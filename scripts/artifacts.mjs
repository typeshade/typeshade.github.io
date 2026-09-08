// Generated binary files the site ships, each committed with a .sha256 sidecar. The build
// asserts the hashes; the capture scripts set the matching *_REBASELINE variable while they
// regenerate a file.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/** One still per mount, with the page it is captured from. A mount forced onto WebGL2 gets
 *  its own file, so the image under it is a frame that backend drew. */
export const STILLS = [
  { id: 'metaballs', example: 'metaballs', page: '/' },
  { id: 'gradient', example: 'gradient', page: '/checks/', backend: 'webgpu' },
  { id: 'gradient-webgl2', example: 'gradient', page: '/checks/', forceWebGl2: true, backend: 'webgl2' },
  { id: 'fp64-deep-zoom', example: 'fp64-deep-zoom', page: '/examples/' },
]

export const ARTIFACTS = [
  { file: 'og.png', env: 'OG_REBASELINE', regenerate: 'bun run capture:og' },
  { file: 'favicon.ico', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
  { file: 'apple-touch-icon.png', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
  { file: 'mask-icon.svg', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
  ...STILLS.map(({ id }) => ({
    file: `stills/${id}.png`,
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
