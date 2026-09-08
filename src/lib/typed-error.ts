// Build-time proof for the types section. The snippet with a misspelt field is type-checked
// by the real TypeScript compiler, and the uniform block's std140 layout comes from
// reflect(). The correct snippet is checked too, and the build fails if the wrong one is
// clean or the correct one is not.

import ts from 'typescript'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { reflect } from '../../vendor/shader-dsl/src/index.ts'
import { gradientModule } from './typed-error-shader.ts'

/** The authored fragment, its uniform struct, and the module `reflect()` is run over. */
const FIXTURE = path.resolve(process.cwd(), 'src/lib/typed-error-shader.ts')
/** The field read the wrong arm breaks, and what it is broken into. */
const RIGHT_READ = 'U.field.top'
const WRONG_READ = 'U.field.colour'
/** Page snippets are capped at 8 lines. */
const MAX_SNIPPET_LINES = 8
/** A `Property 'x' does not exist on type '<struct>'` message carries the whole struct type.
 *  Past this many characters the page gets the first line only, with `truncated` set. */
const MAX_MESSAGE_CHARS = 300

export interface TypedErrorDiagnostic {
  /** TypeScript's own error number (2339 for a property that does not exist). */
  readonly code: number
  /** The compiler's own text, or its first line when `truncated`. */
  readonly message: string
  /** 1-based line within `snippet`. */
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
  /** 1-based line of the wrong read within `snippet`. */
  readonly wrongLine: number
  readonly diagnostic: TypedErrorDiagnostic
  /** The same snippet, correct, checked to have zero diagnostics. */
  readonly fixed: { readonly snippet: string }
  readonly layout: TypedErrorLayout
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

/** Build one program over both in-memory arms. They get real paths inside src/lib (nothing is
 *  written to disk) so the fixture's relative import of the compiler resolves as on disk. */
function checkBothArms(
  wrongSource: string,
  fixedSource: string,
): { wrong: readonly ts.Diagnostic[]; fixed: readonly ts.Diagnostic[]; wrongFile: ts.SourceFile } {
  const root = process.cwd()
  const configPath = path.join(root, 'tsconfig.json')
  const readConfig = ts.readConfigFile(configPath, ts.sys.readFile)
  if (readConfig.error) throw new Error(`[typed-error] cannot read ${configPath}`)
  const parsed = ts.parseJsonConfigFileContent(readConfig.config, ts.sys, root, undefined, configPath)

  const options: ts.CompilerOptions = {
    ...parsed.options,
    // Keep the project's options; these overrides only make the run cheap and side-effect-free.
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
  }
}

function describe(d: ts.Diagnostic): string {
  return `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
}

let memo: TypedError | undefined

/**
 * The section-4 proof, computed once per build.
 *
 * A missing region, a snippet over 8 lines, a clean wrong arm or a failing correct arm all
 * fail the build.
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
      `[typed-error] the snippet region reads '${RIGHT_READ}' ${reads} times; exactly 1 is required`,
    )

  const wrongSnippet = fixedSnippet.replace(RIGHT_READ, WRONG_READ)
  const wrongSource = fixtureSource.replace(fixedSnippet, wrongSnippet)
  if (wrongSource === fixtureSource) throw new Error('[typed-error] the snippet region did not substitute')

  const { wrong, fixed, wrongFile } = checkBothArms(wrongSource, fixtureSource)

  // Both arms must behave, or the diagnostic says nothing about the compiler.
  if (fixed.length > 0)
    throw new Error(
      `[typed-error] the correct snippet must type-check clean; ` +
        `got ${fixed.length}: ${fixed.map(describe).join(' | ')}`,
    )
  if (wrong.length === 0)
    throw new Error(
      `[typed-error] the wrong arm ('${WRONG_READ}') produced no diagnostic`,
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
  }
  return memo
}
