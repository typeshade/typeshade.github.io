// One compute dispatch on WebGPU, and the bytes it left behind. The Playground runs a module
// whose only entry is `@compute` through this: it fills the storage buffers the reader chose,
// dispatches the entry over the invocations they asked for, and reads back every buffer and
// storage texture the entry may have written.
//
// It shares the page's one device and the resource builders with src/lib/shader-runtime.ts,
// and like that file it imports nothing from the compiler.
import { TEXEL_BYTES, type ResourceSpec } from './shader-bindings.ts';
import { gpuLayoutEntry, gpuResource, sharedDevice } from './shader-runtime.ts';

export interface ComputeJob {
  readonly wgsl: string;
  readonly entry: string;
  /** Workgroups along x, y and z. */
  readonly workgroups: readonly [number, number, number];
  readonly resources: readonly ResourceSpec[];
  readonly constants?: Readonly<Record<string, number>>;
  /** The optional WebGPU features the module needs. */
  readonly features?: readonly string[];
}

export interface ComputeResult {
  /** The bytes of every writable storage buffer after the dispatch, by binding name. */
  readonly buffers: ReadonlyMap<string, Uint8Array>;
  /** Every writable storage texture after the dispatch, row by row, tightly packed. */
  readonly textures: ReadonlyMap<
    string,
    {
      readonly width: number;
      readonly height: number;
      readonly format: string;
      readonly bytes: Uint8Array;
    }
  >;
  readonly ms: number;
}

/** Run one dispatch. Throws with the device's own words when the module, the layout or a
 *  resource is refused, and when there is no WebGPU device at all. */
export async function runComputeOnGpu(job: ComputeJob): Promise<ComputeResult> {
  const device = await sharedDevice(job.features ?? []);
  if (!device) throw new Error('no WebGPU device');
  const started = performance.now();
  const visibility = GPUShaderStage.COMPUTE;

  const layouts = new Map<number, GPUBindGroupLayoutEntry[]>();
  for (const r of job.resources) {
    const list = layouts.get(r.group) ?? [];
    list.push(gpuLayoutEntry(r, visibility));
    layouts.set(r.group, list);
  }

  const owned: { destroy(): void }[] = [];
  const entries = new Map<number, GPUBindGroupEntry[]>();
  const made = new Map<string, GPUBindingResource>();
  const textureOf = new Map<string, GPUTexture>();
  device.pushErrorScope('validation');
  let failure: unknown = null;
  let pipeline: GPUComputePipeline | null = null;
  const groupLayouts = new Map<number, GPUBindGroupLayout>();
  try {
    const module = device.createShaderModule({ code: job.wgsl });
    const err = (await module.getCompilationInfo()).messages.find((m) => m.type === 'error');
    if (err) throw new Error(`WGSL: ${err.message}`);
    for (const [group, list] of layouts)
      groupLayouts.set(group, device.createBindGroupLayout({ entries: list }));
    const empty = device.createBindGroupLayout({ entries: [] });
    const top = Math.max(-1, ...groupLayouts.keys());
    const constants =
      job.constants && Object.keys(job.constants).length > 0 ? { ...job.constants } : undefined;
    pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: Array.from({ length: top + 1 }, (_, i) => groupLayouts.get(i) ?? empty),
      }),
      compute: { module, entryPoint: job.entry, ...(constants ? { constants } : {}) },
    });
    for (const r of job.resources) {
      const { resource, owned: o } = await gpuResource(device, r);
      if (o) owned.push(o);
      if (r.kind === 'storage-texture') textureOf.set(r.name, o as GPUTexture);
      made.set(r.name, resource);
      const list = entries.get(r.group) ?? [];
      list.push({ binding: r.binding, resource });
      entries.set(r.group, list);
    }
  } catch (error) {
    failure = error;
  }
  const scoped = await device.popErrorScope();
  if (failure || scoped || !pipeline) {
    for (const o of owned) o.destroy();
    throw failure ?? new Error(`WebGPU compute: ${scoped?.message ?? 'not built'}`);
  }

  device.pushErrorScope('validation');
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  for (const [group, list] of entries) {
    const layout = groupLayouts.get(group);
    if (layout) pass.setBindGroup(group, device.createBindGroup({ layout, entries: list }));
  }
  pass.dispatchWorkgroups(job.workgroups[0], job.workgroups[1], job.workgroups[2]);
  pass.end();

  // Every buffer and texture the entry may have written is copied out to a buffer the page can
  // map. A texture's rows are padded to 256 bytes on the way, which the read below undoes.
  const reads: {
    name: string;
    staging: GPUBuffer;
    texture?: { width: number; height: number; format: string; padded: number; row: number };
  }[] = [];
  for (const r of job.resources) {
    if (r.kind === 'storage-buffer' && !r.readOnly) {
      const buffer = (made.get(r.name) as GPUBufferBinding).buffer;
      const staging = device.createBuffer({
        size: buffer.size,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      encoder.copyBufferToBuffer(buffer, 0, staging, 0, buffer.size);
      reads.push({ name: r.name, staging });
    }
    if (r.kind === 'storage-texture' && r.access !== 'read-only') {
      const texel = TEXEL_BYTES[r.format] ?? 4;
      const row = r.width * texel;
      const padded = Math.ceil(row / 256) * 256;
      const staging = device.createBuffer({
        size: padded * r.height,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      const texture = textureOf.get(r.name);
      if (!texture) continue;
      encoder.copyTextureToBuffer({ texture }, { buffer: staging, bytesPerRow: padded }, [
        r.width,
        r.height,
      ]);
      reads.push({
        name: r.name,
        staging,
        texture: { width: r.width, height: r.height, format: r.format, padded, row },
      });
    }
  }
  device.queue.submit([encoder.finish()]);
  const dispatchScoped = await device.popErrorScope();
  if (dispatchScoped) {
    for (const o of owned) o.destroy();
    for (const r of reads) r.staging.destroy();
    throw new Error(`WebGPU compute: ${dispatchScoped.message}`);
  }

  const buffers = new Map<string, Uint8Array>();
  const textures = new Map<
    string,
    { width: number; height: number; format: string; bytes: Uint8Array }
  >();
  for (const r of reads) {
    await r.staging.mapAsync(GPUMapMode.READ);
    const bytes = new Uint8Array(r.staging.getMappedRange().slice(0));
    r.staging.unmap();
    r.staging.destroy();
    if (!r.texture) {
      buffers.set(r.name, bytes);
      continue;
    }
    const { width, height, format, padded, row } = r.texture;
    const tight = new Uint8Array(row * height);
    for (let y = 0; y < height; y++)
      tight.set(bytes.subarray(y * padded, y * padded + row), y * row);
    textures.set(r.name, { width, height, format, bytes: tight });
  }
  for (const o of owned) o.destroy();
  return { buffers, textures, ms: performance.now() - started };
}
