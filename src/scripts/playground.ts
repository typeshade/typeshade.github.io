// The Playground's browser half. Astro puts this module through Vite, so it can import the
// compiler and the language service from the vendored checkout. The component's own
// `define:vars` script is emitted inline as a classic script, which has no import at all, so
// everything past the first line of it would die with a SyntaxError; the values it used to
// carry arrive here as data attributes instead.
import {
  TypeshadeLanguageService,
  compileTsSource,
  type TypeshadeCompletionItem,
  type TypeshadeDiagnostic,
  type TypeshadePosition,
  type TypeshadeRange,
} from '../../vendor/shader-dsl/src/index.ts'

/** The words the component wrote into `data-copy`; they live in src/i18n. */
interface PlaygroundCopy {
  readonly fileName: string
  readonly idle: string
  readonly ready: string
  readonly errors: string
  readonly loading: string
  readonly clean: string
  readonly noOutput: string
  readonly directive: string
  readonly unavailable: string
}

/** Monaco's one-based cursor position. */
interface MonacoPosition {
  readonly lineNumber: number
  readonly column: number
}

/** Monaco's one-based, end-exclusive range, which a marker and a hover both take. */
interface MonacoRange {
  readonly startLineNumber: number
  readonly startColumn: number
  readonly endLineNumber: number
  readonly endColumn: number
}

// ── The one place the two coordinate systems meet ──────────────────────────────────────────
// Monaco counts lines and columns from 1. The language service counts both from 0, the way
// the Language Server Protocol does. Every crossing goes through these three functions, so a
// +1 or a -1 lives here and in no other file.

const toServicePosition = (position: MonacoPosition): TypeshadePosition => ({
  line: position.lineNumber - 1,
  character: position.column - 1,
})

const toMonacoRange = (range: TypeshadeRange): MonacoRange => {
  const startLineNumber = range.start.line + 1
  const startColumn = range.start.character + 1
  const endLineNumber = range.end.line + 1
  const endColumn = range.end.character + 1
  // A zero-width range draws no squiggle, so an empty one is widened by a column.
  const empty = endLineNumber === startLineNumber && endColumn <= startColumn
  return { startLineNumber, startColumn, endLineNumber, endColumn: empty ? startColumn + 1 : endColumn }
}

/** How a diagnostic's position reads in the diagnostics pane: the line and column an editor shows. */
const toDisplayPosition = (position: TypeshadePosition): string => `${position.line + 1}:${position.character + 1}`

// ── Monaco, from the CDN ───────────────────────────────────────────────────────────────────
// The editor is loaded the way its own samples load it, through its AMD loader. `MONACO_VS`
// is the directory the loader knows as `vs`, with no trailing slash: the loader joins
// `/editor/editor.main.js` onto it, and a trailing slash would make that a doubled separator
// the CDN answers with a 400.
const MONACO_VERSION = '0.52.2'
const MONACO_VS = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`

function monacoWorkerUrl(label: string): string {
  const worker = label === 'typescript' || label === 'javascript' ? 'language/typescript/tsWorker.js' : 'base/worker/workerMain.js'
  // A worker script fetched straight from the CDN is cross-origin, so each worker is a small
  // same-origin data: module that points Monaco's own baseUrl back at the CDN.
  const source =
    `self.MonacoEnvironment={baseUrl:${JSON.stringify(`${MONACO_VS}/`)}};` +
    `importScripts(${JSON.stringify(`${MONACO_VS}/${worker}`)});`
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`
}

function loadMonaco(): Promise<any> {
  const w = window as any
  if (w.monaco) return Promise.resolve(w.monaco)
  return new Promise((resolve, reject) => {
    const start = (): void => {
      const amdRequire = w.require
      if (typeof amdRequire !== 'function') {
        reject(new Error('The Monaco loader ran without defining its AMD require.'))
        return
      }
      amdRequire.config({ paths: { vs: MONACO_VS } })
      w.MonacoEnvironment = { getWorkerUrl: (_moduleId: string, label: string) => monacoWorkerUrl(label) }
      amdRequire(['vs/editor/editor.main'], () => resolve(w.monaco), reject)
    }
    const existing = document.querySelector('script[data-monaco-loader]')
    if (existing) {
      if (w.require) start()
      else existing.addEventListener('load', start, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `${MONACO_VS}/loader.js`
    script.async = true
    script.dataset.monacoLoader = 'true'
    script.addEventListener('load', start, { once: true })
    script.addEventListener('error', () => reject(new Error(`The Monaco loader did not load from ${MONACO_VS}/loader.js`)), { once: true })
    document.head.appendChild(script)
  })
}

function completionKind(monaco: any, kind: TypeshadeCompletionItem['kind']): number {
  const kinds = monaco.languages.CompletionItemKind
  const byKind: Record<TypeshadeCompletionItem['kind'], number> = {
    keyword: kinds.Keyword,
    type: kinds.TypeParameter,
    function: kinds.Function,
    attribute: kinds.Keyword,
    value: kinds.Value,
  }
  return byKind[kind] ?? kinds.Text
}

function mount(root: HTMLElement): void {
  const editorHost = root.querySelector('[data-editor]')
  const output = root.querySelector('[data-output]')
  const diagnosticsPane = root.querySelector('[data-diagnostics]')
  const status = root.querySelector('[data-status]')
  const run = root.querySelector('[data-run]')
  const reset = root.querySelector('[data-reset]')
  if (
    !(editorHost instanceof HTMLElement) ||
    !(output instanceof HTMLElement) ||
    !(diagnosticsPane instanceof HTMLElement) ||
    !(status instanceof HTMLElement) ||
    !(run instanceof HTMLButtonElement) ||
    !(reset instanceof HTMLButtonElement)
  ) {
    return
  }

  const sample = root.dataset.sample ?? ''
  const copy = JSON.parse(root.dataset.copy ?? '{}') as PlaygroundCopy
  const fileName = copy.fileName || 'hello.shade.ts'
  const languageService = new TypeshadeLanguageService({ fileName })

  let editor: any
  let model: any
  let monacoApi: any
  let timer = 0

  const describe = (diagnostic: TypeshadeDiagnostic): string =>
    `${diagnostic.category} ${toDisplayPosition(diagnostic.range.start)} ${diagnostic.message}`

  const render = (): void => {
    if (!editor || !model || !monacoApi) return
    const source = editor.getValue()
    status.textContent = copy.idle
    output.textContent = ''
    diagnosticsPane.textContent = ''
    root.classList.remove('has-errors', 'has-output')
    try {
      const result = compileTsSource(source, { fileName, requireDirective: true })
      const found = [...languageService.getDiagnostics(source)]
      const lines = found.map(describe)
      // The compiler stays quiet about a file with no directive, so the Playground says it.
      if (!result.hasDirective && lines.length === 0) lines.push(copy.directive)

      monacoApi.editor.setModelMarkers(
        model,
        'typeshade',
        found.map((diagnostic) => ({
          ...toMonacoRange(diagnostic.range),
          message: diagnostic.message,
          severity: diagnostic.category === 'warning' ? monacoApi.MarkerSeverity.Warning : monacoApi.MarkerSeverity.Error,
        })),
      )

      if (lines.length > 0) {
        status.textContent = copy.errors
        root.classList.add('has-errors')
        diagnosticsPane.textContent = lines.join('\n')
      } else {
        status.textContent = copy.ready
        diagnosticsPane.textContent = copy.clean
      }

      if (result.wgsl) {
        output.textContent = result.wgsl
        root.classList.add('has-output')
      } else {
        output.textContent = copy.noOutput
      }
    } catch (error) {
      status.textContent = copy.errors
      root.classList.add('has-errors')
      diagnosticsPane.textContent = error instanceof Error ? error.message : String(error)
    }
  }

  status.textContent = copy.loading
  loadMonaco()
    .then((monaco) => {
      monacoApi = monaco
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2022,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowNonTsExtensions: true,
        experimentalDecorators: true,
      })
      // TypeShade is TypeScript syntax with a compiler of its own behind it, and Monaco's
      // bundled TypeScript disagrees with it on the sample the page opens with: `builtin` is
      // an unknown name to it (TS2304), a field an entry point fills has no initialiser
      // (TS2564), `@location(0)` reads as the DOM's global Location (TS2349), and a decorator
      // on a function is a syntax error it has no option to relax (TS1206). The TypeShade
      // compiler reports none of those. So Monaco's own checking is off and the markers on
      // the model are the compiler's diagnostics.
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      })
      // Kept for completion and hover, which stay on.
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        [
          'declare type vec2 = { x: number; y: number }',
          'declare type vec3 = { x: number; y: number; z: number }',
          'declare type vec4 = { x: number; y: number; z: number; w: number }',
          'declare type u32 = number',
          'declare type i32 = number',
          'declare type f32 = number',
          'declare function vec2(x: number, y: number): vec2',
          'declare function vec3(x: number, y: number, z: number): vec3',
          'declare function vec4(x: number, y: number, z: number, w: number): vec4',
        ].join('\n'),
        'file:///types/typeshade.d.ts',
      )

      model = monaco.editor.createModel(sample, 'typescript', monaco.Uri.parse(`file:///${fileName}`))
      editor = monaco.editor.create(editorHost, {
        model,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 21,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'off',
        scrollBeyondLastLine: false,
        padding: { top: 14, bottom: 14 },
        quickSuggestions: true,
        roundedSelection: false,
      })

      monaco.languages.registerCompletionItemProvider('typescript', {
        triggerCharacters: ['@', '"', ':'],
        provideCompletionItems: (currentModel: any, position: MonacoPosition) => {
          if (currentModel.uri.toString() !== model.uri.toString()) return { suggestions: [] }
          const items = languageService.getCompletions(currentModel.getValue(), toServicePosition(position))
          const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
          return {
            suggestions: items.map((item) => ({
              label: item.label,
              kind: completionKind(monaco, item.kind),
              insertText: item.insertText ?? (item.label.startsWith('@') ? item.label.slice(1) : item.label),
              detail: item.detail,
              range,
            })),
          }
        },
      })

      monaco.languages.registerHoverProvider('typescript', {
        provideHover: (currentModel: any, position: MonacoPosition) => {
          if (currentModel.uri.toString() !== model.uri.toString()) return null
          const hover = languageService.getHover(currentModel.getValue(), toServicePosition(position))
          if (!hover) return null
          const r = toMonacoRange(hover.range)
          return {
            contents: hover.contents.map((value) => ({ value })),
            range: new monaco.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn),
          }
        },
      })

      editor.onDidChangeModelContent(() => {
        window.clearTimeout(timer)
        timer = window.setTimeout(render, 350)
      })
      run.addEventListener('click', render)
      reset.addEventListener('click', () => {
        editor.setValue(sample)
        render()
        editor.focus()
      })
      render()
    })
    .catch((error) => {
      status.textContent = copy.errors
      root.classList.add('has-errors')
      // The reader gets the sentence; the console keeps the cause.
      diagnosticsPane.textContent = copy.unavailable
      console.error('[playground]', error)
    })
}

const root = document.querySelector('[data-playground]')
if (root instanceof HTMLElement) mount(root)
