// The Playground's browser half. Astro puts this module through Vite, so it can import the
// compiler and the language service from the vendored checkout. The component's own
// `define:vars` script is emitted inline as a classic script, which has no import at all, so
// everything past the first line of it would die with a SyntaxError; the values it used to
// carry arrive here as data attributes instead.
import {
  TypeshadeLanguageService,
  compile,
  compileTsSource,
  reflect,
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
  readonly entryPoints: string
  readonly resources: string
  readonly inputs: string
  readonly outputs: string
  readonly returns: string
  readonly runCpu: string
  readonly running: string
  readonly cpuIdle: string
  readonly noResources: string
  readonly noEntryPoints: string
  readonly requiredFeatures: string
  readonly cpuFailed: string
  readonly entryCountOne: string
}

// ── Reflection ─────────────────────────────────────────────────────────────────────────────
// What reflect() recovers from the compiled module, shaped for the pane. Names and types in
// here come from the source in the editor, so every one of them reaches the page as text on a
// node and none of it is ever written as markup.

/** One parameter or result of an entry point, as reflect() reports it. */
interface ReflectedField {
  readonly name?: string
  readonly type?: string
  readonly builtin?: string
  readonly location?: number
}

/** One entry point of the module. */
interface ReflectedEntry {
  readonly name: string
  readonly stage: string
  readonly io?: { readonly inputs?: readonly ReflectedField[]; readonly outputs?: readonly ReflectedField[] }
}

/** The zero of a reflected type, for calling an entry point with something valid. A type this
 *  has no case for (a struct, say) cannot be synthesised, and that entry point is left alone. */
function zeroFor(type: string | undefined): { ok: true; value: unknown } | { ok: false } {
  if (!type) return { ok: false }
  if (type === 'bool') return { ok: true, value: false }
  if (/^[uif](?:8|16|32|64)$/.test(type)) return { ok: true, value: 0 }
  const vec = /^vec([234])</.exec(type)
  if (vec) return { ok: true, value: Array.from({ length: Number(vec[1]) }, () => 0) }
  return { ok: false }
}

/** How a field reads on one line: `name: type` and the attribute that placed it, when it has one. */
function fieldLabel(field: ReflectedField): { text: string; attr: string } {
  const text = field.name && field.type ? `${field.name}: ${field.type}` : (field.type ?? field.name ?? '')
  if (field.builtin) return { text, attr: `@builtin(${field.builtin})` }
  if (typeof field.location === 'number') return { text, attr: `@location(${field.location})` }
  return { text, attr: '' }
}

/** A returned value as the pane prints it: arrays inline, everything else as JSON. */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v)).join(', ')}]`
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ')} }`
  }
  return typeof value === 'number' ? String(Number(value.toFixed(6))) : JSON.stringify(value) ?? String(value)
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** One `label   value` line. */
function ioRow(label: string, text: string, attr = '', valueClass = 'io-value'): HTMLElement {
  const row = el('div', 'io-row')
  row.append(el('span', 'io-label', label))
  const value = el('span', valueClass, text)
  if (attr) {
    value.append(document.createTextNode('  '))
    value.append(el('span', 'attr', attr))
  }
  row.append(value)
  return row
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
// The output pane is WGSL. Monaco ships a grammar for it among its basic languages, so the
// pane is coloured by the same editor and the same theme as the source beside it.
const WGSL_LANGUAGE = 'wgsl'
const MONACO_VERSION = '0.52.2'
const MONACO_MIN = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`
const MONACO_VS = `${MONACO_MIN}/vs`

function monacoWorkerUrl(_label: string): string {
  // A worker script fetched straight from the CDN is cross-origin, so each worker is a small
  // same-origin shim that names Monaco's own baseUrl and pulls the real worker in from there.
  //
  // Every label loads the same bootstrap. workerMain.js carries the AMD loader and reads the
  // module to run from the message Monaco sends it, so it serves the TypeScript worker and
  // the plain editor worker alike. Importing language/typescript/tsWorker.js directly, as
  // this did, hands the worker an AMD module with no loader under it, and the browser reports
  // that as the script failing to load; the CDN serves that file, so it read as a network
  // problem and was not one.
  //
  // baseUrl is the directory above vs, since the paths workerMain.js resolves start with vs/.
  const source =
    `self.MonacoEnvironment={baseUrl:${JSON.stringify(`${MONACO_MIN}/`)}};` +
    `importScripts(${JSON.stringify(`${MONACO_VS}/base/worker/workerMain.js`)});`
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

// ── The site's dark mode ───────────────────────────────────────────────────────────────────
// Base.astro puts the reader's choice on `documentElement.dataset.theme` and leaves it unset
// while the choice is the system's. Monaco keeps a theme of its own, so it is told which one
// on load, on the toggle, and when the system setting moves under an unset choice.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function siteIsDark(): boolean {
  const chosen = document.documentElement.dataset.theme
  return chosen ? chosen === 'dark' : darkQuery.matches
}

function followSiteTheme(monaco: any, repaint: () => void): void {
  const apply = () => {
    monaco.editor.setTheme(siteIsDark() ? 'vs-dark' : 'vs')
    repaint()
  }
  apply()
  new MutationObserver(apply).observe(document.documentElement, { attributeFilter: ['data-theme'] })
  darkQuery.addEventListener('change', apply)
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
  const reflectionPane = root.querySelector('[data-reflection]')
  const runCpu = root.querySelector('[data-run-cpu]')

  let editor: any
  let model: any
  let monacoApi: any
  let timer = 0
  let painted = 0
  let shown = ''
  // The last good compile, kept so the CPU button can call into it without compiling again.
  let compiled: ReturnType<typeof compile> | undefined
  let reflection: ReturnType<typeof reflect> | undefined
  let entries: readonly ReflectedEntry[] = []

  /** Draws the reflection pane for the module that just compiled. */
  const paintReflection = (): void => {
    if (!(reflectionPane instanceof HTMLElement)) return
    reflectionPane.textContent = ''
    if (runCpu instanceof HTMLButtonElement) runCpu.disabled = entries.length === 0

    const entryGroup = el('div', 'group')
    entryGroup.append(el('p', 'group-title', copy.entryPoints))
    if (entries.length === 0) {
      entryGroup.append(el('p', 'empty', copy.noEntryPoints))
    }
    for (const entry of entries) {
      const box = el('div', 'entry')
      const head = el('div', 'entry-head')
      head.append(el('span', 'stage', `@${entry.stage}`))
      head.append(el('span', 'entry-name', entry.name))
      box.append(head)
      for (const field of entry.io?.inputs ?? []) {
        const { text, attr } = fieldLabel(field)
        box.append(ioRow(copy.inputs, text, attr))
      }
      for (const field of entry.io?.outputs ?? []) {
        const { text, attr } = fieldLabel(field)
        box.append(ioRow(copy.outputs, text, attr))
      }
      const returns = ioRow(copy.returns, copy.cpuIdle, '', 'io-value empty')
      returns.dataset.returns = entry.name
      box.append(returns)
      entryGroup.append(box)
    }
    reflectionPane.append(entryGroup)

    // Resources, and the features the module asks the device for, each only when it has any.
    const resources = reflection
      ? [
          ...reflection.bindGroups.flatMap((group) =>
            (group.entries ?? []).map((entry) => ({ label: `@group(${group.group ?? 0})`, text: `${entry.name}: ${entry.resourceKind}` })),
          ),
          ...reflection.overrides.map((o) => ({ label: 'override', text: String(o.name ?? o) })),
        ]
      : []
    const resourceGroup = el('div', 'group')
    resourceGroup.append(el('p', 'group-title', copy.resources))
    if (resources.length === 0) resourceGroup.append(el('p', 'empty', copy.noResources))
    else for (const r of resources) resourceGroup.append(ioRow(r.label, r.text))
    reflectionPane.append(resourceGroup)

    const features: readonly string[] = reflection?.requiredFeatures ?? []
    if (features.length > 0) {
      const featureGroup = el('div', 'group')
      featureGroup.append(el('p', 'group-title', copy.requiredFeatures))
      for (const f of features) featureGroup.append(ioRow('', String(f)))
      reflectionPane.append(featureGroup)
    }
  }

  /** Runs every entry point on the CPU oracle and writes what each returned. */
  const evaluateOnCpu = (): void => {
    if (!compiled || !(reflectionPane instanceof HTMLElement)) return
    for (const entry of entries) {
      const slot = reflectionPane.querySelector(`[data-returns="${CSS.escape(entry.name)}"] .io-value`)
      const target = slot instanceof HTMLElement ? slot : reflectionPane.querySelector(`[data-returns="${CSS.escape(entry.name)}"]`)?.lastElementChild
      if (!(target instanceof HTMLElement)) continue
      const args: unknown[] = []
      let callable = true
      for (const field of entry.io?.inputs ?? []) {
        const zero = zeroFor(field.type)
        if (!zero.ok) { callable = false; break }
        args.push(zero.value)
      }
      if (!callable) {
        target.textContent = copy.cpuFailed
        target.className = 'io-value empty'
        continue
      }
      try {
        const value = compiled.eval(entry.name, args)
        const shownArgs = (entry.io?.inputs ?? []).map((f, i) => `${f.name ?? `arg${i}`} = ${formatValue(args[i])}`).join(', ')
        target.textContent = shownArgs ? `${formatValue(value)}   (${shownArgs})` : formatValue(value)
        target.className = 'io-value'
      } catch (error) {
        target.textContent = error instanceof Error ? error.message : copy.cpuFailed
        target.className = 'io-value failed'
      }
    }
  }

  /** Puts WGSL in the output pane, plain first and coloured once Monaco has tokenised it.
   *  The plain text lands synchronously, so the pane reads correctly to a screen reader and
   *  to anything measuring it even when the colouring is slow or unavailable. */
  const paintOutput = (wgsl: string): void => {
    shown = wgsl
    const token = ++painted
    output.textContent = wgsl
    if (!monacoApi) return
    monacoApi.editor
      .colorize(wgsl, WGSL_LANGUAGE, { tabSize: 2 })
      .then((html: string) => {
        if (token === painted) output.innerHTML = html
      })
      .catch(() => {})
  }

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
        paintOutput(result.wgsl)
        root.classList.add('has-output')
      } else {
        shown = ''
        output.textContent = copy.noOutput
      }

      // Reflection reads the module the same source produced. A file with no directive, or one
      // the compiler complained about, has nothing worth reflecting, so the pane stays empty.
      compiled = undefined
      reflection = undefined
      entries = []
      if (result.hasDirective && found.length === 0) {
        try {
          compiled = compile(source)
          reflection = reflect(compiled.module)
          entries = (reflection.entries ?? []) as readonly ReflectedEntry[]
        } catch {
          compiled = undefined
          reflection = undefined
          entries = []
        }
      }
      paintReflection()
    } catch (error) {
      status.textContent = copy.errors
      root.classList.add('has-errors')
      diagnosticsPane.textContent = error instanceof Error ? error.message : String(error)
      compiled = undefined
      reflection = undefined
      entries = []
      paintReflection()
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

      // Colourising bakes the theme into the markup, so the pane is painted again on a change.
      followSiteTheme(monaco, () => { if (shown) paintOutput(shown) })
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
      if (runCpu instanceof HTMLButtonElement) runCpu.addEventListener('click', evaluateOnCpu)
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
