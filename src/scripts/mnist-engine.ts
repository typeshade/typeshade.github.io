// Real TypeShade MNIST training backend. No alternate JavaScript training path.
// TypeShade's packed compute entries are compiled by the site's build, then dispatched
// with the public program runtime in this browser.
import { createRuntime, resident } from '../../vendor/shader-dsl/src/runtime.ts';
import type { Pack } from '../../vendor/shader-dsl/src/core/manifest-types.ts';
import type { Resident } from '../../vendor/shader-dsl/src/core/resident.ts';

type Tier = 'webgpu' | 'webgl2';
type Entry = 'forward' | 'objective' | 'reduce' | 'backward' | 'update';
type ArrayValue = Float32Array | Uint32Array;
const entries: readonly Entry[] = ['forward', 'objective', 'reduce', 'backward', 'update'];

export interface MnistEngine {
  readonly tier: Tier;
  readonly renderer: string;
  setBatch(pixels: Float32Array, labels: Uint32Array): void;
  dispatch(entry: Entry, count: number, rate: number): Promise<void>;
  read(name: 'stats' | 'logits' | 'weights' | 'bias'): Promise<ArrayValue>;
  destroy(): void;
}

function initialWeights(): Float32Array {
  let state = 123;
  const weights = new Float32Array(7840);
  for (let i = 0; i < weights.length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    weights[i] = (state / 4294967296 - 0.5) * 0.02;
  }
  return weights;
}

export async function openMnistEngine(
  pack: Pack,
  capacity: number,
  tier: Tier,
): Promise<MnistEngine> {
  if (tier === 'webgl2') {
    for (const name of entries) {
      const program = pack.gl?.computes?.[name];
      if (!program || 'none' in program) {
        throw new Error('TypeShade WebGL2 pass unavailable for ' + name);
      }
    }
  }
  const rt = await createRuntime({ prefer: [tier], programs: [pack] });
  if (rt.tier !== tier) {
    rt.destroy();
    throw new Error('Requested ' + tier + ', received ' + rt.tier);
  }
  const host: Record<string, ArrayValue> = {
    pixels: new Float32Array(capacity * 784),
    labels: new Uint32Array(capacity),
    weights: initialWeights(),
    bias: new Float32Array(10),
    logits: new Float32Array(capacity * 10),
    delta: new Float32Array(capacity * 10),
    losses: new Float32Array(capacity),
    stats: new Float32Array(2),
    gradW: new Float32Array(7840),
    gradB: new Float32Array(10),
  };
  const buffers: Record<string, Resident<ArrayValue>> = {};
  const pipelines: Partial<
    Record<Entry, Awaited<ReturnType<ReturnType<typeof rt.load>['compute']>>>
  > = {};
  try {
    const program = rt.load(pack);
    for (const [name, value] of Object.entries(host)) buffers[name] = resident(value);
    for (const name of entries) pipelines[name] = await program.compute(name);
  } catch (error) {
    for (const value of Object.values(buffers)) value.destroy();
    rt.destroy();
    throw error;
  }
  const renderer =
    tier === 'webgpu'
      ? (rt.device as GPUDevice).adapterInfo?.description ||
        (rt.device as GPUDevice).adapterInfo?.vendor ||
        'WebGPU adapter'
      : (() => {
          const gl = rt.device as WebGL2RenderingContext;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return String(
            ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          );
        })();
  let disposed = false;
  return {
    tier,
    renderer,
    setBatch(pixels, labels) {
      if (disposed) throw new Error('MNIST backend was released');
      if (pixels.length > capacity * 784 || labels.length > capacity)
        throw new Error('Oversized MNIST batch');
      host.pixels.fill(0);
      host.pixels.set(pixels);
      host.labels.fill(0);
      host.labels.set(labels);
      buffers.pixels.write(host.pixels);
      buffers.labels.write(host.labels);
    },
    async dispatch(entry, count, rate) {
      if (disposed) throw new Error('MNIST backend was released');
      const workgroups =
        entry === 'reduce'
          ? 1
          : entry === 'backward' || entry === 'update'
            ? Math.ceil(7840 / 64)
            : Math.ceil(count / 64);
      const provided: Record<string, unknown> = {
        ...buffers,
        batch: { count, offset: 0, rate },
      };
      const descriptor = pack.entries.find((item) => item.name === entry);
      if (!descriptor) throw new Error('TypeShade manifest lacks ' + entry);
      const reached: Record<string, unknown> = {};
      for (const binding of descriptor.bindings) reached[binding.name] = provided[binding.name];
      const pipeline = pipelines[entry];
      if (!pipeline) throw new Error('TypeShade pipeline is missing: ' + entry);
      const frame = rt.frame();
      frame.dispatch(pipeline, reached, workgroups);
      await frame.submit();
    },
    async read(name) {
      if (disposed) throw new Error('MNIST backend was released');
      return buffers[name].read();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      for (const value of Object.values(buffers)) value.destroy();
      rt.destroy();
    },
  };
}
