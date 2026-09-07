// ═══ typeshade.dev — BUILD-TIME proof for section 4, "The editor catches it" ═══
//
// Two claims, both computed here and neither hand-written:
//   (a) a wrong field in a TypeShade shader is a TypeScript error — the message below comes
//       out of the real `typescript` compiler, run over the snippet the page prints;
//   (b) the uniform block's std140 byte layout comes out of `reflect()`, so no offset on the
//       page was derived by hand — which is the product's own claim about layouts.
//
// The instrument is gated rather than trusted. The SAME program type-checks two arms — the
// snippet with the field misspelt, and the snippet as authored — and the build fails if the
// wrong arm is clean or the control arm is not. An instrument that cannot tell the two apart
// would report "0 errors" for a broken compiler and "1 error" for a working one with equal
// confidence; this one has to demonstrate the difference before its output is used.
//
// Runs in the Astro frontmatter (Node), never in the browser: it reads the filesystem and
// drives `ts.createProgram`. One program, memoized for the whole build (~1 s).

import ts from 'typescript'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { reflect } from '../../vendor/shader-dsl/src/index.ts'
import { gradientModule } from './typed-error-shader.ts'

/** The authored fragment, its uniform struct, and the module `reflect()` is run over. */
const FIXTURE = path.resolve(process.cwd(), 'src/lib/typed-error-shader.ts')
/** The read the wrong arm breaks, and what it is broken into. Exactly one of the former must
 *  sit inside the snippet region — asserted, so renaming the field cannot silently defuse the
 *  proof into a control-vs-control comparison. */
const RIGHT_READ = 'U.field.top'
const WRONG_READ = 'U.field.colour'
/** The brief caps a page snippet at 8 lines; enforced here rather than remembered. */
const MAX_SNIPPET_LINES = 8
/** A `Property 'x' does not exist on type '<struct>'` message carries the whole struct type.
 *  Past this many characters the page gets the first line only, with `truncated` set. */
const MAX_MESSAGE_CHARS = 300

export interface TypedErrorDiagnostic {
  /** TypeScript's own error number (2339 for a property that does not exist). */
  readonly code: number
  /** The compiler's text, verbatim unless `truncated`. */
  readonly message: string
  /** 1-based line WITHIN `snippet` — the same number as `wrongLine`. */
  readonly line: number
  /** 1-based column within that line. */
  readonly column: number
  /** True when `message` is the first line of a longer diagnostic. */
  readonly truncated: boolean
}

export interface TypedErrorField {
  readonly name: string
  /** DSL type key, e.g. `vec4<f32>`. */
  readonly type: string
  /** std140 byte offset, from `reflect()`. */
  readonly offset: number
  readonly size: number
}

export interface TypedErrorLayout {
  readonly struct: string
  /** std140 size of the whole block, rounded to its 16-byte alignment. */
  readonly size: number
  readonly fields: readonly TypedErrorField[]
}

export interface TypedError {
  /** The snippet as the page shows it: the authored fragment with the wrong field read. */
  readonly snippet: string
  /** 1-based line of the wrong read within `snippet` — the line a code frame marks. */
  readonly wrongLine: number
  readonly diagnostic: TypedErrorDiagnostic
  /** The control arm: the same snippet, correct, proven to type-check with zero diagnostics. */
  readonly fixed: { readonly snippet: string }
  readonly layout: TypedErrorLayout
  /** Seconds the type-check took, so the build cost is a measured number on the page's own terms. */
  readonly typeCheckSeconds: number
}

/** Lines strictly between `// #region <name>` and `// #endregion <name>`, plus the 1-based
 *  line number the first of them has in `text`. */
function region(text: string, name: string): { body: string; firstLine: number } {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.trim() === `// #region ${name}`)
  const end = lines.findIndex((l) => l.trim() === `// #endregion ${name}`)
  if (start < 0 || end < 0 || end <= start + 1)
    throw new Error(`[typed-error] ${FIXTURE} has no '// #region ${name}' … '// #endregion ${name}' pair`)
  return { body: lines.slice(start + 1, end).join('\n'), firstLine: start + 2 }
}

function countOf(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

/** Build a program over the two in-memory arms. They live at real paths inside `src/lib/` (they
 *  are never written there) so the fixture's own relative import of the mirror resolves exactly
 *  as it does on disk, and so both arms are compiled by ONE checker under ONE set of options. */
function checkBothArms(
  wrongSource: string,
  fixedSource: string,
): { wrong: readonly ts.Diagnostic[]; fixed: readonly ts.Diagnostic[]; wrongFile: ts.SourceFile; seconds: number } {
  const t0 = performance.now()
  const root = process.cwd()
  const configPath = path.join(root, 'tsconfig.json')
  const readConfig = ts.readConfigFile(configPath, ts.sys.readFile)
  if (readConfig.error) throw new Error(`[typed-error] cannot read ${configPath}`)
  const parsed = ts.parseJsonConfigFileContent(readConfig.config, ts.sys, root, undefined, configPath)

  const options: ts.CompilerOptions = {
    ...parsed.options,
    // The project's options are the point (`strict`, `allowImportingTsExtensions`, bundler
    // resolution); these overrides only make the run cheap and side-effect-free. `types` is
    // pinned because the mirror's `variant-link.ts` names WebGPU handles.
    noEmit: true,
    skipLibCheck: true,
    isolatedModules: false,
    declaration: false,
    sourceMap: false,
    incremental: false,
    types: ['@webgpu/types'],
  }
  delete options.composite
  delete options.tsBuildInfoFile

  const dir = path.dirname(FIXTURE)
  const wrongPath = path.join(dir, '__typed-error-wrong.ts')
  const fixedPath = path.join(dir, '__typed-error-fixed.ts')
  const inMemory = new Map([
    [wrongPath, wrongSource],
    [fixedPath, fixedSource],
  ])

  const host = ts.createCompilerHost(options, true)
  const hostGetSourceFile = host.getSourceFile.bind(host)
  const hostFileExists = host.fileExists.bind(host)
  const hostReadFile = host.readFile.bind(host)
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    const text = inMemory.get(path.resolve(fileName))
    return text === undefined
      ? hostGetSourceFile(fileName, languageVersion, onError, shouldCreate)
      : ts.createSourceFile(fileName, text, languageVersion, true, ts.ScriptKind.TS)
  }
  host.fileExists = (fileName) => inMemory.has(path.resolve(fileName)) || hostFileExists(fileName)
  host.readFile = (fileName) => inMemory.get(path.resolve(fileName)) ?? hostReadFile(fileName)

  const program = ts.createProgram([wrongPath, fixedPath], options, host)
  const wrongFile = program.getSourceFile(wrongPath)
  const fixedFile = program.getSourceFile(fixedPath)
  if (!wrongFile || !fixedFile) throw new Error('[typed-error] the in-memory arms did not reach the program')

  return {
    wrong: ts.getPreEmitDiagnostics(program, wrongFile),
    fixed: ts.getPreEmitDiagnostics(program, fixedFile),
    wrongFile,
    seconds: (performance.now() - t0) / 1000,
  }
}

function describe(d: ts.Diagnostic): string {
  return `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
}

let memo: TypedError | undefined

/**
 * The section-4 proof, computed once per build.
 *
 * Throws rather than returning a weakened result: a missing region, a snippet over 8 lines, a
 * control arm with diagnostics, or a wrong arm without one all fail `bun run build`.
 */
export function typedError(): TypedError {
  if (memo) return memo

  const fixtureSource = readFileSync(FIXTURE, 'utf8')
  const { body: fixedSnippet, firstLine } = region(fixtureSource, 'snippet')

  const snippetLines = fixedSnippet.split('\n').length
  if (snippetLines > MAX_SNIPPET_LINES)
    throw new Error(`[typed-error] snippet is ${snippetLines} lines; the brief caps it at ${MAX_SNIPPET_LINES}`)
  const reads = countOf(fixedSnippet, RIGHT_READ)
  if (reads !== 1)
    throw new Error(
      `[typed-error] the snippet region reads '${RIGHT_READ}' ${reads} times; exactly 1 is required, ` +
        `or the wrong arm is not the control arm with one field broken`,
    )

  const wrongSnippet = fixedSnippet.replace(RIGHT_READ, WRONG_READ)
  const wrongSource = fixtureSource.replace(fixedSnippet, wrongSnippet)
  if (wrongSource === fixtureSource) throw new Error('[typed-error] the snippet region did not substitute')

  const { wrong, fixed, wrongFile, seconds } = checkBothArms(wrongSource, fixtureSource)

  // The instrument must distinguish. Either failure here means the reported diagnostic says
  // nothing about the compiler, so the build stops instead of publishing it.
  if (fixed.length > 0)
    throw new Error(
      `[typed-error] the CONTROL arm (the authored snippet) must type-check clean; ` +
        `got ${fixed.length}: ${fixed.map(describe).join(' | ')}`,
    )
  if (wrong.length === 0)
    throw new Error(
      `[typed-error] the WRONG arm ('${WRONG_READ}') produced no diagnostic — the type-check ` +
        `cannot tell a broken shader from a correct one, so its output is worthless`,
    )

  const located = wrong.find((d) => d.file === wrongFile && d.start !== undefined)
  if (!located)
    throw new Error(`[typed-error] no diagnostic landed in the snippet: ${wrong.map(describe).join(' | ')}`)

  const { line, character } = wrongFile.getLineAndCharacterOfPosition(located.start!)
  const wrongLine = line + 1 - (firstLine - 1)
  if (wrongLine < 1 || wrongLine > snippetLines)
    throw new Error(`[typed-error] the diagnostic landed on line ${line + 1}, outside the snippet region`)

  const full = ts.flattenDiagnosticMessageText(located.messageText, '\n')
  const truncated = full.length > MAX_MESSAGE_CHARS || full.includes('\n')
  const message = truncated ? full.split('\n')[0]!.slice(0, MAX_MESSAGE_CHARS) : full

  const block = reflect(gradientModule).uniforms[0]
  if (!block) throw new Error('[typed-error] the fixture module binds no uniform block')

  memo = {
    snippet: wrongSnippet,
    wrongLine,
    diagnostic: { code: located.code, message, line: wrongLine, column: character + 1, truncated },
    fixed: { snippet: fixedSnippet },
    layout: {
      struct: block.name,
      size: block.size,
      fields: block.fields.map((f) => ({ name: f.name, type: f.type, offset: f.offset, size: f.size })),
    },
    typeCheckSeconds: seconds,
  }
  return memo
}
