// The Playground's browser half. Astro puts this module through Vite, so it can import the
// compiler and the language service from the vendored checkout. The component's own
// `define:vars` script is emitted inline as a classic script, which has no import at all, so
// everything past the first line of it would die with a SyntaxError; the values it used to
// carry arrive here as data attributes instead.
import {
  TypeshadeLanguageService,
  compile,
  compileModule,
  compileTsSource,
  emitGlslStages,
  emitModule,
  emitModuleAt,
  reflect,
  type EmitOptions,
  type GlslEmitOptions,
  type OptLevel,
  type TypeshadeCompletionItem,
  type TypeshadeDiagnostic,
  type TypeshadePosition,
  type TypeshadeRange,
} from '../../vendor/shader-dsl/src/index.ts';
// The ship-time plugins live on their own subpath, the one a host imports for a release build.
import { minify } from '../../vendor/shader-dsl/src/emit-prod.ts';
import {
  cornersOf,
  drawTile,
  entryArguments,
  zeroFor,
  type CpuFunctions,
  type RasterPlan,
  type RasterReply,
  type RasterRequest,
  type ReflectedEntry,
  type ReflectedField,
} from './playground-raster.ts';

/** One example as the page carries it: the source from the vendored file, the words from i18n. */
interface PlaygroundExample {
  readonly id: string;
  readonly source: string;
  readonly title: string;
  readonly description: string;
}

/** What the options bar is set to. Every field is a value the compiler's emit API takes. */
interface EmitChoice {
  readonly level: OptLevel;
  readonly parens: 'full' | 'minimal';
  readonly minify: boolean;
  readonly floatPrecision: 'highp' | 'mediump';
}

/** The words the component wrote into `data-copy`; they live in src/i18n. */
interface PlaygroundCopy {
  readonly fileName: string;
  readonly idle: string;
  readonly ready: string;
  readonly errors: string;
  readonly loading: string;
  readonly clean: string;
  readonly noOutput: string;
  readonly directive: string;
  readonly unavailable: string;
  readonly copy: string;
  readonly copied: string;
  readonly share: string;
  readonly shared: string;
  readonly emit: {
    readonly title: string;
    readonly optimization: string;
    readonly levels: Record<OptLevel, string>;
    readonly parens: string;
    readonly minify: string;
    readonly precision: string;
    readonly levelNote: string;
  };
  readonly entryPoints: string;
  readonly resources: string;
  readonly inputs: string;
  readonly outputs: string;
  readonly returns: string;
  readonly runCpu: string;
  readonly running: string;
  readonly cpuIdle: string;
  readonly noResources: string;
  readonly noEntryPoints: string;
  readonly requiredFeatures: string;
  readonly cpuFailed: string;
  readonly canvas: string;
  readonly draw: string;
  readonly canvasIdle: string;
  readonly canvasNeedsVertex: string;
  readonly canvasProgress: string;
  readonly canvasDrawn: string;
  readonly resolution: string;
  readonly canvasTooBig: string;
  readonly args: string;
  readonly argsInvalid: string;
  readonly cpuNoResources: string;
  readonly entryCountOne: string;
  readonly noGlsl: string;
}

/** The files the compiler emits, one per tab over the output pane. */
type Target = 'wgsl' | 'glslVertex' | 'glslFragment';

// Monaco ships a WGSL grammar. It ships none for GLSL, and GLSL ES 3.00 is close enough to C
// for Monaco's C++ tokenizer to colour its keywords, types, numbers and `#version` line.
const TARGET_LANGUAGE: Readonly<Record<Target, string>> = { wgsl: 'wgsl', glslVertex: 'cpp', glslFragment: 'cpp' };

// ── Reflection ─────────────────────────────────────────────────────────────────────────────
// What reflect() recovers from the compiled module, shaped for the pane. Names and types in
// here come from the source in the editor, so every one of them reaches the page as text on a
// node and none of it is ever written as markup.

/** How the zero of a type reads in an argument field, and how what is typed back reads as a
 *  value. A vector is a comma-separated list, which is how the source spells one too. */
const argText = (value: unknown): string => (Array.isArray(value) ? value.join(', ') : String(value));

function parseArg(text: string, zero: unknown): unknown {
  const trimmed = text.trim();
  if (typeof zero === 'boolean') {
    if (/^(?:true|1)$/i.test(trimmed)) return true;
    if (/^(?:false|0)$/i.test(trimmed)) return false;
    throw new Error('not a boolean');
  }
  const parts = trimmed.split(',').map((part) => Number(part.trim()));
  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) throw new Error('not a number');
  if (Array.isArray(zero)) {
    if (parts.length !== zero.length) throw new Error('wrong length');
    return parts;
  }
  if (parts.length !== 1) throw new Error('not a single number');
  return parts[0];
}

/** How a field reads on one line: `name: type` and the attribute that placed it, when it has one. */
function fieldLabel(field: ReflectedField): { text: string; attr: string; } {
  const text = field.name && field.type ? `${field.name}: ${field.type}` : (field.type ?? field.name ?? '');
  if (field.builtin) return { text, attr: `@builtin(${field.builtin})` };
  if (typeof field.location === 'number') return { text, attr: `@location(${field.location})` };
  return { text, attr: '' };
}

/** A returned value as the pane prints it: arrays inline, everything else as JSON. */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v)).join(', ')}]`;
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ')} }`;
  }
  return typeof value === 'number' ? String(Number(value.toFixed(6))) : JSON.stringify(value) ?? String(value);
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One `label   value` line. */
function ioRow(label: string, text: string, attr = '', valueClass = 'io-value'): HTMLElement {
  const row = el('div', 'io-row');
  row.append(el('span', 'io-label', label));
  const value = el('span', valueClass, text);
  if (attr) {
    value.append(document.createTextNode('  '));
    value.append(el('span', 'attr', attr));
  }
  row.append(value);
  return row;
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
  // A Blob built from the string is already UTF-8, so the same bytes feed the compressed path
  // and the plain one.
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

/** The fragment: what to open, and the options to open it under. Only a setting that differs
 *  from the default is written, so a link to an untouched Playground stays short. */
function writeHash(key: string, value: string, choice?: EmitChoice): void {
  const parts = [`${key}=${value}`];
  if (choice) {
    if (choice.level !== 'O2') parts.push(`opt=${choice.level}`);
    if (choice.parens !== 'full') parts.push(`parens=${choice.parens}`);
    if (choice.minify) parts.push('minify=1');
    if (choice.floatPrecision !== 'highp') parts.push(`precision=${choice.floatPrecision}`);
  }
  const url = new URL(window.location.href);
  url.hash = parts.join('&');
  window.history.replaceState(null, '', url);
}

// ── The emit options ───────────────────────────────────────────────────────────────────────

/** The options both backends share. `minify` is a plugin, so it rides in `plugins`. */
const sharedEmitOptions = (choice: EmitChoice): EmitOptions => ({
  parens: choice.parens,
  ...(choice.minify ? { plugins: [minify()] } : {}),
});

/** WGSL at the chosen level. `emitModuleAt` takes a level and no other options, and
 *  `emitModule` takes the options at O2, so O0 and O1 reach the compiler with the level
 *  alone. The note under the options bar says so where a reader can see it. */
const emitWgsl = (module: Parameters<typeof emitModule>[0], choice: EmitChoice): string =>
  choice.level === 'O2' ? emitModule(module, sharedEmitOptions(choice)) : emitModuleAt(module, choice.level);

/** Both GLSL stages. The GLSL backend fixes its own optimizer at a fixpoint, so it takes the
 *  options and no level. */
const emitGlsl = (
  module: Parameters<typeof emitGlslStages>[0],
  choice: EmitChoice,
): { vertex: string; fragment: string; } | undefined => {
  const options: GlslEmitOptions = { ...sharedEmitOptions(choice), floatPrecision: choice.floatPrecision };
  try {
    return emitGlslStages(module, options);
  } catch {
    // A module the GLSL backend cannot express at all, a uniform scalar among them.
    return undefined;
  }
};

/** A row of the diagnostics list: what to say and where it points. */
interface DiagnosticRow {
  readonly message: string;
  readonly category: TypeshadeDiagnostic['category'];
  readonly start: TypeshadePosition;
}

function mount(root: HTMLElement): void {
  const editorHost = root.querySelector('[data-editor]');
  const output = root.querySelector('[data-output]');
  const diagnosticsPane = root.querySelector('[data-diagnostics]');
  const status = root.querySelector('[data-status]');
  const run = root.querySelector('[data-run]');
  const reset = root.querySelector('[data-reset]');
  if (
    !(editorHost instanceof HTMLElement) ||
    !(output instanceof HTMLElement) ||
    !(diagnosticsPane instanceof HTMLElement) ||
    !(status instanceof HTMLElement) ||
    !(run instanceof HTMLButtonElement) ||
    !(reset instanceof HTMLButtonElement)
  ) {
    return;
  }

  const sample = root.dataset.sample ?? '';
  const copy = JSON.parse(root.dataset.copy ?? '{}') as PlaygroundCopy;
  const fileName = copy.fileName || 'hello.shade.ts';
  const languageService = new TypeshadeLanguageService({ fileName });
  const reflectionPane = root.querySelector('[data-reflection]');
  const runCpu = root.querySelector('[data-run-cpu]');
  const examples = JSON.parse(root.dataset.examples ?? '[]') as PlaygroundExample[];
  const examplePicker = root.querySelector('[data-example]');
  const exampleNote = root.querySelector('[data-example-note]');
  const share = root.querySelector('[data-share]');
  const copyOutput = root.querySelector('[data-copy-output]');
  const sizeLabel = root.querySelector('[data-size]');
  const levelPicker = root.querySelector('[data-opt-level]');
  const parensPicker = root.querySelector('[data-opt-parens]');
  const precisionPicker = root.querySelector('[data-opt-precision]');
  const minifyToggle = root.querySelector('[data-opt-minify]');
  const levelNote = root.querySelector('[data-level-note]');
  const canvas = root.querySelector('[data-canvas]');
  const canvasNote = root.querySelector('[data-canvas-note]');
  const drawCpu = root.querySelector('[data-draw-cpu]');
  const resolutionPicker = root.querySelector('[data-resolution]');

  /** Whether the compiled module has the vertex and fragment pair a triangle needs. */
  let moduleDrawable = false;
  /** Whether the browser actually backed the canvas at the size it was asked for. */
  let canvasFits = true;

  /** Every browser caps how large a canvas may be, and they disagree: desktops allow tens of
   *  megapixels, while an iPhone stops around 4096 by 4096. Past the cap the element still
   *  reports the width and height that were set and then draws nothing, so asking it its size
   *  proves nothing. This writes one pixel into the far corner and reads it back, which is the
   *  only answer the browser cannot be wrong about. It runs on the canvas the page already
   *  has, and never on a second one, since a spare 8K canvas is another 236 MB. */
  const holdsItsPixels = (node: HTMLCanvasElement, surface: CanvasRenderingContext2D | null): boolean => {
    if (!surface) return false;
    const x = node.width - 1;
    const y = node.height - 1;
    if (x < 0 || y < 0) return false;
    try {
      surface.fillStyle = '#ffffff';
      surface.fillRect(x, y, 1, 1);
      const held = surface.getImageData(x, y, 1, 1).data[3] === 255;
      surface.clearRect(x, y, 1, 1);
      return held;
    } catch {
      return false;
    }
  };
  if (
    !(examplePicker instanceof HTMLSelectElement) ||
    !(exampleNote instanceof HTMLElement) ||
    !(share instanceof HTMLButtonElement) ||
    !(copyOutput instanceof HTMLButtonElement) ||
    !(sizeLabel instanceof HTMLElement) ||
    !(levelPicker instanceof HTMLSelectElement) ||
    !(parensPicker instanceof HTMLSelectElement) ||
    !(precisionPicker instanceof HTMLSelectElement) ||
    !(minifyToggle instanceof HTMLInputElement) ||
    !(levelNote instanceof HTMLElement)
  ) {
    return;
  }

  /** What the options bar is set to right now. */
  const currentChoice = (): EmitChoice => ({
    level: levelPicker.value as OptLevel,
    parens: parensPicker.value === 'minimal' ? 'minimal' : 'full',
    minify: minifyToggle.checked,
    floatPrecision: precisionPicker.value === 'mediump' ? 'mediump' : 'highp',
  });

  let editor: any;
  let model: any;
  let monacoApi: any;
  let timer = 0;
  let urlTimer = 0;
  let painted = 0;
  // What the compiler last emitted, by target, and which tab is showing.
  let emitted: Partial<Record<Target, string>> = {};
  let target: Target = 'wgsl';
  // The last good compile, kept so the CPU button can call into it without compiling again.
  let compiled: ReturnType<typeof compile> | undefined;
  let reflection: ReturnType<typeof reflect> | undefined;
  let entries: readonly ReflectedEntry[] = [];
  /** What the reader last typed into each argument field, keyed by entry and field name, so a
   *  recompile does not throw their values away. */
  const typedArgs = new Map<string, string>();

  /** Draws the reflection pane for the module that just compiled. */
  const paintReflection = (): void => {
    if (!(reflectionPane instanceof HTMLElement)) return;
    reflectionPane.textContent = '';
    if (runCpu instanceof HTMLButtonElement) runCpu.disabled = entries.length === 0;
    if (drawCpu instanceof HTMLButtonElement) {
      const drawable =
        entries.some((entry) => entry.stage === 'vertex' && (entry.io?.inputs ?? []).some((f) => f.builtin === 'vertex_index')) &&
        entries.some((entry) => entry.stage === 'fragment');
      moduleDrawable = drawable;
      drawCpu.disabled = !drawable || !canvasFits;
      if (canvasNote instanceof HTMLElement) {
        canvasNote.textContent = !drawable ? copy.canvasNeedsVertex : canvasFits ? copy.canvasIdle : copy.canvasTooBig;
      }
      if (canvas instanceof HTMLCanvasElement) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      if (drawable) window.setTimeout(openPool, 0);
    }

    const entryGroup = el('div', 'group');
    entryGroup.append(el('p', 'group-title', copy.entryPoints));
    if (entries.length === 0) {
      entryGroup.append(el('p', 'empty', copy.noEntryPoints));
    }
    for (const entry of entries) {
      const box = el('div', 'entry');
      const head = el('div', 'entry-head');
      head.append(el('span', 'stage', `@${entry.stage}`));
      head.append(el('span', 'entry-name', entry.name));
      box.append(head);
      for (const field of entry.io?.inputs ?? []) {
        const { text, attr } = fieldLabel(field);
        box.append(ioRow(copy.inputs, text, attr));
      }
      for (const field of entry.io?.outputs ?? []) {
        const { text, attr } = fieldLabel(field);
        box.append(ioRow(copy.outputs, text, attr));
      }
      // The oracle used to run every entry at the zero of its type, which is how a triangle
      // was only ever seen at its first corner and a shader dividing by a zero input returned
      // NaN for every component. The zeros are the starting values of a form now.
      const inputs = entry.io?.inputs ?? [];
      if (inputs.length > 0) {
        const row = el('div', 'io-row arg-row');
        row.append(el('span', 'io-label', copy.args));
        const fields = el('span', 'io-value');
        inputs.forEach((field, index) => {
          const zero = zeroFor(field.type);
          const name = field.name ?? `arg${index}`;
          const key = `${entry.name}/${name}`;
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'arg-input';
          input.dataset.arg = key;
          input.setAttribute('aria-label', `${entry.name} ${name}`);
          input.value = typedArgs.get(key) ?? (zero.ok ? argText(zero.value) : '');
          // A type the form cannot start off, a matrix or a texture among them, is left for
          // the reader to fill in instead of guessed at.
          input.placeholder = field.type ?? '';
          input.addEventListener('input', () => typedArgs.set(key, input.value));
          const label = el('span', 'arg-name', `${name}:`);
          fields.append(label, input);
        });
        row.append(fields);
        box.append(row);
      }

      const returns = ioRow(copy.returns, copy.cpuIdle, '', 'io-value empty');
      returns.dataset.returns = entry.name;
      box.append(returns);
      entryGroup.append(box);
    }
    reflectionPane.append(entryGroup);

    // Resources, and the features the module asks the device for, each only when it has any.
    const resources = reflection
      ? [
          ...reflection.bindGroups.flatMap((group) =>
            (group.entries ?? []).map((entry) => ({ label: `@group(${group.group ?? 0})`, text: `${entry.name}: ${entry.resourceKind}` })),
          ),
          ...reflection.overrides.map((o) => ({ label: 'override', text: String(o.name ?? o) })),
        ]
      : [];
    const resourceGroup = el('div', 'group');
    resourceGroup.append(el('p', 'group-title', copy.resources));
    if (resources.length === 0) resourceGroup.append(el('p', 'empty', copy.noResources));
    else for (const r of resources) resourceGroup.append(ioRow(r.label, r.text));
    reflectionPane.append(resourceGroup);

    const features: readonly string[] = reflection?.requiredFeatures ?? [];
    if (features.length > 0) {
      const featureGroup = el('div', 'group');
      featureGroup.append(el('p', 'group-title', copy.requiredFeatures));
      for (const f of features) featureGroup.append(ioRow('', String(f)));
      reflectionPane.append(featureGroup);
    }
  };

  /** Runs every entry point on the CPU oracle and writes what each returned. */
  const evaluateOnCpu = (): void => {
    if (!compiled || !(reflectionPane instanceof HTMLElement)) return;
    for (const entry of entries) {
      const slot = reflectionPane.querySelector(`[data-returns="${CSS.escape(entry.name)}"] .io-value`);
      const target = slot instanceof HTMLElement ? slot : reflectionPane.querySelector(`[data-returns="${CSS.escape(entry.name)}"]`)?.lastElementChild;
      if (!(target instanceof HTMLElement)) continue;
      const inputs = entry.io?.inputs ?? [];
      const args: unknown[] = [];
      let invalid = false;
      for (const [index, field] of inputs.entries()) {
        const name = field.name ?? `arg${index}`;
        const typed = reflectionPane.querySelector(`[data-arg="${CSS.escape(`${entry.name}/${name}`)}"]`);
        const zero = zeroFor(field.type);
        const text = typed instanceof HTMLInputElement ? typed.value : '';
        try {
          args.push(parseArg(text, zero.ok ? zero.value : 0));
        } catch {
          invalid = true;
          break;
        }
      }
      if (invalid) {
        target.textContent = copy.argsInvalid;
        target.className = 'io-value failed';
        continue;
      }
      try {
        const value = compiled.eval(entry.name, entryArguments(entry, compiled.module.structs, (i) => args[i]));
        const shownArgs = inputs.map((f, i) => `${f.name ?? `arg${i}`} = ${formatValue(args[i])}`).join(', ');
        target.textContent = shownArgs ? `${formatValue(value)}   (${shownArgs})` : formatValue(value);
        target.className = 'io-value';
      } catch (error) {
        // `compileModule` takes `gpuStubs` and `precision` and no resource values, so an entry
        // reading a uniform or a storage binding has nothing to read and the oracle stops at
        // the name. The reader gets that sentence instead of the compiler's.
        const message = error instanceof Error ? error.message : '';
        const binds = (reflection?.bindGroups ?? []).some((group) => (group.entries ?? []).length > 0);
        target.textContent = binds && /unknown (?:const|var|binding)/.test(message)
          ? copy.cpuNoResources
          : message || copy.cpuFailed;
        target.className = 'io-value failed';
      }
    }
  };

  /** Puts the selected target in the output pane, plain first and coloured once Monaco has
   *  tokenised it. The plain text lands synchronously, so the pane reads correctly to a screen
   *  reader and to anything measuring it even when the colouring is slow or unavailable. */
  // ── The canvas, drawn by a pool of workers ──────────────────────────────────────────────
  // The pipeline, walked with the CPU oracle standing in for both stages: the vertex entry
  // runs for indices 0, 1 and 2, its clip positions become a triangle in pixels, and every
  // pixel that triangle covers runs the fragment entry once, with `@builtin(position)` set to
  // that pixel's centre and every `@location` varying interpolated across the three vertices.
  // No varying is a stand-in: the values are the ones the vertex entry returned.
  //
  // The canvas is cut into bands and the bands go through a queue, so the work is neither one
  // blocking pass nor a fixed slice per worker: a worker that finishes its band takes the next
  // one waiting, which is what keeps them busy when a triangle covers the middle of the canvas
  // and none of the top. Each band is painted the moment it arrives, so the picture fills in.
  // How big a tile is, which is the whole trade. A unit has to be worth the message that
  // carries it: measured at 768 by 768 on four cores, drawing takes 380 ms on this thread
  // alone, and through the pool it is 779 ms at 32 pixels a tile, 333 at 64, 169 at 128 and
  // 116 at 256. Small tiles lose to their own round trips; large ones leave too few to
  // balance and too few to watch. This keeps the count near six by six whatever the canvas
  // is, so the ratio of drawing to messaging holds as the canvas grows.
  //
  // The ceiling is what makes the big grids usable. Six by six of 3840 is a tile of 640 and
  // of 7680 a tile of 1280, and a tile that large is seconds of drawing: the progress note
  // jumps in sixths, and whichever worker draws the last one holds the other seven waiting.
  // Holding tiles at 256 turns 8K into 900 of them, which balances to the end and costs about
  // 54 ms of messaging across a draw that takes tens of seconds. Below 1536 the ceiling never
  // binds, so every size measured above keeps the tile it was measured with.
  const tileSize = (side: number): number => Math.min(256, Math.max(64, Math.round(side / 6 / 16) * 16));
  /** How many tiles the single-threaded fallback draws between handing the page back. */
  const YIELD_EVERY = 8;
  /** How many tiles each worker is kept holding. With one, a worker draws its tile and then
   *  waits out a whole round trip before the next arrives, and at 1.7 ms of drawing against a
   *  round trip of the same order that is half its time spent idle. Handing it a few keeps a
   *  backlog in its own queue, so the return of one tile overlaps the drawing of the next. */
  const FEED = 3;

  /** The outline on a tile that is being drawn, taken from the page's own accent so it
   *  follows the theme the reader chose. */
  const outlineColour = (): string =>
    getComputedStyle(root).getPropertyValue('--color-accent').trim() || '#3178c6';
  /** One worker per core the browser admits to, and a ceiling so a 64-thread machine does not
   *  open 64 workers to draw a triangle. */
  const poolSize = (): number => Math.max(1, Math.min(navigator.hardwareConcurrency || 2, 8));

  let job = 0;
  let pool: Worker[] = [];
  /** Opening a worker costs more than drawing this canvas once does, so the pool is opened as
   *  soon as a module that can be drawn compiles and the button press finds it already there.
   *  On this machine starting four workers is 130 ms; drawing 192 by 192 once is 34. */
  const openPool = (): boolean => {
    if (typeof Worker !== 'function') return false;
    try {
      while (pool.length < poolSize()) {
        pool.push(new Worker(new URL('./playground-raster-worker.ts', import.meta.url), { type: 'module' }));
      }
      return true;
    } catch {
      for (const worker of pool) worker.terminate();
      pool = [];
      return false;
    }
  };
  /** Set while a draw is in flight, so a second press does not race the first. */
  let drawing = false;

  /** Hand the page back to the browser without the nested-setTimeout clamp, which is about
   *  4ms a turn and would cost more than the drawing between two of them. A MessageChannel
   *  posts a real task with no floor. */
  const yieldToPage = (): Promise<void> =>
    new Promise((resume) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => { resume(); };
      channel.port2.postMessage(undefined);
    });

  const fillNumbers = (text: string, values: Record<string, string | number>): string =>
    text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

  const rasterPlan = (): RasterPlan | undefined => {
    if (!compiled || !(canvas instanceof HTMLCanvasElement)) return undefined;
    const vertex = entries.find((entry) => entry.stage === 'vertex');
    const fragment = entries.find((entry) => entry.stage === 'fragment');
    if (!vertex || !fragment) return undefined;
    if (!(vertex.io?.inputs ?? []).some((field) => field.builtin === 'vertex_index')) return undefined;
    if (!vertex.io?.outputs?.some((field) => field.builtin === 'position')) return undefined;
    return {
      width: canvas.width,
      height: canvas.height,
      vertex,
      fragment,
      structs: compiled.module.structs.map((struct) => ({ name: struct.name, fields: struct.fields.map((f) => ({ name: f.name })) })),
    };
  };

  /** The fallback for a browser with no worker, and for one whose worker fails to start: the
   *  same bands, on this thread, yielding between them so the page still repaints. */
  /** Every tile of the canvas, in order, as [x0, y0]. */
  const tilesOf = (plan: RasterPlan): [number, number][] => {
    const out: [number, number][] = [];
    const tile = tileSize(plan.width);
    for (let y0 = 0; y0 < plan.height; y0 += tile) {
      for (let x0 = 0; x0 < plan.width; x0 += tile) out.push([x0, y0]);
    }
    return out;
  };

  const drawHere = async (plan: RasterPlan, context: CanvasRenderingContext2D, mine: number): Promise<void> => {
    const cpu = compileModule(compiled!.module, { gpuStubs: true }).fns as CpuFunctions;
    const corners = cornersOf(cpu, plan);
    if (!corners) throw new Error('no triangle');
    const started = performance.now();
    let covered = 0;
    const tile = tileSize(plan.width);
    const tiles = tilesOf(plan);
    for (const [index, [x0, y0]] of tiles.entries()) {
      if (mine !== job) return;
      const x1 = Math.min(plan.width, x0 + tile);
      const y1 = Math.min(plan.height, y0 + tile);
      const drawn = drawTile(cpu, plan, corners, x0, y0, x1, y1);
      covered += drawn.covered;
      context.putImageData(new ImageData(drawn.pixels, x1 - x0, y1 - y0), x0, y0);
      // Handing the page back costs a task turn, so it happens every few tiles and not every
      // one: at one a tile the yielding cost more than the drawing between two of them.
      if (index % YIELD_EVERY === YIELD_EVERY - 1 || index === tiles.length - 1) {
        if (canvasNote instanceof HTMLElement) {
          canvasNote.textContent = fillNumbers(copy.canvasProgress, { done: index + 1, total: tiles.length, running: 1, waiting: tiles.length - index - 1 });
        }
        await yieldToPage();
      }
    }
    if (canvasNote instanceof HTMLElement) {
      canvasNote.textContent = fillNumbers(copy.canvasDrawn, { px: covered, ms: Math.round(performance.now() - started), workers: 1 });
      canvasNote.dataset.px = String(covered);
      canvasNote.dataset.workers = '1';
    }
  };

  const drawOnCpu = (): void => {
    if (!(canvas instanceof HTMLCanvasElement) || !(canvasNote instanceof HTMLElement) || drawing) return;
    const context = canvas.getContext('2d');
    const plan = rasterPlan();
    if (!compiled || !context || !plan) {
      canvasNote.textContent = copy.canvasNeedsVertex;
      return;
    }
    job += 1;
    const mine = job;
    drawing = true;
    if (drawCpu instanceof HTMLButtonElement) drawCpu.disabled = true;
    context.clearRect(0, 0, plan.width, plan.height);
    delete canvasNote.dataset.px;
    delete canvasNote.dataset.workers;

    const finish = (): void => {
      drawing = false;
      if (drawCpu instanceof HTMLButtonElement) drawCpu.disabled = !moduleDrawable || !canvasFits;
    };

    if (typeof Worker !== 'function') {
      void drawHere(plan, context, mine).catch((error) => {
        canvasNote.textContent = error instanceof Error ? error.message : copy.cpuFailed;
      }).finally(finish);
      return;
    }

    if (!openPool()) {
      void drawHere(plan, context, mine).catch(() => { canvasNote.textContent = copy.cpuFailed; }).finally(finish);
      return;
    }

    // The queue every worker pulls from, and the counters the note reads.
    const tile = tileSize(plan.width);
    const queue = tilesOf(plan);
    const total = queue.length;
    let done = 0;
    let running = 0;
    let covered = 0;
    let finished = false;
    const started = performance.now();
    const module = compiled.module;

    // Writing the note is a DOM write, and at one a tile that is six hundred of them in a
    // draw. It is coalesced to one a frame; the numbers it reads are live either way.
    // Every tile arrives in its own task, and a canvas written once a task is flushed once a
    // task. Thirty-six flushes cost more than the drawing; the single-threaded path pays far
    // fewer because it draws several tiles between yields. Arrivals are collected and put on
    // the canvas together, once a frame, which is as often as anyone can see anyway.
    const pending: { image: ImageData; x0: number; y0: number }[] = [];
    let flushQueued = false;
    // Which tiles a worker is holding right now. Outlining them is a canvas write too, so it
    // happens in this same frame and not in the task that handed the tile out.
    const inFlight = new Set<string>();
    /** A draw belongs to the grid it was planned against, and `drawHere` already stops on
     *  `mine !== job` for that reason. The pool has to stop on it too: its tiles carry the old
     *  grid's coordinates, so once the reader changes the resolution, painting what is still
     *  in flight would scatter the old picture over the new canvas. At 8K a draw runs for tens
     *  of seconds, which is long enough for that to be the normal way one ends. */
    let retired = false;
    const retire = (): boolean => {
      if (mine === job) return false;
      if (!retired) {
        retired = true;
        finished = true;
        pending.length = 0;
        inFlight.clear();
        finish();
      }
      return true;
    };
    const flush = (): void => {
      if (retired) return;
      for (const { image, x0, y0 } of pending) context.putImageData(image, x0, y0);
      pending.length = 0;
      context.strokeStyle = outlineColour();
      context.lineWidth = 1;
      for (const key of inFlight) {
        const [x0, y0, x1, y1] = key.split(',').map(Number);
        context.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
      }
    };
    const scheduleFlush = (): void => {
      if (flushQueued) return;
      flushQueued = true;
      window.requestAnimationFrame(() => { flushQueued = false; flush(); });
    };

    let noteQueued = false;
    // The last tile schedules a frame and the queue empties in the same turn, so without this
    // the progress line lands after the result and paints over it.
    let complete = false;
    const say = (): void => {
      if (noteQueued || complete) return;
      noteQueued = true;
      window.requestAnimationFrame(() => {
        noteQueued = false;
        if (complete || retired) return;
        canvasNote.textContent = fillNumbers(copy.canvasProgress, { done, total, running, waiting: queue.length });
      });
    };

    const settleIfDone = (): void => {
      if (retire()) return;
      if (finished || queue.length > 0 || running > 0) return;
      finished = true;
      flush();
      complete = true;
      canvasNote.textContent = fillNumbers(copy.canvasDrawn, { px: covered, ms: Math.round(performance.now() - started), workers: pool.length });
      canvasNote.dataset.px = String(covered);
      canvasNote.dataset.workers = String(pool.length);
      finish();
    };

    const handOut = (worker: Worker): void => {
      if (retire()) return;
      const next = queue.shift();
      if (next === undefined) {
        settleIfDone();
        return;
      }
      const [x0, y0] = next;
      const x1 = Math.min(plan.width, x0 + tile);
      const y1 = Math.min(plan.height, y0 + tile);
      running += 1;
      // The tile a worker has just taken is outlined, so the canvas shows where the work is
      // and not only where it has been. The outline sits inside the tile, so the pixels that
      // come back cover it exactly.
      inFlight.add(`${x0},${y0},${x1},${y1}`);
      scheduleFlush();
      say();
      worker.postMessage({ kind: 'tile', job: mine, x0, y0, x1, y1 } satisfies RasterRequest);
    };

    for (const worker of pool) {
      worker.onmessage = (event: MessageEvent<RasterReply>) => {
        const message = event.data;
        if (message.job !== mine) return;
        if (retire()) return;
        if (message.kind === 'ready') {
          for (let i = 0; i < FEED; i += 1) handOut(worker);
          return;
        }
        if (message.kind === 'failed') {
          canvasNote.textContent = message.message === 'no triangle' ? copy.canvasNeedsVertex : message.message;
          finish();
          return;
        }
        running -= 1;
        done += 1;
        covered += message.covered;
        inFlight.delete(`${message.x0},${message.y0},${message.x1},${message.y1}`);
        pending.push({
          image: new ImageData(message.pixels, message.x1 - message.x0, message.y1 - message.y0),
          x0: message.x0,
          y0: message.y0,
        });
        scheduleFlush();
        say();
        handOut(worker);
      };
      worker.onerror = () => {
        // A worker that cannot start at all leaves the drawing to this thread.
        for (const other of pool) other.terminate();
        pool = [];
        void drawHere(plan, context, mine).catch(() => { canvasNote.textContent = copy.cpuFailed; }).finally(finish);
      };
      worker.postMessage({ kind: 'prepare', job: mine, module, plan } satisfies RasterRequest);
    }
    say();
  };

  const paintOutput = (): void => {
    const token = ++painted;
    const source = emitted[target];
    if (!source) {
      output.textContent = target === 'wgsl' ? copy.noOutput : copy.noGlsl;
      sizeLabel.textContent = '';
      return;
    }
    output.textContent = source;
    sizeLabel.textContent = `${source.length} B`;
    if (!monacoApi) return;
    monacoApi.editor
      .colorize(source, TARGET_LANGUAGE[target], { tabSize: 2 })
      .then((html: string) => {
        // colorize writes every space as a non-breaking space, which a reader copying the
        // output would paste into a shader file as U+00A0 and no compiler accepts. It emits
        // the character itself, and reading innerHTML back spells that as an entity, so both
        // forms are replaced. The pane is a <pre>, so an ordinary space holds the same column.
        if (token === painted) output.innerHTML = html.replace(/&nbsp;|\u00a0/g, ' ');
      })
      .catch(() => {});
  };

  /** Switches the pane to one target and moves the selected state onto its tab. */
  const tabs = [...root.querySelectorAll('[data-target]')].filter(
    (node): node is HTMLButtonElement => node instanceof HTMLButtonElement,
  );

  const selectTarget = (next: Target, focus = false): void => {
    target = next;
    for (const tab of tabs) {
      const on = tab.dataset.target === next;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      // One roving tabindex, so Tab reaches the strip once and the arrows move inside it.
      tab.tabIndex = on ? 0 : -1;
      if (on) {
        output.setAttribute('aria-labelledby', tab.id);
        if (focus) tab.focus();
      }
    }
    paintOutput();
  };

  const goTo = (position: TypeshadePosition): void => {
    if (!editor) return;
    const target = toMonacoPosition(position);
    editor.setPosition(target);
    editor.revealPositionInCenter(target);
    editor.focus();
  };

  /** The compiler writes its diagnostics in English. The one the Playground itself causes, a
   *  file with no directive, is the page's own sentence, so it reads in the page's language. */
  const toRow = (diagnostic: TypeshadeDiagnostic): DiagnosticRow => ({
    message: diagnostic.code === 'TS8001' ? copy.directive : diagnostic.message,
    category: diagnostic.category,
    start: diagnostic.range.start,
  });

  const paintDiagnostics = (rows: readonly DiagnosticRow[]): void => {
    diagnosticsPane.textContent = '';
    if (rows.length === 0) {
      diagnosticsPane.append(el('li', undefined, copy.clean));
      return;
    }
    for (const row of rows) {
      const button = el('button') as HTMLButtonElement;
      button.type = 'button';
      button.append(el('span', 'at', toDisplayPosition(row.start)));
      button.append(el('span', row.category === 'error' ? 'error' : undefined, ` ${row.message}`));
      button.addEventListener('click', () => goTo(row.start));
      const item = el('li');
      item.append(button);
      diagnosticsPane.append(item);
    }
  };

  const render = (): void => {
    if (!editor || !model || !monacoApi) return;
    const source = editor.getValue();
    status.textContent = copy.idle;
    output.textContent = '';
    diagnosticsPane.textContent = '';
    root.classList.remove('has-errors', 'has-output');
    try {
      const result = compileTsSource(source, { fileName, requireDirective: true });
      const found = [...languageService.getDiagnostics(source)];
      const rows = found.map(toRow);
      // The compiler stays quiet about a file with no directive, so the Playground says it.
      if (!result.hasDirective && rows.length === 0) {
        rows.push({ message: copy.directive, category: 'error', start: { line: 0, character: 0 } });
      }

      monacoApi.editor.setModelMarkers(
        model,
        'typeshade',
        found.map((diagnostic) => ({
          ...toMonacoRange(diagnostic.range),
          message: diagnostic.message,
          severity: diagnostic.category === 'warning' ? monacoApi.MarkerSeverity.Warning : monacoApi.MarkerSeverity.Error,
        })),
      );

      paintDiagnostics(rows);
      if (rows.length > 0) {
        status.textContent = copy.errors;
        root.classList.add('has-errors');
      } else {
        status.textContent = copy.ready;
      }

      // Reflection and the GLSL stages read the module the same source produced. A file with
      // no directive, or one the compiler complained about, has nothing worth reflecting, so
      // the panes stay empty.
      compiled = undefined;
      reflection = undefined;
      entries = [];
      if (result.hasDirective && found.length === 0) {
        try {
          compiled = compile(source);
          reflection = reflect(compiled.module);
          entries = (reflection.entries ?? []) as readonly ReflectedEntry[];
        } catch {
          compiled = undefined;
          reflection = undefined;
          entries = [];
        }
      }

      // The panes are emitted from the options bar instead of read off the compile, so the
      // bar is the one thing that decides what they hold. At its defaults the two agree:
      // `compile().wgsl` is `emitModule(module)`, which is `emitModuleAt(module, 'O2')`.
      // `compiled` is already gated on a clean compile, so an error leaves every pane empty.
      const choice = currentChoice();
      const glsl = compiled ? emitGlsl(compiled.module, choice) : undefined;
      emitted = {
        wgsl: compiled ? emitWgsl(compiled.module, choice) : result.wgsl,
        glslVertex: glsl?.vertex,
        glslFragment: glsl?.fragment,
      };
      if (emitted.wgsl) root.classList.add('has-output');
      paintOutput();
      paintReflection();
    } catch (error) {
      status.textContent = copy.errors;
      root.classList.add('has-errors');
      diagnosticsPane.textContent = error instanceof Error ? error.message : String(error);
      compiled = undefined;
      reflection = undefined;
      entries = [];
      emitted = {};
      paintOutput();
      paintReflection();
    }
  };

  const publishSource = async (): Promise<void> => {
    if (!editor) return;
    writeHash('code', await encodeSource(editor.getValue()), currentChoice());
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

  copyOutput.addEventListener('click', () => {
    void navigator.clipboard
      .writeText(emitted[target] ?? '')
      .then(() => flash(copyOutput, copy.copied, copy.copy))
      .catch(() => {});
  });

  const showExample = (id: string): void => {
    const example = examples.find((candidate) => candidate.id === id);
    if (!example || !editor) return;
    examplePicker.value = example.id;
    exampleNote.textContent = example.description;
    editor.setValue(example.source);
    writeHash('example', example.id, currentChoice());
    render();
  };

  examplePicker.addEventListener('change', () => showExample(examplePicker.value));

  const applyOptions = (): void => {
    levelNote.hidden = levelPicker.value === 'O2';
    render();
    // The bar is part of what a link shows, so changing it rewrites the fragment. An
    // untouched example keeps its short `#example=` form.
    const named = hashParams().get('example');
    if (named && !hashParams().get('code')) writeHash('example', named, currentChoice());
    else void publishSource();
  };
  for (const control of [levelPicker, parensPicker, precisionPicker, minifyToggle]) {
    control.addEventListener('change', applyOptions);
  }

  // `width` and `height` on a canvas are its backing store, which is the grid the fragment
  // entry is run over. The box it is shown in is held at one size in the stylesheet, so this
  // changes how much is computed and never how much room the pane takes. A bigger grid is
  // also where the pool earns its keep: the tiles are the same size, so four times the pixels
  // is four times the queue and the same workers draining it.
  if (resolutionPicker instanceof HTMLSelectElement && canvas instanceof HTMLCanvasElement) {
    resolutionPicker.addEventListener('change', () => {
      const side = Number(resolutionPicker.value);
      if (!Number.isFinite(side)) return;
      // A draw already in flight was planned against the old grid, and its tiles carry the
      // old grid's coordinates. Raising the job retires them at the worker and at the page,
      // so none of them lands on the canvas that is about to replace them. At 8K a draw runs
      // for tens of seconds, so this is a control a reader can reach mid-draw.
      job += 1;
      canvas.width = side;
      canvas.height = side;
      const surface = canvas.getContext('2d');
      surface?.clearRect(0, 0, side, side);
      canvasFits = holdsItsPixels(canvas, surface);
      if (drawCpu instanceof HTMLButtonElement) drawCpu.disabled = !moduleDrawable || !canvasFits;
      if (canvasNote instanceof HTMLElement) {
        canvasNote.textContent = !moduleDrawable ? copy.canvasNeedsVertex : canvasFits ? copy.canvasIdle : copy.canvasTooBig;
      }
    });
  }

  /** What the page opens with: the source in the link, else the example the link names, else
   *  the first example. */
  const openingSource = async (): Promise<{ source: string; example?: PlaygroundExample; }> => {
    const params = hashParams();
    // The options come off the fragment before the first render, so the panes are painted
    // once, under the settings the link carried.
    const level = params.get('opt');
    if (level === 'O0' || level === 'O1' || level === 'O2') levelPicker.value = level;
    if (params.get('parens') === 'minimal') parensPicker.value = 'minimal';
    if (params.get('minify') === '1') minifyToggle.checked = true;
    if (params.get('precision') === 'mediump') precisionPicker.value = 'mediump';
    const code = params.get('code');
    if (code) {
      const source = await decodeSource(code);
      if (source !== undefined) return { source, example: examples.find((candidate) => candidate.source === source) };
    }
    const named = params.get('example');
    const chosen =
      examples.find((candidate) => candidate.id === named) ??
      examples.find((candidate) => candidate.id === root.dataset.defaultExample) ??
      examples[0];
    return { source: chosen?.source ?? sample, example: chosen };
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

      // Colourising bakes the theme into the markup, so the pane is painted again on a change.
      followSiteTheme(monaco, paintOutput);
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
      if (runCpu instanceof HTMLButtonElement) runCpu.addEventListener('click', evaluateOnCpu);
      if (drawCpu instanceof HTMLButtonElement) drawCpu.addEventListener('click', drawOnCpu);
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectTarget((tab.dataset.target ?? 'wgsl') as Target));
        tab.addEventListener('keydown', (event) => {
          const steps: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
          const next = steps[event.key];
          if (next === undefined) return;
          event.preventDefault();
          const moved = tabs[(next + tabs.length) % tabs.length];
          selectTarget((moved.dataset.target ?? 'wgsl') as Target, true);
        });
      });
      reset.addEventListener('click', () => {
        showExample(examplePicker.value);
        editor.focus();
      });
      levelNote.hidden = levelPicker.value === 'O2';
      render();
    })
    .catch((error) => {
      status.textContent = copy.errors;
      root.classList.add('has-errors');
      // The reader gets the sentence; the console keeps the cause.
      diagnosticsPane.textContent = copy.unavailable;
      console.error('[playground]', error);
    });
}

const root = document.querySelector('[data-playground]');
if (root instanceof HTMLElement) mount(root);
