// Build-time facts, computed from the vendored compiler (vendor/shader-dsl). Every code
// sample and every number on the page comes from here.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { examples } from '../../vendor/shader-dsl/examples/index.ts'
import { emitModule, emitGlslModule, reflect } from '../../vendor/shader-dsl/src/index.ts'

// Read with fs from the site root, without Vite's glob, so scripts run by bun
// (check-copy.ts) can import this module too.
const examplesDir = path.resolve('vendor/shader-dsl/examples')
const sourceByFile = Object.fromEntries(
  readdirSync(examplesDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => [f, readFileSync(path.join(examplesDir, f), 'utf8')]),
)

/** Text from `from` (inclusive) to the first `to` after it (inclusive), else ''. */
function between(text: string, from: string, to: string): string {
  const a = text.indexOf(from)
  if (a < 0) return ''
  const b = text.indexOf(to, a + from.length)
  return b < 0 ? text.slice(a) : text.slice(a, b + to.length)
}

/** Line count as an editor gutter shows it, including the empty line after a trailing newline. */
const countLines = (text: string): number => text.trimEnd().split('\n').length

const ex = examples.find((e) => e.id === 'gradient')
if (!ex) throw new Error("example 'gradient' is not in the registry")
const source = sourceByFile[ex.file] ?? ''
const wgsl = emitModule(ex.module)
const glslVertex = emitGlslModule(ex.module, 'vertex')
const glsl = emitGlslModule(ex.module, 'fragment')

const authored = between(source, 'const fsGradient = fn(', '\n)')

/** The gradient example: the authored fragment function and what it emits for each target. */
export const hero = {
  file: ex.file,
  authored,
  authoredLines: countLines(authored),
  wgsl: between(wgsl, '@fragment', '\n}'),
  glsl: between(glsl, 'void main()', '\n}'),
  emit: {
    wgslLines: countLines(wgsl),
    glslVertexLines: countLines(glslVertex),
    glslFragmentLines: countLines(glsl),
  },
}

/** The source file of one registry example, so a caption can name it. */
export function exampleFile(id: string): string {
  const e = examples.find((x) => x.id === id)
  if (!e) throw new Error(`[examples] no example '${id}' in the registry`)
  return e.file
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
const packageFiles = walk(vendorRoot)
const testFiles = packageFiles.filter((f) => f.endsWith('.test.ts'))

/** How many registry examples emit both targets. WGSL emission runs outside the guard
 *  because every example must emit WGSL; only a GLSL refusal is counted. */
function countBothTargets(): number {
  let n = 0
  for (const e of examples) {
    emitModule(e.module)
    try {
      emitGlslModule(e.module, 'vertex')
      emitGlslModule(e.module, 'fragment')
      n += 1
    } catch {
      // WGSL-only example (compute has no GLSL ES 3.00 stage).
    }
  }
  return n
}

function pinnedCommit(): string {
  const sha = execSync('git -C vendor/shader-dsl rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new Error(`[examples] unusable pinned commit '${sha}'`)
  return sha
}

function pinnedYear(): number {
  const date = execSync('git -C vendor/shader-dsl log -1 --format=%cs HEAD', { encoding: 'utf8' }).trim()
  const year = Number(date.slice(0, 4))
  if (!Number.isInteger(year) || year < 2020) throw new Error(`[examples] unusable commit date '${date}'`)
  return year
}

const pkg = JSON.parse(readFileSync(path.join(vendorRoot, 'package.json'), 'utf8')) as {
  version: string
  license: string
  author: string
  dependencies?: unknown
  peerDependencies?: unknown
  optionalDependencies?: unknown
}

/** Zero is derived from the absence of the three fields that put code into a consumer's install.
 *  devDependencies is the compiler's own CI toolchain and never reaches an install. */
function runtimeDeps(): number {
  const declared = (['dependencies', 'peerDependencies', 'optionalDependencies'] as const).filter((f) => f in pkg)
  if (declared.length > 0) {
    throw new Error(`[examples] the mirror's package.json now declares ${declared.join(', ')}; update the copy`)
  }
  return 0
}

function gitmodulesField(field: 'url' | 'path'): string {
  const conf = readFileSync(path.resolve(process.cwd(), '.gitmodules'), 'utf8')
  const m = new RegExp(`\\[submodule "vendor\\/shader-dsl"\\][^[]*?\\b${field}\\s*=\\s*(\\S+)`).exec(conf)
  if (!m) throw new Error(`[examples] no ${field} for vendor/shader-dsl in .gitmodules`)
  return m[1]!
}

const semver = (v: string): [number, number, number] => {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v)
  if (!m) throw new Error(`[examples] the mirror's version '${v}' is not semver`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
const mirrorVersion = pkg.version
/** The next minor above the mirror's own version: the release the page says is not out yet. */
const nextVersion = `${semver(mirrorVersion)[0]}.${semver(mirrorVersion)[1] + 1}.0`

function deepZoomOrigin(): { name: string; sourceType: string; layoutType: string } {
  const e = examples.find((x) => x.id === 'fp64-deep-zoom')
  if (!e) throw new Error("[examples] no example 'fp64-deep-zoom' in the registry")
  const field = reflect(e.module).uniforms[0]?.fields.find((f) => f.name === 'origin')
  if (!field) throw new Error("[examples] 'fp64-deep-zoom' reflects no 'origin' field")
  if (field.type !== 'f64') throw new Error(`[examples] 'fp64-deep-zoom' declares origin as '${field.type}'`)
  const lanes = field.size / 4
  if (!Number.isInteger(lanes) || lanes < 1) throw new Error(`[examples] origin occupies ${field.size} bytes`)
  return { name: field.name, sourceType: field.type, layoutType: lanes === 1 ? 'f32' : `vec${lanes}<f32>` }
}

/** The GLSL target, read from the `#version` directive the compiler emits. */
function glslTarget(): string {
  const m = /^#version\s+(\d)(\d\d)\s+es\b/.exec(glsl)
  if (!m) throw new Error(`[examples] the emitted GLSL names no '#version <n> es'`)
  return `GLSL ES ${m[1]}.${m[2]}`
}

/** The buffer layout standards named in reflect()'s own source. */
function layoutStandards(): readonly string[] {
  const src = readFileSync(path.join(vendorRoot, 'src/core/reflect.ts'), 'utf8')
  const found = [...new Set(src.match(/\bstd\d{3}\b/g) ?? [])].sort()
  if (found.length === 0) throw new Error('[examples] reflect.ts names no std<n> layout standard')
  return found
}

export const facts = {
  examples: examples.length,
  bothTargets: countBothTargets(),
  fp64Examples: examples.filter((e) => e.id.startsWith('fp64')).length,
  testFiles: testFiles.length,
  pinnedCommit: pinnedCommit(),
  license: pkg.license,
  author: pkg.author,
  /** The year of the pinned commit, for the copyright line. */
  year: pinnedYear(),
  glslTarget: glslTarget(),
  layoutStandards: layoutStandards(),
  runtimeDeps: runtimeDeps(),
  mirrorUrl: gitmodulesField('url').replace(/\.git$/, '').replace(/\/$/, ''),
  mirrorPath: gitmodulesField('path'),
  mirrorVersion,
  nextVersion,
  splitLabels: examples.find((e) => e.id === 'fp64-deep-zoom')?.splitLabels ?? null,
  deepZoomOrigin: deepZoomOrigin(),
  /** Third-party survey figures. They describe the market as a whole. */
  survey: {
    title: 'Khronos 2026 Real-Time Shading Ecosystem Survey',
    figure64: 64,
    figure10: 10,
    n: 400,
    url: 'https://www.khronos.org/blog/shader-ecosystem-survey-results-2026',
  },
}

// The copy was written against these values at this commit. A change here is a copy
// decision, so the build stops and asks for one.
const pinned = { commit: 'd894fc0', examples: 36, bothTargets: 35, testFiles: 146 }
const drift: string[] = []
if (facts.pinnedCommit === pinned.commit) {
  if (facts.examples !== pinned.examples) drift.push(`examples ${facts.examples} != ${pinned.examples}`)
  if (facts.bothTargets !== pinned.bothTargets) drift.push(`bothTargets ${facts.bothTargets} != ${pinned.bothTargets}`)
}
if (facts.testFiles < pinned.testFiles) drift.push(`testFiles ${facts.testFiles} < ${pinned.testFiles}`)
if (drift.length > 0) {
  throw new Error(`[examples] the pinned mirror no longer matches the copy: ${drift.join('; ')}`)
}
// The page says the next version is not published. When the compiler reaches it, that copy
// has to change, so the build stops here instead of printing a stale sentence.
const reached = ((a, b) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!
  return true
})(semver(mirrorVersion), semver(nextVersion))
if (reached) {
  throw new Error(`[examples] the compiler is at ${mirrorVersion}; the page still says ${nextVersion} is unreleased`)
}
