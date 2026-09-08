// Build-time facts, computed from the vendored compiler (vendor/shader-dsl). Every code
// sample and every number on the page comes from here.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { examples, type ShaderExample } from '../../vendor/shader-dsl/examples/index.ts'
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

/** The complete file the quick start shows: gradient-pass.ts's uniform block, both stages
 *  and the module they build, real source with nothing rewritten except the import line,
 *  which now points at the path this pin resolves (nothing is on npm yet; the checked-out
 *  submodule is the package), and one emit call appended so the file runs end to end. */
function buildQuickStartFile(): { code: string; lines: number; importPath: string } {
  const importPath = `./${gitmodulesField('path')}/src/index.js`
  const importStart = source.indexOf('import {')
  const importEnd = source.indexOf(`from '../src/index.js'`)
  if (importStart < 0 || importEnd < 0) throw new Error("[examples] gradient-pass.ts's import block moved")
  const names = source
    .slice(importStart + 'import {'.length, importEnd)
    .replace(/\}\s*$/, '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
  const importLine = `import { ${[...names, 'emitModule'].join(', ')} } from '${importPath}'`

  const declStart = source.indexOf('const U = uniformStruct(')
  const moduleStart = source.indexOf('const gradientModule = module({')
  const moduleEnd = source.indexOf('\n})', moduleStart)
  if (declStart < 0 || moduleStart < 0 || moduleEnd < 0) throw new Error("[examples] gradient-pass.ts's declarations moved")
  const decls = source.slice(declStart, moduleStart).trim()
  const moduleDecl = source.slice(moduleStart, moduleEnd + 3)

  const code = [importLine, '', decls, '', moduleDecl, '', 'console.log(emitModule(gradientModule))'].join('\n')
  return { code, lines: countLines(code), importPath }
}
export const quickStartFile = buildQuickStartFile()

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

/** Whether one example emits both GLSL stages. A compute kernel has no GLSL ES 3.00 stage
 *  and refuses, which is what the count and the examples table both read. */
export function emitsGlsl(module: ShaderExample['module']): boolean {
  try {
    emitGlslModule(module, 'vertex')
    emitGlslModule(module, 'fragment')
    return true
  } catch {
    return false
  }
}

/** The one registry example that emits WGSL alone, so the examples table can name it once
 *  instead of repeating "WGSL and GLSL ES 3.00" in every other row. The build stops if the
 *  registry ever has none or more than one, the same way it stops on a drifted count. */
function wgslOnlyExample(): { id: string; title: string } {
  const only = examples.filter((e) => !emitsGlsl(e.module))
  if (only.length !== 1) throw new Error(`[examples] expected exactly one WGSL-only example, found ${only.length}`)
  return { id: only[0]!.id, title: only[0]!.title }
}

/** How many registry examples emit both targets. WGSL emission runs outside the guard
 *  because every example must emit WGSL; only a GLSL refusal is counted. */
function countBothTargets(): number {
  let n = 0
  for (const e of examples) {
    emitModule(e.module)
    if (emitsGlsl(e.module)) n += 1
  }
  return n
}

// Acronyms an example's blurb may keep in capitals. Anything else in capitals is the
// upstream file emphasising a word, which this site sets in ordinary type.
const ACRONYMS = new Set(['WGSL', 'GLSL', 'ES', 'GPU', 'CPU', 'RGB', 'LOD', 'SDF', 'API', 'LORAN', 'IO'])
// The first clause of a blurb, up to an em dash, a colon or the first full stop.
const CLAUSE = new RegExp(` \u2014 |: |(?<=\\.)\\s`)

/** One example's blurb, shortened to its first clause. The blurbs are written in the
 *  compiler's repository, so they are trimmed to this site's typography. */
function shortBlurb(text: string): string {
  const clause = text.split(CLAUSE)[0]!.replace(/\s*\(#\d+\)/g, '').trim()
  const plain = clause.replace(/\b[A-Z]{2,}\b/g, (w) => (ACRONYMS.has(w) ? w : w.toLowerCase()))
  return `${plain.replace(/[.,;:]$/, '')}.`
}

/** The English description of every example, keyed by id. English is the compiler's own
 *  wording; every other language writes its own line against the same keys, in src/i18n. */
export function registryBlurbs(): Record<string, string> {
  return Object.fromEntries(examples.map((e) => [e.id, shortBlurb(e.blurb)]))
}

/** One locale's descriptions, checked against the registry, so an example added upstream
 *  cannot reach the table without a line in each language. */
export function checkedBlurbs(blurbs: Record<string, string>): Record<string, string> {
  const ids = examples.map((e) => e.id)
  const missing = ids.filter((id) => !blurbs[id])
  const extra = Object.keys(blurbs).filter((id) => !ids.includes(id))
  if (missing.length > 0) throw new Error(`[examples] no description for ${missing.join(', ')}`)
  if (extra.length > 0) throw new Error(`[examples] description for ${extra.join(', ')}, which the registry has no example for`)
  return blurbs
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

/** The pinned commit's own date, ISO 8601 with its offset, for WebPage.dateModified on the
 *  pages generated from it (the guide and the reference). Nothing else on the site reads it. */
function pinnedDate(): string {
  const date = execSync('git -C vendor/shader-dsl log -1 --format=%cI HEAD', { encoding: 'utf8' }).trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(date)) throw new Error(`[examples] unusable commit date '${date}'`)
  return date
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
  wgslOnlyExample: wgslOnlyExample(),
  fp64Examples: examples.filter((e) => e.id.startsWith('fp64')).length,
  testFiles: testFiles.length,
  pinnedCommit: pinnedCommit(),
  license: pkg.license,
  author: pkg.author,
  /** The year of the pinned commit, for the copyright line. */
  year: pinnedYear(),
  /** The pinned commit's own date, for WebPage.dateModified on the guide and the reference. */
  pinnedDate: pinnedDate(),
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
