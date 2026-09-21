// Generated binary files the site ships, each committed with a .sha256 sidecar. The build
// asserts the hashes; the capture scripts set the matching *_REBASELINE variable while they
// regenerate a file.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/** One still per mount, with the page it is captured from. A mount forced onto WebGL2 gets
 * its own file, so the image under it is a frame that backend drew. An entry with `live`
 * names a <LiveShader> instance by its id instead of a registry example. */
/** Every registry example src/lib/hero-shader.ts can emit for the canvas: no compute-only
 *  module, no control kind the runtime has no packer for. A list, because this file is read
 *  by plain Node before the build, where the registry (TypeScript) cannot be imported. */
export const STILL_EXAMPLES = [
  'color-ramp', 'discard-cutout', 'domain-warp', 'fbm-clouds', 'fp64-cancellation', 'fp64-clock',
  'fp64-deep-zoom', 'fp64-mercator-tiles', 'fp64-sine-sweep', 'gradient', 'graticule', 'heart',
  'hillshade', 'julia', 'kaleidoscope', 'mandelbrot', 'metaballs', 'ocean', 'plasma',
  'raymarch-boxes', 'raymarch-sphere', 'starfield', 'truchet', 'tunnel', 'voronoi',
]

/** The `.shade.ts` examples the same runtime can draw: every one with a GLSL ES 3.00 form,
 *  less four. Three declare a texture the page has no data for (textured-quad,
 *  shadow-compare, cube-env), hello-vsin reads its vertex attributes from a buffer, which a
 *  page that draws one fullscreen triangle and binds no vertex buffer cannot fill, and
 *  hello-uniform-struct and bit-bump declare a uniform field that is neither one of the
 *  three the runtime fills by itself nor covered by a source twin's controls. Those six keep
 *  the gallery's plain tile, the way a registry example the runtime cannot draw already
 *  does. A list for the same reason as the one above: plain Node reads this file before the
 *  build. */
export const SHADE_STILL_EXAMPLES = [
  'array-literal-ramp', 'bare-position', 'bitfield-bands', 'block-scope',
  'bool-select', 'convert-grid', 'cutout', 'default-args', 'domain-warp-twin',
  'generic-class', 'generic-helpers', 'gradient-twin', 'hello',
  'hello-vsout', 'hillshade-twin', 'julia-twin', 'kaleidoscope-twin',
  'mandelbrot-twin', 'mixin-surface', 'module-const', 'ocean-twin', 'orbit-inout',
  'palette-const', 'pick-composite', 'plasma-twin', 'private-state', 'ray-class',
  'shape-inheritance', 'starfield-twin', 'tunnel-twin', 'tuple-and-brand', 'twin-structs',
]

export const STILLS = [
  { id: 'gradient', example: 'gradient', page: '/guide/checks/', backend: 'webgpu' },
  { id: 'gradient-webgl2', example: 'gradient', page: '/guide/checks/', forceWebGl2: true, backend: 'webgl2' },
  { id: 'fp64-deep-zoom', example: 'fp64-deep-zoom', page: '/guide/examples/' },
  { id: 'quick-start-stripes', live: true, page: '/guide/quick-start/' },
  { id: 'gpu-types-disc', live: true, page: '/guide/language/gpu-types/' },
  // The front page's own live file.
  { id: 'front-first', live: true, page: '/' },
  // One tile per example the runtime can draw, photographed on the build-only /capture-stills/ page.
  // The examples gallery shows them as pictures and the front page runs nine of them live.
  // gradient and fp64-deep-zoom keep the entries above, at the aspect their own pages use.
  ...STILL_EXAMPLES.filter((id) => id !== 'gradient' && id !== 'fp64-deep-zoom').map((id) => ({ id, example: id, page: '/capture-stills/' })),
  // The `.shade.ts` corpus, photographed on the same page.
  ...SHADE_STILL_EXAMPLES.map((id) => ({ id, example: id, page: '/capture-stills/' })),
]

export const ARTIFACTS = [
  { file: 'og.png', env: 'OG_REBASELINE', regenerate: 'bun run capture:og' },
  { file: 'favicon.svg', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
  ...STILLS.map(({ id }) => ({
    file: `stills/${id}.webp`,
    env: 'STILLS_REBASELINE',
    regenerate: 'bun run capture:stills',
  })),
]

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/** Write public/<file>, then its .sha256. */
export function writeHashed(root, file, bytes) {
  const target = path.join(root, 'public', file)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, bytes)
  const digest = sha256(bytes)
  writeFileSync(`${target}.sha256`, `${digest}\n`)
  return digest
}

/** Throws on the first artifact whose bytes do not match its sidecar. */
export function verifyArtifacts(root) {
  for (const { file, env, regenerate } of ARTIFACTS) {
    const rebaseline = process.env[env] === '1'
    const target = path.join(root, 'public', file)
    const sidecar = `${target}.sha256`
    if (!existsSync(target) || !existsSync(sidecar)) {
      if (rebaseline) continue
      throw new Error(`[artifacts] public/${file} or its .sha256 is missing. Run \`${regenerate}\`.`)
    }
    const actual = sha256(readFileSync(target))
    const expected = readFileSync(sidecar, 'utf8').trim()
    if (actual === expected || rebaseline) continue
    throw new Error(
      `[artifacts] public/${file} does not match its committed hash.\n` +
        `  committed ${expected}\n  on disk   ${actual}\n` +
        `Regenerate it with \`${regenerate}\`, or set ${env}=1 for this build while rebaselining.`,
    )
  }
}
