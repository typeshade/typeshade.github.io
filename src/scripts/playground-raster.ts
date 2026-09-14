// The pixels, and the shapes both halves of the Playground need to compute them.
//
// Nothing here imports the compiler. The main thread already holds it, and the raster worker
// imports only `core/oracle.ts`, which reaches no part of the TypeScript compiler, so the
// worker's chunk is the oracle and this file and not another copy of the front end. The
// compiled functions arrive as a parameter for that reason: whoever calls in has already
// decided where the module was compiled.

/** One parameter or result of an entry point, as reflect() reports it. */
export interface ReflectedField {
  readonly name?: string;
  readonly type?: string;
  readonly builtin?: string;
  readonly location?: number;
}

/** One entry point of the module. */
export interface ReflectedEntry {
  readonly name: string;
  readonly stage: string;
  /** The DECLARED parameter types, one per parameter. A struct parameter is one entry here
   *  and several in `io.inputs`, which is what `entryArguments` reconciles. */
  readonly inputs?: readonly string[];
  readonly io?: { readonly inputs?: readonly ReflectedField[]; readonly outputs?: readonly ReflectedField[]; };
}

/** A struct as the module declares it: the field order a struct argument is built in. */
export interface DeclaredStruct {
  readonly name: string;
  readonly fields: readonly { readonly name: string; }[];
}

/** The entry points a lowered module exposes, by name. */
export type CpuFunctions = Readonly<Record<string, (...args: never[]) => unknown>>;

/** Everything a worker needs to draw a band, none of it holding a function. It crosses
 *  postMessage, so every field is structured-cloneable. */
export interface RasterPlan {
  readonly width: number;
  readonly height: number;
  readonly vertex: ReflectedEntry;
  readonly fragment: ReflectedEntry;
  readonly structs: readonly DeclaredStruct[];
}

/** The zero of a reflected type, for calling an entry point with something valid. A type this
 *  has no case for (a matrix or a texture, say) cannot be synthesised. */
export function zeroFor(type: string | undefined): { ok: true; value: unknown; } | { ok: false; } {
  if (!type) return { ok: false };
  if (type === 'bool') return { ok: true, value: false };
  if (/^[uif](?:8|16|32|64)$/.test(type)) return { ok: true, value: 0 };
  const vec = /^vec([234])</.exec(type);
  if (vec) return { ok: true, value: Array.from({ length: Number(vec[1]) }, () => 0) };
  return { ok: false };
}

/** The arguments the lowered entry function takes, which is not one per reflected input: a
 *  struct parameter is declared once and reflected as its fields. Handing the flattened list
 *  over leaves the struct's own fields undefined, and every component the entry computes from
 *  them comes back NaN. That reads like a shader returning nothing, when what is wrong is the
 *  call. `valueAt` is asked for the flattened values in order. */
export function entryArguments(
  entry: ReflectedEntry,
  structs: readonly DeclaredStruct[],
  valueAt: (index: number) => unknown,
): unknown[] {
  let next = 0;
  return (entry.inputs ?? []).map((key) => {
    const named = /^struct:(.+)$/.exec(key);
    if (!named) return valueAt(next++);
    const declared = structs.find((candidate) => candidate.name === named[1]);
    const built: Record<string, unknown> = {};
    for (const field of declared?.fields ?? []) built[field.name] = valueAt(next++);
    return built;
  });
}

/** The triangle in pixels: the vertex entry run for indices 0, 1 and 2, its clip positions
 *  divided by w and put through the viewport transform, which flips y. Also the vertex
 *  outputs themselves, which the varyings are interpolated from. */
export interface Corners {
  readonly screen: readonly (readonly number[])[];
  readonly area: number;
  readonly outputs: readonly Record<string, unknown>[];
}

export function cornersOf(cpu: CpuFunctions, plan: RasterPlan): Corners | undefined {
  const flat = plan.vertex.io?.inputs ?? [];
  const indexAt = flat.findIndex((field) => field.builtin === 'vertex_index');
  const positionName = plan.vertex.io?.outputs?.find((field) => field.builtin === 'position')?.name;
  const run = cpu[plan.vertex.name];
  if (indexAt < 0 || !positionName || !run) return undefined;

  const outputs = [0, 1, 2].map(
    (index) =>
      run(
        ...(entryArguments(plan.vertex, plan.structs, (at) => {
          if (at === indexAt) return index;
          const zero = zeroFor(flat[at]?.type);
          return zero.ok ? zero.value : 0;
        }) as never[]),
      ) as Record<string, unknown>,
  );
  const screen = outputs.map((corner) => {
    const [x, y, , w] = corner[positionName] as number[];
    return [((x / w) * 0.5 + 0.5) * plan.width, (1 - ((y / w) * 0.5 + 0.5)) * plan.height];
  });
  const [a, b, c] = screen;
  const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
  if (!Number.isFinite(area) || area === 0) return undefined;
  return { screen, area, outputs };
}

/** One horizontal band of the canvas, drawn a pixel at a time. Returns the band's own RGBA
 *  rows and how many of its pixels the triangle covered, so the caller can put it straight
 *  onto the canvas without waiting for the rest. */
export function drawBand(
  cpu: CpuFunctions,
  plan: RasterPlan,
  corners: Corners,
  y0: number,
  y1: number,
): { pixels: Uint8ClampedArray<ArrayBuffer>; covered: number; } {
  const { width } = plan;
  const rows = y1 - y0;
  const pixels = new Uint8ClampedArray(width * rows * 4);
  const [a, b, c] = corners.screen;
  const fragmentFlat = plan.fragment.io?.inputs ?? [];
  const vertexOuts = plan.fragment.io ? (plan.vertex.io?.outputs ?? []) : [];
  const colourField = plan.fragment.io?.outputs?.[0]?.name;
  const run = cpu[plan.fragment.name];
  let covered = 0;
  if (!run) return { pixels, covered };

  for (let py = y0; py < y1; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const x = px + 0.5;
      const y = py + 0.5;
      const w0 = ((b[0] - x) * (c[1] - y) - (c[0] - x) * (b[1] - y)) / corners.area;
      const w1 = ((c[0] - x) * (a[1] - y) - (a[0] - x) * (c[1] - y)) / corners.area;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      covered += 1;
      const values = fragmentFlat.map((field) => {
        if (field.builtin === 'position') return [x, y, 0, 1];
        const from = vertexOuts.find((candidate) => candidate.name === field.name);
        if (!from?.name) {
          const zero = zeroFor(field.type);
          return zero.ok ? zero.value : 0;
        }
        const at = corners.outputs.map((corner) => corner[from.name as string]);
        if (Array.isArray(at[0])) {
          const first = at[0] as number[];
          return first.map((_, k) => w0 * first[k] + w1 * (at[1] as number[])[k] + w2 * (at[2] as number[])[k]);
        }
        return w0 * (at[0] as number) + w1 * (at[1] as number) + w2 * (at[2] as number);
      });
      const returned = run(...(entryArguments(plan.fragment, plan.structs, (at) => values[at]) as never[]));
      const colour = (colourField ? (returned as Record<string, unknown>)[colourField] : returned) as number[];
      if (!Array.isArray(colour)) continue;
      const offset = ((py - y0) * width + px) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = colour[channel];
        pixels[offset + channel] = Number.isFinite(value) ? Math.round(Math.max(0, Math.min(1, value)) * 255) : 0;
      }
      const alpha = colour[3];
      pixels[offset + 3] = Number.isFinite(alpha) ? Math.round(Math.max(0, Math.min(1, alpha)) * 255) : 255;
    }
  }
  return { pixels, covered };
}

// ── What crosses the worker boundary ───────────────────────────────────────────────────────
// Every message carries the job it belongs to. A draw at a new resolution, or of a new
// module, raises the job number, and a band that arrives late under an old one is dropped
// instead of painted over the new picture.

export type RasterRequest =
  | { readonly kind: 'prepare'; readonly job: number; readonly module: unknown; readonly plan: RasterPlan; }
  | { readonly kind: 'band'; readonly job: number; readonly y0: number; readonly y1: number; };

export type RasterReply =
  | { readonly kind: 'ready'; readonly job: number; }
  | { readonly kind: 'failed'; readonly job: number; readonly message: string; }
  | {
      readonly kind: 'band';
      readonly job: number;
      readonly y0: number;
      readonly y1: number;
      readonly covered: number;
      readonly pixels: Uint8ClampedArray<ArrayBuffer>;
    };
