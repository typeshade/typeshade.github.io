// The Playground's example list, read at build time from the vendored checkout.
//
// `examples/_shade.ts` in the compiler is node-only: it reads the filesystem, so importing it
// from the browser half would pull `node:fs` into the page bundle. The sources are read here
// instead, in Astro's front matter, and travel to the page as JSON.
//
// The ids below are the curated order, the same hand-written half `examples/_order.ts` keeps
// for the compiler's own example registry. An id that names no file, or a file no id names,
// fails the build with both directions reported, so this list cannot drift into a stale copy
// of the directory.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Astro bundles this front matter into a chunk under dist/, so the path is resolved from the
// project root the way src/lib/api.ts and src/lib/guide.ts resolve theirs, and not from
// import.meta.url.
const examplesDir = path.resolve(process.cwd(), 'vendor/shader-dsl/examples');

/** Every TypeShade example the Playground offers, in the order the gallery groups them:
 *  stages, resources, values and control flow, classes and generics, module state and
 *  compute, then the source twins of the `fn()` corpus. The same order as `SHADE_GROUPS` in
 *  src/lib/shade-examples.ts, which is where their words live; the list is repeated here
 *  because this module reads the directory with `fs` alone and imports no compiler. */
export const playgroundExampleIds = [
  'hello',
  'hello-vsout',
  'hello-vsin',
  'bare-position',
  'twin-structs',
  'id-pick',
  'clip-planes',
  'hello-uniform',
  'hello-uniform-struct',
  'hello-camera',
  'textured-quad',
  'array-length',
  'storage-texture',
  'shadow-compare',
  'cube-env',
  'cube-array-gather',
  'msaa-resolve',
  'uniform-array',
  'sample-branch',
  'module-const',
  'palette-const',
  'array-literal-ramp',
  'convert-grid',
  'normal-matrix',
  'fp64-lane-stripes',
  'bitfield-bands',
  'block-scope',
  'pick-composite',
  'cutout',
  'default-args',
  'bit-bump',
  'bool-select',
  'integer-math',
  'packing-bitcast',
  'packed-bytes',
  'closures',
  'higher-order',
  'inferred-returns',
  'array-methods',
  'loops-over-data',
  'path-tracer',
  'ray-class',
  'orbit-inout',
  'particle-step',
  'shape-inheritance',
  'mixin-surface',
  'generic-helpers',
  'generic-class',
  'tuple-and-brand',
  'class-syntax',
  'rng-method',
  'class-builder',
  'class-parts',
  'private-state',
  'workgroup-scratch',
  'workgroup-reduce',
  'atomic-histogram',
  'gpu-console',
  'compute-sync',
  'compute-reduction-twin',
  'workgroup-tile-2d',
  'hillshade-twin',
  'plasma-twin',
  'julia-twin',
  'mandelbrot-twin',
  'domain-warp-twin',
  'tunnel-twin',
  'ocean-twin',
  'starfield-twin',
  'kaleidoscope-twin',
  'gradient-twin',
  'voronoi-twin',
  'fp64-deep-zoom-twin',
  'fp64-checker-plane-twin',
  'fp64-loran-twin',
  'fp64-rtc-twin',
  'fp64-julia-twin',
  'fp64-burning-ship-twin',
  'fp64-newton-twin',
  'fp64-mandelbrot-de-twin',
  'fp64-clock-twin',
  'fp64-cancellation-twin',
  'fp64-sine-sweep-twin',
] as const;

export type PlaygroundExampleId = (typeof playgroundExampleIds)[number];

/** One example as the page carries it: the id its words are keyed by, and its source text. */
export interface PlaygroundExample {
  readonly id: PlaygroundExampleId;
  readonly source: string;
}

const fileFor = (id: string): string => path.join(examplesDir, `${id}.shade.ts`);

/** The examples, in curated order, with their sources. Throws when the list and the directory
 *  disagree, so an example added upstream is noticed at the next pin. */
export function playgroundExamples(): readonly PlaygroundExample[] {
  const onDisk = readdirSync(examplesDir)
    .filter((name) => name.endsWith('.shade.ts'))
    .map((name) => name.slice(0, -'.shade.ts'.length))
    .sort();

  const listed = new Set<string>(playgroundExampleIds);
  const missing = playgroundExampleIds.filter((id) => !onDisk.includes(id));
  const unlisted = onDisk.filter((id) => !listed.has(id));
  if (missing.length > 0 || unlisted.length > 0) {
    const parts = [
      missing.length > 0 ? `named here with no file: ${missing.join(', ')}` : '',
      unlisted.length > 0 ? `in the directory with no id here: ${unlisted.join(', ')}` : '',
    ].filter(Boolean);
    throw new Error(
      `[playground] src/lib/playground-examples.ts and ${examplesDir} disagree (${parts.join('; ')})`,
    );
  }

  return playgroundExampleIds.map((id) => ({ id, source: readFileSync(fileFor(id), 'utf8') }));
}

/** The example the Playground opens with when the URL carries nothing. */
export const defaultPlaygroundExample: PlaygroundExampleId = 'hello';
