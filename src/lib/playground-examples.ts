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

/** Every TypeShade example the Playground offers, simplest first. */
export const playgroundExampleIds = [
  'hello',
  'hello-vsout',
  'hello-vsin',
  'hello-uniform',
  'hello-camera',
  'hello-uniform-struct',
  'compute-reduction-twin',
  'module-const',
  'palette-const',
  'convert-grid',
  'array-literal-ramp',
  'bitfield-bands',
  'cutout',
  'textured-quad',
  'twin-structs',
  'gradient-twin',
  'plasma-twin',
  'tunnel-twin',
  'julia-twin',
  'mandelbrot-twin',
  'domain-warp-twin',
  'kaleidoscope-twin',
  'ocean-twin',
  'starfield-twin',
  'hillshade-twin',
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
    throw new Error(`[playground] src/lib/playground-examples.ts and ${examplesDir} disagree (${parts.join('; ')})`);
  }

  return playgroundExampleIds.map((id) => ({ id, source: readFileSync(fileFor(id), 'utf8') }));
}

/** The example the Playground opens with when the URL carries nothing. */
export const defaultPlaygroundExample: PlaygroundExampleId = 'hello';
