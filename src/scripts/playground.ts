// The Playground's browser half. Astro puts this module through Vite, so it can import the
// compiler and the language service from the vendored checkout. The component's own
// `define:vars` script is emitted inline as a classic script, which has no import at all, so
// everything past the first line of it would die with a SyntaxError; the values it used to
// carry arrive here as data attributes instead.
// Each import below names the module that defines the symbol and not the package barrel. The
// barrel re-exports the front end, which carries the TypeScript compiler, and none of these
// do: the page's own chunk is Monaco's glue, the emitters, reflection and the CPU oracle, and
// the compiler lives in the language worker alone. The raster worker imports `core/oracle.ts`
// this way for the same reason.
import {
  emitModule,
  emitModuleAt,
  wgslBackend,
} from '../../vendor/shader-dsl/src/core/backends/wgsl.ts';
import { hostFeaturesFor } from '../../vendor/shader-dsl/src/core/backend.ts';
import {
  emitGlslStages,
  type GlslEmitOptions,
} from '../../vendor/shader-dsl/src/core/backends/glsl.ts';
import type { EmitOptions } from '../../vendor/shader-dsl/src/core/emit.ts';
import type { ModuleDecl } from '../../vendor/shader-dsl/src/core/ir/nodes.ts';
import type { Fp64Flavor } from '../../vendor/shader-dsl/src/core/passes/fp64-lower.ts';
import { compileModule } from '../../vendor/shader-dsl/src/core/oracle.ts';
import { decodeConsole, type ConsoleEvent } from '../../vendor/shader-dsl/src/core/console.ts';
import {
  consoleBuffer,
  hasConsoleCall,
} from '../../vendor/shader-dsl/src/core/passes/console-buffer.ts';
import type { OptLevel } from '../../vendor/shader-dsl/src/core/passes/opt/optimize.ts';
import { reflect } from '../../vendor/shader-dsl/src/core/reflect.ts';
// The ship-time plugins live on their own subpath, the one a host imports for a release build.
import { minify, obfuscate } from '../../vendor/shader-dsl/src/emit-prod.ts';
import type {
  TypeshadeCompletionItem,
  TypeshadeDiagnostic,
  TypeshadeDocumentSymbol,
  TypeshadePosition,
  TypeshadeRange,
} from '../../vendor/shader-dsl/src/language-service/index.ts';
import {
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  createLanguageClient,
  encodeSemanticTokens,
  type Analysis,
  type LanguageClient,
} from './playground-language.ts';
import { codeOnly, FRAGMENT_PRELUDE, sampleShape } from '../lib/live-shader-contract.ts';
import { runComputeOnGpu } from '../lib/compute-runner.ts';
import { BindingsModel, type BindingsCopy } from './playground-bindings.ts';
import { installOracleTextures } from './playground-oracle-textures.ts';
import { errorLink } from './error-links.ts';
// The runtime every figure on the site draws through. It imports nothing from the compiler:
// the WGSL, both GLSL stages and the std140 offsets arrive as plain data, which is exactly
// what this page already holds after a compile.
import { mountShader, type MountedShader, type ShaderData } from '../lib/shader-runtime.ts';
import {
  cornersOf,
  drawTile,
  pixelArguments,
  RASTER_PRECISION,
  entryArguments,
  zeroFor,
  type CpuFunctions,
  type RasterPlan,
  type RasterReply,
  type RasterRequest,
  type ReflectedEntry,
  type ReflectedField,
} from './playground-raster.ts';

// The oracle's texture reads answer from the texels the bindings panel binds, on this thread as
// in the raster workers, so the return values and a dispatch read the picture the GPU does.
installOracleTextures();

/** One example as the page carries it: the source from the vendored file, the words from i18n. */
interface PlaygroundExample {
  readonly id: string;
  readonly source: string;
  readonly title: string;
  readonly description: string;
  /** Where a source twin's uniform fields start, by field name. */
  readonly defaults?: Readonly<Record<string, readonly number[]>>;
}

/** What the options bar is set to. Every field is a value the compiler's emit API takes. */
interface EmitChoice {
  readonly level: OptLevel;
  readonly parens: 'full' | 'minimal';
  readonly minify: boolean;
  /** `minify({ numbers })`: how a float literal is re-spelled. */
  readonly numbers: boolean | 'f32';
  readonly obfuscate: boolean;
  /** Which primitives back the emulated-double helpers, for the emit and for reflect(). */
  readonly fp64Flavor: Fp64Flavor;
  readonly floatPrecision: 'highp' | 'mediump';
  /** The backend the Result tab draws on. Not an emit option, but it rides in the link with
   *  them, so a link shows the canvas the sender was looking at. */
  readonly backend: 'auto' | 'webgpu' | 'webgl2' | 'cpu';
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
  /** The error codes' index in the page's language, which a code links under. */
  readonly errorsHref: string;
  readonly emit: {
    readonly title: string;
    readonly optimization: string;
    readonly levels: Record<OptLevel, string>;
    readonly parens: string;
    readonly minify: string;
    readonly numbers: string;
    readonly obfuscate: string;
    readonly fp64: string;
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
  readonly stop: string;
  readonly canvasIdle: string;
  readonly engineGpu: string;
  readonly engineCpu: string;
  readonly gpuIdle: string;
  readonly gpuWebgpu: string;
  readonly gpuWebgl2: string;
  readonly gpuNone: string;
  readonly gpuNeedsStages: string;
  readonly gpuNeedsAttributes: string;
  readonly gpuNeedsBindings: string;
  readonly gpuNoWebgpu: string;
  readonly gpuNoWebgl2: string;
  readonly gpuNoGlsl: string;
  readonly gpuNoGlslFeatures: string;
  readonly gpuNoFeature: string;
  readonly gpuFailed: string;
  readonly computeNeedsWebgpu: string;
  readonly computeRan: string;
  readonly consoleIdle: string;
  readonly consoleLines: string;
  readonly consoleNone: string;
  readonly consoleDropped: string;
  readonly consoleMore: string;
  readonly consoleIndex: string;
  readonly consolePixelHint: string;
  readonly consolePixel: string;
  readonly consolePixelNone: string;
  readonly consolePixelOutside: string;
  readonly consolePixelFailed: string;
  readonly consolePixelNoRaster: string;
  readonly pixelNote: string;
  readonly consoleValue: string;
  readonly bindings: BindingsCopy;
  readonly canvasNeedsVertex: string;
  readonly canvasFlat: string;
  readonly canvasFlatInputs: string;
  readonly canvasProgress: string;
  readonly canvasDrawn: string;
  readonly resolution: string;
  readonly canvasTooBig: string;
  readonly args: string;
  readonly argsInvalid: string;
  readonly cpuNoResources: string;
  readonly entryCountOne: string;
  readonly noGlsl: string;
  readonly resultTab: string;
  readonly starting: string;
  readonly serviceFailed: string;
  readonly sourceTypescript: string;
  readonly sourceTypeshade: string;
}

/** The files the compiler emits, one per tab over the text panel. */
type Target = 'wgsl' | 'glslVertex' | 'glslFragment';

/** What the one tab strip over the result column selects: the canvas, one of the three
 *  emitted files, or the reflection. */
type View = 'result' | Target | 'reflection' | 'console';

/** What scripts/check-playground.mjs reads off the tool's element. */
interface PlaygroundHandle {
  /** Hold the shader clock at `seconds` on both engines, or let it run with null. */
  freeze(seconds: number | null): void;
  /** The rasteriser's RGBA at each pixel of a `width` by `height` grid, one 1-pixel tile each,
   *  or null where the triangle does not cover it; a sentence when it cannot run at all. */
  cpuPixels(
    points: readonly (readonly [number, number])[],
    width: number,
    height: number,
  ): (number[] | null)[] | string;
}

declare global {
  interface HTMLElement {
    __playground?: PlaygroundHandle;
  }
}

/** Whether a view is one of the three the text panel holds. */
const isTarget = (view: View): view is Target =>
  view === 'wgsl' || view === 'glslVertex' || view === 'glslFragment';

// Monaco ships a WGSL grammar. It ships none for GLSL, and GLSL ES 3.00 is close enough to C
// for Monaco's C++ tokenizer to colour its keywords, types, numbers and `#version` line.
const TARGET_LANGUAGE: Readonly<Record<Target, string>> = {
  wgsl: 'wgsl',
  glslVertex: 'cpp',
  glslFragment: 'cpp',
};

// ── Reflection ─────────────────────────────────────────────────────────────────────────────
// What reflect() recovers from the compiled module, shaped for the pane. Names and types in
// here come from the source in the editor, so every one of them reaches the page as text on a
// node and none of it is ever written as markup.

/** How the zero of a type reads in an argument field, and how what is typed back reads as a
 *  value. A vector is a comma-separated list, which is how the source spells one too. */
const argText = (value: unknown): string =>
  Array.isArray(value) ? value.join(', ') : String(value);

function parseArg(text: string, zero: unknown): unknown {
  const trimmed = text.trim();
  if (typeof zero === 'boolean') {
    if (/^(?:true|1)$/i.test(trimmed)) return true;
    if (/^(?:false|0)$/i.test(trimmed)) return false;
    throw new Error('not a boolean');
  }
  const parts = trimmed.split(',').map((part) => Number(part.trim()));
  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part)))
    throw new Error('not a number');
  if (Array.isArray(zero)) {
    if (parts.length !== zero.length) throw new Error('wrong length');
    return parts;
  }
  if (parts.length !== 1) throw new Error('not a single number');
  return parts[0];
}

/** How a field reads on one line: `name: type` and the attribute that placed it, when it has one. */
function fieldLabel(field: ReflectedField): { text: string; attr: string } {
  const text =
    field.name && field.type ? `${field.name}: ${field.type}` : (field.type ?? field.name ?? '');
  if (field.builtin) return { text, attr: `@builtin(${field.builtin})` };
  if (typeof field.location === 'number') return { text, attr: `@location(${field.location})` };
  return { text, attr: '' };
}

/** A returned value as the pane prints it: arrays inline, everything else as JSON. */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v)).join(', ')}]`;
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(', ')} }`;
  }
  return typeof value === 'number'
    ? String(Number(value.toFixed(6)))
    : (JSON.stringify(value) ?? String(value));
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

// ── The fullscreen vertex half ─────────────────────────────────────────────────────────────
// A file that declares no `@vertex` entry is compiled behind the fullscreen triangle every
// Book of Shaders page draws on, which is what `<LiveShader>` does on a guide page and what
// src/lib/live-shader-contract.ts fixes as the site's one rule for it. So a reader can write
// a fragment program alone, take the `uv` the triangle hands them, and see it cover the
// canvas, instead of reading that the canvas needs a vertex entry they did not want to write.
//
// The directive has to stay the first thing in the file, so the prelude goes in after it and
// everything below moves down by its lines. The compiler answers about the composed text and
// the editor holds the reader's, so the two line numbers differ from that point on, and the
// four functions below are where they meet.

/** The directive line as the compiler wants it: first in the file. The Playground's own
 *  sample writes a semicolon after it and the `.shade.ts` examples do not. */
const DIRECTIVE_LINE = /^[\s\uFEFF]*(['"])use typeshade\1[ \t]*;?[ \t]*\r?\n/;

/** The two top-level names the prelude brings. A file that declares one of its own would get
 *  a duplicate and stop compiling, so that file keeps what it wrote and the prelude stays
 *  out. A file that only names one of them gets the prelude and the declaration with it. */
const PRELUDE_DECLARES =
  /^[\t ]*(?:export[\t ]+)?(?:class|function|const|let|var|type|interface)[\t ]+(?:VsOut|fullscreen)\b/m;

/** The reader's text as the compiler sees it, and where the prelude went in. A file with no
 *  directive is left alone: the page's own message about the directive is what that reader
 *  needs, and it would never appear if a directive were supplied for them. */
function compose(source: string): {
  readonly text: string;
  readonly at: number;
  readonly lines: number;
} {
  const directive = DIRECTIVE_LINE.exec(source);
  const code = codeOnly(source);
  // A file with no fragment entry has nothing for the triangle to hand a `uv` to: a compute
  // kernel gets no vertex half it would never run.
  if (
    !directive ||
    sampleShape(source) === 'module' ||
    !/@fragment\b/.test(code) ||
    PRELUDE_DECLARES.test(code)
  ) {
    return { text: source, at: 0, lines: 0 };
  }
  const head = source.slice(0, directive[0].length);
  const inserted = `\n${FRAGMENT_PRELUDE}\n`;
  return {
    text: head + inserted + source.slice(directive[0].length),
    at: head.split('\n').length - 1,
    lines: inserted.split('\n').length - 1,
  };
}

/** How many lines the prelude took, and the line it went in at. Zero while the reader's file
 *  declares its own vertex entry, which is when the two texts are the same text. */
let preludeLines = 0;
let preludeAt = 0;

/** Whether a line of the compiled text is one of the prelude's, which the editor does not
 *  hold and the reader never wrote. */
const inPrelude = (line: number): boolean =>
  preludeLines > 0 && line >= preludeAt && line < preludeAt + preludeLines;

/** A line of the editor's text, as the compiled text numbers it. */
const intoDocument = (line: number): number =>
  preludeLines > 0 && line >= preludeAt ? line + preludeLines : line;

/** A line of the compiled text, back in the editor's. One of the prelude's own lands on the
 *  directive line, which is the nearest line the reader can see. */
const outOfDocument = (line: number): number => {
  if (preludeLines === 0 || line < preludeAt) return line;
  return line >= preludeAt + preludeLines ? line - preludeLines : Math.max(0, preludeAt - 1);
};

// ── The one place the two coordinate systems meet ──────────────────────────────────────────
// Monaco counts lines and columns from 1. The language service counts both from 0, the way
// the Language Server Protocol does. Every crossing goes through these four functions, so a
// +1 or a -1, and the prelude's own lines, live here and in no other file.

const toServicePosition = (position: MonacoPosition): TypeshadePosition => ({
  line: intoDocument(position.lineNumber - 1),
  character: position.column - 1,
});

const toMonacoPosition = (position: TypeshadePosition): MonacoPosition => ({
  lineNumber: outOfDocument(position.line) + 1,
  column: position.character + 1,
});

const toMonacoRange = (range: TypeshadeRange): MonacoRange => {
  const startLineNumber = outOfDocument(range.start.line) + 1;
  const startColumn = range.start.character + 1;
  const endLineNumber = outOfDocument(range.end.line) + 1;
  const endColumn = range.end.character + 1;
  // A zero-width range draws no squiggle, so an empty one is widened by a column.
  const empty = endLineNumber === startLineNumber && endColumn <= startColumn;
  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn: empty ? startColumn + 1 : endColumn,
  };
};

/** How a diagnostic's position reads in the diagnostics pane: the line and column an editor shows. */
const toDisplayPosition = (position: TypeshadePosition): string =>
  `${outOfDocument(position.line) + 1}:${position.character + 1}`;

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
      w.MonacoEnvironment = {
        getWorkerUrl: (_moduleId: string, label: string) => monacoWorkerUrl(label),
      };
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
    script.addEventListener(
      'error',
      () => reject(new Error(`The Monaco loader did not load from ${MONACO_VS}/loader.js`)),
      { once: true },
    );
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
    monaco.editor.setTheme(siteIsDark() ? 'typeshade-dark' : 'typeshade-light');
    repaint();
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, {
    attributeFilter: ['data-theme'],
  });
  darkQuery.addEventListener('change', apply);
}

function completionKind(monaco: any, kind: TypeshadeCompletionItem['kind']): number {
  const kinds = monaco.languages.CompletionItemKind;
  const byKind: Record<TypeshadeCompletionItem['kind'], number> = {
    keyword: kinds.Keyword,
    type: kinds.TypeParameter,
    function: kinds.Function,
    attribute: kinds.Keyword,
    builtin: kinds.Constant,
    variable: kinds.Variable,
    field: kinds.Field,
    struct: kinds.Struct,
    resource: kinds.Variable,
    snippet: kinds.Snippet,
  };
  return byKind[kind] ?? kinds.Text;
}

function symbolKind(monaco: any, kind: TypeshadeDocumentSymbol['kind']): number {
  const kinds = monaco.languages.SymbolKind;
  const byKind: Record<TypeshadeDocumentSymbol['kind'], number> = {
    function: kinds.Function,
    struct: kinds.Struct,
    field: kinds.Field,
    resource: kinds.Variable,
    constant: kinds.Constant,
    variable: kinds.Variable,
    parameter: kinds.Variable,
    entry: kinds.Function,
  };
  return byKind[kind] ?? kinds.Variable;
}

function markerSeverity(monaco: any, severity: TypeshadeDiagnostic['severity']): number {
  const levels = monaco.MarkerSeverity;
  return severity === 'error'
    ? levels.Error
    : severity === 'warning'
      ? levels.Warning
      : severity === 'information'
        ? levels.Info
        : levels.Hint;
}

/** The service's semantic tokens, coloured. Monaco matches a semantic token against a theme
 *  rule by its type followed by its modifiers, `type.gpu` for a GPU type, so a decorator, a
 *  GPU type, an entry point and a bound resource each read as what the compiler says they
 *  are. The values are Monaco's own light and dark TypeScript palette, so nothing here is a
 *  colour the editor does not already use. */
function defineTypeshadeThemes(monaco: any): void {
  const rules = (dark: boolean) => [
    { token: 'decorator', foreground: dark ? 'c586c0' : 'af00db' },
    { token: 'type', foreground: dark ? '4ec9b0' : '267f99' },
    { token: 'type.gpu', foreground: dark ? '4ec9b0' : '267f99', fontStyle: 'bold' },
    { token: 'struct', foreground: dark ? '4ec9b0' : '267f99' },
    { token: 'builtin', foreground: dark ? 'dcdcaa' : '795e26' },
    { token: 'resource', foreground: dark ? '9cdcfe' : '0070c1', fontStyle: 'italic' },
    { token: 'function', foreground: dark ? 'dcdcaa' : '795e26' },
    { token: 'function.entry', foreground: dark ? 'dcdcaa' : '795e26', fontStyle: 'bold' },
    { token: 'parameter', foreground: dark ? '9cdcfe' : '001080' },
    { token: 'variable', foreground: dark ? '9cdcfe' : '001080' },
    { token: 'property', foreground: dark ? '9cdcfe' : '001080' },
  ];
  monaco.editor.defineTheme('typeshade-light', {
    base: 'vs',
    inherit: true,
    rules: rules(false),
    colors: {},
  });
  monaco.editor.defineTheme('typeshade-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: rules(true),
    colors: {},
  });
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

const hashParams = (): URLSearchParams =>
  new URLSearchParams(window.location.hash.replace(/^#/, ''));

/** The fragment: what to open, and the options to open it under. Only a setting that differs
 *  from the default is written, so a link to an untouched Playground stays short. */
function writeHash(key: string, value: string, choice?: EmitChoice): void {
  const parts = [`${key}=${value}`];
  if (choice) {
    if (choice.level !== 'O2') parts.push(`opt=${choice.level}`);
    if (choice.parens !== 'full') parts.push(`parens=${choice.parens}`);
    if (choice.minify) parts.push('minify=1');
    if (choice.numbers !== true)
      parts.push(`numbers=${choice.numbers === 'f32' ? 'f32' : 'false'}`);
    if (choice.obfuscate) parts.push('obfuscate=1');
    if (choice.fp64Flavor !== 'float') parts.push(`fp64=${choice.fp64Flavor}`);
    if (choice.floatPrecision !== 'highp') parts.push(`precision=${choice.floatPrecision}`);
    if (choice.backend !== 'auto') parts.push(`backend=${choice.backend}`);
  }
  const url = new URL(window.location.href);
  url.hash = parts.join('&');
  window.history.replaceState(null, '', url);
}

// ── The emit options ───────────────────────────────────────────────────────────────────────

/** The options both backends share. `minify` and `obfuscate` are plugins, so they ride in
 *  `plugins`. `obfuscate()` is the compiler's own preset and expands to four plugins, the
 *  last of them a `minify({ numbers: 'f32' })`; the reader's own minify follows it, because
 *  the text-stage hooks run in array order and the reader's number mode is the one they
 *  chose. Running minify twice changes nothing the first run did not already do. */
const sharedEmitOptions = (choice: EmitChoice): EmitOptions => {
  const plugins = [
    ...(choice.obfuscate ? obfuscate() : []),
    ...(choice.minify ? [minify({ numbers: choice.numbers })] : []),
  ];
  return {
    parens: choice.parens,
    fp64Flavor: choice.fp64Flavor,
    ...(plugins.length > 0 ? { plugins } : {}),
  };
};

/** WGSL at the chosen level. `emitModuleAt` takes a level and no other options, and
 *  `emitModule` takes the options at O2, so O0 and O1 reach the compiler with the level
 *  alone. The note under the options bar says so where a reader can see it. */
const emitWgsl = (module: Parameters<typeof emitModule>[0], choice: EmitChoice): string =>
  choice.level === 'O2'
    ? emitModule(module, sharedEmitOptions(choice))
    : emitModuleAt(module, choice.level);

/** Both GLSL stages. The GLSL backend fixes its own optimizer at a fixpoint, so it takes the
 *  options and no level. */
const emitGlsl = (
  module: Parameters<typeof emitGlslStages>[0],
  choice: EmitChoice,
  overrideValues?: Readonly<Record<string, number>>,
): { vertex: string; fragment: string } | { failed: string } => {
  // An override the reader moved is pinned as a hard `#define`; one left at its default keeps
  // the `#ifndef` guard the emit writes, so an untouched module emits the bytes it always did.
  const options: GlslEmitOptions = {
    ...sharedEmitOptions(choice),
    floatPrecision: choice.floatPrecision,
    ...(overrideValues ? { overrideValues } : {}),
  };
  try {
    return emitGlslStages(module, options);
  } catch (error) {
    // A module the GLSL backend cannot express at all, a uniform scalar among them. The
    // reason is kept, since WebGL2 has to say why it has nothing to run.
    return { failed: error instanceof Error ? error.message : String(error) };
  }
};

/** A row of the diagnostics list: what to say and where it points. A row about a line of the
 *  prelude points nowhere, since the editor does not hold that line. */
interface DiagnosticRow {
  readonly message: string;
  /** The compiler's code: `TS8022` and the like from TypeShade, a number from TypeScript. */
  readonly code: string;
  readonly severity: TypeshadeDiagnostic['severity'];
  readonly source: TypeshadeDiagnostic['source'];
  readonly start: TypeshadePosition;
  readonly located: boolean;
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
  /** The uri the worker knows the document by. Any string does; this one is the same the
   *  editor's model is created under, so a location the service hands back names it. */
  const documentUri = `file:///${fileName}`;
  /** The version the editor holds. Every change raises it; every reply names the version it
   *  answers for, and the client drops one for any other, so a slow answer to an old keystroke
   *  never paints over a fast answer to a new one. */
  let version = 0;
  /** The last analysis painted and the version it was of, so a control on the options bar
   *  repaints from it without asking the worker again. */
  let lastAnalysis: Analysis | undefined;
  let analysedVersion = -1;
  const serviceFailed = (): void => {
    if (status instanceof HTMLElement) status.textContent = copy.serviceFailed;
    root.classList.add('has-errors');
  };
  /** The language worker, opened as early as the page runs so it boots while Monaco is still
   *  loading from the CDN; the two arrive in either order and the first analysis waits for
   *  both. It carries the compiler and the TypeScript it is built on, which is why it is a
   *  worker: that is a megabyte of script the main thread should never parse or run. */
  const openLanguageWorker = (): LanguageClient | undefined => {
    if (typeof Worker !== 'function') return undefined;
    try {
      const worker = new Worker(new URL('./playground-language-worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.addEventListener('error', () => serviceFailed());
      return createLanguageClient(
        worker,
        (asked) => asked === version,
        () => serviceFailed(),
      );
    } catch {
      return undefined;
    }
  };
  const client = openLanguageWorker();
  const reflectionPane = root.querySelector('[data-reflection]');
  const consolePane = root.querySelector('[data-console]');
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
  const numbersPicker = root.querySelector('[data-opt-numbers]');
  const numbersField = root.querySelector('[data-numbers-field]');
  const obfuscateToggle = root.querySelector('[data-opt-obfuscate]');
  const fp64Picker = root.querySelector('[data-opt-fp64]');
  const levelNote = root.querySelector('[data-level-note]');
  const preludeNote = root.querySelector('[data-prelude-note]');
  const canvas = root.querySelector('[data-canvas]');
  const canvasNote = root.querySelector('[data-canvas-note]');
  const gpuNote = root.querySelector('[data-gpu-note]');
  const enginePicker = root.querySelector('[data-engine]');
  const cpuOnly = [...root.querySelectorAll('[data-cpu-only]')].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
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
  const holdsItsPixels = (
    node: HTMLCanvasElement,
    surface: CanvasRenderingContext2D | null,
  ): boolean => {
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
    !(share instanceof HTMLButtonElement) ||
    !(copyOutput instanceof HTMLButtonElement) ||
    !(sizeLabel instanceof HTMLElement) ||
    !(levelPicker instanceof HTMLSelectElement) ||
    !(parensPicker instanceof HTMLSelectElement) ||
    !(precisionPicker instanceof HTMLSelectElement) ||
    !(minifyToggle instanceof HTMLInputElement) ||
    !(numbersPicker instanceof HTMLSelectElement) ||
    !(numbersField instanceof HTMLElement) ||
    !(obfuscateToggle instanceof HTMLInputElement) ||
    !(fp64Picker instanceof HTMLSelectElement) ||
    !(levelNote instanceof HTMLElement)
  ) {
    return;
  }

  /** What the options bar is set to right now. */
  const currentChoice = (): EmitChoice => ({
    level: levelPicker.value as OptLevel,
    parens: parensPicker.value === 'minimal' ? 'minimal' : 'full',
    minify: minifyToggle.checked,
    numbers: numbersPicker.value === 'f32' ? 'f32' : numbersPicker.value !== 'false',
    obfuscate: obfuscateToggle.checked,
    fp64Flavor: fp64Picker.value === 'integer' ? 'integer' : 'float',
    floatPrecision: precisionPicker.value === 'mediump' ? 'mediump' : 'highp',
    backend:
      enginePicker instanceof HTMLSelectElement &&
      (enginePicker.value === 'webgpu' ||
        enginePicker.value === 'webgl2' ||
        enginePicker.value === 'cpu')
        ? enginePicker.value
        : 'auto',
  });

  let editor: any;
  let model: any;
  let monacoApi: any;
  let timer = 0;
  let urlTimer = 0;
  let painted = 0;
  // What the compiler last emitted, by target, which tab is showing, and which of the three
  // texts the text panel holds. The panel keeps its text while another tab is up.
  let emitted: Partial<Record<Target, string>> = {};
  let view: View = 'result';
  let target: Target = 'wgsl';
  // The last good compile, kept so the CPU button can call into it without compiling again.
  let compiled: { readonly module: ModuleDecl } | undefined;
  let reflection: ReturnType<typeof reflect> | undefined;
  /** Why the GLSL backend emitted nothing for the last module, or ''. */
  let glslFailure = '';
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
        entries.some(
          (entry) =>
            entry.stage === 'vertex' &&
            (entry.io?.inputs ?? []).some(
              (f) => f.builtin === 'vertex_index' || typeof f.location === 'number',
            ),
        ) && entries.some((entry) => entry.stage === 'fragment');
      moduleDrawable = drawable;
      syncDrawButton();
      if (canvasNote instanceof HTMLElement) {
        canvasNote.textContent = !drawable
          ? copy.canvasNeedsVertex
          : canvasFits
            ? copy.canvasIdle
            : copy.canvasTooBig;
      }
      if (canvas instanceof HTMLCanvasElement)
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      // The pool is opened ahead of the press only where the reader can press: four workers
      // for a canvas the GPU is drawing would be four workers doing nothing.
      if (drawable && engineIsCpu()) window.setTimeout(openPool, 0);
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
            (group.entries ?? []).map((entry) => ({
              label: `@group(${group.group ?? 0})`,
              text: `${entry.name}: ${entry.resourceKind}`,
            })),
          ),
          ...reflection.overrides.map((o) => ({ label: 'override', text: String(o.name ?? o) })),
        ]
      : [];
    const resourceGroup = el('div', 'group');
    resourceGroup.append(el('p', 'group-title', copy.resources));
    if (resources.length === 0) resourceGroup.append(el('p', 'empty', copy.noResources));
    else {
      for (const r of resources) {
        const row = ioRow(r.label, r.text);
        // A binding is supplied in the panel under the canvas, so its row here goes there.
        const name = r.text.split(':')[0]!.trim();
        if (r.label !== 'override' && name !== '_fp64') {
          const go = document.createElement('button');
          go.type = 'button';
          go.className = 'to-binding';
          go.textContent = copy.bindings.title;
          go.addEventListener('click', () => {
            selectView('result');
            const target = root.querySelector(
              `[data-bindings] [data-binding-name="${CSS.escape(name)}"]`,
            );
            if (target instanceof HTMLElement) {
              target.scrollIntoView({ block: 'nearest' });
              target.focus({ preventScroll: true });
            }
          });
          row.append(go);
        }
        resourceGroup.append(row);
      }
    }
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
      const slot = reflectionPane.querySelector(
        `[data-returns="${CSS.escape(entry.name)}"] .io-value`,
      );
      const target =
        slot instanceof HTMLElement
          ? slot
          : reflectionPane.querySelector(`[data-returns="${CSS.escape(entry.name)}"]`)
              ?.lastElementChild;
      if (!(target instanceof HTMLElement)) continue;
      const inputs = entry.io?.inputs ?? [];
      const args: unknown[] = [];
      let invalid = false;
      for (const [index, field] of inputs.entries()) {
        const name = field.name ?? `arg${index}`;
        const typed = reflectionPane.querySelector(
          `[data-arg="${CSS.escape(`${entry.name}/${name}`)}"]`,
        );
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
        // The IR is compiled to the oracle here the way the raster worker compiles it, and the
        // entry is called directly; the old `compiled.eval` did the same work per call.
        const oracle = compileModule(compiled.module, { gpuStubs: true });
        for (const [name, value] of Object.entries(
          bindings.cpuBindings(frozen ?? 0, 1, 1, pointer),
        ))
          oracle.setBinding(name, value as never);
        const run = (oracle.fns as CpuFunctions)[entry.name];
        if (!run) throw new Error(entry.name);
        const value = run(
          ...(entryArguments(entry, compiled.module.structs, (i) => args[i]) as never[]),
        );
        const shownArgs = inputs
          .map((f, i) => `${f.name ?? `arg${i}`} = ${formatValue(args[i])}`)
          .join(', ');
        target.textContent = shownArgs
          ? `${formatValue(value)}   (${shownArgs})`
          : formatValue(value);
        target.className = 'io-value';
      } catch (error) {
        // `compileModule` takes `gpuStubs` and `precision` and no resource values, so an entry
        // reading a uniform or a storage binding has nothing to read and the oracle stops at
        // the name. The reader gets that sentence instead of the compiler's.
        const message = error instanceof Error ? error.message : '';
        const binds = (reflection?.bindGroups ?? []).some(
          (group) => (group.entries ?? []).length > 0,
        );
        target.textContent =
          binds && /unknown (?:const|var|binding)/.test(message)
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
  const tileSize = (side: number): number =>
    Math.min(256, Math.max(64, Math.round(side / 6 / 16) * 16));
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
        pool.push(
          new Worker(new URL('./playground-raster-worker.ts', import.meta.url), { type: 'module' }),
        );
      }
      return true;
    } catch {
      for (const worker of pool) worker.terminate();
      pool = [];
      return false;
    }
  };
  /** Set while a draw is in flight, so a second press does not race the first. */
  /** The job whose draw owns the button and the note, or 0 when none is running. A number and
   *  not a flag, so a draw that was superseded by the next one can tell that its finish is no
   *  longer its to perform. */
  let drawing = 0;
  /** The button reads Stop while a draw runs and Draw otherwise, and is only ever disabled
   *  when there is nothing a press could do. */
  const syncDrawButton = (): void => {
    if (!(drawCpu instanceof HTMLButtonElement)) return;
    if (drawing !== 0) {
      drawCpu.textContent = copy.stop;
      drawCpu.disabled = false;
      return;
    }
    drawCpu.textContent = copy.draw;
    drawCpu.disabled = !moduleDrawable || !canvasFits;
  };
  /** Ends the running draw where it is. Moving `job` retires it at every worker and at the
   *  page; clearing `drawing` first makes its own finish a no-op, so the button and the note
   *  are this press's to set and not the retired draw's. */
  /** Close every worker, so the next draw opens a pool that holds nothing from before. */
  const retirePool = (): void => {
    for (const worker of pool) worker.terminate();
    pool = [];
  };

  const stopDrawing = (): void => {
    if (drawing !== 0) retirePool();
    job += 1;
    drawing = 0;
    syncDrawButton();
    if (canvasNote instanceof HTMLElement) canvasNote.textContent = copy.canvasIdle;
  };

  /** Hand the page back to the browser without the nested-setTimeout clamp, which is about
   *  4ms a turn and would cost more than the drawing between two of them. A MessageChannel
   *  posts a real task with no floor. */
  const yieldToPage = (): Promise<void> =>
    new Promise((resume) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        resume();
      };
      channel.port2.postMessage(undefined);
    });

  const fillNumbers = (text: string, values: Record<string, string | number>): string =>
    text.replace(/\{(\w+)\}/g, (whole, key: string) =>
      key in values ? String(values[key]) : whole,
    );

  /** What the rasteriser says when it is done. */
  const drawnNote = (px: number, ms: number, workers: number): string =>
    fillNumbers(copy.canvasDrawn, { px, ms: Math.round(ms), workers });

  // ── The Result tab ──────────────────────────────────────────────────────────────────
  // The canvas draws the program the WGSL and GLSL tabs hold, on the backend the reader
  // picked: the GPU in the runtime's own order (WebGPU, then WebGL2), WebGPU alone, WebGL2
  // alone, or the CPU oracle's rasteriser. The GPU half goes through src/lib/shader-runtime.ts,
  // the runtime every figure on the site uses; a module whose only entry is `@compute` is
  // dispatched instead, and the canvas plots what it wrote.
  //
  // A canvas holds one kind of context for its whole life, so a change of backend puts a new
  // canvas element in the frame. Nothing else moves: the source, the editor and the compile
  // stay as they are, and only the mount is made again.

  type Engine = 'auto' | 'webgpu' | 'webgl2' | 'cpu';
  const engine = (): Engine => {
    const value = enginePicker instanceof HTMLSelectElement ? enginePicker.value : 'auto';
    return value === 'webgpu' || value === 'webgl2' || value === 'cpu' ? value : 'auto';
  };
  const engineIsCpu = (): boolean => engine() === 'cpu';

  /** The pointer over the canvas, 0 to 1 from the bottom left, which is the space the
   *  prelude's `uv` is in. A canvas nobody has touched holds the middle. */
  let pointer: readonly [number, number] = [0.5, 0.5];
  /** The shader clock when it is held: under `prefers-reduced-motion`, at the three seconds a
   *  live example holds it at, or wherever a check pins it to compare two engines on one
   *  frame. Null lets it run. The rasteriser draws at this time, or at 0 when it runs. */
  let frozen: number | null =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 3
      : null;
  let mounted: MountedShader | undefined;
  /** The engine and the program the mount is running, so a compile that changes neither does
   *  not rebuild the pipeline. */
  let mountedEngine: Engine | undefined;
  let mountedSignature = '';
  /** Moves on every texture, sampler or buffer change, so the signature above moves too. */
  let resourceGeneration = 0;
  /** Each run of the Result tab takes the next number; a run that finds a later one has
   *  started lets that one finish instead of painting over it. */
  let resultRun = 0;

  const bindingsHost = root.querySelector('[data-bindings]');
  let valuesTimer = 0;
  const bindings = new BindingsModel(copy.bindings, {
    values: () => {
      // The frame the GPU is drawing packs the new value on its next frame. The oracle's
      // rasteriser and a dispatch take their values when they start, so those run again,
      // once the control has settled.
      mounted?.redraw();
      if (engineIsCpu() || isComputeModule()) {
        window.clearTimeout(valuesTimer);
        valuesTimer = window.setTimeout(() => void runResult(), 250);
      }
    },
    resources: () => {
      resourceGeneration += 1;
      void runResult();
    },
    overrides: () => {
      // An override is part of the program: the GLSL tabs spell it as a `#define` and the
      // WebGPU pipeline takes it as a constant, so the texts are emitted again.
      render();
    },
  });

  /** Whether the module has a compute entry and nothing to draw, which is when the tab
   *  dispatches it instead. */
  const isComputeModule = (): boolean =>
    entries.some((entry) => entry.stage === 'compute') &&
    !entries.some((entry) => entry.stage === 'fragment');

  const frame = root.querySelector('[data-gpu-frame]');

  /** Put a new canvas where the old one was, carrying its name and its handlers. */
  const freshCanvas = (): HTMLCanvasElement | undefined => {
    const old = root.querySelector('[data-gpu-canvas]');
    if (!(old instanceof HTMLCanvasElement)) return undefined;
    const next = document.createElement('canvas');
    // Every attribute the page gave it, the stylesheet's scoping one among them: without that
    // the new element misses the rules that size it to the frame and draws at 300 by 150.
    for (const { name, value } of [...old.attributes]) {
      if (name === 'width' || name === 'height' || name === 'data-plotted' || name === 'hidden')
        continue;
      next.setAttribute(name, value);
    }
    next.dataset.backend = 'none';
    next.hidden = old.hidden;
    next.addEventListener('pointermove', (event) => {
      const box = next.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      pointer = [
        Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)),
        Math.min(1, Math.max(0, 1 - (event.clientY - box.top) / box.height)),
      ];
    });
    old.replaceWith(next);
    return next;
  };
  const gpuCanvasNow = (): HTMLCanvasElement | undefined => {
    const node = root.querySelector('[data-gpu-canvas]');
    return node instanceof HTMLCanvasElement ? node : undefined;
  };

  const stopMount = (): void => {
    mounted?.stop();
    mounted = undefined;
    mountedEngine = undefined;
    mountedSignature = '';
  };

  /** The still under the canvas goes for good once the reader's own program has drawn, or once
   *  they change the file: past that point it is a picture of something else. */
  const retireStill = (): void => {
    if (frame instanceof HTMLElement) frame.dataset.drawn = '';
  };

  const sayGpu = (text: string): void => {
    if (gpuNote instanceof HTMLElement) gpuNote.textContent = text;
  };

  const backendName = (which: Engine | 'none'): string =>
    which === 'webgpu'
      ? 'WebGPU'
      : which === 'webgl2'
        ? 'WebGL2'
        : which === 'cpu'
          ? copy.engineCpu
          : 'GPU';

  /** What the canvas says after a mount: which backend drew, or why none did, in the terms of
   *  what the reader picked. A WebGPU pick on a browser with none is said as that, and not as
   *  a WebGL2 frame under a WebGPU label. */
  const backendNote = (picked: Engine): string => {
    const backend = mounted?.backend ?? 'none';
    if (backend === 'webgpu') return copy.gpuWebgpu;
    if (backend === 'webgl2') return copy.gpuWebgl2;
    const failure = mounted?.failure ?? '';
    const feature = /missing WebGPU feature: ([^;]+)/.exec(failure)?.[1];
    if (feature) return fillNumbers(copy.gpuNoFeature, { features: feature });
    if (picked === 'auto' && !emitted.glslVertex && /no WebGPU/.test(failure))
      return `${copy.gpuNone} ${noGlslNote()}`;
    if (picked === 'webgpu' && /no WebGPU/.test(failure)) return copy.gpuNoWebgpu;
    if (picked === 'webgl2' && /no WebGL2/.test(failure)) return copy.gpuNoWebgl2;
    if (picked === 'auto' && (/no WebGL2/.test(failure) || failure === '')) return copy.gpuNone;
    return fillNumbers(copy.gpuFailed, {
      backend: backendName(picked === 'auto' ? 'none' : picked),
      reason: failure,
    });
  };

  /** What the GPU canvas should run, or why it cannot run this module. */
  const gpuPayload = (picked: Engine): { readonly data: ShaderData } | { readonly why: string } => {
    if (!compiled || !reflection || !emitted.wgsl) return { why: copy.gpuIdle };
    const missing = bindings.missing();
    if (missing.length > 0)
      return { why: fillNumbers(copy.gpuNeedsBindings, { names: missing.join(', ') }) };
    // The runtime draws three vertices and binds no vertex buffer, so a vertex entry that
    // reads an attribute from one has nothing to read. Saying which attribute beats letting
    // the pipeline fail and reporting that the browser has no GPU API.
    const vertex = entries.find((entry) => entry.stage === 'vertex');
    const fragment = entries.find((entry) => entry.stage === 'fragment');
    if (!vertex || !fragment) return { why: copy.gpuNeedsStages };
    const vertexBuffer = bindings.vertexBuffer();
    if (vertexBuffer === null) {
      const attributes = (vertex.io?.inputs ?? [])
        .filter((field) => typeof field.location === 'number')
        .map((field, index) => field.name ?? `arg${index}`);
      return { why: fillNumbers(copy.gpuNeedsAttributes, { fields: attributes.join(', ') }) };
    }
    if (picked === 'webgl2' && !emitted.glslVertex) return { why: noGlslNote() };
    const block = bindings.renderBlock();
    const guards = reflection.bindGroups
      .flatMap((group) => group.entries)
      .filter((entry) => entry.name === '_fp64')
      .map((entry) => ({ name: entry.name, binding: entry.binding }));
    return {
      data: {
        id: 'playground',
        title: fileName,
        wgsl: emitted.wgsl,
        // A module the GLSL backend cannot express still runs on WebGPU; the WebGL2 half is
        // what it loses, and the note says which backend drew when neither is left.
        vertex: emitted.glslVertex ?? '',
        fragment: emitted.glslFragment ?? '',
        layout: {
          size: block?.size ?? 0,
          block: block?.block ?? '',
          group: block?.group ?? 0,
          binding: block?.binding ?? 0,
          instance: block?.instance ?? '',
          fields: block?.fields ?? [],
          vertexEntry: vertex.name,
          fragmentEntry: fragment.name,
          textures: guards,
          resources: bindings.resources(false),
          moreBlocks: bindings.moreBlocks(),
          ...(vertexBuffer ? { vertexBuffer } : {}),
        },
        controls: {},
        constants: bindings.constants(),
        features: gpuFeatures(),
      },
    };
  };

  /** The optional WebGPU features the module asks for, as WebGPU names them. */
  const gpuFeatures = (): string[] => [
    ...hostFeaturesFor(wgslBackend, reflection?.requiredFeatures ?? []),
  ];

  /** Why WebGL2 has nothing to run: the capabilities GLSL ES 3.00 lacks when the emit names
   *  them, and the plain sentence otherwise. */
  const noGlslNote = (): string => {
    const missing = /missing capabilities?:\s*([\w, ]+)/.exec(glslFailure)?.[1]?.trim();
    return missing ? fillNumbers(copy.gpuNoGlslFeatures, { features: missing }) : copy.gpuNoGlsl;
  };

  /** Put the program the last compile emitted on the canvas, on the backend the reader
   *  picked. The same backend swaps, so the pass that is drawing stays up until the new one
   *  has drawn; a new backend, or a program the swap cannot take, mounts on a new canvas. */
  const runOnGpu = async (): Promise<void> => {
    const mine = ++resultRun;
    const picked = engine();
    const payload = gpuPayload(picked);
    if ('why' in payload) {
      stopMount();
      const node = gpuCanvasNow();
      if (node) node.dataset.backend = 'none';
      sayGpu(payload.why);
      return;
    }
    const signature = `${payload.data.wgsl}\n${payload.data.vertex}\n${payload.data.fragment}\n${resourceGeneration}\n${JSON.stringify(payload.data.constants)}`;
    if (mounted && mountedEngine === picked && mounted.backend !== 'none') {
      if (signature === mountedSignature) return;
      const swapped = await mounted.swap(payload.data);
      if (mine !== resultRun) return;
      if (swapped) {
        mountedSignature = signature;
        retireStill();
        sayGpu(backendNote(picked));
        return;
      }
    }
    stopMount();
    const target = freshCanvas();
    if (!target) return;
    const next = await mountShader(target, payload.data, {
      // The Playground's canvas is the reader's own program running, so it keeps its clock
      // under `prefers-reduced-motion` the way a live example does and redraws on a change.
      interactive: true,
      // A reader's program can be far heavier than any figure on the site, so the buffer
      // gives up pixels before the page gives up its frames.
      adaptive: true,
      // With no GLSL there is nothing for WebGL2 to try, so the order is WebGPU alone and the
      // reason printed is WebGPU's own.
      ...(picked === 'webgpu' || picked === 'webgl2'
        ? { backend: picked }
        : emitted.glslVertex
          ? {}
          : { backend: 'webgpu' as const }),
      uniformValues: (name, seconds, instance) =>
        bindings.renderValue(
          name,
          frozen ?? seconds,
          target.width,
          target.height,
          pointer,
          instance,
        ),
    });
    if (mine !== resultRun) {
      next.stop();
      return;
    }
    mounted = next;
    mountedEngine = picked;
    mountedSignature = signature;
    if (next.backend !== 'none') retireStill();
    sayGpu(backendNote(picked));
  };

  // ── A compute entry, dispatched ───────────────────────────────────────────────────────

  const accent = (): string =>
    getComputedStyle(root).getPropertyValue('--color-accent').trim() || '#1677ff';

  /** Draw a buffer's first number per element as bars, or a storage texture as the image it
   *  is, onto a new 2D canvas in the frame. */
  const plot = (
    values: readonly number[] | undefined,
    image: { width: number; height: number; format: string; bytes: Uint8Array } | undefined,
    backend: string,
  ): void => {
    const node = freshCanvas();
    if (!node) return;
    const box = node.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    node.width = Math.max(1, Math.round((box.width || 320) * dpr));
    node.height = Math.max(1, Math.round((box.height || 240) * dpr));
    const context = node.getContext('2d');
    if (!context) return;
    context.fillStyle =
      getComputedStyle(root).getPropertyValue('--color-ground').trim() || '#ffffff';
    context.fillRect(0, 0, node.width, node.height);
    if (image) {
      const { width, height, format, bytes } = image;
      const rgba = new Uint8ClampedArray(width * height * 4);
      const floats =
        format === 'r32float'
          ? new Float32Array(bytes.buffer, bytes.byteOffset, width * height)
          : undefined;
      let top = 0;
      if (floats) for (const v of floats) if (Number.isFinite(v)) top = Math.max(top, Math.abs(v));
      for (let i = 0; i < width * height; i++) {
        if (floats) {
          const g = top > 0 ? Math.round((Math.abs(floats[i]!) / top) * 255) : 0;
          rgba.set([g, g, g, 255], i * 4);
        } else {
          rgba.set([bytes[i * 4]!, bytes[i * 4 + 1]!, bytes[i * 4 + 2]!, 255], i * 4);
        }
      }
      const scratch = document.createElement('canvas');
      scratch.width = width;
      scratch.height = height;
      scratch.getContext('2d')?.putImageData(new ImageData(rgba, width, height), 0, 0);
      const side = Math.min(node.width, node.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(scratch, (node.width - side) / 2, (node.height - side) / 2, side, side);
    } else if (values && values.length > 0) {
      // A buffer longer than what the entry wrote ends in the zeros it started from, so the
      // plot stops a little past the last element that is not zero.
      let last = values.length - 1;
      while (last > 0 && values[last] === 0) last -= 1;
      const series = values.slice(
        0,
        Math.min(values.length, Math.max(8, last + 1 + Math.ceil((last + 1) / 8))),
      );
      const shown =
        series.length > 256
          ? Array.from({ length: 256 }, (_, i) => series[Math.floor((i * series.length) / 256)]!)
          : [...series];
      const finite = shown.filter(Number.isFinite);
      const low = Math.min(0, ...finite);
      const high = Math.max(0, ...finite);
      const span = high - low || 1;
      const pad = 12 * dpr;
      const h = node.height - pad * 2;
      const zero = pad + h * (high / span);
      const w = (node.width - pad * 2) / shown.length;
      context.fillStyle = accent();
      shown.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        const y = pad + h * ((high - v) / span);
        context.fillRect(
          pad + i * w,
          Math.min(y, zero),
          Math.max(1, w - (w > 3 ? 1 : 0)),
          Math.max(1, Math.abs(zero - y)),
        );
      });
      context.fillStyle =
        getComputedStyle(root).getPropertyValue('--color-text-3').trim() || '#999';
      context.fillRect(pad, zero, node.width - pad * 2, Math.max(1, dpr));
    }
    node.dataset.backend = backend;
    node.dataset.plotted = '1';
    retireStill();
  };

  /** The Console tab: the lines the last compute run delivered, in the order the CPU runs the
   *  invocations (surface §66), or the ones one clicked pixel delivered (`heading` says which).
   *  Only the first CONSOLE_SHOWN are drawn; the count says the rest. */
  const CONSOLE_SHOWN = 500;
  const showConsole = (
    events: readonly ConsoleEvent[],
    dropped: number,
    backend: 'webgpu' | 'cpu',
    heading?: string,
  ): void => {
    if (!(consolePane instanceof HTMLElement)) return;
    consolePane.replaceChildren();
    const say = (text: string): void => {
      const p = document.createElement('p');
      p.textContent = text;
      consolePane.append(p);
    };
    const name = backendName(backend);
    if (heading !== undefined) say(heading);
    else if (events.length === 0 && dropped === 0) {
      say(fillNumbers(copy.consoleNone, { backend: name }));
      return;
    } else say(fillNumbers(copy.consoleLines, { lines: events.length, backend: name }));
    if (events.length === 0) return;
    const list = document.createElement('ol');
    const shown = (v: unknown): string =>
      typeof v === 'string' ? v : typeof v === 'number' ? String(v) : JSON.stringify(v);
    for (const e of events.slice(0, CONSOLE_SHOWN)) {
      const li = document.createElement('li');
      if (e.method === 'warn' || e.method === 'error') li.className = e.method;
      const at = document.createElement('span');
      at.className = 'at';
      at.textContent = e.invocation ? `[${e.invocation.join(', ')}]` : '';
      // `table` joins ConsoleMethod with compiler proposal 0019; the pin that carries it drops
      // this widening.
      const body =
        (e.method as string) === 'table' && e.args.length === 1 && typeof e.args[0] === 'object'
          ? consoleTable(e.args[0], shown)
          : document.createElement('span');
      if (!(body instanceof HTMLTableElement)) body.textContent = e.args.map(shown).join(' ');
      li.append(at, body);
      list.append(li);
    }
    consolePane.append(list);
    if (events.length > CONSOLE_SHOWN)
      say(fillNumbers(copy.consoleMore, { more: events.length - CONSOLE_SHOWN }));
    if (dropped > 0) say(fillNumbers(copy.consoleDropped, { dropped }));
  };

  /** A `console.table` value as the browser's own console lays one out (changes/0019): a row per
   *  array element or struct field, and a column per field or component when the rows are
   *  structs or vectors, else one value column. A matrix arrives as its columns already. */
  const consoleTable = (value: unknown, shown: (v: unknown) => string): HTMLTableElement => {
    const rows: [string, unknown][] = Array.isArray(value)
      ? value.map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>);
    const columns: string[] = [];
    for (const [, v] of rows) {
      if (v === null || typeof v !== 'object') continue;
      for (const k of Object.keys(v)) if (!columns.includes(k)) columns.push(k);
    }
    const table = document.createElement('table');
    const cell = (tag: 'th' | 'td', text: string): HTMLTableCellElement => {
      const c = document.createElement(tag);
      c.textContent = text;
      return c;
    };
    const head = document.createElement('tr');
    head.append(cell('th', copy.consoleIndex));
    for (const k of columns.length > 0 ? columns : [copy.consoleValue]) head.append(cell('th', k));
    table.append(head);
    for (const [key, v] of rows) {
      const tr = document.createElement('tr');
      tr.append(cell('th', key));
      if (columns.length === 0) tr.append(cell('td', shown(v)));
      else {
        const o = (v !== null && typeof v === 'object' ? v : {}) as Record<string, unknown>;
        for (const k of columns) tr.append(cell('td', k in o ? shown(o[k]) : ''));
      }
      table.append(tr);
    }
    return table;
  };

  /** A module that draws runs its fragment entry once per pixel, which is far too many lines to
   *  show, so its console calls are read one pixel at a time: the Console tab says so until the
   *  reader clicks one, and a click runs the fragment entry for that pixel on the CPU oracle,
   *  with the inputs the CPU draw gives it (surface §66). */
  const pixelNote = root.querySelector('[data-pixel-note]');
  /** The idle line the page was served with, which carries its code span. */
  const consoleIdle =
    consolePane instanceof HTMLElement
      ? [...consolePane.childNodes].map((n) => n.cloneNode(true))
      : [];
  const showPixelHint = (): void => {
    if (pixelNote instanceof HTMLElement) pixelNote.hidden = true;
    if (!(consolePane instanceof HTMLElement)) return;
    const logs = compiled !== undefined && hasConsoleCall(compiled.module);
    if (logs) {
      const p = document.createElement('p');
      p.textContent = copy.consolePixelHint;
      consolePane.replaceChildren(p);
    } else consolePane.replaceChildren(...consoleIdle.map((n) => n.cloneNode(true)));
    if (frame instanceof HTMLElement) frame.dataset.logs = logs ? '1' : '0';
  };
  const logPixel = (target: HTMLCanvasElement, event: MouseEvent): void => {
    if (!compiled || isComputeModule() || !hasConsoleCall(compiled.module)) return;
    const box = target.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const width = target.width;
    const height = target.height;
    const x = Math.min(
      width - 1,
      Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * width)),
    );
    const y = Math.min(
      height - 1,
      Math.max(0, Math.floor(((event.clientY - box.top) / box.height) * height)),
    );
    const at = { x, y };
    const lines: ConsoleEvent[] = [];
    const report = (heading: string): void => {
      showConsole(lines, 0, 'cpu', heading);
      if (pixelNote instanceof HTMLElement) {
        pixelNote.textContent = fillNumbers(copy.pixelNote, { x, y, lines: lines.length });
        pixelNote.hidden = false;
      }
    };
    const base = rasterPlan();
    if (!base) return report(copy.consolePixelNoRaster);
    // The pixel grid of the canvas that was clicked, so `position` is the pixel the reader
    // pointed at on the GPU canvas as on the CPU one.
    const plan: RasterPlan = {
      ...base,
      width,
      height,
      bindings: bindings.cpuBindings(frozen ?? 0, width, height, pointer),
    };
    // The vertex entry runs three times to place the triangle; only the fragment's own call is
    // listened to, so a vertex entry's console call does not read as the pixel's.
    let listening = false;
    try {
      const oracle = compileModule(compiled.module, {
        gpuStubs: true,
        precision: RASTER_PRECISION,
        consoleSink: (e) => {
          if (listening) lines.push({ ...e, invocation: [x, y, 0] });
        },
      });
      for (const [name, value] of Object.entries(plan.bindings ?? {}))
        oracle.setBinding(name, value as never);
      const cpu = oracle.fns as CpuFunctions;
      const corners = cornersOf(cpu, plan);
      const args = corners && pixelArguments(plan, corners, x, y);
      if (!args) return report(fillNumbers(copy.consolePixelOutside, at));
      listening = true;
      cpu[plan.fragment.name]!(...(args as never[]));
    } catch (error) {
      listening = false;
      return report(
        fillNumbers(copy.consolePixelFailed, {
          ...at,
          reason: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    listening = false;
    report(
      lines.length === 0
        ? fillNumbers(copy.consolePixelNone, at)
        : fillNumbers(copy.consolePixel, { ...at, lines: lines.length }),
    );
  };
  if (frame instanceof HTMLElement) {
    // On the frame and not the canvas, because the GPU canvas is replaced on every mount.
    frame.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLCanvasElement) logPixel(target, event);
    });
  }

  /** Room for this many words of console entries in the WebGPU run's buffer. */
  const CONSOLE_WORDS = 1 << 16;

  const runCompute = async (): Promise<void> => {
    const mine = ++resultRun;
    stopMount();
    const picked = engine();
    const entry = entries.find((candidate) => candidate.stage === 'compute');
    if (!compiled || !entry || !emitted.wgsl) return;
    if (picked === 'webgl2') {
      const node = freshCanvas();
      if (node) node.dataset.backend = 'none';
      sayGpu(copy.computeNeedsWebgpu);
      return;
    }
    const missing = bindings.missing();
    if (missing.length > 0) {
      sayGpu(fillNumbers(copy.gpuNeedsBindings, { names: missing.join(', ') }));
      return;
    }
    const size = (entry as { workgroupSize?: number }).workgroupSize ?? 64;
    const invocations = bindings.invocations();
    const groups = Math.max(1, Math.ceil(invocations / size));
    const results = new Map<string, string>();
    let series: number[] | undefined;
    let image: { width: number; height: number; format: string; bytes: Uint8Array } | undefined;
    let ranOn: 'webgpu' | 'cpu';
    let ms = 0;
    // The console lines the run delivers: the oracle's sink on the CPU, the decoded buffer on
    // WebGPU, where a module that logs is emitted with the console buffer (surface §66).
    const lines: ConsoleEvent[] = [];
    let dropped = 0;
    const logs = hasConsoleCall(compiled.module);
    try {
      if (picked === 'cpu') {
        const started = performance.now();
        // With the GPU-only reads allowed: a texture read and a storage texture's load and
        // store answer from the panel's data (src/scripts/playground-oracle-textures.ts).
        const cpu = compileModule(compiled.module, {
          gpuStubs: true,
          precision: RASTER_PRECISION,
          consoleSink: (e) => lines.push(e),
        });
        const values = bindings.cpuBindings(0, 0, 0, pointer);
        for (const [name, value] of Object.entries(values)) cpu.setBinding(name, value as never);
        cpu.dispatch(entry.name, groups);
        ms = performance.now() - started;
        for (const name of bindings.writableStorage()) {
          const read = bindings.readCpu(name, values[name]);
          results.set(name, read.rows.join('\n'));
          series ??= read.series;
        }
        // The storage textures, in the same bytes and rows a readback from the GPU gives.
        for (const spec of bindings.resources(true)) {
          if (spec.kind !== 'storage-texture') continue;
          const held = values[spec.name] as { bytes?: Uint8Array } | undefined;
          if (!held?.bytes) continue;
          const texture = { width: spec.width, height: spec.height, format: spec.format };
          if (spec.name === bindings.firstStorageTexture())
            image = { ...texture, bytes: held.bytes };
          results.set(spec.name, `${spec.width} × ${spec.height} ${spec.format}`);
        }
        ranOn = 'cpu';
      } else {
        const recorded = logs ? consoleBuffer(compiled.module) : undefined;
        const log = recorded?.log;
        const result = await runComputeOnGpu({
          wgsl: log && recorded ? emitWgsl(recorded.module, currentChoice()) : emitted.wgsl,
          entry: entry.name,
          workgroups: [groups, 1, 1],
          resources: log
            ? [
                ...bindings.resources(true),
                {
                  kind: 'storage-buffer',
                  name: '_console',
                  group: log.group,
                  binding: log.binding,
                  readOnly: false,
                  bytes: new Uint8Array(8 + 4 * CONSOLE_WORDS),
                },
              ]
            : bindings.resources(true),
          constants: bindings.constants(),
          features: gpuFeatures(),
        });
        ms = result.ms;
        const words = result.buffers.get('_console');
        if (log && words) {
          const decoded = decodeConsole(
            new Uint32Array(words.buffer, words.byteOffset, words.byteLength / 4),
            log,
          );
          lines.push(...decoded.events);
          dropped = decoded.dropped;
        }
        for (const name of bindings.writableStorage()) {
          const bytes = result.buffers.get(name);
          if (!bytes) continue;
          const read = bindings.readBack(name, bytes);
          results.set(name, read.rows.join('\n'));
          series ??= read.series;
        }
        const shown = bindings.firstStorageTexture();
        if (shown) image = result.textures.get(shown);
        for (const [name, t] of result.textures)
          results.set(name, `${t.width} × ${t.height} ${t.format}`);
        ranOn = 'webgpu';
      }
    } catch (error) {
      if (mine !== resultRun) return;
      const node = freshCanvas();
      if (node) node.dataset.backend = 'none';
      const message = error instanceof Error ? error.message : String(error);
      const feature = /missing WebGPU feature: ([^;]+)/.exec(message)?.[1];
      sayGpu(
        feature
          ? fillNumbers(copy.gpuNoFeature, { features: feature })
          : picked !== 'cpu' && /no WebGPU/.test(message)
            ? copy.gpuNoWebgpu
            : fillNumbers(copy.gpuFailed, {
                backend: backendName(picked === 'auto' ? 'webgpu' : picked),
                reason: message,
              }),
      );
      return;
    }
    if (mine !== resultRun) return;
    bindings.showResults(results);
    if (logs) showConsole(lines, dropped, ranOn);
    if (bindingsHost instanceof HTMLElement) bindings.render(bindingsHost);
    plot(series, image, ranOn);
    sayGpu(
      fillNumbers(copy.computeRan, {
        entry: entry.name,
        invocations: groups * size,
        backend: backendName(ranOn),
        ms: Math.max(1, Math.round(ms)),
      }),
    );
  };

  /** Run whatever the Result tab should show for the module that compiled last, then mark
   *  the frame with the document version it shows. A check that selects an example waits for
   *  that mark to reach the editor's version, so it never photographs the example before. */
  let lastResult = 0;
  const runResult = async (): Promise<void> => {
    const at = analysedVersion;
    // A picked example is painted twice, once for the pick and once when the debounced edit
    // lands, and the first run gives way to the second. Only the latest may mark the frame.
    const mine = ++lastResult;
    if (frame instanceof HTMLElement) delete frame.dataset.settled;
    if (!isComputeModule()) showPixelHint();
    if (isComputeModule()) await runCompute();
    else if (engineIsCpu()) {
      resultRun += 1;
      stopMount();
      if (moduleDrawable && canvasFits) drawOnCpu();
    } else await runOnGpu();
    if (frame instanceof HTMLElement && at === analysedVersion && mine === lastResult)
      frame.dataset.settled = String(at);
  };

  // The handle scripts/check-playground.mjs reads. It pins the clock, and asks the rasteriser
  // for single pixels at the GPU canvas's own size, so the two engines are compared on the
  // same pixels of the same frame.
  const handle: PlaygroundHandle = {
    freeze: (seconds) => {
      frozen = seconds;
      // A held frame is held at the size it has, so the pixels a check reads off it and the
      // grid it asks the rasteriser for are one grid.
      mounted?.holdScale(seconds !== null);
      mounted?.redraw();
    },
    cpuPixels: (points, width, height) => {
      if (!compiled) return 'no module';
      const vertex = entries.find((entry) => entry.stage === 'vertex');
      const fragment = entries.find((entry) => entry.stage === 'fragment');
      if (!vertex || !fragment) return 'no vertex and fragment pair';
      const attributes = bindings.cpuAttributes();
      const plan: RasterPlan = {
        width,
        height,
        vertex,
        fragment,
        structs: compiled.module.structs.map((struct) => ({
          name: struct.name,
          fields: struct.fields.map((f) => ({ name: f.name })),
        })),
        bindings: bindings.cpuBindings(frozen ?? 0, width, height, pointer),
        ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
      };
      try {
        const oracle = compileModule(compiled.module, {
          gpuStubs: true,
          precision: RASTER_PRECISION,
        });
        for (const [name, value] of Object.entries(plan.bindings ?? {}))
          oracle.setBinding(name, value as never);
        const cpu = oracle.fns as CpuFunctions;
        const corners = cornersOf(cpu, plan);
        if (!corners) return 'no triangle';
        return points.map(([x, y]) => {
          const tile = drawTile(cpu, plan, corners, x, y, x + 1, y + 1);
          return tile.covered > 0 ? Array.from(tile.pixels) : null;
        });
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
  };
  root.__playground = handle;

  /** Show the canvas the picked engine draws on, and draw on it. Nothing is compiled here: the
   *  program is the one the last compile emitted. */
  const syncEngine = (): void => {
    const cpu = engineIsCpu() && !isComputeModule();
    for (const node of cpuOnly) node.hidden = !cpu;
    const node = gpuCanvasNow();
    if (node) node.hidden = cpu;
    if (cpu) retireStill();
    // A different backend is a different context, so the mount starts over on a new canvas.
    stopMount();
    void runResult();
  };

  /** What the canvas had no value for when it ran the vertex entry. It runs that entry at
   *  the indices 0, 1 and 2 and zeroes every other input, so an input the entry reads comes
   *  back as three collapsed corners and there is no triangle. Naming them is the difference
   *  between a reader fixing their shader and reading the page as broken. */
  const zeroedVertexInputs = (): readonly string[] => {
    const vertex = entries.find((entry) => entry.stage === 'vertex');
    return (vertex?.io?.inputs ?? [])
      .filter((field) => field.builtin !== 'vertex_index')
      .map((field, index) => field.name ?? `arg${index}`);
  };

  /** A raster failure as a sentence. The oracle takes entry arguments and no resource
   *  values, so an entry reading a uniform or a storage binding stops at the name. */
  const rasterFailure = (message: string): string => {
    if (message === 'no triangle') {
      const zeroed = zeroedVertexInputs();
      return zeroed.length > 0
        ? fillNumbers(copy.canvasFlatInputs, { fields: zeroed.join(', ') })
        : copy.canvasFlat;
    }
    if (/unknown (?:const|var|binding)|unbound/.test(message)) return copy.cpuNoResources;
    return message || copy.cpuFailed;
  };

  const rasterPlan = (): RasterPlan | undefined => {
    if (!compiled || !(canvas instanceof HTMLCanvasElement)) return undefined;
    const vertex = entries.find((entry) => entry.stage === 'vertex');
    const fragment = entries.find((entry) => entry.stage === 'fragment');
    if (!vertex || !fragment) return undefined;
    const attributes = bindings.cpuAttributes();
    if (
      !(vertex.io?.inputs ?? []).some((field) => field.builtin === 'vertex_index') &&
      Object.keys(attributes).length === 0
    )
      return undefined;
    if (!vertex.io?.outputs?.some((field) => field.builtin === 'position')) return undefined;
    return {
      width: canvas.width,
      height: canvas.height,
      vertex,
      fragment,
      structs: compiled.module.structs.map((struct) => ({
        name: struct.name,
        fields: struct.fields.map((f) => ({ name: f.name })),
      })),
      bindings: bindings.cpuBindings(frozen ?? 0, canvas.width, canvas.height, pointer),
      ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
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

  const drawHere = async (
    plan: RasterPlan,
    context: CanvasRenderingContext2D,
    mine: number,
  ): Promise<void> => {
    const oracle = compileModule(compiled!.module, { gpuStubs: true, precision: RASTER_PRECISION });
    for (const [name, value] of Object.entries(plan.bindings ?? {}))
      oracle.setBinding(name, value as never);
    const cpu = oracle.fns as CpuFunctions;
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
          canvasNote.textContent = fillNumbers(copy.canvasProgress, {
            done: index + 1,
            total: tiles.length,
            running: 1,
            waiting: tiles.length - index - 1,
          });
        }
        await yieldToPage();
      }
    }
    if (canvasNote instanceof HTMLElement) {
      canvasNote.textContent = drawnNote(covered, performance.now() - started, 1);
      canvasNote.dataset.px = String(covered);
      canvasNote.dataset.workers = '1';
    }
  };

  const drawOnCpu = (): void => {
    if (!(canvas instanceof HTMLCanvasElement) || !(canvasNote instanceof HTMLElement)) return;
    const context = canvas.getContext('2d');
    const plan = rasterPlan();
    if (!compiled || !context || !plan) {
      canvasNote.textContent = copy.canvasNeedsVertex;
      return;
    }
    // Raising the job retires whatever draw is still running; taking `drawing` makes that
    // draw's finish a no-op, so the button stays Stop across the handover. A worker still
    // holding the old draw's tiles would take the new one's only after finishing them, which
    // at a slow shader is seconds of a canvas reading 0 tiles; a new pool costs 130 ms.
    if (drawing !== 0) retirePool();
    job += 1;
    const mine = job;
    drawing = mine;
    syncDrawButton();
    context.clearRect(0, 0, plan.width, plan.height);
    delete canvasNote.dataset.px;
    delete canvasNote.dataset.workers;

    const finish = (): void => {
      if (drawing !== mine) return;
      drawing = 0;
      syncDrawButton();
    };

    if (typeof Worker !== 'function') {
      void drawHere(plan, context, mine)
        .catch((error) => {
          canvasNote.textContent = rasterFailure(error instanceof Error ? error.message : '');
        })
        .finally(finish);
      return;
    }

    if (!openPool()) {
      void drawHere(plan, context, mine)
        .catch((error) => {
          canvasNote.textContent = rasterFailure(error instanceof Error ? error.message : '');
        })
        .finally(finish);
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
      window.requestAnimationFrame(() => {
        flushQueued = false;
        flush();
      });
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
        canvasNote.textContent = fillNumbers(copy.canvasProgress, {
          done,
          total,
          running,
          waiting: queue.length,
        });
      });
    };

    const settleIfDone = (): void => {
      if (retire()) return;
      if (finished || queue.length > 0 || running > 0) return;
      finished = true;
      flush();
      complete = true;
      canvasNote.textContent = drawnNote(covered, performance.now() - started, pool.length);
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
          canvasNote.textContent = rasterFailure(message.message);
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
        void drawHere(plan, context, mine)
          .catch((error) => {
            canvasNote.textContent = rasterFailure(error instanceof Error ? error.message : '');
          })
          .finally(finish);
      };
      worker.postMessage({ kind: 'prepare', job: mine, module, plan } satisfies RasterRequest);
    }
    say();
  };

  const paintOutput = (): void => {
    const token = ++painted;
    // The three texts are emitted on every compile whichever tab is up; only the one the
    // text panel is showing is written into it, and the panel is repainted on a tab switch.
    if (!isTarget(view)) return;
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

  /** The one tab strip over the result column, and the panel and the controls each tab owns. */
  const tabs = [...root.querySelectorAll('[data-target]')].filter(
    (node): node is HTMLButtonElement => node instanceof HTMLButtonElement,
  );
  const resultPanel = root.querySelector('#pg-panel-result');
  const metas = [...root.querySelectorAll('[data-meta]')].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  /** Which of the three control groups in the tab row belongs to a view. */
  const metaFor = (next: View): string =>
    next === 'result' || next === 'reflection' || next === 'console' ? next : 'text';

  /** Shows one tab's panel and moves the selected state onto its tab. Nothing here compiles,
   *  emits or draws: every panel already holds what the last compile put in it, and the
   *  canvas keeps the pixels it was drawn with while it is behind another tab. */
  const selectView = (next: View, focus = false): void => {
    view = next;
    if (isTarget(next)) target = next;
    for (const tab of tabs) {
      const on = tab.dataset.target === next;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      // One roving tabindex, so Tab reaches the strip once and the arrows move inside it.
      tab.tabIndex = on ? 0 : -1;
      if (on) {
        if (isTarget(next)) output.setAttribute('aria-labelledby', tab.id);
        if (focus) tab.focus();
      }
    }
    if (resultPanel instanceof HTMLElement) resultPanel.hidden = next !== 'result';
    output.hidden = !isTarget(next);
    if (reflectionPane instanceof HTMLElement) reflectionPane.hidden = next !== 'reflection';
    if (consolePane instanceof HTMLElement) consolePane.hidden = next !== 'console';
    const wanted = metaFor(next);
    for (const meta of metas) meta.hidden = meta.dataset.meta !== wanted;
    if (isTarget(next)) paintOutput();
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
    code: String(diagnostic.code ?? ''),
    severity: diagnostic.severity,
    source: diagnostic.source,
    start: diagnostic.range.start,
    located: !inPrelude(diagnostic.range.start.line),
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
      if (row.located) button.append(el('span', 'at', toDisplayPosition(row.start)));
      button.append(
        el(
          'span',
          'source',
          ` ${row.source === 'typescript' ? copy.sourceTypescript : copy.sourceTypeshade}`,
        ),
      );
      button.append(el('span', row.severity === 'error' ? 'error' : undefined, ` ${row.message}`));
      if (row.located) button.addEventListener('click', () => goTo(row.start));
      else button.disabled = true;
      const item = el('li');
      item.append(button);
      // The code sits outside the button, since a link inside one is not a link.
      const code = errorLink(copy.errorsHref, row.code, 'diag-code');
      if (code) item.append(code);
      diagnosticsPane.append(item);
    }
  };

  /** Paints one analysis of the document: the markers, the list, the status, and the panes
   *  emitted from the module it lowered. Nothing here compiles. The worker did, and what
   *  arrived is data: diagnostics, and the IR when they allowed one. */
  const paintAnalysis = (analysis: Analysis): void => {
    if (!editor || !model || !monacoApi) return;
    output.textContent = '';
    diagnosticsPane.textContent = '';
    root.classList.remove('has-errors', 'has-output');

    const found = analysis.diagnostics;
    const rows = found.map(toRow);
    // The compiler stays quiet about a file with no directive, so the Playground says it.
    if (!analysis.hasDirective && rows.length === 0) {
      rows.push({
        message: copy.directive,
        code: 'TS8001',
        severity: 'error',
        source: 'typeshade',
        start: { line: 0, character: 0 },
        located: true,
      });
    }

    // One marker owner, fed from the service alone. Monaco's own TypeScript checking is off,
    // and TypeScript's diagnostics arrive from the service instead, under `source`; Monaco
    // prints that beside the code after the message, so the two halves read apart there the
    // way the list above tags them.
    monacoApi.editor.setModelMarkers(
      model,
      'typeshade',
      found
        .filter((diagnostic) => !inPrelude(diagnostic.range.start.line))
        .map((diagnostic) => ({
          ...toMonacoRange(diagnostic.range),
          message: diagnostic.message,
          source: diagnostic.source === 'typescript' ? copy.sourceTypescript : copy.sourceTypeshade,
          code: String(diagnostic.code),
          severity: markerSeverity(monacoApi, diagnostic.severity),
        })),
    );

    paintDiagnostics(rows);
    if (rows.some((row) => row.severity === 'error')) {
      status.textContent = copy.errors;
      root.classList.add('has-errors');
    } else {
      status.textContent = copy.ready;
    }

    // Reflection and the panes read the module the worker lowered. The worker sends none for
    // a file with no directive or one with an error, so those leave the panes empty, which is
    // what the service's own contract asks of an adapter: no compiled output past an error.
    compiled = undefined;
    reflection = undefined;
    entries = [];
    // The panes are emitted from the options bar instead of read off the compile, so the
    // bar is the one thing that decides what they hold. At its defaults the two agree:
    // `compile().wgsl` is `emitModule(module)`, which is `emitModuleAt(module, 'O2')`.
    const choice = currentChoice();
    if (analysis.module) {
      try {
        compiled = { module: analysis.module as ModuleDecl };
        // The same flavour the emit is given. The `float` helpers read an `_fp64` guard
        // texture the lowering injects and the `integer` ones read none, so a reflection
        // computed under the other flavour lists a binding the emitted module does not
        // declare, or leaves out one it does.
        reflection = reflect(compiled.module, { fp64Flavor: choice.fp64Flavor });
        entries = (reflection.entries ?? []) as readonly ReflectedEntry[];
      } catch {
        compiled = undefined;
        reflection = undefined;
        entries = [];
      }
    }

    // The bindings panel reads the new reflection first, keeping every value the reader set
    // for a binding that survived the edit, because the GLSL tabs spell an override the
    // reader moved as a `#define` of that value.
    bindings.update(reflection, compiled?.module);
    const glslOrWhy = compiled
      ? emitGlsl(
          compiled.module,
          choice,
          bindings.overridesMoved() ? bindings.constants() : undefined,
        )
      : undefined;
    const glsl = glslOrWhy && 'vertex' in glslOrWhy ? glslOrWhy : undefined;
    glslFailure = glslOrWhy && 'failed' in glslOrWhy ? glslOrWhy.failed : '';
    emitted = {
      wgsl: compiled ? emitWgsl(compiled.module, choice) : undefined,
      glslVertex: glsl?.vertex,
      glslFragment: glsl?.fragment,
    };
    if (emitted.wgsl) root.classList.add('has-output');
    paintOutput();
    paintReflection();
    // The canvas and the return values follow the source. The oracle's calls are
    // microseconds, so the return values are not worth a button press; the buttons re-run
    // with edited arguments and redraw. Only the engine the reader is looking at runs: a
    // rasteriser drawing a canvas nobody is shown is the page's own CPU for nothing.
    evaluateOnCpu();
    if (bindingsHost instanceof HTMLElement) bindings.render(bindingsHost);
    // A compute module has no rasteriser half, so the engine's canvases are set for it again.
    const cpu = engineIsCpu() && !isComputeModule();
    for (const node of cpuOnly) node.hidden = !cpu;
    const node = gpuCanvasNow();
    if (node) node.hidden = cpu;
    void runResult();
  };

  /** Hands the worker the document as the editor holds it now. Sent on every change, so the
   *  worker never answers a hover or a completion about text the editor has already left
   *  behind: storing the text costs the service nothing until something is asked. */
  const syncDocument = (): void => {
    if (!editor || !client) return;
    version += 1;
    root.dataset.version = String(version);
    const composed = compose(editor.getValue());
    preludeAt = composed.at;
    preludeLines = composed.lines;
    if (preludeNote instanceof HTMLElement) preludeNote.hidden = composed.lines === 0;
    client.update(documentUri, composed.text, version);
  };

  /** Asks the worker for the document's analysis and paints it when it arrives. A control on
   *  the options bar calls this too, and for that the last analysis is repainted at once,
   *  since the document has not changed. Debounced by the caller on an edit. */
  const render = (): void => {
    if (!editor || !model || !monacoApi) return;
    if (lastAnalysis && analysedVersion === version) {
      paintAnalysis(lastAnalysis);
      return;
    }
    if (!client) {
      serviceFailed();
      return;
    }
    const asked = version;
    status.textContent = analysedVersion < 0 ? copy.starting : copy.idle;
    void client.request('analysis', documentUri, asked, {}).then((analysis) => {
      if (!analysis || asked !== version) return;
      lastAnalysis = analysis;
      analysedVersion = asked;
      paintAnalysis(analysis);
    });
  };

  const publishSource = async (): Promise<void> => {
    if (!editor) return;
    writeHash('code', await encodeSource(editor.getValue()), currentChoice());
  };

  const flash = (button: HTMLButtonElement, word: string, back: string): void => {
    button.textContent = word;
    window.setTimeout(() => {
      button.textContent = back;
    }, 1400);
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

  /** Which example the editor was last filled from. On a page that names the example there
   *  is no picker to read it off, so the id is held here and Reset uses it. */
  let openedExample = root.dataset.defaultExample ?? '';

  const showExample = (id: string): void => {
    const example = examples.find((candidate) => candidate.id === id);
    if (!example || !editor) return;
    openedExample = example.id;
    if (examplePicker instanceof HTMLSelectElement) examplePicker.value = example.id;
    if (exampleNote instanceof HTMLElement) exampleNote.textContent = example.description;
    bindings.seed(example.defaults ?? {});
    editor.setValue(example.source);
    // The edit handler queued a render for the new text; this one is immediate, so that one
    // is dropped and the example is painted once.
    window.clearTimeout(timer);
    writeHash('example', example.id, currentChoice());
    render();
  };

  if (examplePicker instanceof HTMLSelectElement) {
    examplePicker.addEventListener('change', () => showExample(examplePicker.value));
  }

  const applyOptions = (): void => {
    levelNote.hidden = levelPicker.value === 'O2';
    numbersField.hidden = !minifyToggle.checked;
    render();
    // The bar is part of what a link shows, so changing it rewrites the fragment. An
    // untouched example keeps its short `#example=` form.
    const named = hashParams().get('example');
    if (named && !hashParams().get('code')) writeHash('example', named, currentChoice());
    else void publishSource();
  };
  for (const control of [
    levelPicker,
    parensPicker,
    precisionPicker,
    minifyToggle,
    numbersPicker,
    obfuscateToggle,
    fp64Picker,
  ]) {
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
      if (drawing !== 0) retirePool();
      job += 1;
      // The grid keeps the frame's 4:3, so a pixel of it is square on the page.
      canvas.width = side;
      canvas.height = Math.round((side * 3) / 4);
      const surface = canvas.getContext('2d');
      surface?.clearRect(0, 0, side, side);
      canvasFits = holdsItsPixels(canvas, surface);
      drawing = 0;
      syncDrawButton();
      if (canvasNote instanceof HTMLElement) {
        canvasNote.textContent = !moduleDrawable
          ? copy.canvasNeedsVertex
          : canvasFits
            ? copy.canvasIdle
            : copy.canvasTooBig;
      }
      if (moduleDrawable && canvasFits) drawOnCpu();
    });
  }

  if (enginePicker instanceof HTMLSelectElement) {
    enginePicker.addEventListener('change', () => {
      syncEngine();
      // The backend is part of what a link shows, the way the emit options are.
      const named = hashParams().get('example');
      if (named && !hashParams().get('code')) writeHash('example', named, currentChoice());
      else void publishSource();
    });
  }

  /** What the page opens with: the source in the link, else the example the link names, else
   *  the first example. */
  const openingSource = async (): Promise<{ source: string; example?: PlaygroundExample }> => {
    const params = hashParams();
    // The options come off the fragment before the first render, so the panes are painted
    // once, under the settings the link carried.
    const level = params.get('opt');
    if (level === 'O0' || level === 'O1' || level === 'O2') levelPicker.value = level;
    if (params.get('parens') === 'minimal') parensPicker.value = 'minimal';
    if (params.get('minify') === '1') minifyToggle.checked = true;
    const numbers = params.get('numbers');
    if (numbers === 'f32' || numbers === 'false') numbersPicker.value = numbers;
    if (params.get('obfuscate') === '1') obfuscateToggle.checked = true;
    if (params.get('fp64') === 'integer') fp64Picker.value = 'integer';
    if (params.get('precision') === 'mediump') precisionPicker.value = 'mediump';
    const backend = params.get('backend');
    if (
      enginePicker instanceof HTMLSelectElement &&
      (backend === 'webgpu' || backend === 'webgl2' || backend === 'cpu')
    ) {
      enginePicker.value = backend;
    }
    const code = params.get('code');
    if (code) {
      const source = await decodeSource(code);
      if (source !== undefined)
        return { source, example: examples.find((candidate) => candidate.source === source) };
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
      // And its providers are off too. The page registers one provider per service method
      // below, and the service answers for TypeScript's half as well as TypeShade's, so with
      // Monaco's own left on a hover would show two answers, `i: number` from its worker over
      // `i: u32` from the compiler. Off, the widget holds one. The language stays registered:
      // its tokenizer and bracket rules are what colour the text before the semantic tokens
      // arrive and what pair the braces.
      monaco.languages.typescript.typescriptDefaults.setModeConfiguration({
        completionItems: false,
        hovers: false,
        documentSymbols: false,
        definitions: false,
        references: false,
        documentHighlights: false,
        rename: false,
        diagnostics: false,
        documentRangeFormattingEdits: false,
        signatureHelp: false,
        onTypeFormattingEdits: false,
        codeActions: false,
        inlayHints: false,
      });
      defineTypeshadeThemes(monaco);

      // Colourising bakes the theme into the markup, so the pane is painted again on a change.
      followSiteTheme(monaco, paintOutput);
      if (opening.example) {
        openedExample = opening.example.id;
        bindings.seed(opening.example.defaults ?? {});
        if (examplePicker instanceof HTMLSelectElement) examplePicker.value = opening.example.id;
        if (exampleNote instanceof HTMLElement)
          exampleNote.textContent = opening.example.description;
      } else if (exampleNote instanceof HTMLElement) {
        exampleNote.textContent = '';
      }
      model = monaco.editor.createModel(
        opening.source,
        'typescript',
        monaco.Uri.parse(documentUri),
      );
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
        'semanticHighlighting.enabled': true,
      });

      // ── The providers, one per service method ─────────────────────────────────────────
      // Each asks the worker about the document at the version the editor holds and hands
      // back what it answers; the client resolves `undefined` for an answer about a version
      // the editor has left, and each provider turns that into nothing. Positions cross in
      // the four helpers at the top of this file and nowhere else.
      const isOurs = (currentModel: any): boolean =>
        currentModel.uri.toString() === model.uri.toString();
      const monacoRange = (range: TypeshadeRange) => {
        const r = toMonacoRange(range);
        return new monaco.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn);
      };
      const here = (position: MonacoPosition) => ({ position: toServicePosition(position) });

      monaco.languages.registerCompletionItemProvider('typescript', {
        triggerCharacters: ['@', '"', ':', '.'],
        provideCompletionItems: async (currentModel: any, position: MonacoPosition) => {
          if (!isOurs(currentModel) || !client) return { suggestions: [] };
          const items = await client.request('completions', documentUri, version, here(position));
          if (!items) return { suggestions: [] };
          const word = currentModel.getWordUntilPosition(position);
          const range = new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          );
          // Monaco's word does not include a leading `@`, so an attribute offered after one
          // has already been typed would insert it twice unless the item says otherwise.
          const before = currentModel.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: word.startColumn,
          });
          return {
            suggestions: items.map((item) => ({
              label: item.label,
              kind: completionKind(monaco, item.kind),
              insertText:
                item.insertText ??
                (item.label.startsWith('@') && before.endsWith('@')
                  ? item.label.slice(1)
                  : item.label),
              insertTextRules:
                item.insertTextFormat === 'snippet'
                  ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                  : undefined,
              detail: item.detail,
              documentation: item.documentation ? { value: item.documentation } : undefined,
              sortText: item.sortText,
              filterText: item.filterText,
              range: item.textEdit ? monacoRange(item.textEdit.range) : range,
            })),
          };
        },
      });

      monaco.languages.registerHoverProvider('typescript', {
        provideHover: async (currentModel: any, position: MonacoPosition) => {
          if (!isOurs(currentModel) || !client) return null;
          const hover = await client.request('hover', documentUri, version, here(position));
          if (!hover) return null;
          return { contents: [{ value: hover.contents }], range: monacoRange(hover.range) };
        },
      });

      // A location in another document is dropped: the Playground holds one file. So is one
      // inside the prelude, which the editor does not hold either.
      const ownLocations = (
        locations: readonly { uri: string; range: TypeshadeRange }[] | undefined,
      ) =>
        (locations ?? [])
          .filter(
            (location) => location.uri === documentUri && !inPrelude(location.range.start.line),
          )
          .map((location) => ({ uri: model.uri, range: monacoRange(location.range) }));

      monaco.languages.registerDefinitionProvider('typescript', {
        provideDefinition: async (currentModel: any, position: MonacoPosition) => {
          if (!isOurs(currentModel) || !client) return null;
          return ownLocations(
            await client.request('definition', documentUri, version, here(position)),
          );
        },
      });

      monaco.languages.registerReferenceProvider('typescript', {
        provideReferences: async (
          currentModel: any,
          position: MonacoPosition,
          context: { includeDeclaration: boolean },
        ) => {
          if (!isOurs(currentModel) || !client) return null;
          return ownLocations(
            await client.request('references', documentUri, version, {
              ...here(position),
              includeDeclaration: context.includeDeclaration,
            }),
          );
        },
      });

      const toDocumentSymbol = (symbol: TypeshadeDocumentSymbol): any => ({
        name: symbol.name,
        detail: symbol.detail ?? '',
        kind: symbolKind(monaco, symbol.kind),
        tags: [],
        range: monacoRange(symbol.range),
        selectionRange: monacoRange(symbol.selectionRange),
        children: symbol.children?.map(toDocumentSymbol),
      });
      monaco.languages.registerDocumentSymbolProvider('typescript', {
        provideDocumentSymbols: async (currentModel: any) => {
          if (!isOurs(currentModel) || !client) return null;
          const symbols = await client.request('symbols', documentUri, version, {});
          return symbols ? symbols.map(toDocumentSymbol) : null;
        },
      });

      monaco.languages.registerSignatureHelpProvider('typescript', {
        signatureHelpTriggerCharacters: ['(', ','],
        signatureHelpRetriggerCharacters: [','],
        provideSignatureHelp: async (currentModel: any, position: MonacoPosition) => {
          if (!isOurs(currentModel) || !client) return null;
          const help = await client.request('signatureHelp', documentUri, version, here(position));
          if (!help) return null;
          return {
            value: {
              signatures: help.signatures.map((signature) => ({
                label: signature.label,
                documentation: signature.documentation
                  ? { value: signature.documentation }
                  : undefined,
                parameters: signature.parameters.map((parameter) => ({
                  label: parameter.label,
                  documentation: parameter.documentation
                    ? { value: parameter.documentation }
                    : undefined,
                })),
              })),
              activeSignature: help.activeSignature,
              activeParameter: help.activeParameter,
            },
            dispose: () => {},
          };
        },
      });

      monaco.languages.registerRenameProvider('typescript', {
        resolveRenameLocation: async (currentModel: any, position: MonacoPosition) => {
          if (!isOurs(currentModel) || !client) return null;
          const prepared = await client.request(
            'prepareRename',
            documentUri,
            version,
            here(position),
          );
          return prepared
            ? { range: monacoRange(prepared.range), text: prepared.placeholder }
            : null;
        },
        provideRenameEdits: async (
          currentModel: any,
          position: MonacoPosition,
          newName: string,
        ) => {
          if (!isOurs(currentModel) || !client) return null;
          const edits = await client.request('rename', documentUri, version, {
            ...here(position),
            newName,
          });
          if (!edits) return null;
          // A name the prelude also declares would be renamed in there too, and the editor
          // holds none of those lines, so the edit has nowhere to land. The rename is
          // refused whole instead of applied to half the occurrences.
          if ((edits[documentUri] ?? []).some((edit) => inPrelude(edit.range.start.line)))
            return null;
          return {
            edits: (edits[documentUri] ?? []).map((edit) => ({
              resource: model.uri,
              textEdit: { range: monacoRange(edit.range), text: edit.newText },
              versionId: undefined,
            })),
          };
        },
      });

      // The colouring: the compiler's own classification of every token, delta-encoded the way
      // Monaco takes it. Monaco asks again after each edit and keeps the last tokens it was
      // given until then, so an answer dropped for being stale costs nothing but a moment.
      monaco.languages.registerDocumentSemanticTokensProvider('typescript', {
        getLegend: () => ({
          tokenTypes: [...SEMANTIC_TOKEN_TYPES],
          tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS],
        }),
        provideDocumentSemanticTokens: async (currentModel: any) => {
          if (!isOurs(currentModel) || !client) return null;
          const tokens = await client.request('semanticTokens', documentUri, version, {});
          if (!tokens) return null;
          // The compiler classified the composed text, so the prelude's tokens come back
          // too. They are dropped and the rest move up, since the encoding is a delta over
          // the lines the editor actually holds.
          const own = tokens
            .filter((token) => !inPrelude(token.line))
            .map((token) => ({ ...token, line: outOfDocument(token.line) }));
          return { data: encodeSemanticTokens(own) };
        },
        releaseDocumentSemanticTokens: () => {},
      });

      // The worker holds the document from the moment the model does.
      syncDocument();

      editor.onDidChangeModelContent((event: { isFlush?: boolean }) => {
        // A keystroke makes the still a picture of a file the editor no longer holds. Loading
        // an example is a flush and leaves it, so the example's own still covers its first frame.
        if (!event.isFlush) retireStill();
        syncDocument();
        window.clearTimeout(timer);
        timer = window.setTimeout(render, 350);
        window.clearTimeout(urlTimer);
        urlTimer = window.setTimeout(() => {
          void publishSource();
        }, 600);
      });
      run.addEventListener('click', render);
      if (runCpu instanceof HTMLButtonElement) runCpu.addEventListener('click', evaluateOnCpu);
      if (drawCpu instanceof HTMLButtonElement) {
        drawCpu.addEventListener('click', () => {
          if (drawing !== 0) stopDrawing();
          else drawOnCpu();
        });
      }
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectView((tab.dataset.target ?? 'result') as View));
        tab.addEventListener('keydown', (event) => {
          const steps: Record<string, number> = {
            ArrowRight: index + 1,
            ArrowLeft: index - 1,
            Home: 0,
            End: tabs.length - 1,
          };
          const next = steps[event.key];
          if (next === undefined) return;
          event.preventDefault();
          const moved = tabs[(next + tabs.length) % tabs.length];
          selectView((moved.dataset.target ?? 'result') as View, true);
        });
      });
      reset.addEventListener('click', () => {
        showExample(openedExample);
        editor.focus();
      });
      levelNote.hidden = levelPicker.value === 'O2';
      numbersField.hidden = !minifyToggle.checked;
      syncEngine();
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
