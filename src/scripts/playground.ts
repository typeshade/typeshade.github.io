// The Playground's browser half. Astro puts this module through Vite, so it can import the
// compiler and the language service from the vendored checkout. The component's own
// `define:vars` script is emitted inline as a classic script, which has no import at all, so
// everything past the first line of it would die with a SyntaxError; the values it used to
// carry arrive here as data attributes instead.
import {
  TypeshadeLanguageService,
  compile,
  reflect,
  type BindGroup,
  type EntryInfo,
  type EntryIoField,
  type Reflection,
  type StructLayout,
  type TypeshadeCompletionItem,
  type TypeshadeDiagnostic,
  type TypeshadePosition,
  type TypeshadeRange,
} from '../../vendor/shader-dsl/src/index.ts';

/** The words the component wrote into `data-copy`; they live in src/i18n. */
interface PlaygroundCopy {
  readonly fileName: string;
  readonly idle: string;
  readonly ready: string;
  readonly errors: string;
  readonly loading: string;
  readonly clean: string;
  readonly directive: string;
  readonly unavailable: string;
  readonly copy: string;
  readonly copied: string;
  readonly share: string;
  readonly shared: string;
  readonly empty: { readonly pending: string; readonly glsl: string };
  readonly reflection: Record<string, string>;
  readonly runner: {
    readonly entry: string;
    readonly args: string;
    readonly execute: string;
    readonly result: string;
    readonly noEntries: string;
    readonly unsupported: string;
    readonly failed: string;
    readonly idle: string;
  };
}

/** One example as the page carries it: the source from the vendored file, the words from i18n. */
interface PlaygroundExample {
  readonly id: string;
  readonly source: string;
  readonly title: string;
  readonly description: string;
}

/** Monaco's one-based cursor position. */
interface MonacoPosition {
  readonly lineNumber: number;
  readonly column: number;
}

/** Monaco's one-based, end-exclusive range, which a marker and a hover both take. */
interface MonacoRange {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

/** A row of the diagnostics list: what to say and where it points. */
interface DiagnosticRow {
  readonly message: string;
  readonly category: TypeshadeDiagnostic['category'];
  readonly start: TypeshadePosition;
}

/** The five output tabs, by the id the markup gives them. */
type PanelId = 'wgsl' | 'glsl-vertex' | 'glsl-fragment' | 'reflection' | 'run';
const PANEL_IDS: readonly PanelId[] = ['wgsl', 'glsl-vertex', 'glsl-fragment', 'reflection', 'run'];

// ── The one place the two coordinate systems meet ──────────────────────────────────────────
// Monaco counts lines and columns from 1. The language service counts both from 0, the way
// the Language Server Protocol does. Every crossing goes through these four functions, so a
// +1 or a -1 lives here and in no other file.

const toServicePosition = (position: MonacoPosition): TypeshadePosition => ({
  line: position.lineNumber - 1,
  character: position.column - 1,
});

const toMonacoPosition = (position: TypeshadePosition): MonacoPosition => ({
  lineNumber: position.line + 1,
  column: position.character + 1,
});

const toMonacoRange = (range: TypeshadeRange): MonacoRange => {
  const startLineNumber = range.start.line + 1;
  const startColumn = range.start.character + 1;
  const endLineNumber = range.end.line + 1;
  const endColumn = range.end.character + 1;
  // A zero-width range draws no squiggle, so an empty one is widened by a column.
  const empty = endLineNumber === startLineNumber && endColumn <= startColumn;
  return { startLineNumber, startColumn, endLineNumber, endColumn: empty ? startColumn + 1 : endColumn };
};

/** How a diagnostic's position reads in the diagnostics pane: the line and column an editor shows. */
const toDisplayPosition = (position: TypeshadePosition): string => `${position.line + 1}:${position.character + 1}`;

// ── Monaco, from the CDN ───────────────────────────────────────────────────────────────────
// The editor is loaded the way its own samples load it, through its AMD loader. `MONACO_VS`
// is the directory the loader knows as `vs`, with no trailing slash: the loader joins
// `/editor/editor.main.js` onto it, and a trailing slash would make that a doubled separator
// the CDN answers with a 400.
// The code panes are coloured by the same editor and the same theme as the source beside
// them. Monaco ships a WGSL grammar among its basic languages. It ships none for GLSL, whose
// declarations, types and preprocessor lines are close enough to C that `cpp` colours them.
const WGSL_LANGUAGE = 'wgsl';
const GLSL_LANGUAGE = 'cpp';
const MONACO_VERSION = '0.52.2';
const MONACO_MIN = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`;
const MONACO_VS = `${MONACO_MIN}/vs`;

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
    `importScripts(${JSON.stringify(`${MONACO_VS}/base/worker/workerMain.js`)});`;
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
}

function loadMonaco(): Promise<any> {
  const w = window as any;
  if (w.monaco) return Promise.resolve(w.monaco);
  return new Promise((resolve, reject) => {
    const start = (): void => {
      const amdRequire = w.require;
      if (typeof amdRequire !== 'function') {
        reject(new Error('The Monaco loader ran without defining its AMD require.'));
        return;
      }
      amdRequire.config({ paths: { vs: MONACO_VS } });
      w.MonacoEnvironment = { getWorkerUrl: (_moduleId: string, label: string) => monacoWorkerUrl(label) };
      amdRequire(['vs/editor/editor.main'], () => resolve(w.monaco), reject);
    };
    const existing = document.querySelector('script[data-monaco-loader]');
    if (existing) {
      if (w.require) start();
      else existing.addEventListener('load', start, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = `${MONACO_VS}/loader.js`;
    script.async = true;
    script.dataset.monacoLoader = 'true';
    script.addEventListener('load', start, { once: true });
    script.addEventListener('error', () => reject(new Error(`The Monaco loader did not load from ${MONACO_VS}/loader.js`)), { once: true });
    document.head.appendChild(script);
  });
}

// ── The site's dark mode ───────────────────────────────────────────────────────────────────
// Base.astro puts the reader's choice on `documentElement.dataset.theme` and leaves it unset
// while the choice is the system's. Monaco keeps a theme of its own, so it is told which one
// on load, on the toggle, and when the system setting moves under an unset choice.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function siteIsDark(): boolean {
  const chosen = document.documentElement.dataset.theme;
  return chosen ? chosen === 'dark' : darkQuery.matches;
}

function followSiteTheme(monaco: any, repaint: () => void): void {
  const apply = () => {
    monaco.editor.setTheme(siteIsDark() ? 'vs-dark' : 'vs');
    repaint();
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributeFilter: ['data-theme'] });
  darkQuery.addEventListener('change', apply);
}

function completionKind(monaco: any, kind: TypeshadeCompletionItem['kind']): number {
  const kinds = monaco.languages.CompletionItemKind;
  const byKind: Record<TypeshadeCompletionItem['kind'], number> = {
    keyword: kinds.Keyword,
    type: kinds.TypeParameter,
    function: kinds.Function,
    attribute: kinds.Keyword,
    value: kinds.Value,
  };
  return byKind[kind] ?? kinds.Text;
}

// ── The source in the URL ──────────────────────────────────────────────────────────────────
// A shared link carries the whole file in its fragment, so nothing is stored and no service
// has to hand the source back. The bytes are deflated where the browser has
// CompressionStream and passed through where it does not; the first character says which, so
// a link written by one browser opens in another.
const PACKED = 'z';
const PLAIN = 'u';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encodeSource(source: string): Promise<string> {
  // A Blob built from the string is already UTF-8, so the same bytes feed the compressed
  // path and the plain one.
  const plain = new Blob([source]);
  if (typeof CompressionStream === 'function') {
    try {
      const packed = plain.stream().pipeThrough(new CompressionStream('deflate-raw'));
      return PACKED + toBase64Url(new Uint8Array(await new Response(packed).arrayBuffer()));
    } catch {
      // A browser that has the constructor but refuses the format falls through.
    }
  }
  return PLAIN + toBase64Url(new Uint8Array(await plain.arrayBuffer()));
}

async function decodeSource(text: string): Promise<string | undefined> {
  if (text.length < 2) return undefined;
  try {
    const bytes = fromBase64Url(text.slice(1));
    if (text.startsWith(PLAIN)) return new TextDecoder().decode(bytes);
    if (!text.startsWith(PACKED) || typeof DecompressionStream !== 'function') return undefined;
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  } catch {
    return undefined;
  }
}

const hashParams = (): URLSearchParams => new URLSearchParams(window.location.hash.replace(/^#/, ''));

function writeHash(key: string, value: string): void {
  const url = new URL(window.location.href);
  url.hash = `${key}=${value}`;
  window.history.replaceState(null, '', url);
}

// ── Small DOM helpers ──────────────────────────────────────────────────────────────────────
// Every reflected name and every value the oracle returns comes from whatever is in the
// editor, so all of it is set as text on a node and none of it is written as markup.

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function table(headers: readonly string[], rows: readonly (readonly string[])[]): HTMLTableElement {
  const node = el('table');
  const head = el('tr');
  for (const header of headers) head.appendChild(el('th', header));
  node.appendChild(el('thead')).appendChild(head);
  const body = el('tbody');
  for (const row of rows) {
    const line = el('tr');
    for (const cell of row) line.appendChild(el('td', cell));
    body.appendChild(line);
  }
  node.appendChild(body);
  return node;
}

/** A value the CPU oracle returned, printed so a vector reads on one line and NaN survives
 *  (JSON turns it into null, which would read as a value the shader produced). */
function formatValue(value: unknown, indent = ''): string {
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => formatValue(item)).join(', ')}]`;
  if (value && typeof value === 'object') {
    const fields = Object.entries(value as Record<string, unknown>);
    if (fields.length === 0) return '{}';
    const inner = `${indent}  `;
    return `{\n${fields.map(([key, item]) => `${inner}${key}: ${formatValue(item, inner)}`).join(',\n')}\n${indent}}`;
  }
  return String(value);
}

/** One entry point's parameters or results, as the reflection spells them. */
const ioText = (fields: readonly EntryIoField[]): string =>
  fields.length === 0
    ? '-'
    : fields
        .map((field) => {
          const attribute = field.builtin
            ? ` @builtin(${field.builtin})`
            : field.location !== undefined
              ? ` @location(${field.location})`
              : '';
          return `${field.name}: ${field.type}${attribute}`;
        })
        .join(', ');

// ── The reflection tab ─────────────────────────────────────────────────────────────────────

function layoutTables(layouts: readonly StructLayout[], copy: PlaygroundCopy): HTMLElement | undefined {
  if (layouts.length === 0) return undefined;
  const host = el('div');
  const bytes = (n: number) => `${n} B`;
  for (const layout of layouts) {
    host.appendChild(el('p', `${layout.name} (${bytes(layout.size)})`));
    host.appendChild(
      table(
        [copy.reflection.field, copy.reflection.type, copy.reflection.offset, copy.reflection.size],
        layout.fields.map((field) => [field.name, field.type, bytes(field.offset), bytes(field.size)]),
      ),
    );
  }
  return host;
}

function bindingTable(groups: readonly BindGroup[], copy: PlaygroundCopy): HTMLElement | undefined {
  const rows = groups.flatMap((group) =>
    group.entries.map((entry) => [
      String(entry.group),
      String(entry.binding),
      entry.structName ? `${entry.name}: ${entry.structName}` : entry.name,
      entry.space,
      entry.resourceKind,
    ]),
  );
  if (rows.length === 0) return undefined;
  const c = copy.reflection;
  return table([c.group, c.binding, c.name, c.space, c.kind], rows);
}

function entryTable(entries: readonly EntryInfo[], copy: PlaygroundCopy): HTMLElement | undefined {
  if (entries.length === 0) return undefined;
  const c = copy.reflection;
  const compute = entries.some((entry) => entry.workgroupSize !== undefined);
  const headers = compute ? [c.name, c.stage, c.workgroup, c.inputs, c.outputs] : [c.name, c.stage, c.inputs, c.outputs];
  const rows = entries.map((entry) => {
    const cells = [entry.name, `@${entry.stage}`, ioText(entry.io.inputs), ioText(entry.io.outputs)];
    return compute ? [cells[0], cells[1], entry.workgroupSize === undefined ? '-' : String(entry.workgroupSize), cells[2], cells[3]] : cells;
  });
  return table(headers, rows);
}

function paintReflection(host: HTMLElement, reflection: Reflection, copy: PlaygroundCopy): void {
  host.textContent = '';
  const c = copy.reflection;
  const add = (title: string, body: HTMLElement | undefined): void => {
    host.appendChild(el('h3', title));
    host.appendChild(body ?? el('p', c.none));
  };
  add(c.entries, entryTable(reflection.entries, copy));
  add(c.bindings, bindingTable(reflection.bindGroups, copy));
  add(c.uniforms, layoutTables(reflection.uniforms, copy));
  add(c.storage, layoutTables(reflection.storage, copy));
  add(c.features, reflection.requiredFeatures.length > 0 ? el('p', reflection.requiredFeatures.join(', ')) : undefined);
}

// ── The run tab ────────────────────────────────────────────────────────────────────────────
// The CPU oracle runs an entry point with no GPU, so the form is filled from the same
// reflection the tab beside it draws: one field per reflected input, at the zero of its type.

function defaultArgument(field: EntryIoField): string | undefined {
  if (field.builtin === 'vertex_index' || field.builtin === 'instance_index') return '0';
  const vector = /^vec([234])<(?:f32|f64|i32|u32)>$/.exec(field.type);
  if (vector) return new Array(Number(vector[1])).fill('0').join(', ');
  if (/^(?:f32|f64|i32|u32)$/.test(field.type)) return '0';
  return undefined;
}

function parseArgument(text: string): number | number[] {
  const parts = text.split(',').map((part) => Number(part.trim()));
  if (parts.length === 0 || parts.some((part) => Number.isNaN(part))) throw new Error(`"${text}" is not a number or a list of numbers`);
  return parts.length === 1 ? parts[0] : parts;
}

// ── The page ───────────────────────────────────────────────────────────────────────────────

function mount(root: HTMLElement): void {
  const editorHost = root.querySelector('[data-editor]');
  const diagnosticsList = root.querySelector('[data-diagnostics]');
  const status = root.querySelector('[data-status]');
  const run = root.querySelector('[data-run]');
  const reset = root.querySelector('[data-reset]');
  const share = root.querySelector('[data-share]');
  const examplePicker = root.querySelector('[data-example]');
  const exampleNote = root.querySelector('[data-example-note]');
  const entryPicker = root.querySelector('[data-entry]');
  const argsHost = root.querySelector('[data-args]');
  const runEntry = root.querySelector('[data-run-entry]');
  if (
    !(editorHost instanceof HTMLElement) ||
    !(diagnosticsList instanceof HTMLElement) ||
    !(status instanceof HTMLElement) ||
    !(run instanceof HTMLButtonElement) ||
    !(reset instanceof HTMLButtonElement) ||
    !(share instanceof HTMLButtonElement) ||
    !(examplePicker instanceof HTMLSelectElement) ||
    !(exampleNote instanceof HTMLElement) ||
    !(entryPicker instanceof HTMLSelectElement) ||
    !(argsHost instanceof HTMLElement) ||
    !(runEntry instanceof HTMLButtonElement)
  ) {
    return;
  }

  const copy = JSON.parse(root.dataset.copy ?? '{}') as PlaygroundCopy;
  const examples = JSON.parse(root.dataset.examples ?? '[]') as PlaygroundExample[];
  const fileName = copy.fileName || 'hello.shade.ts';
  const languageService = new TypeshadeLanguageService({ fileName });

  const bodies = new Map<PanelId, HTMLElement>();
  const empties = new Map<PanelId, HTMLElement>();
  for (const id of PANEL_IDS) {
    const body = root.querySelector(`[data-body="${id}"]`);
    const empty = root.querySelector(`[data-empty="${id}"]`);
    if (body instanceof HTMLElement) bodies.set(id, body);
    if (empty instanceof HTMLElement) empties.set(id, empty);
  }

  let editor: any;
  let model: any;
  let monacoApi: any;
  let timer = 0;
  let urlTimer = 0;
  /** The latest colourise each pane started, so a pane's own repaint is the one that lands. */
  const painting = new Map<PanelId, number>();
  /** The text each code pane holds, kept so the theme can repaint it and Copy can take it. */
  const shown = new Map<PanelId, string>();
  /** The compiled module's oracle, while the source compiles clean. */
  let evaluate: ((name: string, args?: readonly unknown[]) => unknown) | undefined;
  let entries: readonly EntryInfo[] = [];

  // ── tabs ────────────────────────────────────────────────────────────────────────────────
  const tabs = [...root.querySelectorAll('[role="tab"]')].filter((node): node is HTMLButtonElement => node instanceof HTMLButtonElement);
  const panels = [...root.querySelectorAll('[data-panel]')].filter((node): node is HTMLElement => node instanceof HTMLElement);

  const selectTab = (id: string, focus = false): void => {
    for (const tab of tabs) {
      const on = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    }
    for (const panel of panels) panel.hidden = panel.dataset.panel !== id;
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab ?? 'wgsl'));
    tab.addEventListener('keydown', (event) => {
      const steps: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      const next = steps[event.key];
      if (next === undefined) return;
      event.preventDefault();
      const target = tabs[(next + tabs.length) % tabs.length];
      selectTab(target.dataset.tab ?? 'wgsl', true);
    });
  });

  // ── the panes ───────────────────────────────────────────────────────────────────────────
  /** Puts generated source in a pane, plain first and coloured once Monaco has tokenised it.
   *  The plain text lands synchronously, so the pane reads correctly to a screen reader and
   *  to anything measuring it even when the colouring is slow or unavailable. */
  const paintCode = (id: PanelId, text: string, language: string): void => {
    const body = bodies.get(id);
    const empty = empties.get(id);
    if (!body || !empty) return;
    shown.set(id, text);
    empty.textContent = '';
    const token = (painting.get(id) ?? 0) + 1;
    painting.set(id, token);
    body.textContent = text;
    if (!monacoApi) return;
    monacoApi.editor
      .colorize(text, language, { tabSize: 2 })
      .then((html: string) => {
        if (token === painting.get(id)) body.innerHTML = html;
      })
      .catch(() => {});
  };

  /** A pane with nothing in it: the body stays empty so what is measured is what is there,
   *  and the sentence beside it says why. */
  const paintEmpty = (id: PanelId, message: string): void => {
    const body = bodies.get(id);
    const empty = empties.get(id);
    shown.delete(id);
    if (body) body.textContent = '';
    if (empty) empty.textContent = message;
  };

  const clearOutput = (): void => {
    for (const id of PANEL_IDS) paintEmpty(id, copy.empty.pending);
    evaluate = undefined;
    entries = [];
    entryPicker.textContent = '';
    argsHost.textContent = '';
    runEntry.disabled = true;
    root.classList.remove('has-output');
  };

  // ── the run tab's form ──────────────────────────────────────────────────────────────────
  const fillArguments = (): void => {
    argsHost.textContent = '';
    const entry = entries.find((candidate) => candidate.name === entryPicker.value);
    if (!entry) {
      runEntry.disabled = true;
      return;
    }
    let complete = true;
    entry.io.inputs.forEach((field, index) => {
      const value = defaultArgument(field);
      if (value === undefined) complete = false;
      const wrap = el('div');
      if (field.type.startsWith('vec4')) wrap.className = 'wide';
      const id = `playground-arg-${index}`;
      const label = el('label', `${field.name}: ${field.type}`);
      label.htmlFor = id;
      const input = el('input');
      input.id = id;
      input.type = 'text';
      input.value = value ?? '';
      input.disabled = value === undefined;
      wrap.append(label, input);
      argsHost.appendChild(wrap);
    });
    runEntry.disabled = !complete;
    if (!complete) paintEmpty('run', copy.runner.unsupported);
    else paintEmpty('run', copy.runner.idle);
  };

  const runSelectedEntry = (): void => {
    const entry = entries.find((candidate) => candidate.name === entryPicker.value);
    if (!entry || !evaluate) return;
    const inputs = [...argsHost.querySelectorAll('input')].filter((node): node is HTMLInputElement => node instanceof HTMLInputElement);
    try {
      const args = inputs.map((input) => parseArgument(input.value));
      const result = evaluate(entry.name, args);
      const printed = `${entry.name}(${args.map((arg) => formatValue(arg)).join(', ')})\n\n${formatValue(result)}`;
      paintCode('run', printed, 'plaintext');
    } catch (error) {
      paintEmpty('run', `${copy.runner.failed} ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  entryPicker.addEventListener('change', fillArguments);
  runEntry.addEventListener('click', runSelectedEntry);

  // ── diagnostics ─────────────────────────────────────────────────────────────────────────
  const goTo = (position: TypeshadePosition): void => {
    if (!editor) return;
    const target = toMonacoPosition(position);
    editor.setPosition(target);
    editor.revealPositionInCenter(target);
    editor.focus();
  };

  const paintDiagnostics = (rows: readonly DiagnosticRow[]): void => {
    diagnosticsList.textContent = '';
    if (rows.length === 0) {
      diagnosticsList.appendChild(el('li', copy.clean));
      return;
    }
    for (const row of rows) {
      const button = el('button');
      button.type = 'button';
      const at = el('span', toDisplayPosition(row.start));
      at.className = 'at';
      const message = el('span', ` ${row.message}`);
      if (row.category === 'error') message.className = 'error';
      button.append(at, message);
      button.addEventListener('click', () => goTo(row.start));
      diagnosticsList.appendChild(el('li')).appendChild(button);
    }
  };

  /** The compiler writes its diagnostics in English. The one the Playground itself causes,
   *  a file with no directive, is the page's own sentence, so it reads in the page's
   *  language. */
  const toRow = (diagnostic: TypeshadeDiagnostic): DiagnosticRow => ({
    message: diagnostic.code === 'TS8001' ? copy.directive : diagnostic.message,
    category: diagnostic.category,
    start: diagnostic.range.start,
  });

  // ── one pass over what is in the editor ─────────────────────────────────────────────────
  const render = (): void => {
    if (!editor || !model || !monacoApi) return;
    const source = editor.getValue();
    status.textContent = copy.idle;
    root.classList.remove('has-errors', 'has-output');

    const found = languageService.getDiagnostics(source);
    monacoApi.editor.setModelMarkers(
      model,
      'typeshade',
      found.map((diagnostic) => ({
        ...toMonacoRange(diagnostic.range),
        message: diagnostic.message,
        severity: diagnostic.category === 'warning' ? monacoApi.MarkerSeverity.Warning : monacoApi.MarkerSeverity.Error,
      })),
    );
    const rows = found.map(toRow);
    paintDiagnostics(rows);

    // An error means the module never finished lowering, so there is nothing downstream to
    // ask for: the panes stay empty and the compiler is left alone.
    if (rows.some((row) => row.category === 'error')) {
      status.textContent = copy.errors;
      root.classList.add('has-errors');
      clearOutput();
      return;
    }

    try {
      const result = compile(source);
      status.textContent = copy.ready;
      root.classList.add('has-output');

      paintCode('wgsl', result.wgsl ?? '', WGSL_LANGUAGE);
      if (result.glsl) {
        paintCode('glsl-vertex', result.glsl.vertex, GLSL_LANGUAGE);
        paintCode('glsl-fragment', result.glsl.fragment, GLSL_LANGUAGE);
      } else {
        paintEmpty('glsl-vertex', copy.empty.glsl);
        paintEmpty('glsl-fragment', copy.empty.glsl);
      }

      const reflection = reflect(result.module);
      const reflectionBody = bodies.get('reflection');
      const reflectionEmpty = empties.get('reflection');
      if (reflectionBody) paintReflection(reflectionBody, reflection, copy);
      if (reflectionEmpty) reflectionEmpty.textContent = '';

      evaluate = result.eval;
      entries = reflection.entries;
      entryPicker.textContent = '';
      for (const entry of entries) {
        const option = el('option', `${entry.name} (@${entry.stage})`);
        option.value = entry.name;
        entryPicker.appendChild(option);
      }
      if (entries.length === 0) {
        argsHost.textContent = '';
        runEntry.disabled = true;
        paintEmpty('run', copy.runner.noEntries);
      } else {
        fillArguments();
      }
    } catch (error) {
      // A module that passes the front end can still fail further down, where the failure
      // arrives as a thrown error and not as a diagnostic. It belongs in the same list.
      status.textContent = copy.errors;
      root.classList.add('has-errors');
      clearOutput();
      paintDiagnostics([
        ...rows,
        { message: error instanceof Error ? error.message : String(error), category: 'error', start: { line: 0, character: 0 } },
      ]);
    }
  };

  // ── the URL ─────────────────────────────────────────────────────────────────────────────
  const publishSource = async (): Promise<void> => {
    if (!editor) return;
    writeHash('code', await encodeSource(editor.getValue()));
  };

  const flash = (button: HTMLButtonElement, word: string, back: string): void => {
    button.textContent = word;
    window.setTimeout(() => { button.textContent = back; }, 1400);
  };

  share.addEventListener('click', () => {
    void publishSource()
      .then(() => navigator.clipboard.writeText(window.location.href))
      .then(() => flash(share, copy.shared, copy.share))
      .catch(() => {});
  });

  for (const button of root.querySelectorAll('[data-copy-panel]')) {
    if (!(button instanceof HTMLButtonElement)) continue;
    button.addEventListener('click', () => {
      const id = button.dataset.copyPanel as PanelId;
      const text = shown.get(id) ?? bodies.get(id)?.innerText ?? '';
      void navigator.clipboard
        .writeText(text)
        .then(() => flash(button, copy.copied, copy.copy))
        .catch(() => {});
    });
  }

  // ── the example picker ──────────────────────────────────────────────────────────────────
  const showExample = (id: string): void => {
    const example = examples.find((candidate) => candidate.id === id);
    if (!example || !editor) return;
    examplePicker.value = example.id;
    exampleNote.textContent = example.description;
    editor.setValue(example.source);
    writeHash('example', example.id);
    render();
  };

  examplePicker.addEventListener('change', () => showExample(examplePicker.value));
  reset.addEventListener('click', () => {
    showExample(examplePicker.value);
    editor?.focus();
  });

  /** What the page opens with: the source in the link, else the example the link names, else
   *  the first example. */
  const openingSource = async (): Promise<{ source: string; example?: PlaygroundExample; }> => {
    const params = hashParams();
    const code = params.get('code');
    if (code) {
      const source = await decodeSource(code);
      if (source !== undefined) return { source, example: examples.find((candidate) => candidate.source === source) };
    }
    const named = params.get('example');
    const chosen = examples.find((candidate) => candidate.id === named) ?? examples.find((candidate) => candidate.id === root.dataset.defaultExample) ?? examples[0];
    return { source: chosen?.source ?? '', example: chosen };
  };

  status.textContent = copy.loading;
  Promise.all([loadMonaco(), openingSource()])
    .then(([monaco, opening]) => {
      monacoApi = monaco;
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2022,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowNonTsExtensions: true,
        experimentalDecorators: true,
      });
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
      });
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
      );

      // Colourising bakes the theme into the markup, so every pane is painted again on a
      // change.
      followSiteTheme(monaco, () => {
        const wgsl = shown.get('wgsl');
        if (wgsl !== undefined) paintCode('wgsl', wgsl, WGSL_LANGUAGE);
        for (const id of ['glsl-vertex', 'glsl-fragment'] as const) {
          const text = shown.get(id);
          if (text !== undefined) paintCode(id, text, GLSL_LANGUAGE);
        }
      });

      if (opening.example) {
        examplePicker.value = opening.example.id;
        exampleNote.textContent = opening.example.description;
      } else {
        exampleNote.textContent = '';
      }

      model = monaco.editor.createModel(opening.source, 'typescript', monaco.Uri.parse(`file:///${fileName}`));
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
      });

      monaco.languages.registerCompletionItemProvider('typescript', {
        triggerCharacters: ['@', '"', ':'],
        provideCompletionItems: (currentModel: any, position: MonacoPosition) => {
          if (currentModel.uri.toString() !== model.uri.toString()) return { suggestions: [] };
          const items = languageService.getCompletions(currentModel.getValue(), toServicePosition(position));
          const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
          return {
            suggestions: items.map((item) => ({
              label: item.label,
              kind: completionKind(monaco, item.kind),
              insertText: item.insertText ?? (item.label.startsWith('@') ? item.label.slice(1) : item.label),
              detail: item.detail,
              range,
            })),
          };
        },
      });

      monaco.languages.registerHoverProvider('typescript', {
        provideHover: (currentModel: any, position: MonacoPosition) => {
          if (currentModel.uri.toString() !== model.uri.toString()) return null;
          const hover = languageService.getHover(currentModel.getValue(), toServicePosition(position));
          if (!hover) return null;
          const r = toMonacoRange(hover.range);
          return {
            contents: hover.contents.map((value) => ({ value })),
            range: new monaco.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn),
          };
        },
      });

      editor.onDidChangeModelContent(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(render, 350);
        window.clearTimeout(urlTimer);
        urlTimer = window.setTimeout(() => { void publishSource(); }, 600);
      });
      run.addEventListener('click', render);
      selectTab('wgsl');
      render();
    })
    .catch((error) => {
      status.textContent = copy.errors;
      root.classList.add('has-errors');
      // The reader gets the sentence; the console keeps the cause.
      paintDiagnostics([{ message: copy.unavailable, category: 'error', start: { line: 0, character: 0 } }]);
      console.error('[playground]', error);
    });
}

const root = document.querySelector('[data-playground]');
if (root instanceof HTMLElement) mount(root);
