/// <reference types="@webgpu/types" />
import {
  catalog,
  outputLength,
  storageBytes,
  type BenchResult,
  type Metadata,
} from './contract.ts';
import { PROFILES, SUITES, type Profile, type Suite } from './definitions.ts';
import { fixture, matches } from './fixtures.ts';

type Job = (typeof catalog.cases)[number];
function webglInfo(): Metadata['webgl'] {
  const empty: Metadata['webgl'] = {
    state: 'unavailable',
    debugExtension: false,
    vendor: null,
    renderer: null,
    unmaskedVendor: null,
    unmaskedRenderer: null,
  };
  try {
    const gl = new OffscreenCanvas(1, 1).getContext('webgl2');
    if (!gl) return empty;
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const info = (key: number): string | null => {
      const value: unknown = gl.getParameter(key);
      return typeof value === 'string' && value ? value.slice(0, 512) : null;
    };
    const result: Metadata['webgl'] = {
      state: 'available',
      debugExtension: !!debug,
      vendor: info(gl.VENDOR),
      renderer: info(gl.RENDERER),
      unmaskedVendor: debug ? info(debug.UNMASKED_VENDOR_WEBGL) : null,
      unmaskedRenderer: debug ? info(debug.UNMASKED_RENDERER_WEBGL) : null,
    };
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return result;
  } catch {
    return empty;
  }
}
export async function run(
  profile: Profile,
  suites: Suite[],
  seed: number,
  send: (data: unknown) => void,
): Promise<void> {
  const adapter = await navigator.gpu?.requestAdapter();
  const metadata: Metadata = {
    userAgent: navigator.userAgent.slice(0, 512),
    webgl: webglInfo(),
    webgpu: {
      available: !!adapter,
      vendor: adapter?.info.vendor ?? '',
      architecture: adapter?.info.architecture ?? '',
      device: adapter?.info.device ?? '',
      description: adapter?.info.description ?? '',
      fallback: adapter?.info.isFallbackAdapter ?? null,
      timestamps: adapter?.features.has('timestamp-query') ?? false,
      features: adapter ? [...adapter.features].sort() : [],
      limits: {
        maxBufferSize: adapter?.limits.maxBufferSize ?? 0,
        maxStorageBufferBindingSize: adapter?.limits.maxStorageBufferBindingSize ?? 0,
        maxComputeInvocationsPerWorkgroup: adapter?.limits.maxComputeInvocationsPerWorkgroup ?? 0,
      },
    },
  };
  send({ type: 'metadata', metadata });
  if (!adapter) {
    send({ type: 'done', status: 'unsupported' });
    return;
  }
  const timestamps = metadata.webgpu.timestamps;
  const device = await adapter.requestDevice({
    requiredFeatures: timestamps ? ['timestamp-query'] : [],
  });
  let lost = false;
  let invalid = false;
  void device.lost.then(() => {
    lost = true;
  });
  device.addEventListener('uncapturederror', () => {
    invalid = true;
  });
  const buffer = (size: number, usage: number) =>
    device.createBuffer({ size: Math.max(4, size), usage });
  const read = async (src: GPUBuffer, bytes: number): Promise<Uint32Array> => {
    const stage = buffer(bytes, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
    try {
      const encoder = device.createCommandEncoder();
      encoder.copyBufferToBuffer(src, 0, stage, 0, bytes);
      device.queue.submit([encoder.finish()]);
      await stage.mapAsync(GPUMapMode.READ);
      const data = new Uint32Array(stage.getMappedRange().slice(0));
      stage.unmap();
      return data;
    } finally {
      stage.destroy();
    }
  };
  let active: BenchResult | undefined;
  async function prepare(job: Job, n: number) {
    const owned: { destroy(): void }[] = [];
    const make = (size: number, usage: number) => {
      const b = buffer(size, usage);
      owned.push(b);
      return b;
    };
    const { input, expected } = fixture(job, n);
    const row: BenchResult = {
      id: job.id,
      n,
      status: 'failed',
      reason: 'validation',
      setupMs: 0,
      wallMs: [],
      gpuNs: null,
      gpuTiming: 'unsupported',
      checkedValues: 0,
      corruptionDetected: false,
      storageBytes: storageBytes(job, n),
    };
    active = row;
    const start = performance.now();
    try {
      const src = make(
        input.byteLength,
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      );
      const out = make(
        expected.byteLength,
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      );
      const args = make(16, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
      device.queue.writeBuffer(src, 0, input.buffer);
      device.queue.writeBuffer(args, 0, new Uint32Array([n, 0, 0, 0]));
      let pipeline: GPUComputePipeline | undefined;
      let bindGroup: GPUBindGroup | undefined;
      if (job.wgsl) {
        const module = device.createShaderModule({ code: job.wgsl });
        if ((await module.getCompilationInfo()).messages.some((m) => m.type === 'error'))
          throw new Error('validation');
        const layout = device.createBindGroupLayout({
          entries: job.bindings.map((b) => ({
            binding: b.binding,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type:
                b.name === 'args'
                  ? ('uniform' as const)
                  : b.name === 'src'
                    ? ('read-only-storage' as const)
                    : ('storage' as const),
            },
          })),
        });
        pipeline = await device.createComputePipelineAsync({
          layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
          compute: { module, entryPoint: 'main' },
        });
        bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: job.bindings.map((b) => ({
            binding: b.binding,
            resource: { buffer: b.name === 'src' ? src : b.name === 'out' ? out : args },
          })),
        });
      }
      const query =
        timestamps && pipeline ? device.createQuerySet({ type: 'timestamp', count: 2 }) : undefined;
      if (query) owned.push(query);
      const resolved = query
        ? make(16, GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC)
        : undefined;
      const queryRead = query
        ? make(16, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ)
        : undefined;
      const gpu: number[] = [];
      let resolvedAll = !!query;
      await device.queue.onSubmittedWorkDone();
      row.setupMs = performance.now() - start;
      const dispatch = async (timed: boolean) => {
        if (lost || invalid) throw new Error(lost ? 'device-lost' : 'validation');
        if (job.kind === 'atomic') {
          device.queue.writeBuffer(out, 0, new Uint32Array(outputLength(job, n)));
          await device.queue.onSubmittedWorkDone();
        }
        const t = performance.now();
        let deviceNs: number | null = null;
        if (job.kind === 'upload') {
          device.queue.writeBuffer(src, 0, input.buffer);
          await device.queue.onSubmittedWorkDone();
        } else if (job.kind === 'readback') {
          // Includes staging allocation, copy, map and the host copy; records this whole path.
          await read(src, input.byteLength);
        } else {
          const groups = Math.ceil(
            (job.kind === 'reduce' && job.variant === 'serial' ? n / 64 : n) / job.wg,
          );
          const commands: GPUCommandBuffer[] = [];
          const makePass = (count: number, stamp: boolean) => {
            const encoder = device.createCommandEncoder();
            const pass = encoder.beginComputePass(
              stamp && query
                ? {
                    timestampWrites: {
                      querySet: query,
                      beginningOfPassWriteIndex: 0,
                      endOfPassWriteIndex: 1,
                    },
                  }
                : {},
            );
            pass.setPipeline(pipeline!);
            pass.setBindGroup(0, bindGroup!);
            for (let i = 0; i < count; i++) pass.dispatchWorkgroups(groups);
            pass.end();
            if (stamp && query) {
              encoder.resolveQuerySet(query, 0, 2, resolved!, 0);
              encoder.copyBufferToBuffer(resolved!, 0, queryRead!, 0, 16);
            }
            return encoder.finish();
          };
          // Separate submits measure queue overhead. Per-pass timestamps do not span this path.
          if (job.separate)
            for (let i = 0; i < job.dispatches; i++) device.queue.submit([makePass(1, false)]);
          else {
            commands.push(makePass(job.dispatches, true));
            device.queue.submit(commands);
          }
          await device.queue.onSubmittedWorkDone();
        }
        const wall = (performance.now() - t) / job.dispatches;
        if (queryRead && !job.separate) {
          await queryRead.mapAsync(GPUMapMode.READ);
          const ts = new BigUint64Array(queryRead.getMappedRange());
          deviceNs = Number(ts[1]! - ts[0]!) / job.dispatches;
          queryRead.unmap();
          if (!(deviceNs > 0)) resolvedAll = false;
        } else resolvedAll = false;
        if (timed) {
          row.wallMs.push(wall);
          if (deviceNs !== null) gpu.push(deviceNs);
        }
      };
      const verify = async () => {
        const actual = await read(job.wgsl ? out : src, expected.byteLength);
        if (!matches(actual, expected) || !matches(await read(src, input.byteLength), input))
          throw new Error('validation');
        actual[0] = actual[0]! ^ 1;
        if (matches(actual, expected)) throw new Error('validation');
        row.checkedValues = expected.length;
        row.corruptionDetected = true;
      };
      return {
        job,
        row,
        dispatch,
        verify,
        finish() {
          row.status = 'passed';
          row.reason = 'none';
          row.gpuNs = resolvedAll && gpu.length === row.wallMs.length ? gpu : null;
          row.gpuTiming = row.gpuNs ? 'available' : query ? 'unresolved' : 'unsupported';
          return row;
        },
        destroy() {
          owned.forEach((b) => b.destroy());
        },
      };
    } catch (error) {
      owned.forEach((b) => b.destroy());
      throw error;
    }
  }
  try {
    const config = PROFILES[profile];
    for (const n of config.sizes)
      for (const suite of SUITES.filter((s) => suites.includes(s))) {
        const states: Awaited<ReturnType<typeof prepare>>[] = [];
        active = undefined;
        device.pushErrorScope('validation');
        try {
          for (const job of catalog.cases.filter((e) => e.suite === suite)) {
            send({ type: 'progress', id: job.id, n });
            states.push(await prepare(job, n));
          }
          for (const state of states) {
            active = state.row;
            for (let i = 0; i < config.warmup; i++) await state.dispatch(false);
            await state.verify();
          }
          // Rotate alternatives each round. Record the seed to reproduce ordering.
          for (let rep = 0; rep < config.samples; rep++)
            for (let j = 0; j < states.length; j++) {
              const state = states[(seed + rep + j) % states.length]!;
              active = state.row;
              send({ type: 'progress', id: state.job.id, n });
              await state.dispatch(true);
            }
          for (const state of states) {
            active = state.row;
            await state.verify();
          }
          if ((await device.popErrorScope()) || invalid || lost)
            throw new Error(lost ? 'device-lost' : 'validation');
          for (const state of states) send({ type: 'result', row: state.finish() });
        } finally {
          states.forEach((state) => state.destroy());
        }
      }
    send({ type: 'done', status: 'complete' });
  } catch {
    if (active) {
      active.status = 'failed';
      active.reason = lost ? 'device-lost' : 'validation';
      send({ type: 'result', row: active });
    }
    send({ type: 'done', status: 'failed', reason: lost ? 'device-lost' : 'validation' });
  } finally {
    device.destroy();
  }
}
self.addEventListener(
  'message',
  (event: MessageEvent<{ profile: Profile; suites: Suite[]; seed: number }>) => {
    const { profile, suites, seed } = event.data;
    if (
      !(profile in PROFILES) ||
      !Array.isArray(suites) ||
      !suites.every((s) => SUITES.includes(s))
    )
      return;
    void run(profile, suites, seed, (data) => self.postMessage(data)).catch(() =>
      self.postMessage({ type: 'done', status: 'failed' }),
    );
  },
);
