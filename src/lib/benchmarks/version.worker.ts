/// <reference types="@webgpu/types" />
import { regressionCatalog, type RegressionResult } from './regression-contract.ts';
import { benchmarkMetadata } from './metadata.ts';
import { prepareCompiled } from './regression-gpu.ts';
import { nextBatch, validDeviceSamples } from './timing.ts';
import {
  applicationInput,
  applicationOutput,
  expectedApplication,
  numbersMatch,
  RESIDENT_CALLS,
  type Application,
} from './workloads.ts';
import { storageBytes } from './contract.ts';
import type { Experiment } from './definitions.ts';

// Each build runs in its own worker, so runtime globals and pipeline caches cannot mix.
let device: GPUDevice;
let api: Record<string, (...args: any[]) => any>;
let session: { owner: any; close(): Promise<void> };
let compiled: Awaited<ReturnType<typeof prepareCompiled>> | undefined;
let resident: any;
let row: RegressionResult;
let gpu: (number | null)[] = [];
let live = 0,
  peak = 0,
  allocations = 0,
  submissions = 0;
let lost = false,
  invalid = false;
function verify(actual: number[], expected: number[]) {
  if (!numbersMatch(actual, expected)) throw new Error('validation');
  const corrupt = [...actual];
  corrupt[0] = corrupt[0]! + 1;
  if (numbersMatch(corrupt, expected)) throw new Error('validation');
  row.checkedValues = expected.length;
  row.corruptionDetected = true;
}
async function application() {
  const id = row.id as Application;
  const input = applicationInput(row.n, id);
  const expected = expectedApplication(id, input);
  const start = performance.now();
  let result: unknown;
  if (id === 'resident-image') {
    await session.owner.fuse(() => {
      for (let i = 0; i < RESIDENT_CALLS; i++) void api.image!(resident);
    });
    await session.owner.wait();
  } else if (id === 'image') await api.image!(input.values);
  else if (id === 'particles') await api.particles!(input.particles);
  else if (id === 'peak') result = await api.peak!(input.values);
  else await api.collect!(input.keys, input.values, input.last, input.seen);
  const wallMs = performance.now() - start;
  let readbackMs: number | null = null;
  if (id === 'resident-image') {
    const readStart = performance.now();
    result = await resident.read();
    readbackMs = performance.now() - readStart;
  }
  verify(applicationOutput(id, input, result), expected);
  return { wallMs, readbackMs };
}
async function command(data: any) {
  if (data.command === 'init') {
    const build = regressionCatalog.builds[data.build]!;
    const start = performance.now();
    const response = await fetch(build.url);
    if (!response.ok) throw new Error('artifact');
    const bytes = await response.arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (x) =>
      x.toString(16).padStart(2, '0'),
    ).join('');
    if (digest !== build.runtimeDigest) throw new Error('artifact');
    const blob = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
    try {
      api = await import(/* @vite-ignore */ blob);
    } finally {
      URL.revokeObjectURL(blob);
    }
    const adapter = (await navigator.gpu?.requestAdapter()) ?? null;
    const metadata = benchmarkMetadata(adapter);
    if (!adapter) return { metadata, unsupported: true, loadMs: performance.now() - start };
    device = await adapter.requestDevice({
      requiredFeatures: metadata.webgpu.timestamps ? ['timestamp-query'] : [],
    });
    void device.lost.then(() => {
      lost = true;
    });
    device.addEventListener('uncapturederror', () => {
      invalid = true;
    });
    const create = device.createBuffer.bind(device);
    device.createBuffer = (descriptor) => {
      const b = create(descriptor);
      allocations++;
      live += descriptor.size;
      peak = Math.max(peak, live);
      const destroy = b.destroy.bind(b);
      let destroyed = false;
      b.destroy = () => {
        if (!destroyed) {
          destroyed = true;
          live -= descriptor.size;
        }
        destroy();
      };
      return b;
    };
    const submit = device.queue.submit.bind(device.queue);
    device.queue.submit = (commands) => {
      submissions++;
      submit(commands);
    };
    session = await api.open!(device);
    return { metadata, loadMs: performance.now() - start };
  }
  if (data.command === 'prepare') {
    peak = live;
    allocations = 0;
    submissions = 0;
    gpu = [];
    invalid = false;
    device.pushErrorScope('validation');
    const job = regressionCatalog.builds[data.build]!.cases.find((e) => e.id === data.id);
    row = {
      id: data.id,
      n: data.n,
      build: data.build === 0 ? 'baseline' : 'candidate',
      kind: job ? 'compiled' : data.id === 'resident-image' ? 'resident' : 'host',
      status: 'passed',
      reason: 'none',
      setupMs: 0,
      coldMs: 0,
      wallMs: [],
      readbackMs: data.id === 'resident-image' ? [] : null,
      gpuNs: null,
      gpuTiming: 'unsupported',
      dispatches: job?.dispatches ?? (data.id === 'resident-image' ? RESIDENT_CALLS : 1),
      checkedValues: 0,
      corruptionDetected: false,
      logicalBytes: job
        ? storageBytes(job as Experiment, data.n)
        : data.n * (data.id === 'particles' ? 32 : data.id === 'collect' ? 8 : 4),
      peakBufferBytes: 0,
      bufferAllocations: 0,
      gpuSubmissions: 0,
    };
    const start = performance.now();
    if (job) compiled = await prepareCompiled(device, job, data.n);
    if (row.kind === 'resident')
      resident = session.owner.array(applicationInput(row.n, 'resident-image').values);
    row.setupMs = performance.now() - start;
    const cold = compiled ? await compiled.dispatch(compiled.dispatches) : await application();
    row.coldMs = cold.wallMs * (compiled?.dispatches ?? 1) + row.setupMs;
    if (compiled) await compiled.verify(row);
    let count = compiled?.dispatches ?? 1;
    if (compiled?.batchable) {
      for (;;) {
        const x = await compiled.dispatch(count);
        const next =
          x.wallMs * count > 50
            ? count
            : nextBatch(count, compiled.supported ? x.elapsedNs : x.wallMs * count * 1e6);
        if (next === count) break;
        count = next;
      }
    }
    return { count };
  }
  if (data.command === 'warmup') {
    row.dispatches = row.kind === 'compiled' ? data.count : row.dispatches;
    for (let i = 0; i < data.warmup; i++) {
      if (compiled) await compiled.dispatch(row.dispatches);
      else await application();
    }
    if (compiled) await compiled.verify(row);
    return {};
  }
  if (data.command === 'sample') {
    if (lost || invalid) throw new Error('validation');
    if (compiled) {
      const x = await compiled.dispatch(row.dispatches);
      row.wallMs.push(x.wallMs);
      gpu.push(x.elapsedNs === null ? null : x.elapsedNs / row.dispatches);
    } else {
      const x = await application();
      row.wallMs.push(x.wallMs);
      if (x.readbackMs !== null) row.readbackMs!.push(x.readbackMs);
    }
    return {};
  }
  if (data.command === 'finish') {
    if (compiled) await compiled.verify(row);
    if ((await device.popErrorScope()) || lost || invalid) throw new Error('validation');
    row.gpuNs = validDeviceSamples(gpu);
    row.gpuTiming = row.gpuNs ? 'available' : compiled?.supported ? 'unresolved' : 'unsupported';
    row.peakBufferBytes = peak;
    row.bufferAllocations = allocations;
    row.gpuSubmissions = submissions;
    compiled?.destroy();
    compiled = undefined;
    resident?.destroy();
    resident = undefined;
    return { row };
  }
  if (data.command === 'close') {
    await session?.close();
    device?.destroy();
    return {};
  }
  throw new Error('command');
}
self.onmessage = async ({ data }) => {
  try {
    self.postMessage({ sequence: data.sequence, value: await command(data) });
  } catch (error) {
    console.error(error);
    if (row) {
      row.status = 'failed';
      row.reason = lost ? 'device-lost' : 'validation';
    }
    self.postMessage({ sequence: data.sequence, error: true, row });
  }
};
