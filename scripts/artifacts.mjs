// The four binary artifacts the page ships that are GENERATED, not authored — and the one
// rule that keeps them honest (design §9).
//
// Each is produced by a script that runs OUTSIDE `bun run build` (a headless launch is 3-5 s
// against NFR-12's 8 s budget), and each is committed together with a `.sha256` sidecar. The
// build then asserts the hash — ~5 ms — so a stale or hand-edited artifact fails the build
// instead of shipping. `OG_REBASELINE=1` / `ICONS_REBASELINE=1` is the ONE deliberate way past
// a mismatch, and it is what the capture scripts set for their own internal build.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

export const ARTIFACTS = [
  { file: 'og.png', env: 'OG_REBASELINE', regenerate: 'bun run capture:og' },
  { file: 'favicon.ico', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
  { file: 'apple-touch-icon.png', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
  { file: 'mask-icon.svg', env: 'ICONS_REBASELINE', regenerate: 'bun run build:icons' },
]

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/** Write `<file>` and, AFTER it, `<file>.sha256` — in that order, so a crash can leave a stale
 *  hash but never an unhashed artifact (§9). */
export function writeHashed(root, file, bytes) {
  const target = path.join(root, 'public', file)
  writeFileSync(target, bytes)
  const digest = sha256(bytes)
  writeFileSync(`${target}.sha256`, `${digest}\n`)
  return digest
}

/** The build gate. Throws on the first artifact whose bytes do not match its sidecar. */
export function verifyArtifacts(root) {
  for (const { file, env, regenerate } of ARTIFACTS) {
    const rebaseline = process.env[env] === '1'
    const target = path.join(root, 'public', file)
    const sidecar = `${target}.sha256`
    if (!existsSync(target) || !existsSync(sidecar)) {
      if (rebaseline) continue
      throw new Error(
        `[artifacts] public/${file} or its .sha256 is missing. It is generated, never authored: ` +
          `run \`${regenerate}\`.`,
      )
    }
    const actual = sha256(readFileSync(target))
    const expected = readFileSync(sidecar, 'utf8').trim()
    if (actual === expected) continue
    if (rebaseline) continue
    throw new Error(
      `[artifacts] public/${file} does not match its committed hash.\n` +
        `  committed ${expected}\n  on disk   ${actual}\n` +
        `Regenerate it deliberately with \`${regenerate}\`, or set ${env}=1 for this build if ` +
        `you are mid-rebaseline.`,
    )
  }
}
