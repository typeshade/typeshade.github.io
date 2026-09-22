// Build-time facts, computed from the vendored compiler (vendor/shader-dsl). Every code
// sample and every number on the page comes from here.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { examples, type ShaderExample } from '../../vendor/shader-dsl/examples/index.ts'
import { shortBlurb } from './blurb.ts'
import { builtinCounts } from './builtin-table.ts'
import { languageCounts } from './language-reference.ts'
import { loweringRowCount, loweringTripLimit } from './typescript-lowering.ts'
import { glslCapabilityCount } from './glsl-mapping.ts'
import { wgslBuiltinIdCount } from './target-mapping.ts'
import { shadeCounts } from './shade-examples.ts'
import { shadeCounts, shadeExampleList } from './shade-examples.ts'
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
  // %cI is ISO 8601, and git spells a commit made at UTC two ways: '+00:00' up to git 2.43,
  // 'Z' from 2.55. The same pinned commit therefore reads differently depending on which git
  // built the site, and dateModified would move with the runner. 'Z' is folded into '+00:00'
  // so the page is the same either way. A commit at any other offset is untouched.
  const date = execSync('git -C vendor/shader-dsl log -1 --format=%cI HEAD', { encoding: 'utf8' }).trim().replace(/Z$/, '+00:00')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(date)) throw new Error(`[examples] unusable commit date '${date}'`)
  return date
}

const pkg = JSON.parse(readFileSync(path.join(vendorRoot, 'package.json'), 'utf8')) as {
  version: string
  license: string
  author: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
  optionalDependencies?: Record<string, string>
}

/** The names the mirror's package.json puts into a consumer's install: `dependencies`,
 *  `optionalDependencies`, and every `peerDependencies` entry not marked optional in
 *  `peerDependenciesMeta`. An optional peer installs nothing and does not count.
 *  devDependencies is the compiler's own CI toolchain and never reaches an install.
 *  At the pinned commit the one name is `typescript`, a required peer since the language
 *  service compiles TypeScript source; every core subpath does without it. A name outside
 *  this list stops the build, because the copy counts these and names them. */
const RUNTIME_DEPS = ['typescript']
function runtimeDeps(): readonly string[] {
  const meta = pkg.peerDependenciesMeta ?? {}
  const requiredPeers = Object.keys(pkg.peerDependencies ?? {}).filter((name) => !meta[name]?.optional)
  const declared = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
    ...requiredPeers,
  ].sort()
  const unexpected = declared.filter((name) => !RUNTIME_DEPS.includes(name))
  if (unexpected.length > 0) {
    throw new Error(`[examples] the mirror's package.json now installs ${unexpected.join(', ')} into a consumer; update the copy`)
  }
  return declared
}

/** The author field with the address removed, so the copyright line and the structured data
 *  carry the name alone. The mirror writes it in npm's `Name <email>` form. */
function authorName(): string {
  const name = pkg.author.replace(/\s*<[^>]*>/, '').replace(/\s*\([^)]*\)/, '').trim()
  if (name.length === 0) throw new Error(`[examples] the mirror's author field '${pkg.author}' has no name`)
  return name
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

const builtins = builtinCounts()
const languageSurface = languageCounts()

export const facts = {
  examples: examples.length,
  /** The other corpus: the `.shade.ts` files, written in TypeScript source and compiled from
   *  the file itself. They are registered in examples/_shade.ts and not in the barrel the
   *  count above reads, so the two are counted apart and shown apart. */
  shadeExamples: shadeCounts.total,
  /** How many of those have a GLSL ES 3.00 form. The registry states it per file; a compute
   *  entry and a WGSL-only texture have none. */
  shadeRenderable: shadeCounts.renderable,
  /** Both corpora, for the sentences that count the repository's examples as a whole. */
  totalExamples: examples.length + shadeCounts.total,
  bothTargets: countBothTargets(),
  /** How many examples of the two corpora together have a GLSL ES 3.00 pair baked beside
   *  their WGSL in examples/__emit-goldens__/. The per-example pages read that directory, so
   *  a pin that stops baking a stage stops the build here as well as at the page that wanted
   *  the file. */
  goldenGlslPairs: [...examples, ...shadeExampleList].filter((e) => e.renderable).length,
  wgslOnlyExample: wgslOnlyExample(),
  fp64Examples: examples.filter((e) => e.id.startsWith('fp64')).length,
  testFiles: testFiles.length,
  pinnedCommit: pinnedCommit(),
  license: pkg.license,
  author: authorName(),
  /** The year of the pinned commit, for the copyright line. */
  year: pinnedYear(),
  /** The pinned commit's own date, for WebPage.dateModified on the guide and the reference. */
  pinnedDate: pinnedDate(),
  glslTarget: glslTarget(),
  /** The builtin registry, counted at the pin (src/lib/builtin-table.ts): every id the
   *  compiler can spell, the ones spelled the same way on both targets, the ones GLSL ES 3.00
   *  has no form for, and the ones the `Math.*` surface has a name for. The builtin table
   *  page prints all four and types none of them. */
  builtins: builtins.total,
  portableBuiltins: builtins.portable,
  glslAbsentBuiltins: builtins.noGlsl,
  mathAliasBuiltins: builtins.aliased,
  /** The construct rows on /guide/language/from-typescript/, counted from the generator that
   *  compiles one program per row (src/lib/typescript-lowering.ts). */
  constructRows: loweringRowCount(),
  /** The most trips a counted `for` may run, read off the compiler's own refusal. */
  forTripLimit: loweringTripLimit(),
  /** How many `@builtin(...)` ids the WGSL vocabulary holds (src/core/sot.ts
   *  WGSL_BUILTIN_NAMES). The WGSL mapping page states it and types none of it. */
  wgslBuiltinIds: wgslBuiltinIdCount(),
  /** How many capabilities the GLSL ES 3.00 profile has a row for
   *  (src/core/backends/glsl.ts GLSL_CAP_PROFILE). Everything with no row fails the module
   *  closed on that target. The GLSL mapping page states it and types none of it. */
  glslCapabilities: glslCapabilityCount(),
  layoutStandards: layoutStandards(),
  runtimeDeps: runtimeDeps().length,
  /** The names behind that count, so a sentence can say which one it is. */
  runtimeDepNames: runtimeDeps(),
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
  /** The documented language surface at the pin, counted from the six tables the compiler's
   *  language service keeps one sentence per name in (src/lib/language-reference.ts). The
   *  language reference at /reference/ is generated from them, and every count on those
   *  pages is read from here. */
  languageEntries: languageSurface.total,
  languageTypes: languageSurface.type,
  languageAttributes: languageSurface.attribute,
  languageBuiltinValues: languageSurface.builtin,
  languageFunctions: languageSurface.function,
  languageConstants: languageSurface.constant,
  languageMathMembers: languageSurface.math,
}

// The copy was written against these values, at the commit this names. Every count is
// compared at whatever commit is pinned now, so the pin that changes one stops the build and
// asks for a copy decision. Comparing them only at the commit the copy was written at left
// the check inert from the next pin on, which is when it has something to catch.
const pinned = {
  commit: 'ee71d18', examples: 36, shadeExamples: 51, bothTargets: 35, testFiles: 302,
  builtins: 139, portableBuiltins: 44, glslAbsentBuiltins: 31, mathAliasBuiltins: 27,
  constructRows: 65, forTripLimit: 256,
  wgslBuiltinIds: 15, glslCapabilities: 4,
  languageEntries: 235, languageTypes: 31, languageAttributes: 5, languageBuiltinValues: 15,
  languageFunctions: 140, languageConstants: 8, languageMathMembers: 36,
}
const pinned = { commit: 'ee71d18', examples: 36, shadeExamples: 51, bothTargets: 35, goldenGlslPairs: 73, testFiles: 302 }
const drift: string[] = []
if (facts.examples !== pinned.examples) drift.push(`examples ${facts.examples} != ${pinned.examples}`)
if (facts.shadeExamples !== pinned.shadeExamples) drift.push(`shadeExamples ${facts.shadeExamples} != ${pinned.shadeExamples}`)
if (facts.bothTargets !== pinned.bothTargets) drift.push(`bothTargets ${facts.bothTargets} != ${pinned.bothTargets}`)
if (facts.goldenGlslPairs !== pinned.goldenGlslPairs) drift.push(`goldenGlslPairs ${facts.goldenGlslPairs} != ${pinned.goldenGlslPairs}`)
if (facts.testFiles < pinned.testFiles) drift.push(`testFiles ${facts.testFiles} < ${pinned.testFiles}`)
if (facts.builtins !== pinned.builtins) drift.push(`builtins ${facts.builtins} != ${pinned.builtins}`)
if (facts.portableBuiltins !== pinned.portableBuiltins) drift.push(`portableBuiltins ${facts.portableBuiltins} != ${pinned.portableBuiltins}`)
if (facts.glslAbsentBuiltins !== pinned.glslAbsentBuiltins) drift.push(`glslAbsentBuiltins ${facts.glslAbsentBuiltins} != ${pinned.glslAbsentBuiltins}`)
if (facts.mathAliasBuiltins !== pinned.mathAliasBuiltins) drift.push(`mathAliasBuiltins ${facts.mathAliasBuiltins} != ${pinned.mathAliasBuiltins}`)
if (facts.constructRows !== pinned.constructRows) drift.push(`constructRows ${facts.constructRows} != ${pinned.constructRows}`)
if (facts.forTripLimit !== pinned.forTripLimit) drift.push(`forTripLimit ${facts.forTripLimit} != ${pinned.forTripLimit}`)
if (facts.wgslBuiltinIds !== pinned.wgslBuiltinIds) drift.push(`wgslBuiltinIds ${facts.wgslBuiltinIds} != ${pinned.wgslBuiltinIds}`)
if (facts.glslCapabilities !== pinned.glslCapabilities) drift.push(`glslCapabilities ${facts.glslCapabilities} != ${pinned.glslCapabilities}`)
if (facts.languageEntries !== pinned.languageEntries) drift.push(`languageEntries ${facts.languageEntries} != ${pinned.languageEntries}`)
if (facts.languageTypes !== pinned.languageTypes) drift.push(`languageTypes ${facts.languageTypes} != ${pinned.languageTypes}`)
if (facts.languageAttributes !== pinned.languageAttributes) drift.push(`languageAttributes ${facts.languageAttributes} != ${pinned.languageAttributes}`)
if (facts.languageBuiltinValues !== pinned.languageBuiltinValues) drift.push(`languageBuiltinValues ${facts.languageBuiltinValues} != ${pinned.languageBuiltinValues}`)
if (facts.languageFunctions !== pinned.languageFunctions) drift.push(`languageFunctions ${facts.languageFunctions} != ${pinned.languageFunctions}`)
if (facts.languageConstants !== pinned.languageConstants) drift.push(`languageConstants ${facts.languageConstants} != ${pinned.languageConstants}`)
if (facts.languageMathMembers !== pinned.languageMathMembers) drift.push(`languageMathMembers ${facts.languageMathMembers} != ${pinned.languageMathMembers}`)
if (drift.length > 0) {
  throw new Error(
    `[examples] the pinned mirror (${facts.pinnedCommit}) no longer matches the copy written at ${pinned.commit}: ${drift.join('; ')}`,
  )
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
