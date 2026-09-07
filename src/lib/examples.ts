// Build-time facts, computed from the vendored mirror (vendor/shader-dsl = typeshade/typeshade).
// Every code sample and every number on the page comes from here, so the page cannot drift
// from what the compiler actually emits or contains.
//
// Two rules this file exists to keep. (1) Nothing here is typed: a number is measured, or it
// does not ship. (2) The mirror is PINNED, so a measurement that changes is a change of
// subject — the assertions at the bottom refuse it rather than letting the page quietly
// restate a different fact under the copy deck's wording.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { examples } from '../../vendor/shader-dsl/examples/index.ts'
import { emitModule, emitGlslModule, reflect } from '../../vendor/shader-dsl/src/index.ts'
import { heroPayload } from './hero-shader.ts'

const rawSources = import.meta.glob('../../vendor/shader-dsl/examples/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const sourceByFile = Object.fromEntries(
  Object.entries(rawSources).map(([p, src]) => [p.split('/').pop()!, src]),
)

/** The text between `from` (inclusive) and the first `to` after it (inclusive), else ''. */
function between(text: string, from: string, to: string): string {
  const a = text.indexOf(from)
  if (a < 0) return ''
  const b = text.indexOf(to, a + from.length)
  return b < 0 ? text.slice(a) : text.slice(a, b + to.length)
}

/** Lines as the emitter writes them. Every emit ends with a trailing newline, so this counts
 *  the final empty position too — the count an editor's gutter shows, and the one the copy
 *  deck's claim table was measured with. One convention for all three counts, so the WGSL
 *  number and the two GLSL stage numbers are comparable to each other. */
const countLines = (text: string): number => text.split('\n').length

const ex = examples.find((e) => e.id === 'gradient')
if (!ex) throw new Error("example 'gradient' not in the mirror's registry")
const source = sourceByFile[ex.file] ?? ''
const wgsl = emitModule(ex.module)
const glslVertex = emitGlslModule(ex.module, 'vertex')
const glsl = emitGlslModule(ex.module, 'fragment')

function css(v: readonly number[]): string {
  return `rgb(${v.slice(0, 3).map((c) => Math.round(c * 255)).join(' ')})`
}
const ctl = ex.controls as Record<string, { kind: string; value?: readonly number[] }>
const authored = between(source, 'const fsGradient = fn(', '\n)')

/** The hero: one authored fragment function, the fragment it emits for each target, the two
 *  colours it blends, and the SHAPE of what it emitted — measured, never listed (P4). */
export const hero = {
  file: ex.file,
  authored,
  /** Asserted equal to the numeral §write renders (IA R-3). */
  authoredLines: countLines(authored),
  wgsl: between(wgsl, '@fragment', '\n}'),
  glsl: between(glsl, 'void main()', '\n}'),
  top: ctl.top?.value ? css(ctl.top.value) : '#7dd3fc',
  bottom: ctl.bottom?.value ? css(ctl.bottom.value) : '#0b0f14',
  /** `B1.EMIT`'s four measured values. `payloadBytes` is measured on the very string
   *  `ShaderCanvas.astro` inlines (`heroPayload`), so the size the card reports is the size
   *  the page ships. */
  emit: {
    wgslLines: countLines(wgsl),
    glslVertexLines: countLines(glslVertex),
    glslFragmentLines: countLines(glsl),
    payloadBytes: new TextEncoder().encode(heroPayload(ex.id)).length,
  },
}

const vendorRoot = path.resolve(process.cwd(), 'vendor/shader-dsl')
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.ts')) out.push(p)
  }
  return out
}
// Counted from the PACKAGE ROOT, not from `src/` — the widening owner decision (3) of the
// copy deck ratified: 146 files, of which 135 are under `src/`.
const packageFiles = walk(vendorRoot)
const testFiles = packageFiles.filter((f) => f.endsWith('.test.ts'))
const srcLoc = packageFiles
  .filter((f) => f.startsWith(path.join(vendorRoot, 'src')) && !f.endsWith('.test.ts'))
  .reduce((n, f) => n + readFileSync(f, 'utf8').split('\n').length, 0)

/** How many registry examples emit BOTH targets from the one authored source — measured by
 *  running both emitters over every entry, never asserted from a count written down
 *  somewhere. WGSL emission runs OUTSIDE the guard: every example emits WGSL, so a throw
 *  there is a broken emitter and must fail the build rather than silently lower this number.
 *  The GLSL refusal is the fact being counted (`compute-reduction` has no GLSL ES 3.00 path:
 *  that backend has no compute stage). */
function countBothTargets(): number {
  let n = 0
  for (const e of examples) {
    emitModule(e.module)
    try {
      emitGlslModule(e.module, 'vertex')
      emitGlslModule(e.module, 'fragment')
      n += 1
    } catch {
      // WGSL-only example — counted by omission, which is exactly the rail chip's claim.
    }
  }
  return n
}

function pinnedCommit(): string {
  const sha = execSync('git -C vendor/shader-dsl rev-parse --short HEAD', {
    encoding: 'utf8',
  }).trim()
  // Every shader, number and link on the page is labelled with this hash. A fallback string
  // here would put a hash-shaped lie in front of the reader, so it fails the build instead.
  if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new Error(`[examples] unusable pinned commit '${sha}'`)
  return sha
}

const pkg = JSON.parse(readFileSync(path.join(vendorRoot, 'package.json'), 'utf8')) as {
  name: string
  version: string
  license: string
  dependencies?: unknown
  peerDependencies?: unknown
  devDependencies?: unknown
}

/** `0 runtime dependencies` is derived from the ABSENCE of all three dependency fields, which
 *  is the claim the rail chip and §adopt make word for word. If the mirror ever declares one,
 *  the number stops being derivable and the build says so instead of printing a stale 0. */
function runtimeDeps(): number {
  const declared = (['dependencies', 'peerDependencies', 'devDependencies'] as const).filter(
    (f) => f in pkg,
  )
  if (declared.length > 0) {
    throw new Error(
      `[examples] the mirror's package.json now declares ${declared.join(', ')} — the ` +
        `"0 runtime dependencies" claim is no longer derivable from an absent field`,
    )
  }
  return 0
}

/** The mirror URL comes from `.gitmodules`, the one place this repo declares where
 *  `vendor/shader-dsl` was cloned from, so §adopt's submodule command cannot name a mirror
 *  other than the one the page was built from (IA R-11). */
function mirrorUrl(): string {
  const conf = readFileSync(path.resolve(process.cwd(), '.gitmodules'), 'utf8')
  const m = /\[submodule "vendor\/shader-dsl"\][^[]*?\burl\s*=\s*(\S+)/.exec(conf)
  if (!m) throw new Error('[examples] no url for vendor/shader-dsl in .gitmodules')
  return m[1]!.replace(/\.git$/, '').replace(/\/$/, '')
}

/** The path the submodule command tells a reader to clone INTO. Read from the same
 *  `.gitmodules` stanza as the URL, so `B5.INSTALL` prints the command this repository
 *  actually ran — which is what ratifies the target path (IA R-11) instead of asserting it. */
function mirrorPath(): string {
  const conf = readFileSync(path.resolve(process.cwd(), '.gitmodules'), 'utf8')
  const m = /\[submodule "vendor\/shader-dsl"\][^[]*?\bpath\s*=\s*(\S+)/.exec(conf)
  if (!m) throw new Error('[examples] no path for vendor/shader-dsl in .gitmodules')
  return m[1]!
}

const semver = (v: string): [number, number, number] => {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v)
  if (!m) throw new Error(`[examples] the mirror's version '${v}' is not semver`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
const gte = (a: string, b: string): boolean => {
  const [x, y] = [semver(a), semver(b)]
  for (let i = 0; i < 3; i++) if (x[i]! !== y[i]!) return x[i]! > y[i]!
  return true
}
const mirrorVersion = pkg.version
/** The version the page names everywhere it says "not published yet": the next minor above
 *  what the mirror declares. Derived, never typed. */
const nextVersion = `${semver(mirrorVersion)[0]}.${semver(mirrorVersion)[1] + 1}.0`

function deepZoomOrigin(): { name: string; sourceType: string; layoutType: string } {
  const e = examples.find((x) => x.id === 'fp64-deep-zoom')
  if (!e) throw new Error("[examples] no example 'fp64-deep-zoom' in the mirror's registry")
  const field = reflect(e.module).uniforms[0]?.fields.find((f) => f.name === 'origin')
  if (!field) throw new Error("[examples] 'fp64-deep-zoom' reflects no 'origin' field")
  // The whole sentence rests on this being the f64 the emulation is about. If the example ever
  // declares it as something else, the page must not keep printing the old claim.
  if (field.type !== 'f64') {
    throw new Error(`[examples] 'fp64-deep-zoom' declares origin as '${field.type}', not f64`)
  }
  const lanes = field.size / 4
  if (!Number.isInteger(lanes) || lanes < 1) {
    throw new Error(`[examples] origin occupies ${field.size} bytes, which is not whole f32 lanes`)
  }
  return { name: field.name, sourceType: field.type, layoutType: lanes === 1 ? 'f32' : `vec${lanes}<f32>` }
}

/** The GLSL target the compiler actually emits, read from the `#version` directive of an
 *  emitted fragment stage — `#version 300 es` becomes `GLSL ES 3.00`. The rail, §agree and
 *  `/llms.txt` all name this target, and R-14 asserts every numeral in `/llms.txt` against
 *  `facts`: a target NAME that is typed is a numeral that is typed. */
function glslTarget(): string {
  const m = /^#version\s+(\d)(\d\d)\s+es\b/.exec(glsl)
  if (!m) throw new Error(`[examples] the emitted GLSL names no '#version <n> es': ${glsl.slice(0, 40)}`)
  return `GLSL ES ${m[1]}.${m[2]}`
}

/** The buffer layout standards `reflect()` implements, read from `reflect()`'s own source —
 *  the file §types links as the one wording for that destination. Derived rather than typed
 *  for the same reason as the target above, and if the compiler stops naming one, the fact
 *  disappears and the sentence that claims it fails to build. */
function layoutStandards(): readonly string[] {
  const src = readFileSync(path.join(vendorRoot, 'src/core/reflect.ts'), 'utf8')
  const found = [...new Set(src.match(/\bstd\d{3}\b/g) ?? [])].sort()
  if (found.length === 0) {
    throw new Error("[examples] reflect.ts names no std<n> layout standard")
  }
  return found
}

export const facts = {
  examples: examples.length,
  /** 35 of 36 at the pinned commit — measured by `countBothTargets`, asserted below. */
  bothTargets: countBothTargets(),
  fp64Examples: examples.filter((e) => e.id.startsWith('fp64')).length,
  testFiles: testFiles.length,
  srcLocRounded: `${Math.round(srcLoc / 1000)}k`,
  pinnedCommit: pinnedCommit(),
  packageName: pkg.name,
  license: pkg.license,
  /** `GLSL ES 3.00`, read from the emitter's own `#version` line. */
  glslTarget: glslTarget(),
  /** `std140`, `std430` — read from `reflect()`'s source, in the order §types prints them. */
  layoutStandards: layoutStandards(),
  runtimeDeps: runtimeDeps(),
  mirrorUrl: mirrorUrl(),
  mirrorPath: mirrorPath(),
  mirrorVersion,
  nextVersion,
  /** The release state behind the `pre-release` chip, `HERO.STATUS`, §adopt's body and the
   *  footer's npm label. It is the mirror's OWN version measured against the version the page
   *  names — the npm registry is not reachable at build time, and a page that claimed to have
   *  checked it would be making the one claim it cannot verify. `nextVersion` is derived from
   *  `mirrorVersion`, so this cannot flip on its own: retiring the honesty device is a
   *  deliberate edit made when the release exists, not a silent one. */
  published: gte(mirrorVersion, nextVersion),
  /** §precision's two half-labels, from the registry entry itself — HTML, never in the
   *  shader (IA `B4.LABELS`). */
  splitLabels: examples.find((e) => e.id === 'fp64-deep-zoom')?.splitLabels ?? null,
  /** `B4.REFLECT` — §precision's build-time TEXT proof, so the block still argues its claim
   *  with every canvas removed (IA R-18). The source declares `origin` as f64; the LAYOUT
   *  gives it two f32 lanes, which is what an emulated double is in a buffer. The lane count
   *  is DERIVED from the reflected byte size, so the sentence follows the compiler rather
   *  than restating it. */
  deepZoomOrigin: deepZoomOrigin(),
  /** Whether §precision's SPLIT bezel ships — a ratification, not a position: the position is
   *  `--b4-split` in global.css, and design §2 keeps every size in that one file, so the
   *  fraction is never written twice and cannot drift between them.
   *
   *  `false` ships the single-row legend and no rule. It is `true` because the re-measure
   *  design §5 and §10 risk 3 make the precondition actually ran, on the crop that ships:
   *  the 672 x 448 mount puts the banded → smooth discontinuity at x = 336 of 672 =
   *  50.000 %, identically on WebGPU and on WebGL2, with 16 distinct column-luminance levels
   *  left of it against 168 right — 10.5x, over G10's >= 8x rung. M-8's 41.4 % was a 2.40:1
   *  spike frame and does not describe this crop. The example agrees from its own source
   *  (`p.vo.uv.x.lt(0.5).select(stripes32, stripes64)`), so the constant is corroborated as
   *  well as measured. G10 asserts the RENDERED discontinuity against `--b4-split` — never
   *  against a round number that happens to match it. */
  b4SplitReady: true,
  /** Facts about the MARKET, never about TypeShade's audience — so they render with this
   *  record's own source beside them (deck §5 `whowrites`, D-11). Literal data, because the
   *  source is a third-party publication and there is nothing in the mirror to measure. */
  survey: {
    title: 'Khronos Shader Ecosystem Survey 2026',
    /** % who adapt shaders across platforms, APIs or tools. */
    figure64: 64,
    /** % who call that adaptation one of their largest engineering costs. */
    figure10: 10,
    /** Respondents, reported by the source as "over 400". */
    n: 400,
    fieldStart: '2026-06-16',
    fieldEnd: '2026-07-10',
    url: 'https://www.khronos.org/blog/shader-ecosystem-survey-results-2026',
  },
}

// ── the pinned-mirror assertions (IA R-2) ───────────────────────────────────
// The values above SHIP whatever they measure; these refuse a silent change of subject at the
// commit the copy deck was written against, and a test-file count below the floor it ratified
// at any commit. A count that legitimately moves is a copy decision, made once, in the open.
const pinned = { commit: '29c9614', examples: 36, bothTargets: 35, testFiles: 146 }
const drift: string[] = []
if (facts.pinnedCommit === pinned.commit) {
  if (facts.examples !== pinned.examples) drift.push(`examples ${facts.examples} ≠ ${pinned.examples}`)
  if (facts.bothTargets !== pinned.bothTargets) {
    drift.push(`bothTargets ${facts.bothTargets} ≠ ${pinned.bothTargets}`)
  }
}
if (facts.testFiles < pinned.testFiles) {
  drift.push(`testFiles ${facts.testFiles} < ${pinned.testFiles}`)
}
if (drift.length > 0) {
  throw new Error(
    `[examples] the pinned mirror no longer matches what 07-copy-deck.md measured: ` +
      `${drift.join('; ')}. Re-run the deck's claim table before changing these numbers.`,
  )
}
