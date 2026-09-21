// English copy: the source text every translation follows. Every number comes from the
// build (src/lib/examples.ts). Inline links are written as [text](key), where key names a
// record in src/lib/links.ts; inline code is written in backticks. Rich.astro renders both.
import { API_CATEGORIES } from '../lib/api.ts'
import { exampleFile, facts, hero, quickStartFile, registryBlurbs } from '../lib/examples.ts'
import { shadeDescriptions, shadeTitles } from '../lib/shade-examples.ts'
import { guideSections } from '../lib/guide.ts'
import type { LinkKey } from '../lib/links.ts'
import { typedError } from '../lib/typed-error.ts'

const glsl = facts.glslTarget
const err = typedError()
const std = facts.layoutStandards[0]
const split = facts.splitLabels ?? ['f32', 'f64']

// A title and a description for every section of the authoring guide, keyed by the id the
// loader takes from its heading. English reads both off the section itself, so this map
// cannot drift from the file the pages are rendered from. Every section opens with a
// sentence that says what the reader can do after it; the loader takes that sentence as the
// description. The entries here replace the ones the loader had to cut short (a page
// description is plain text, so they carry no markdown code marks, the way describe() in
// src/lib/authoring.ts strips them from a derived one).
const written: Record<string, string> = {
  'your-first-shader': `After this page you have a two-entry shader module written in TypeScript, emitted as WGSL and as ${glsl}, and you know which call produced each string.`,
  'functions-and-entry-points': 'After this page you can declare a helper, call it from another function, write an entry point for any stage, and collect them in the module that carries them.',
  'emitting-and-reflection': 'After this page you can turn a module into WGSL, into both GLSL stages or into a fragment a host composes, and read the pipeline metadata a host binds from.',
  diagnostics: 'After this page you can read a coded error, branch on its code, get every failure in a module in one report, and print the TypeScript line an error came from.',
  'conditional-programs': 'After this page you can decide which of several programs to build from one source, tell when a variant is one constant instead, and hand the choice to the host.',
  'capabilities-extensions': 'After this page you can declare the GPU features a module needs, read what each costs on each target, and check a booted device against them before it emits.',
  'glsl-float-precision': 'After this page you know when to emit a GLSL stage at mediump, what that one option changes in the emitted source, and what it leaves alone.',
}
const sections: Record<string, { title: string; description: string }> = Object.fromEntries(
  guideSections
    .filter((s) => s.id !== 'overview')
    .map((s) => {
      const description = written[s.id] ?? s.description
      if (!description) throw new Error(`[guide] section '${s.id}' has no prose to describe it; write one in src/i18n/en.ts`)
      return [s.id, { title: s.title, description }]
    }),
)

// The reference's categories, named and described where the entries are read, so the index
// pages cannot drift from the categories the entries sit in. Korean writes its own.
const apiCategories: Record<string, { name: string; summary: string }> = Object.fromEntries(
  API_CATEGORIES.map((c) => [c.slug, { name: c.name, summary: c.summary }]),
)

// Two lists of copy carry a link as a key of src/lib/links.ts, so the locale prefix and the
// pinned commit stay in one place. The two functions are identities: the parameter types the
// list where it is written, so a key no record has is a type error here, before the page
// that renders it is built. ko.ts is typed against the same shapes.
interface NextLink {
  readonly linkKey: LinkKey
  readonly label: string
}
interface PathStep extends NextLink {
  readonly title: string
  readonly text: string
}
const nextLinks = (items: readonly NextLink[]): readonly NextLink[] => items
const pathSteps = (items: readonly PathStep[]): readonly PathStep[] => items

export const en = {
  lang: 'en',
  /** How this locale names itself, shown in the language switch of other locales. */
  name: 'English',
  skip: 'Skip to content',

  meta: {
    title: 'TypeShade: typed shaders in TypeScript for WebGPU and WebGL2',
    description: `Start a file with "use typeshade" and emit WGSL for WebGPU and ${glsl} for WebGL2. The same source runs on the CPU in f64, so its output can be checked.`,
    ogAlt: 'TypeShade: one shader source for WebGPU and WebGL2, with a rendered metaballs shader.',
  },

  nav: {
    /** The accessible name of the header's own navigation, which a screen reader reads out. */
    primary: 'Primary',
    guide: 'Guide',
    api: 'API',
    examples: 'Examples',
    github: 'GitHub',
    llms: 'llms.txt',
    languages: 'Languages',
    theme: 'Toggle dark mode',
    menu: 'Menu',
    search: 'Search',
    close: 'Close',
    /** Astro's dev server has no index; only a build writes dist/pagefind/. */
    searchUnavailable: 'Search is available on the built site',
    /** Pagefind's own UI strings. [SEARCH_TERM] and [COUNT] are its placeholders. */
    searchUi: {
      placeholder: 'Search',
      clear_search: 'Clear',
      load_more: 'Load more results',
      search_label: 'Search this site',
      filters_label: 'Filters',
      zero_results: 'No results for [SEARCH_TERM]',
      many_results: '[COUNT] results for [SEARCH_TERM]',
      one_result: '[COUNT] result for [SEARCH_TERM]',
      alt_search: 'No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM]',
      search_suggestion: 'No results for [SEARCH_TERM]. Try one of these searches:',
      searching: 'Searching for [SEARCH_TERM]',
    },
    version: 'Version',
    prerelease: `Pre-release; ${facts.nextVersion} is next`,
    releases: 'Releases',
    commit: 'Pinned commit',
    changelog: 'Changelog',
  },
  docs: {
    labels: {
      nav: {
        use: 'Use TypeShade',
        playground: 'Playground',
        language: 'Language',
        api: 'API',
        examples: 'Examples'
      },
      languageGuide: 'Language guide',
      internals: 'Compiler internals',
      concepts: 'TypeScript & WebGPU',
      languageService: 'Language service',
      playground: 'Playground',
      /** The sidebar's own group headings (src/lib/links.ts sidebar()). */
      sidebarGroups: {
        getStarted: 'Get started',
        language: 'Language',
        concepts: 'Concepts',
        examples: 'Examples',
        reference: 'Reference',
        project: 'Project',
      },
      conceptPages: {
        cpuAndGpu: 'CPU and GPU',
        pipeline: 'The pipeline',
        webgpuAndWebgl2: 'WebGPU and WebGL2',
        wgslAndGlsl: 'WGSL and GLSL'
      },
      topics: {
        types: 'Types',
        functions: 'Functions',
        controlFlow: 'Control flow',
        gpuTypes: 'GPU types',
        resources: 'Resources',
        stages: 'Shader stages'
      },
      /** The four construct-mapping pages, after the topics in the Language group. */
      mapping: {
        fromTypescript: 'From TypeScript',
        fromWgsl: 'From WGSL',
        fromGlsl: 'From GLSL',
        builtins: 'Builtin functions'
      }
    },
    introduction: 'Introduction',
    authoring: 'Authoring',
    project: 'Project',
    why: 'Why TypeShade',
    quickStart: 'Quick start',
    authoringGuide: 'Language guide',
    checks: 'Verification',
    examples: 'Examples',
    onThisPage: 'On this page',
    previous: 'Previous',
    next: 'Next',
    editPage: 'Edit this page',
    permalink: 'Link to heading',
    // The API reference: the words around a generated ApiEntry (src/lib/api-types.ts).
    api: {
      // Lengthened past the review's 45-character floor for a reference title (the SEO
      // review, onpage, title length); the description below is unaffected.
      title: 'TypeShade API reference: functions, types and interfaces',
      description: 'Every public export of TypeShade on its own page: syntax, parameters, return value, examples and which targets support it.',
      h1: 'API reference',
      intro: `Every export of the typeshade package, generated from the compiler at commit ${facts.pinnedCommit}. One page per function, type, interface and class.`,
      reference: 'Reference',
      breadcrumbs: 'Breadcrumbs',
      // The title names the export, its kind and its category, and grows a suffix only as
      // far as it fits under the 60-character limit check-seo.mjs enforces (the SEO review,
      // onpage, title length). 'clamp(): function in Builtins, TypeShade API reference'. A
      // short base (a short name in a short category) tried the two shortest suffixes first
      // and landed under the review's 45-character floor, so the longest suffix now leads.
      pageTitle: (heading: string, kind: string, category: string) => {
        const base = `${heading}: ${kind.toLowerCase()} in ${category}`
        const suffixes = [', TypeShade API reference for developers', ', TypeShade API reference', ', TypeShade API', ', TypeShade']
        const fitting = suffixes.find((suffix) => (base + suffix).length <= 60)
        return fitting ? base + fitting : base
      },
      categoryTitle: (name: string) => `${name}, a category in the TypeShade API reference`,
      categoryDescription: (name: string, summary: string) => `${name} in the TypeShade API reference. ${summary}`,
      pageDescription: (name: string, kind: string, category: string, summary: string) => {
        // 'interface' is the one kind that starts with a vowel, so the article follows the word.
        const k = kind.toLowerCase()
        return `${name}, ${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k} in ${category}. ${summary}`
      },
      kindLine: (kind: string, category: string) => `${kind} in ${category}`,
      note: `The signature, the description and the examples come from the compiler's own source at commit ${facts.pinnedCommit}.`,
      syntax: 'Syntax',
      parameters: 'Parameters',
      returnValue: 'Return value',
      exceptions: 'Exceptions',
      descriptionHeading: 'Description',
      examples: 'Examples',
      example: 'Example',
      targets: 'Targets',
      target: 'Target',
      supportHeading: 'Support',
      notes: 'Notes',
      constructor: 'Constructor',
      instanceProperties: 'Instance properties',
      instanceMethods: 'Instance methods',
      inGuide: 'In the guide',
      seeAlso: 'See also',
      source: 'Source',
      optional: 'optional',
      readonly: 'read only',
      deprecated: 'deprecated',
      previewNote: 'Template preview. The words on this page are a fixture; the compiler supplies the real ones.',
      line: (n: number) => `line ${n}`,
      atCommit: (sha: string) => `at commit ${sha}`,
      members: (n: number) => `${n} members`,
      kindMeta: 'Kind',
      kinds: { function: 'Function', constant: 'Constant', interface: 'Interface', type: 'Type', class: 'Class' },
      targetNames: { wgsl: 'WGSL (WebGPU)', glsl: `${glsl} (WebGL2)`, cpu: 'CPU oracle' },
      support: { native: 'Supported', emulated: 'Emulated', stub: 'Stub', none: 'Not supported', 'n/a': 'Does not apply' },
      categories: apiCategories,
    },
  },
  // The Playground at /playground/: the words around the Monaco editor and the WGSL the
  // compiler writes from what is typed into it. Monaco carries its own English inside the
  // editor box.
  playground: {
    h1: 'Playground',
    intro: 'Write a TypeShade TypeScript file, compile it in your browser, and inspect the generated WGSL and diagnostics.',
    fileName: 'hello.shade.ts',
    help: 'Author TypeShade in a Monaco editor and compile it here.',
    run: 'Compile',
    reset: 'Reset example',
    editor: 'TypeShade source',
    output: 'Compiler output',
    // One tab per file the compiler emits: the WGSL module, and the two GLSL ES 3.00 stages.
    wgslTab: 'WGSL',
    glslVertexTab: 'GLSL vertex',
    glslFragmentTab: 'GLSL fragment',
    noGlsl: 'This module emits no GLSL.',
    diagnostics: 'Diagnostics',
    idle: 'Ready to compile',
    ready: 'Compiled successfully',
    errors: 'Compile errors',
    loading: 'Loading editor…',
    clean: 'No diagnostics.',
    noOutput: 'No WGSL output.',
    directive: 'A file compiles once it starts with the "use typeshade" directive.',
    unavailable: 'The editor did not load. Check the connection and reload the page.',
    starting: 'Starting the language service…',
    serviceFailed: 'The language service stopped. Reload the page.',
    sourceTypescript: 'TypeScript',
    sourceTypeshade: 'TypeShade',
    // The reflection pane: what reflect() recovers from the compiled module, and what each
    // entry point returns when the CPU oracle runs it.
    reflection: 'Reflection',
    entryPoints: 'Entry points',
    resources: 'Resources',
    inputs: 'In',
    outputs: 'Out',
    returns: 'Returns',
    runCpu: 'Run on the CPU',
    running: 'Running',
    cpuIdle: 'Run the entry points to see the values they return.',
    noResources: 'This module binds no resources.',
    noEntryPoints: 'This module declares no entry point.',
    requiredFeatures: 'Required features',
    args: 'Arguments',
    argsInvalid: 'That argument is not a number or a list of numbers.',
    cpuNoResources: 'The CPU oracle takes entry arguments only, so an entry that reads a uniform or a storage binding cannot run here yet.',
    canvas: 'CPU canvas',
    draw: 'Draw on the CPU',
    stop: 'Stop',
    canvasIdle: 'Run the fragment entry once per pixel, with no GPU.',
    resolution: 'Resolution',
    canvasTooBig: 'This browser will not back a canvas this large, so nothing can be drawn at this resolution. Choose a smaller one.',
    canvasProgress: '{done}/{total} tiles, {running} running, {waiting} waiting',
    canvasDrawn: '{px} px in {ms} ms on {workers} worker(s)',
    canvasNeedsVertex: 'Drawing needs a vertex entry driven by vertex_index and a fragment entry. This module has no such pair, so there is no triangle to cover.',
    cpuFailed: 'The CPU oracle could not run this entry point.',
    entryCount: (n: number) => (n === 1 ? '1 entry point' : `${n} entry points`),
    // The example picker. Every example is one of the compiler's own .shade.ts files; the
    // names and the lines under them are the gallery's, in `examples.shade`, and the source
    // text comes from the vendored checkout at build time.
    exampleLabel: 'Example',
    copy: 'Copy',
    copied: 'Copied',
    share: 'Copy link',
    shared: 'Link copied',
    // The emit options the compiler takes, as controls over what the code tabs show.
    emit: {
      title: 'Emit options',
      optimization: 'WGSL optimization',
      levels: { O0: 'O0 (no passes)', O1: 'O1 (value-safe)', O2: 'O2 (default)' },
      parens: 'Parentheses',
      minify: 'Minify',
      precision: `${glsl} float precision`,
      levelNote: 'At O0 and O1 the compiler emits WGSL from the level alone, so parentheses and minify reach the GLSL tabs only.',
    },
  },

  footer: {
    docs: 'Documentation',
    project: 'Project',
    languages: 'Languages',
    readme: 'README',
    releases: 'Releases',
    npm: 'npm package',
    license: 'Released under the [MIT License](license).',
    copyright: `Copyright © ${facts.year} ${facts.author}`,
    builtFrom: 'Built from commit',
  },

  canvas: {
    /** Accessible names for a mounted shader, by what drew it. */
    aria: (title: string) => ({
      webgpu: `${title} shader, written in TypeScript and compiled by TypeShade to WGSL, running on WebGPU.`,
      webgl2: `${title} shader, written in TypeScript and compiled by TypeShade to ${glsl}, running on WebGL2.`,
      'still-webgpu': `${title} shader, written in TypeScript and compiled by TypeShade to WGSL, one frame drawn on WebGPU.`,
      'still-webgl2': `${title} shader, written in TypeScript and compiled by TypeShade to ${glsl}, one frame drawn on WebGL2.`,
      none: `${title} shader, written in TypeScript and compiled by TypeShade, rendered at build time.`,
    }),
  },

  /** The copy button Expressive Code puts on every code block (ec.config.mjs). */

  /** The chrome around a live example (src/components/LiveShader.astro). The sample's own
   *  code is not copy: it stays on the page that shows it, and so does its file name. */
  live: {
    file: 'live.shade.ts',
    edit: 'Edit',
    reset: 'Reset',
    editorAria: 'Editable shader source',
    loading: 'Loading the compiler',
    keptFrame: 'The canvas holds the last frame that compiled.',
    noFrame: 'The canvas could not run this program, so it is holding the last frame that ran.',
    /** Named for the reserved fields this sample declares, so the note describes the file
     *  above it. The list goes last, in code font, so no language has to bend a word around
     *  whichever name lands at the end. */
    reserved: (fields: string) => `Filled by the page every frame, with no control: ${fields}.`,
    mouseUnits: '`mouse` runs 0 to 1 over the canvas from the bottom left, the space `uv` is in.',
    backend: {
      webgpu: 'Running on WebGPU.',
      webgl2: `Running on WebGL2, from the emitted ${glsl}.`,
      none: `This browser has no WebGPU and no WebGL2, so the frame above was drawn at build time.`,
    },
    /** The line that introduces the list of things to try, under the controls. */
    exercisesP: 'Try the following, with the controls or by editing a line:',
    output: 'Emitted output',
    outputNote: 'The whole module the compiler saw. The page added the vertex entry and the `VsOut` struct it returns; the rest is the file above.',
    wgsl: 'WGSL',
    glslVertex: `${glsl} vertex`,
    glslFragment: `${glsl} fragment`,
    uniforms: 'Uniform block',
    field: 'Field',
    type: 'Type',
    offset: 'Offset',
    lineAt: 'line {line}',
    /** The names of a vector control's components, for its accessible name. */
    component: ['x', 'y', 'z', 'w'],
  },

  code: { copy: 'Copy to clipboard', copied: 'Copied' },

  install: { label: 'Submodule command' },
  diagnostic: {
    frameLabel: 'Shader with a misspelt field, typed-error-shader.ts',
    error: (code: number, line: number, column: number) => `error TS${code} at line ${line}, column ${column}:`,
    truncated: '(first line of a longer message)',
  },
  layout: {
    region: `Reflected ${std} layout`,
    caption: (size: number) => `reflect(), ${std}, ${size} bytes`,
    field: 'field',
    type: 'type',
    offset: 'offset',
    size: 'size',
  },
  codeLabels: {
    authored: `Authored fragment, ${hero.file}`,
    quickStartFile: 'The complete file, shader.ts',
    wgsl: 'The emitted WGSL fragment entry point',
    glsl: `The emitted ${glsl} fragment main`,
    print: "Printing an example's WGSL, GLSL and reflection",
    useTypeshade: 'hello.shade.ts',
  },

  front: {
    title: 'A shader language you write in TypeScript.',
    searchTitle: 'TypeShade',
    lede: `TypeShade is a language of its own, with TypeScript's syntax, types and editor. A file that starts with \`"use typeshade"\` emits WGSL for WebGPU and ${glsl} for WebGL2. ${facts.bothTargets} of the ${facts.examples} examples in the repository emit both from one file.`,
    playground: 'Open the Playground',
    quickStart: 'Quick start',
    stageAria: 'A shader running beside the file that draws it',
    first: {
      title: 'Warped bands',
      caption: 'The file on the left, drawn on the right. Edit a line or move a control and the picture follows.',
      warp: 'how much the bands bend',
      ink: 'first colour',
      paper: 'second colour',
    },
    targets: {
      h: 'One file, two targets',
      p: 'The compiler lowers `hello.shade.ts` to one intermediate representation and emits both targets from it. The file is the whole program; the pane beside it holds the WGSL and the GLSL ES 3.00 fragment a host hands to WebGPU or WebGL2, one tab each.',
      source: 'hello.shade.ts',
      wgsl: 'WGSL',
      glsl: `${glsl} fragment`,
    },
    gallery: {
      h: 'More shaders',
      p: `${facts.examples} examples ship with the compiler, from cartographic passes to a compute kernel. Each tile runs the emitted code in this browser.`,
      all: 'All examples',
      tile: (title: string) => ({
        neutral: `${title}, drawn at build time.`,
        webgpu: `${title}, running on WebGPU.`,
        webgl2: `${title}, running on WebGL2.`,
        none: `${title}, drawn at build time; this browser has no WebGPU or WebGL2.`,
        reduced: `${title}, one frame, since this system asks for less motion.`,
      }),
    },
    map: {
      h: 'What carries over from TypeScript',
      p: 'GPU code has three things: resources, value layouts and entry points. TypeShade gives each a place TypeScript already has, and keeps the rest of the language where it fits the GPU. The full rules are in the [language guide](guide).',
      rows: [
        ['"use typeshade"', 'The directive is the language boundary', 'It is the first statement of the file, where a JavaScript directive goes. A file without it does not compile as a shader; with it, everything under it is checked as TypeShade and lowered to the compiler\'s intermediate representation.'],
        ['f32, vec3, mat4, sin(x)', 'GPU types and builtins are globals', '`f32`, `vec3`, `mat4` and the builtins such as `sin` and `vec4(...)` need no import, and `Math.sin` and `Math.PI` are aliases of the same operations. The checker applies the shader rules to them in the editor, before any code is emitted.'],
        ['class VsIn { @location(0) uv: vec2 }', 'A type or a class is a value layout', 'Plain data is a `type` alias; a `class` carries per-field metadata such as `@location` and `@builtin`, and its fields lay out the struct both targets receive.'],
        ['new Circle(center, 0.3).coverage(p)', 'A class is a TypeScript class', 'Fields, a constructor and `new`, methods and static functions, `extends` with `super` and `abstract`, generic classes and functions, and the mixin pattern all compile. A method lowers to a function that takes the struct first, and a generic is compiled once per set of type arguments. The [gallery](examples) has a file for each of them.'],
        ['declare const u: uniform<Camera>', 'declare names a resource the host fills', '`uniform<T>` reads a uniform block, and `storage<T>` behind `declare let` is writable. There is no initializer: the host owns the slot, in the order the file declares them, and [`reflect()`](apiReflect) reports its layout.'],
        ['@fragment export function fs(v: VsOut): vec4', 'A decorated export is an entry point', '`@vertex`, `@fragment` and `@compute([64, 1, 1])` name the stage; a function without one is a helper. Stage inputs are explicit parameters, a `@builtin("vertex_index")` or a `@location`. There is no hidden global.'],
      ],
    },
    oracle: {
      h: 'Checked against the CPU',
      p: 'The same module runs on the CPU in f64, and [the test suite](checks) checks the compiler\'s algebra against it. Every emit is compiled on Tint and linked on WebGL2 on each push. Below, the gradient pass drawn by each backend from the same file.',
      webgpu: {
        neutral: 'The gradient pass, drawn at build time from the emitted WGSL.',
        webgpu: 'The gradient pass, drawn by WebGPU from the emitted WGSL.',
        webgl2: 'The gradient pass, drawn by WebGL2; this browser has no WebGPU.',
        none: 'The gradient pass, drawn at build time; this browser has no WebGPU or WebGL2.',
      },
      webgl2: {
        neutral: `The gradient pass, drawn at build time from the emitted ${glsl}.`,
        webgpu: `The gradient pass, drawn by WebGL2 from the emitted ${glsl}.`,
        webgl2: `The gradient pass, drawn by WebGL2 from the emitted ${glsl}.`,
        none: 'The gradient pass, drawn at build time; this browser has no WebGL2.',
      },
    },
    install: {
      h: 'Install',
      p: `Pre-release: ${facts.nextVersion} is not on npm yet. Add the repository as a git submodule and import from it; the [quick start](quickStart) walks through the first file.`,
    },
  },
  quickStart: {
    host: {
      hostH: 'Connect it to the host application',
      boundaryH: 'The TypeShade / host boundary',
      nextLearnH: 'What to learn next',
      p0: 'A file that starts with `"use typeshade"` is a shader compilation unit. The example below is the TypeShade authoring surface.',
      boundaryP: 'TypeShade source is authored with TypeScript syntax, but a file marked with `"use typeshade"` follows the shader language rules. TypeScript types and syntax form the authoring surface; TypeShade GPU types, resources and shader-stage rules define the shader semantics.',
      boundaryBullets: [
        '`"use typeshade"` declares the language boundary.',
        'GPU entry inputs are explicit parameters such as `@builtin(...)`, not hidden globals.',
        'Resource types such as `uniform<T>` and `storage<T>` express GPU resource semantics.'
      ],
      hostWgslLabel: 'Where the host consumes WGSL',
      hostP1: 'TypeShade is not the rendering runtime. Write and compile the shader in TypeScript, then let the host application pass the generated WGSL or GLSL ES 3.00 source to WebGPU or WebGL2.',
      hostP2: 'TypeShade owns the language semantics and shader emission. The host owns runtime objects and their lifetimes, including the device, pipeline, bind groups, buffers, textures and command encoders.',
      nextLearnP: 'Now connect familiar TypeScript concepts to their TypeShade GPU meaning.',
      nextLinks: nextLinks([
        { linkKey: 'languageTypes', label: 'Types: value shapes and GPU structs' },
        { linkKey: 'languageFunctions', label: 'Functions: helpers and entry points' },
        { linkKey: 'languageControlFlow', label: 'Control flow: GPU execution' },
        { linkKey: 'languageGpuTypes', label: 'GPU types: scalars, vectors, matrices and arrays' },
        { linkKey: 'languageResources', label: 'Resources: uniform and storage' },
        { linkKey: 'languageStages', label: 'Shader stages: compute, vertex and fragment' }
      ]),
      nextLearnAllLink: 'Read the full Language Guide'
    },
    title: 'Use TypeShade: install and write your first shader',
    description: 'Add TypeShade as a git submodule and compile a file that starts with "use typeshade", with a note on the pre-release status.',
    h1: 'Use TypeShade',
    installH: 'Install',
      p0: 'Start with a TypeScript file whose first statement is `"use typeshade"`. That directive crosses the boundary into the TypeShade shader language; the example below is a complete first shader, written with a class and stage-decorated functions.',
      p1: `TypeShade also has a function-based authoring surface: the same pass declared with [\`fn\`](apiFn) and [\`module()\`](apiModule) instead of classes, ${quickStartFile.lines} lines from the import line to a call that emits WGSL:`,
      p2: 'Running it emits WGSL for both stages. Here is the fragment entry point:',
      p3: `The ${glsl} stage for the same function, and the uniform layout [\`reflect()\`](apiReflect) recovers for it, are on the [examples page](examples). The [language guide](guide) covers the rest of the surface.`,
    live: {
      h: 'Live example',
      p: '`sin` turns the x coordinate into a wave, and `time` scrolls it. That is the whole file below, and it runs here: edit a line and the canvas follows on the next keystroke.',
      title: 'Sine stripes',
      caption: 'A sine wave across the canvas, mixed between two colours.',
      anchor:
        '`bands` is how many times the wave repeats between the left edge and the right, and `time` slides the pattern along. Every column holds one colour, because only `uv.x` reaches `phase`.',
      exercises: [
        'Drag `bands` to the bottom of its range for a single wave, then to the top and watch the crests narrow to lines.',
        'Change `uv.x` to `uv.y` on the `phase` line. The stripes lie down, because `uv` runs up the canvas as well as across it.',
        'Add `speed: f32` to `Uniforms`, then multiply `u.time` by `u.speed` on the `phase` line. A slider named `speed` appears under the canvas, and `struct Uniforms` under Emitted output grows a field: the controls and the WGSL are both read from the module the compiler just built.',
      ],
      bands: 'waves across the canvas',
      low: 'trough colour',
      high: 'crest colour',
    },
    status: {
      h: 'Status',
      p: `Pre-release. The repository is at version ${facts.mirrorVersion}; ${facts.nextVersion} is the release the npm name [typeshade](npm) is reserved for, and the manifest and the imports are renamed at that tag. Until then this is a mirror: the import above resolves at \`${quickStartFile.importPath}\`, inside the submodule itself. Issues are welcome; pull requests cannot be merged yet, because changes land upstream and this tree is fast-forwarded from there. [Watch releases](releases) to hear about ${facts.nextVersion}.`,
    },
  },

  motivation: {
    use: {
      title: 'What is TypeShade?',
      description: 'Learn TypeShade as a shader language: start from TypeScript concepts, cross the use typeshade boundary, and compile to host-ready GPU code.',
      h1: 'A shader language that starts in TypeScript',
      sections: [
        ['What does TypeShade change?', 'TypeShade is not a runtime that executes ordinary TypeScript on the GPU. It starts from familiar TypeScript syntax and tooling, then interprets the file as a separate shader language with its own types and semantics.'],
        ['`use typeshade` is the language boundary', 'The file-level `"use typeshade"` directive declares a TypeShade program. Once present, the compiler applies TypeShade shader semantics instead of treating the file as ordinary application code. Understanding this line is the first step to understanding the language.'],
        ['What stays familiar from TypeScript?', 'Functions, type annotations, modules, expressions and control flow form the familiar authoring surface. That does not mean every TypeScript feature is available unchanged. TypeShade deliberately constrains features that do not map cleanly to the GPU execution model and reports those constraints statically.'],
        ['Where does TypeScript end and TypeShade begin?', 'TypeScript describes general-purpose program types and execution. TypeShade additionally describes GPU values, vectors and matrices, resources, entry points, target capabilities and shader-specific restrictions. A familiar `function` or `if` still has to make sense for the target GPU program.'],
        ['What does the compiler produce?', 'TypeShade source is lowered to one intermediate representation and then emitted as host-consumable shader source. The current targets are WGSL for WebGPU and GLSL ES 3.00 for WebGL2. There is no TypeShade runtime to ship with the application.'],
        ['Where should you go next?', 'Start with Quick start and make one real `"use typeshade"` file. Then use the Language guide to learn types, values and expressions, functions, control flow and GPU semantics. Move to Verification and the API reference once you know the authoring model.']
      ],
      familiarH: 'Your TypeScript knowledge is the starting point',
      familiarP: 'TypeShade keeps familiar language concepts, then makes the GPU-specific differences explicit instead of hiding them in generated shader strings.',
      rows: [
        ['Functions', 'Declarations and calls', 'Shader functions and entry-point rules are added.'],
        ['Types', 'Annotations and inference', 'GPU-native values plus vector and matrix types are added.'],
        ['Modules', 'import / export', 'Shader compilation-unit and emit rules apply.'],
        ['Control flow', 'if / for and related syntax', 'The program must satisfy GPU execution and target constraints.'],
        ['Execution', 'JavaScript runtime', 'The host executes generated code through WebGPU or WebGL2.']
      ],
      furtherH: 'Keep the TypeScript and JavaScript references nearby',
      furtherP: 'TypeShade documentation focuses on what is different. When a TypeScript or JavaScript concept is new to you, use the language references below as the background layer.',
      further: [
        ['TypeScript Handbook — Everyday Types', 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', 'Types, annotations, unions and other everyday TypeScript concepts'],
        ['TypeScript Handbook — Functions', 'https://www.typescriptlang.org/docs/handbook/2/functions.html', 'Function declarations, parameters, return types and calls'],
        ['MDN — JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'The JavaScript background for expressions, control flow, functions and modules']
      ],
      columns: ['Concept', 'Familiar from TypeScript', 'What TypeShade adds']
    },
    title: 'Why one shader source for WebGPU and WebGL2, TypeShade',
    description: `Why TypeShade emits WGSL and ${glsl} from one typed TypeScript module: what maintaining two shader languages costs, with the Khronos survey figures.`,
    h1: 'Why TypeShade',
    sections: [
      {
        h: 'Two copies of every shader',
        p: 'A shader that has to run on WebGL2 and on WebGPU exists twice. The two languages disagree about types, entry points, resource binding and precision, so the second copy is a rewrite. A fix that lands in one copy and misses the other only shows up on the machines that take the other path, and a reviewer has to read two dialects to decide whether they still mean the same thing.',
      },
      {
        h: 'The move to WebGPU',
        p: 'The web is in the middle of one such move. The [MapLibre graphics modernization roadmap](maplibreRoadmap), the [deck.gl WebGPU guide](deckglWebgpu) and the [PixiJS v8 migration guide](pixijsMigration) each describe a WebGPU path arriving beside an existing WebGL one, so a custom layer written as GLSL will need a WGSL copy.',
      },
      {
        h: 'What the survey says',
        p: `In the [${facts.survey.title}](survey), ${facts.survey.figure64}% of the ${facts.survey.n}+ shader developers surveyed adapt shaders across platforms, APIs or tools, and nearly ${facts.survey.figure10}% describe it as a significant engineering cost or one of their largest.`,
      },
      {
        h: 'What TypeShade does',
        p: 'The official surface is a TypeScript file that starts with \`"use typeshade"\`. A misspelt field or a wrong-typed return is caught in the editor; one intermediate representation emits both languages; and the same source compiles to a CPU function in double precision, so what a backend produces can be checked against a reference computed from the same source. [Verification](checks) says what runs on every push. The graph API remains for the gallery.',
      },
      {
        h: 'What it does not do',
        p: 'TypeShade has no renderer and no scene graph. It returns strings and reflection metadata; creating pipelines, binding resources and issuing draws stay with the host. SPIR-V, MSL and HLSL come out of naga or Tint, fed the WGSL, because every native host already reaches WGSL through Dawn or wgpu.',
      },
    ],
  },

  checks: {
    title: 'How TypeShade is checked: oracle, compile gate, goldens',
    description: "What TypeShade's CI runs on every push: a CPU oracle in f64, a compile gate on Tint and a real WebGL2 context, and golden files for every emit.",
    h1: 'Verification',
    ciH: 'On every push',
    intro: "The repository's CI runs these on every push and pull request, in [the CI workflow](ciGates):",
    items: [
      'The same module compiles to a CPU function that runs in f64 arithmetic. In its default mode only its equality tests round to f32 first, so they agree with the GPU; an f32 mode that rounds after every operation is opt-in. The test suite checks that function against known answers and against a second CPU backend, generated JavaScript, which must match it bit for bit. It says nothing about what rounding does on a driver, and no GPU output is compared against it in this repository. [src/core/oracle.ts](oracle)',
      `The compile gate emits every registered example, hands each WGSL emit to Tint inside headless Chromium, and compiles and links both ${glsl} stages of every renderable example on a real WebGL2 context. It also hands each compiler a shader that cannot compile: if either accepts that non-program, the gate fails and the verdicts on the examples do not count. [scripts/compile-gate.ts](compileGate)`,
      'Golden files hold the emitted bytes of every example, so any change in a backend surfaces as a diff in review. [emit-goldens.test.ts](goldens)',
    ],
    pairH: 'The same pass on both backends',
    pairIntro: 'The gradient pass from the front page, drawn once by each backend. No pixel comparison between the two is committed yet.',
    gpuFrame: {
      neutral: 'Drawn on WebGPU at build time, from the compiled WGSL.',
      webgpu: 'Drawn here on WebGPU, from the compiled WGSL.',
      webgl2: `WebGPU is not available here, so this frame was drawn on WebGL2 from the compiled ${glsl}.`,
      none: 'Drawn on WebGPU at build time, from the compiled WGSL. This browser has no WebGPU or WebGL2.',
    },
    glFrame: {
      neutral: `Drawn on WebGL2 at build time, from the compiled ${glsl}.`,
      webgpu: 'Drawn here on WebGPU, from the compiled WGSL.',
      webgl2: `Drawn here on WebGL2, from the compiled ${glsl}.`,
      none: `Drawn on WebGL2 at build time, from the compiled ${glsl}. This browser has no WebGPU or WebGL2.`,
    },
    authorTime: {
      h: 'At author time',
      p: 'The uniform block is declared once, and every field read is typed against that declaration. Misspell one and TypeScript says so in the editor, before a string reaches a GPU.',
      caption: `The wrong read on line ${err.wrongLine}, the diagnostic it produces, and the ${std} layout [\`reflect()\`](apiReflect) recovers for the block it reads from: ${err.layout.size} bytes over ${err.layout.fields.length} fields. The gap after the first field is alignment.`,
    },
  },

  /** The bridge page at /guide/typescript-and-webgpu/. Rendered by
   *  src/components/pages/ConceptsPage.astro; the shader sample is not copy, so it stays there. */
  concepts: {
    title: 'TypeScript and WebGPU concepts',
    description: 'How TypeScript types, functions and modules map to TypeShade GPU values, entry points and shader modules, and where WebGPU begins.',
    h1: 'TypeScript and WebGPU concepts',
    lead: 'TypeShade starts from TypeScript authoring and adds GPU-specific semantics. This page connects the concepts you already know to the concepts you need to write shaders.',
    startH: 'Start with a TypeScript file',
    startP: '`"use typeshade"` marks the file as a TypeShade compilation unit. The rest of the program still uses familiar TypeScript-shaped constructs: functions, parameters, return types, objects, imports and exports.',
    modelH: 'The mental model',
    adds: 'TypeShade adds',
    model: [
      ['TypeScript types', 'Type annotations describe values and make incorrect programs visible to tooling.', 'GPU value types such as `f32`, `u32`, `vec2`, `vec3` and `vec4`, plus rules for shader operations.'],
      ['Functions', 'A function has parameters, a return type and a body.', 'Stage decorators such as `@vertex` and `@fragment` to identify entry points.'],
      ['Modules', '`import` and `export` define reusable program boundaries.', 'Shader-module constraints so the compiler can lower the reachable program to GPU code.'],
      ['Web APIs', 'The host application owns devices, pipelines, buffers and rendering.', 'Shader source and reflection metadata; it does not replace the WebGPU or WebGL host API.'],
    ],
    fitH: 'Where WebGPU fits',
    fitP: 'Think of TypeShade as the authoring and compilation layer above the browser graphics API. TypeShade produces shader code; the application still creates a `GPUDevice`, configures a pipeline, binds resources and submits work.',
    fitLinks: [
      ['TypeScript documentation ↗', 'https://www.typescriptlang.org/docs/'],
      ['MDN WebGPU API ↗', 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'],
      ['MDN JavaScript directives ↗', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode'],
    ],
    playgroundLink: 'Try it in the Playground →',
    orderH: 'Learn in this order',
    orderItems: [
      'Learn the TypeScript shape: types, functions and modules.',
      'Add `"use typeshade"` and learn the GPU types.',
      'Add entry-point decorators and resource declarations.',
      'Use the Playground to see diagnostics and generated WGSL while you edit.',
      'Only then move into compiler and backend details.',
    ],

    /** The four pages under /guide/concepts/, the learning path from what a TypeScript
     *  developer knows to what a shader needs. Each is a component in src/components/pages
     *  and a one-line route file in src/pages/guide/concepts/. */
    cpuAndGpu: {
      title: 'CPU and GPU execution',
      description: 'What the GPU hands one invocation, why a shader has no heap, no strings and no recursion, and which TypeShade rule follows from each of those facts.',
      h1: 'CPU and GPU',
      lead: 'A TypeShade file is TypeScript to your editor and a GPU program to the compiler. The restrictions the language guide states are not house style. Each one follows from something the hardware does, so this page gives the fact first and the rule after it.',
      invocationH: 'Invocations',
      invocationP: 'A TypeScript function runs once when you call it. An entry point is called by the GPU instead, once for every vertex in a draw, once for every fragment a primitive covers, and once for every work item in a dispatch. Those runs happen beside each other and cannot read each other. Nothing outside the function tells one of them which one it is.',
      invocationRule: 'What follows: a stage decorator says which of the three is calling, and a `@builtin(...)` parameter is how an invocation learns its own place in the work. [Shader stages](languageStages) states the decorators and [Functions](languageFunctions) states the parameters.',
      memoryH: 'Memory',
      memoryP: 'An invocation works in registers and in the buffers and textures the host bound before the draw. There is no heap under it, so a shader has nothing to allocate from, no array that can grow and no string to build. A class in a TypeShade file describes the bytes of a GPU struct, and the host writes those bytes.',
      memoryRule: 'What follows: `new` builds nothing, a field decorator carries layout, and every resource arrives through `declare`. [Types](languageTypes) states the struct surface and [Resources](languageResources) states the declarations.',
      callsH: 'Calls',
      callsP: 'A shader has no call stack to return through, and the call graph is flattened before a driver sees it. A function that calls itself, directly or through another function, leaves the compiler with nothing to flatten.',
      callsRule: 'What follows: recursion is rejected, and a helper is an ordinary function the compiler can follow to its leaves. [Functions](languageFunctions) states what a call may be.',
      loopsH: 'Loops',
      loopsP: 'The invocations of a stage move through a loop together, and the ones that leave early wait for the rest. A bound the compiler can read is what keeps that wait knowable, and it is also what lets a backend unroll the body when the target asks for it.',
      loopsRule: 'What follows: a loop counts over a value the compiler already holds. [Control flow](languageControlFlow) states which conditions and loops compile.',
      typesH: 'Value types',
      typesP: 'A GPU register has a width and a layout, fixed when the shader is compiled. A variable therefore holds one value type from its declaration to the end of its scope, with no union of two value types and nothing at run time that could choose between them.',
      typesRule: 'What follows: every value carries a written GPU type such as `f32`, `u32` or `vec4`. [Types](languageTypes) states the type surface and [GPU types](languageGpuTypes) states the values.',
      tableH: 'Facts and rules',
      tableP: 'The facts above with the rule each produces, and the page of the language guide that states it.',
      tableColumns: ['What the GPU does', 'What TypeShade asks for', 'Stated in'],
      tableRows: [
        ['Calls an entry point once per vertex, fragment or work item', 'A stage decorator on the entry point and a parameter for every builtin input', '[Shader stages](languageStages)'],
        ['Gives an invocation registers and bound resources, with no heap under them', 'No `new`, no growing array and no string; a class is a layout and a resource is a `declare`', '[Resources](languageResources)'],
        ['Runs without a call stack', 'A call graph the compiler can flatten, so no recursion', '[Functions](languageFunctions)'],
        ['Moves the invocations of a stage through a loop together', 'A loop bound the compiler can read', '[Control flow](languageControlFlow)'],
        ['Holds a value of one width in a register', 'One value type per variable, written out', '[GPU types](languageGpuTypes)']
      ],
      furtherH: 'Further reading',
      furtherItems: [
        '[WGSL specification](specWgsl) writes down the execution model these facts come from, including what an invocation is and what it may hold.',
        '[MDN WebGPU API](mdnWebgpu) is the browser side of the same model, written for a JavaScript developer.'
      ],
      nextP: 'Next in this path: [The pipeline](conceptsPipeline), which says what each stage is handed and what it produces.'
    },

    pipeline: {
      title: 'The shader pipeline',
      description: 'What a vertex stage, a fragment stage and a compute stage are each handed, what each produces, and how an entry point signature maps onto them.',
      h1: 'The pipeline',
      lead: 'A shader never runs on its own. It sits at one of the fixed points of a GPU pipeline, and that point decides what the entry point is handed and what it has to give back. This page describes the points TypeShade emits for, and leaves the syntax to the language guide.',
      stagesH: 'Stages',
      stagesP: 'Each row is one stage of the pipeline the host set up.',
      stagesColumns: ['Stage', 'What it is handed', 'What it produces'],
      stagesRows: [
        ['Vertex', 'One vertex of the draw: its index in the draw, and the fields the host laid out in the vertex buffers.', 'A clip-space position, and the values the fragment stage will read.'],
        ['Fragment', 'The values the vertex stage produced, weighed for this fragment, and the fragment’s own position.', 'A value for each colour attachment the pipeline declares.'],
        ['Compute', 'Its own place in the dispatch grid, and the resources the host bound.', 'Nothing given back; a compute entry writes through the resources it holds.']
      ],
      entryH: 'Entry points',
      entryP: 'The signature of an entry point is that stage interface written out. A `@builtin(...)` parameter is a value the stage hands the invocation, such as the vertex index or the fragment position. A struct parameter is per-vertex input in a vertex stage and a weighed value in a fragment stage. The return type is what the stage gives back to the pipeline, so a vertex entry returns a position and a fragment entry returns colour. [Shader stages](languageStages) has the decorators and the spellings; this page stays with the meaning.',
      entryNote: 'Reading a signature therefore tells you which stage the function belongs to, what the pipeline has to supply, and what the pipeline receives.',
      interpolationH: 'Interpolation',
      interpolationP: 'Between the vertex stage and the fragment stage the rasterizer works out which fragments a primitive covers. For each of them it weighs the values the vertices produced by how near the fragment lies to each vertex, and hands the fragment stage the result. A vertex entry writes a value per vertex and a fragment entry reads a value per fragment, so the two are different values with the same name.',
      interpolationNote: '`@interpolate` on a field chooses the weighting, and a field that has to arrive unweighed says so in the same place. [Types](languageTypes) states the field decorators.',
      computeH: 'Compute',
      computeP: 'A compute stage has no rasterizer in front of it and no attachment behind it. The host dispatches a grid of work items, the entry point reads its own coordinates in that grid from a builtin parameter, and everything it produces goes through a storage resource. [Resources](languageResources) states how a writable resource is declared.',
      furtherH: 'Further reading',
      furtherItems: [
        '[WebGPU specification](specWebgpu) defines the render and compute pipelines these stages belong to.',
        '[MDN GPURenderPipeline](mdnRenderPipeline) and [MDN GPUComputePassEncoder](mdnComputePass) show the host code that drives them.'
      ],
      nextP: 'Next in this path: [WebGPU and WebGL2](conceptsWebgpu), which divides the work between the host application and the compiler.'
    },

    webgpuAndWebgl2: {
      title: 'WebGPU and WebGL2',
      description: 'What the host application owns, what TypeShade owns, how the compiler’s reflection feeds a bind group layout, and where WebGL2 differs.',
      h1: 'WebGPU and WebGL2',
      lead: 'TypeShade produces shader text and the data a host needs in order to bind resources to it. The rest of the GPU side belongs to the application: the device, the pipelines, the bind groups, the buffers and the textures. Knowing which side owns what is most of what a first TypeShade program needs.',
      ownsH: 'Ownership',
      ownsP: 'One row per object a WebGPU application creates.',
      ownsColumns: ['Object', 'What the application does', 'What TypeShade contributes'],
      ownsRows: [
        ['Device', 'Asks for an adapter and a `GPUDevice`, and keeps them for the life of the page.', 'Nothing. No TypeShade code touches a WebGPU object.'],
        ['Pipeline', 'Creates a render or compute pipeline and names an entry point for each stage.', 'The shader text of the module, and the name of every entry point in it.'],
        ['Bind group layout', 'Describes each binding by its group, its index, its kind and the stages that see it.', 'That same description, read back from the compiled module by `reflect()`.'],
        ['Buffer', 'Allocates the buffer and writes the bytes into it.', 'The offset, the size and the type of every field of a uniform struct.'],
        ['Texture and sampler', 'Creates them and puts them in a bind group.', 'The binding the shader declares and the type it expects to find there.']
      ],
      reflectionH: 'Reflection',
      reflectionP: `\`reflect()\` reads a compiled module and returns its bindings: the group and index the shader declared, the address space, the access the shader needs, and for a uniform struct the fields with their offsets and sizes under the ${facts.layoutStandards.join(' and ')} layouts. A host builds its bind group layout entries out of that list and packs its uniform buffer from those offsets. The numbers the shader was compiled with are the numbers the host writes, so the two sides stay in step.`,
      reflectionNote: 'A field renamed in the shader changes the reflection at the next build, and the host code that reads the reflection follows it.',
      runtimeH: 'No runtime',
      runtimeP: `The compiler runs where the shader text is produced: in a build, in a test, or in an editor through the [language service](languageService). What reaches the browser is the emitted shader source and the host code the application already had. TypeShade installs ${facts.runtimeDeps} runtime dependency, TypeScript, which the language service compiles source with and no core subpath asks for, and there is no TypeShade object to create at startup and none to keep alive.`,
      webgl2H: 'Where WebGL2 differs',
      webgl2P: 'The same source compiles for WebGL2, and the host side of it looks different.',
      webgl2Items: [
        'There are no bind groups. A uniform block is bound to a binding point on the linked program and a sampler is set through its uniform location, so a host uses the same reflection in a different shape.',
        `There is no compute stage. A module with a \`@compute\` entry emits WGSL and refuses to emit ${facts.glslTarget}.`,
        `Precision belongs to the source. Every emitted ${facts.glslTarget} program declares its default precision above its declarations, which WGSL has no need of.`,
        'A GPU feature is turned on twice: the host asks the context for the extension and the emitted source declares it. [Compiler internals](internals) describes how the compiler splits those halves.'
      ],
      furtherH: 'Further reading',
      furtherItems: [
        '[MDN WebGPU API](mdnWebgpu) and [MDN GPUBindGroupLayout](mdnBindGroupLayout) are the host objects this page names.',
        '[MDN WebGL2RenderingContext](mdnWebgl2) is the older context, with the uniform and sampler calls the WebGL2 path uses.',
        '[WebGPU specification](specWebgpu) and the [WebGL2 specification](specWebgl2) define the two host APIs.'
      ],
      nextP: 'Next in this path: [WGSL and GLSL](conceptsWgsl), which prints what one source compiles to on both targets.'
    },

    wgslAndGlsl: {
      title: `WGSL and ${facts.glslTarget}`,
      description: `The two shader languages one TypeShade source compiles to, the emitted text for one small shader, and where the targets differ.`,
      h1: `WGSL and ${facts.glslTarget}`,
      lead: `One \`"use typeshade"\` file reaches WebGPU as WGSL and WebGL2 as ${facts.glslTarget}. The blocks on this page are compiled while the page is built, from the file above them, by the compiler pinned at ${facts.pinnedCommit}.`,
      sourceH: 'The source',
      sourceP: 'A triangle, with a vertex entry that places it and a fragment entry that colours it. The two structs give each stage its output shape.',
      sourceLabel: 'hello.shade.ts',
      wgslH: 'WGSL',
      wgslP: 'WGSL is the language a WebGPU device accepts, and one module holds every stage. The structs survive as structs, each entry point keeps its stage attribute, and the builtin input stays an attribute on the parameter that receives it.',
      wgslLabel: 'The emitted WGSL module',
      glslH: `${facts.glslTarget}`,
      glslP: `A WebGL2 program is linked from one vertex shader and one fragment shader, so the compiler emits a separate program for each stage. Each one opens with its version line and its default precision, the vertex index arrives under the name the language reserves for it, and the fragment output becomes a declared out variable.`,
      glslVertexLabel: `The emitted ${facts.glslTarget} vertex shader`,
      glslFragmentLabel: `The emitted ${facts.glslTarget} fragment shader`,
      diffH: 'Where the targets differ',
      diffP: 'Each difference is named by the page of the guide that handles it.',
      diffColumns: ['What differs', 'WGSL', `${facts.glslTarget}`],
      diffRows: [
        ['[Compute stages](languageStages)', 'A `@compute` entry emits a compute shader carrying its workgroup size.', 'The target has no compute stage, so a module that declares one emits WGSL alone.'],
        ['[Precision](languageGpuTypes)', 'A type carries its own width, so the program declares nothing.', 'The program opens with a default precision for floating-point and integer values.'],
        ['[Builtin inputs](languageStages)', 'A builtin stays an attribute on the parameter that receives it.', 'A builtin becomes the name the language reserves for it, and the parameter goes away.'],
        ['[Stage outputs](languageTypes)', 'A stage returns a struct whose fields carry their locations.', 'A stage writes to declared out variables, and the position goes to the reserved one.'],
        ['[Extensions](internals)', 'A GPU feature is turned on by a declaration at the top of the module.', 'A GPU feature is turned on by a preprocessor line, and the host asks the context for the matching extension.']
      ],
      furtherH: 'Further reading',
      furtherItems: [
        '[WGSL specification](specWgsl) defines the first of the two targets.',
        `[${facts.glslTarget} specification](specGlslEs) and the [WebGL2 specification](specWebgl2) define the second.`,
        '[MDN WebGPU API](mdnWebgpu) and [MDN WebGL2RenderingContext](mdnWebgl2) show how a host hands each of them to a driver.'
      ],
      nextP: 'Next: [Examples](examples), where every example in the compiler’s registry names the targets it emits.'
    },
  },

  /** The language service page at /guide/language-service/, rendered by
   *  src/components/pages/LanguageServicePage.astro. The TypeScript sample is not copy, so it stays there. */
  languageService: {
    title: 'TypeShade language service for editors and language servers',
    description: 'The editor-neutral layer behind the Playground: TypeScript and TypeShade diagnostics, completions, hover, rename and compiled output from one document API.',
    h1: 'Language service',
    intro: "The language service is the layer between the compiler's front end and an editor. It takes text and positions and returns data, and it touches no DOM or Node API. The Playground reads its diagnostics, completions and hover from it today, through the Monaco editor, and a language server for VS Code and other editors will read the same layer later, so the two cannot drift apart.",
    layersH: 'Layers',
    layersP: `The front end parses a \`"use typeshade"\` file, checks its types, structs and bindings, and reports diagnostics with source positions. The language service sits on top of the front end and of the TypeScript language service, which runs over an ambient declaration of the TypeShade globals, and answers requests about documents it holds by \`uri\`. Adapters sit above it and do nothing semantic: the Playground's Monaco adapter converts coordinates and owns the editor's markers, and an LSP server would carry the same answers over JSON-RPC. A judgement about TypeShade belongs in the service; an adapter converts.`,
    requestsH: 'Requests',
    requestsP: 'One document API answers the requests an editor makes.',
    requests: [
      ['Diagnostics', 'TypeScript and TypeShade diagnostics in one list. Each carries a `source` of `typeshade` or `typescript` and a code, so an adapter can tell the two apart, and a TypeScript parse error appears once, under its TypeScript code.'],
      ['Completions', 'The symbols in scope, the keywords, and TypeShade items where the context calls for them: attribute names after `@`, builtin input names inside `@builtin("`, GPU type names in a type position, and snippets for vectors and entry functions.'],
      ['Hover', 'Quick info for a symbol, with the TypeShade type name where TypeScript would say `number`, and documentation for GPU types, attributes and builtin inputs.'],
      ['Signature help', 'The signatures of the function under the cursor and the parameter being typed.'],
      ['Definition and references', 'Where a symbol is declared and where it is used, across the documents the service holds.'],
      ['Document symbols', 'The functions, structs, fields and resources of a document as an outline, with an entry function labelled by its stage.'],
      ['Rename', 'The edits that rename a symbol in every document that uses it, after a check that the position can be renamed at all.'],
      ['Semantic tokens', 'The tokens in document order, with GPU types, entry functions, resources and the names inside `@builtin(...)` marked as such.'],
      ['Compiled output', 'The WGSL or GLSL a document compiles to, on demand for an output pane. Diagnostics produce no shader text, so a keystroke does not run a backend.'],
    ],
    documentsH: 'Documents and positions',
    documentsP1: "Import `createTypeshadeLanguageService` from the `typeshade/language-service` subpath and open a document by `uri` with its text and an optional version. Update it with the whole text on each change and close it when the editor does; every other method takes the `uri` and, where it applies, a position. Nothing in the service is asynchronous, and a result for a stale version is the adapter's to drop.",
    documentsP2: "Positions are zero-based line and character pairs, with the character counted in UTF-16 code units, and a range is half-open with its end exclusive. These are the conventions LSP uses, so a language server passes them through field for field. Monaco counts from one, so the Playground's adapter adds one on its own side and takes it off on the way back; that adapter is the only place the two coordinate systems meet.",
    packagingH: 'Packaging',
    packagingP: 'The service is the one part of the package that needs `typescript`, which is an optional peer dependency: a program that imports only the compiler installs nothing extra, and one that imports `typeshade/language-service` supplies its own copy.',
    exampleH: 'Example',
    exampleP: 'A host opens one document, asks for its diagnostics and for the hover at a position, and compiles it for an output pane.',
    furtherH: 'Further reading',
    furtherP: "The [Playground](playground) is the service at work in a browser. The [design document](languageServiceDesign) in the compiler's repository, at the pinned commit, records the conventions, the adapter contracts and the order of work.",
  },

  examples: {
    path: {
      h: 'Learn TypeShade by building',
      p: 'Each step connects one Language Guide concept to actually writing a shader.',
      steps: pathSteps([
        {
          title: '1. First shader',
          text: 'Start with the shape of a "use typeshade" file and its shader entries.',
          label: 'Quick start',
          linkKey: 'quickStart'
        },
        {
          title: '2. Values and types',
          text: 'See how TypeScript type aliases and classes become GPU value layouts.',
          label: 'Types',
          linkKey: 'languageTypes'
        },
        {
          title: '3. Compose functions',
          text: 'Combine helper functions with stage entries to build shader calculations.',
          label: 'Functions',
          linkKey: 'languageFunctions'
        },
        {
          title: '4. GPU data',
          text: 'Connect vectors, matrices, arrays, and host-owned shader resources.',
          label: 'Resources',
          linkKey: 'languageResources'
        },
        {
          title: '5. Real examples',
          text: 'Read the repository examples and combine the language pieces into complete shaders.',
          label: 'Source examples',
          linkKey: 'examplesDir'
        }
      ])
    },
    title: `TypeShade examples: ${facts.totalExamples} shaders, GLSL emit, emulated f64`,
    description: `The ${facts.totalExamples} TypeShade examples, the ${glsl} emit of the gradient pass, and a deep-zoom demo of emulated double precision.`,
    h1: 'Examples',
    intro: `There are ${facts.totalExamples} runnable examples in the repository, written on the two authoring surfaces. ${facts.examples} are built with the \`fn()\` builder and cover cartographic passes, the ShaderToy-era screen-space effects, the emulated-double tier and a compute kernel; ${facts.fp64Examples} of those use emulated double precision. The builder's are exported from [examples/index.ts](examplesIndex); browse [the examples directory](examplesDir).`,
    categories: { cartographic: 'Cartographic', generic: 'Screen space', compute: 'Compute' },
    columns: { example: 'Example', category: 'Category', blurb: 'Description' },
    tableCaption: `${facts.bothTargets} of the ${facts.examples} examples below emit WGSL and ${glsl}. ${facts.wgslOnlyExample.title} has no vertex or fragment stage to emit as ${glsl}, so it is marked WGSL only; its WebGL2 path is the opt-in emulation.`,
    wgslOnly: 'WGSL only',
    /** A tile whose example has nothing the page can draw shows Ant's Empty mark and this
     *  line instead of a bare grey frame. */
    noStill: 'No picture: this example is not one the page can draw.',
    /** The Description column, one line per example, keyed by the registry's id. English
     *  takes the compiler's own wording; a translation writes the same lines in its language. */
    blurbs: registryBlurbs(),
    /** The other corpus: one TypeScript file per example, compiled from the file itself.
     *  Grouped by the part of TypeScript each file is there to show, because the compiler
     *  files them all under one category and a reader looking for inheritance wants them
     *  apart. The titles and the lines under them are the registry's own words in English;
     *  a translation writes its own against the same keys. */
    shade: {
      h: 'Written as TypeScript source',
      p: `${facts.shadeExamples} more examples in the same directory are TypeScript files that open with \`"use typeshade"\`, compiled by \`compile()\` from the file's own bytes. Each one is there for one part of the language, and they are grouped here that way. ${facts.shadeRenderable} have a ${glsl} form and carry a picture; the others emit WGSL alone.`,
      groups: {
        stages: 'Stages and IO structs',
        resources: 'Resources',
        values: 'Values and control flow',
        classes: 'Classes and generics',
        compute: 'Module state and compute',
        twins: 'Source twins',
      },
      titles: shadeTitles(),
      descriptions: shadeDescriptions(),
    },
    printIntro: 'From a checkout of the repository, the first command prints WGSL, GLSL and reflection for every example; the second does one by id.',
    glsl: {
      h: `The gradient pass in ${glsl}`,
      p1: `The front page shows a file that starts with \`"use typeshade"\`. The gallery pass \`${hero.file}\` still emits this ${glsl} \`main\`:`,
      p2: `The whole module is ${hero.emit.wgslLines} lines of WGSL; the GLSL vertex stage is ${hero.emit.glslVertexLines} lines and the fragment stage ${hero.emit.glslFragmentLines}. Uniform types, byte offsets, bind-group entries and entry signatures come from [\`reflect()\`](apiReflect), which reads the same intermediate representation and stays off the emit path, so a host can pack its uniform buffer from that layout. [Verification](checks) shows the reflected layout of a uniform block beside the diagnostic for a misspelt field.`,
    },
    f64: {
      h: 'Emulated double precision',
      p1: `Neither WGSL nor ${glsl} has a double-precision float. TypeShade emulates one as an unevaluated pair of f32 values, and lowers arithmetic, comparisons and a set of builtins into calls on that pair. An operation outside that set fails at emit with a coded error. What you write is unchanged: only the declared type differs. In the deep-zoom example the \`${facts.deepZoomOrigin.name}\` field is declared \`${facts.deepZoomOrigin.sourceType}\` in the source and occupies a \`${facts.deepZoomOrigin.layoutType}\` slot in the uniform block, which the host fills with the split pair.`,
      p2: 'A module that does f64 arithmetic also carries an injected guard texture binding for the host to fill with a single white texel. A downstream shader compiler cannot fold a texel read, and without one it is free to optimise the error-compensation terms away. Each operation costs several times its f32 equivalent, so the type is opted into per value. The example is [fp64-deep-zoom.ts](deepZoom).',
      caption: `One world coordinate drawn twice: ${split[0]} on the left, ${split[1]} on the right. The ${split[0]} half draws the stripes as steps because one ${split[0]} ulp at this distance is coarser than the fraction a stripe needs; the other half draws them smooth.`,
      captionNone: 'Rendered at build time; this browser has no WebGPU or WebGL2.',
    },
  },

  guide: {
    title: 'TypeShade authoring guide: writing shaders in TypeScript',
    description: 'The authoring surface of TypeShade, section by section: values, control flow, layouts, diagnostics, emulated f64, production emit and migrating a GLSL shader.',
    contents: 'Contents',
    /** A section's page title, from the title in `sections`. */
    sectionTitle: (title: string) => `${title}, TypeShade authoring guide`,
    /** Every section with a page of its own: what the sidebar, the h1 and the title show. */
    sections,
    /** Quick reference has no prose to open a section with, just its table: the heading
     *  src/lib/remark-promote-bold-leads.mjs adds in front of it, so the page still has one. */
    referenceTableHeading: 'Reference table',
    note: `Rendered from [AUTHORING.md](guideSource) at commit ${facts.pinnedCommit}. The package is imported here by its ${facts.nextVersion} name, \`typeshade\`.`,
    noteUntranslated: `Rendered from [AUTHORING.md](guideSource) at commit ${facts.pinnedCommit}. The package is imported here by its ${facts.nextVersion} name, \`typeshade\`.`,
  },

  // The language guide: src/components/pages/LanguagePage.astro and the Language*Page.astro topic pages.
  language: {
    overview: {
      title: 'TypeShade language guide',
      description: 'A progressive guide to TypeShade syntax and GPU semantics for TypeScript developers, with examples and concept mapping.',
      h1: 'TypeShade language guide',
      intro: 'Do not learn TypeShade as a list of syntax forms. Start from TypeScript concepts you already know, then learn what changes when the same idea must execute on a GPU. Each topic moves from syntax to meaning, a small example, and a real shader use.',
      boundaryH: '1. Start with `use typeshade`',
      boundaryP: '`"use typeshade"` is a language boundary, not just a string literal. Inside the file, TypeScript-like authoring is combined with TypeShade rules for types, resources, stages and builtin inputs.',
      boundaryNote: 'The first directive tells you that this file is not interpreted as an ordinary TypeScript module.',
      syntaxH: '2. TypeScript syntax is the starting point',
      syntaxP: 'Variables, functions, type aliases, classes, conditionals and loops provide a familiar authoring surface. A shader does not execute like a JavaScript program, though. A construct has TypeShade meaning only when the compiler can lower its values and operations to GPU code.',
      syntaxTableHeader1: 'TypeScript concept',
      syntaxTableHeader3: 'What changes',
      syntaxTableRows: [
        ['function', 'helper / entry', 'The body must be GPU-lowerable.'],
        ['type', 'GPU value shape', 'The shape is checked against GPU value semantics.'],
        ['class', 'GPU struct', 'It describes data layout, not a runtime object.'],
        ['if / for', 'GPU control flow', 'Only flow that compiles to GPU execution, not the whole JavaScript runtime.']
      ],
      gpuH: '3. GPU concepts stay visible in the source',
      gpuP: 'TypeShade makes the GPU interface explicit. Resources use `declare`, stages use decorated top-level functions, and builtin inputs are declared as `@builtin(...)` parameters.',
      gpuNote: 'The shader does not create `camera` or `pixels`. `gid` is not injected as a global either; it is declared as an input to the function.',
      functionH: '4. Functions describe value flow',
      functionP: 'As in TypeScript, parameters and return types describe a function contract. TypeShade adds shader-specific meaning through stages and builtin inputs.',
      functionNote: '`addBias` is a reusable helper; `paint` is a compute entry. They share function syntax but have different roles in the pipeline.',
      resourceH: '5. Resources form the host boundary',
      resourceP: '`uniform<T>` and `storage<T>` are GPU resources supplied by the host, not JavaScript objects created by the shader. `declare` records that ownership boundary in source.',
      resourceNote: '`const` and `let` are not just local-variable style here; they participate in the resource access model.',
      stageH: '6. Entry functions start a pipeline stage',
      stageP: '`@vertex`, `@fragment` and `@compute` declare which shader stage owns an entry function. Builtins are explicit parameters instead of automatically injected globals.',
      completeH: '7. Put the pieces together',
      completeP: 'Read the following example from top to bottom. The language directive, GPU struct, resources, compute stage and builtin parameter form one explicit program contract.',
      tsH: '8. What TypeScript gives you, and what changes',
      tsRows: [
        ['`declare`', '`declare` describes host-provided GPU resources.'],
        ['function parameter', 'GPU value or explicit stage builtin input.'],
        ['class', 'GPU struct and field metadata.'],
        ['number', 'Use explicit GPU numeric types such as `f32`, `i32`, `u32`.']
      ],
      tsNote: 'TypeShade is therefore not a copy of TypeScript syntax. It connects the TypeScript authoring experience to a GPU language model.',
      refsH: '9. Further reading',
      refsP: 'When learning a TypeShade concept, read the matching TypeScript type or function documentation, check the JavaScript execution model, and then connect it to the GPU concept.',
      nextH: '10. Learning path',
      nextP: 'Build a first file in Quick start, then expand through Types, Functions, Control flow, GPU types, Resources and Shader stages, in that order.',
      nextLink: 'Quick start'
    },
    topics: {
      types: {
        title: 'TypeShade types',
        description: 'How TypeScript type and class concepts map to TypeShade GPU values, structs and field layout.',
        h1: 'Types: from TypeScript types to GPU values',
        intro: 'TypeShade starts from TypeScript’s type surface, but the final meaning is a GPU value model. Learn the TypeScript idea first: structural typing and type aliases describe value shape. When GPU layout metadata is required, use classes and field decorators.',
        ts: 'Start from the TypeScript concept',
        tsP: 'A type alias gives a name to a value shape. TypeShade keeps that surface, while shader semantics determine which types and expressions are valid in a shader.',
        alias: '1. Use type aliases for plain data',
        aliasP: 'When fields do not need decorators, a type alias is the smallest representation. It is also useful when the same GPU value shape is shared across helper parameters and return values.',
        struct: '2. A class is a GPU struct',
        structP: 'A TypeShade class is not a JavaScript runtime object. It is an authoring surface for a GPU struct and its field metadata.',
        attrs: '3. Field decorators describe layout',
        attrsP: 'The current surface supports `@location`, `@builtin`, `@align`, `@size`, `@offset`, `@interpolate`, and `@ignore` on class fields. These decorators carry shader layout meaning, not ordinary JavaScript object metadata.',
        boundary: '4. Where TypeScript classes stop',
        boundaryItems: ['Do not construct GPU structs with `new`.', 'Do not use `extends` as a GPU inheritance model.', 'Do not make shader entry points class methods.', 'Prefer a type alias when field metadata is unnecessary.'],
        mapping: '5. Concept mapping',
        mappingRows: [['TypeScript', 'TypeShade'], ['type alias / object shape', 'GPU value shape'], ['class fields', 'GPU struct fields'], ['decorator metadata', 'GPU layout / stage metadata'], ['runtime object', 'not applicable'], ['structural compatibility', 'applies within shader type checking']],
        example: '6. Connect the type to an entry point',
        exampleP: 'After defining a struct, use it as an entry point parameter. The value shape and field metadata then define the meaning of that shader input.',
        next: 'Next: Functions'
      },
      functions: {
        title: 'TypeShade functions',
        description: 'A detailed guide to TypeShade functions: TypeScript-style parameters and returns, helpers, shader entries, stages and explicit builtins.',
        h1: 'Functions: from TypeScript functions to GPU functions',
        intro: 'Functions are the basic unit for naming computation and making inputs and outputs explicit. TypeShade keeps the TypeScript function shape, but every function in a `"use typeshade"` file must describe computation that can be lowered to GPU IR.',
        anatomy: '1. Anatomy of a function',
        anatomyP: 'A function has a name, parameter list, return type and body. TypeShade keeps that familiar structure while giving parameters and return values GPU semantics.',
        anatomyNote: 'Here <code>value</code> is the input parameter, <code>f32</code> is the GPU type of both the input and result, and <code>return</code> produces the value for the caller.',
        params: '2. Parameters and return types',
        paramsP: 'A parameter is an input to the function and the return type describes the shape of its result. Types are part of compilation: they tell the compiler which values and operations are valid.',
        paramsTable: [['Part', 'Role'], ['`a`, `b`', 'GPU input values.'], ['`amount: f32`', 'A scalar input whose type participates in expression checking.'], ['`: vec4`', 'The GPU value shape returned to the caller.']],
        helper: '3. Helper functions',
        helperP: 'A top-level function without a stage decorator is a helper. Helpers let you name repeated calculations and keep shader entries focused on pipeline inputs, resources and outputs.',
        helperNote: 'A helper has no stage decorator because it is not a pipeline entry. This keeps reusable math separate from the pipeline interface.',
        call: '4. Calling a function',
        callP: 'A call looks like an ordinary TypeScript call, but its callee and arguments must stay inside the TypeShade GPU type model. Do not treat the shader as a place to call arbitrary JavaScript APIs.',
        callNote: 'The call looks like a normal function call, but both the argument and the result of `addBias` must be values supported by the TypeShade GPU model.',
        entry: '5. Shader entry functions',
        entryP: 'A pipeline entry is declared as a top-level `export function` with a stage decorator. `@compute`, `@vertex` and `@fragment` attach the function to a GPU execution stage.',
        entryNote: '`export` keeps the familiar module surface and exposes the function to the compiler as an entry candidate. The stage decorator adds the GPU-specific stage information.',
        builtin: '6. Builtins are parameters',
        builtinP: 'GPU-provided stage inputs are explicit function parameters, not hidden global variables. Reading the signature tells you exactly which external inputs the entry expects.',
        builtinTable: [['Form', 'Meaning'], ['`@builtin("global_invocation_id")`', 'Selects the GPU-provided compute input.'], ['`gid: vec3u`', 'The TypeShade type and local name for that input.'], ['`gid.x`', 'Reads the x component for the current invocation.']],
        compute: '7. Reading a compute entry',
        computeP: '`@compute([64, 1, 1])` declares the workgroup size. `gid` is a parameter receiving the `global_invocation_id` builtin, and `gid.x` reads the current invocation’s x coordinate.',
        computeNote: 'When reading this function, first identify the stage and workgroup size, then inspect the parameters for external GPU inputs, and finally follow the body’s calculation.',
        graphics: '8. Vertex and fragment entries',
        graphicsP: 'Graphics stages use the same function model. The decorator selects the stage, while parameters and the return type describe the pipeline interface.',
        graphicsNote: 'The vertex function has two different inputs: `vid` is a GPU builtin and `vin` is a user-defined struct. The fragment function makes its builtin input, `pid`, explicit as well, so the signature documents the stage interface.',
        scope: '9. Functions and scope',
        scopeP: 'Local variables belong to the current function invocation. Keep them conceptually separate from resources and builtin inputs supplied by the shader interface.',
        scopeNote: '`factor` is a local value scoped to the function. Resources such as `camera` and `pixels` belong to the host-facing shader interface, while builtin parameters are inputs supplied by the GPU stage.',
        boundary: '10. Where TypeScript functions stop',
        boundaryItems: ['Do not call arbitrary JavaScript runtime APIs.', 'Do not assume dynamic object creation or general runtime side effects can become shader computation.', 'Entry points are top-level exported functions, not class methods.', 'Builtins are explicit parameters, not implicit globals.', 'Parameters and return types must have valid GPU value semantics.'],
        example: '11. From a small helper to a real entry',
        exampleP: 'The example below keeps reusable math in a helper and lets the entry connect the builtin input and resources.',
        exampleNote: 'The important distinction is the boundary: `addBias` is reusable computation, while `paint` connects the stage, builtin input and resources to an actual GPU invocation.',
        next: 'Next: Control flow'
      },
      controlFlow: {
        title: 'TypeShade control flow',
        description: 'How familiar TypeScript conditionals and loops map to the TypeShade GPU execution model.',
        h1: 'Control flow: familiar syntax, explicit GPU execution',
        intro: 'TypeShade uses familiar TypeScript conditional and loop syntax, but the code executes on the GPU. Understand control flow in terms of compilable computation, not the full dynamic behavior of the JavaScript runtime.',
        ts: '1. Start from the TypeScript control-flow model',
        tsP: 'Syntax such as if/else and for is familiar, but every condition and loop in TypeShade must be lowerable to GPU code. Matching syntax does not imply that all JavaScript runtime semantics are available.',
        branch: '2. Branching',
        branchP: 'Use if/else to express calculation paths. Inside a branch, keep values and resources within the TypeShade GPU model.',
        loop: '3. Loops',
        loopP: 'Use loops in forms the compiler can lower to GPU code. Avoid JavaScript patterns that dynamically change execution structure from runtime objects or array methods.',
        boundary: '4. Where JavaScript control flow stops',
        boundaryItems: ['Do not use dynamic array methods to determine execution length.', 'Do not rely on closures or general runtime objects.', 'Keep conditions and loop ranges based on GPU-compilable values.', 'A control-flow pattern valid in TypeScript is not automatically valid under TypeShade shader semantics.'],
        next: 'Next: GPU types'
      },
      gpuTypes: {
        title: 'TypeShade GPU types',
        description: 'How TypeScript type syntax maps to TypeShade scalar, vector, matrix and array GPU values.',
        h1: 'GPU types: from TypeScript syntax to GPU values',
        intro: 'TypeShade uses TypeScript syntax but does not inherit every JavaScript runtime value type as a shader value. This page focuses on the values that are actually represented and computed on the GPU.',
        mapping: '1. TypeScript types and GPU types',
        mappingP: 'Instead of treating a broad runtime type such as `number` as a shader value, TypeShade uses explicit GPU representations such as `f32`, `i32` and `u32`. `vec*` and `mat*` are GPU arithmetic values, not JavaScript objects.',
        scalar: '2. Scalars',
        scalarP: 'Single numeric values are represented as GPU scalar types and can be used in resource and struct field declarations.',
        vector: '3. Vectors',
        vectorP: 'vec2, vec3 and vec4 group scalar values into a GPU value. They are common in shader calculations and stage inputs.',
        matrix: '4. Matrices',
        matrixP: 'Types such as mat4 represent GPU arithmetic values used for transforms. They are not JavaScript objects.',
        arrays: '5. Arrays',
        arraysP: 'array represents a sequence of GPU values. Combined with a resource element type, it describes the shape of host-provided buffer data.',
        live: '6. Live example',
        liveP: 'The entry below names a GPU type on every line: `vec2` for the position, `f32` for the distance and the radius, `vec3` for the colour.',
        liveTitle: 'Disc',
        liveCaption: 'A disc placed by a vec2, sized by an f32 and coloured by a vec3.',
        liveAnchor:
          '`d` is the distance from the pixel to the rim of the disc: negative inside it, 0 on the rim, positive outside. `edge` turns that one `f32` into a mask, and `mix` reads the mask to pick a colour.',
        liveExercises: [
          'Change `vec2(ratio, 1.)` to `vec2(1., 1.)` on the `p` line. The disc stretches into an ellipse: `ratio` was scaling the x component alone, which is what a `vec2` lets you do.',
          'Replace the `return` line with `return vec4(vec3(fract(d * 10.)), 1.)`. The rings that appear are `d` itself, and `vec3` spreads that one `f32` across the three colour channels.',
          'Swap `length(p)` for `max(abs(p.x), abs(p.y))` and the disc becomes a square, or for `abs(p.x) + abs(p.y)` and it becomes a diamond. Then write the `f32` for a shape of your own.',
        ],
        liveCenter: 'centre, in uv space',
        liveRadius: 'radius, in uv units',
        liveTint: 'disc colour',
        next: 'Next: Resources'
      },
      resources: {
        title: 'TypeShade resources',
        description: 'Map TypeScript declaration concepts to TypeShade uniform and storage resources, access modes and the host binding contract.',
        h1: 'Resources: from TypeScript declarations to GPU resources',
        intro: 'A TypeShade resource is a host-filled binding slot, not a JavaScript object owned by the shader. Product code makes that boundary explicit with `declare`.',
        mapping: '1. Map the TypeScript declaration model',
        mappingP: 'Just as TypeScript `declare` describes a value at the type level without creating a runtime value, TypeShade `declare` describes a GPU resource supplied by the host. TypeShade additionally uses `uniform<T>` and `storage<T>` to express GPU memory semantics.',
        decl: '2. Declare resources with `declare`',
        declP: 'Declare the resource type and access mode without an initializer.',
        access: '3. const and let express access',
        accessP: 'Uniform resources are read-only and therefore use `declare const`. Storage resources are read-only with `const` and read-write with `let`.',
        slots: '4. Resource slots are a host contract',
        slotsP: 'Resource slots follow declaration order in the file. Keep binding details as part of the compiler/host reflection contract instead of scattering binding numbers through shader code.',
        invalid: '5. Common mistakes',
        invalidItems: [
          'Do not declare `declare const x: f32`; a resource needs a space such as `uniform<T>` or `storage<T>`.',
          'Do not use `declare let x: uniform<T>`.',
          'Do not assign to a read-only resource.',
          'Do not model a resource as a class or bind-group instance.'
        ],
        next: 'Next: Shader stages'
      },
      stages: {
        title: 'TypeShade shader stages',
        description: 'Map TypeScript function and module concepts to compute, vertex and fragment entry points with explicit builtins in TypeShade.',
        h1: 'Shader stages: explicit GPU entry points',
        intro: 'TypeShade entry points are top-level exported functions. A decorator marks the shader stage and any stage-specific metadata.',
        mapping: '1. Start from TypeScript functions and modules',
        mappingP: 'In TypeScript, `export function` makes a function part of a module’s public surface. In TypeShade, adding a stage decorator gives that function the GPU meaning of a pipeline entry point. An undecorated function remains a reusable helper.',
        compute: '2. Compute',
        computeP: '`@compute` carries the workgroup size. A compute builtin such as `global_invocation_id` is an explicit function parameter, not an injected global.',
        graphics: '3. Vertex and fragment',
        graphicsP: '`@vertex` and `@fragment` describe graphics-pipeline entry points. Inputs, outputs and builtins are expressed explicitly in the function signature.',
        helper: '4. Helper functions',
        helperP: 'An undecorated function is a helper, not an entry point. Do not put entry points on classes or treat `this` as a pipeline object.',
        next: 'Back to the language overview'
      }
    },

    // The four construct-mapping pages: /guide/language/from-typescript/, from-wgsl/,
    // from-glsl/ and builtins/. Each page component reads one block. The builtin table is
    // generated from the compiler's spelling registry (src/lib/builtin-table.ts), so its
    // rows are not copy and only the words around them live here.
    mapping: {
      fromTypescript: {
        title: 'TypeScript constructs and what each one lowers to',
        description: 'What each TypeScript construct becomes in a "use typeshade" file: declarations, functions, classes, control flow, and the shader text the compiler writes.',
        h1: 'TypeScript constructs',
        h: 'What this page covers',
        p: 'A `"use typeshade"` file is written in TypeScript, and every construct in it has one meaning on the GPU or a refusal that says why. This page puts each construct beside what it lowers to and beside the WGSL the compiler emits for it, compiled at build time so the emitted column cannot drift from the compiler.',
        pending: 'The construct tables are being written, one section each for declarations, functions, classes, control flow, and expressions and types.'
      },
      fromWgsl: {
        title: 'WGSL in TypeShade: types, resources and entries',
        description: 'The WGSL surface construct by construct, with the TypeShade spelling of each one: scalars, vectors, textures, address spaces, stage attributes and statements.',
        h1: 'WGSL in TypeShade',
        h: 'What this page covers',
        p: 'A reader who already writes WGSL needs one thing from this site, which is the TypeShade spelling of the construct in front of them. This page reads in that direction: a WGSL form on the left, what to write in a `"use typeshade"` file on the right, and a note where the two do not line up.',
        pending: 'The construct tables are being written, one section each for types, resources and address spaces, entry points and attributes, and statements.'
      },
      fromGlsl: {
        title: `${glsl} in TypeShade: types and uniform blocks`,
        description: `The ${glsl} surface construct by construct, with the TypeShade spelling of each one: samplers, uniform blocks, varyings, builtin variables and functions.`,
        h1: `${glsl} in TypeShade`,
        h: 'What this page covers',
        p: `A shader written for WebGL2 is written in ${glsl}, and most of it has a TypeShade spelling that emits the same program for both targets. This page reads in that direction, and it says which constructs have no form on WebGPU and which ones the compiler refuses on both.`,
        pending: 'The construct tables are being written, one section each for types and samplers, uniforms and buffers, builtin variables, and functions.'
      },
      builtins: {
        title: `Builtin functions and their WGSL and ${glsl} forms`,
        description: `Every builtin the compiler can spell, ${facts.builtins} in all, beside the WGSL and the ${glsl} text it writes for each one, grouped by family.`,
        h1: 'Builtin functions',
        intro: `A builtin is a function the GPU already has. A call carries one neutral name through the compiler, and each backend writes its own spelling for that name, so the call is written once and emitted twice. The registry holds ${facts.builtins} names.`,
        readingH: 'How to read a row',
        readingP: `The first column is the name the call carries, with a placeholder argument in each position it takes. The next two are the text the WGSL backend and the ${glsl} backend write for that call, run from the compiler's own spelling table at the pinned commit. ${facts.portableBuiltins} of the names are spelled the same way on both targets, and ${facts.glslAbsentBuiltins} have no ${glsl} form at all, where the cell carries the compiler's own message. ${facts.mathAliasBuiltins} answer to a \`Math.\` name as well, which the last column of the maths and cast tables shows.`,
        idsP: 'A few of these names are chosen by the compiler and never written by hand. A layered texture read, a depth comparison and a storage fetch each take a name of their own, so the argument order of a call never depends on the texture it landed on.',
        precedenceH: 'A name the file declares',
        precedenceP: 'A function the file declares wins over a builtin of the same name. Such a name meant the author\'s own function before it was a builtin, and an addition does not change what a program already means.',
        colName: 'TypeShade',
        colWgsl: 'WGSL',
        colGlsl: glsl,
        colMath: 'Math name',
        colBuiltin: 'Builtin',
        colHelper: 'GLSL function',
        noForm: 'No form on this target.',
        preEmit: 'Rewritten into a pair of `f32` lanes before either backend runs.',
        families: {
          maths: 'Maths',
          geometry: 'Geometry',
          derivatives: 'Derivatives',
          bits: 'Bit operations',
          packing: 'Packing',
          casts: 'Casts',
          textures: 'Textures and storage',
          atomics: 'Atomics',
          barriers: 'Barriers',
          f64: 'Emulated double'
        },
        bitsP: `${glsl} has none of the bit builtins, so the column above names a small function the GLSL writer defines over the shifts, masks and comparisons that target does have. A module that calls none of them carries none of the definitions.`,
        helpersH: 'GLSL helper functions',
        helpersP: `A storage buffer has no ${glsl} form, so a read of one is rewritten into a read from a data texture. These are the functions that read stands for, and the GLSL writer emits the definition of each one a module calls.`,
        sourceP: 'Every row on this page is read from [the spelling registry](intrinsicRegistry) at the pinned commit, and none of it is typed here.'
      }
    }
  },

  notFound: {
    title: 'Page not found, TypeShade',
    description: 'There is nothing at this address on typeshade.dev.',
    h1: 'There is nothing at this address.',
    p: 'The page may have moved. The front page and the authoring guide are still here.',
    links: '[Go to the front page](home), or read the [authoring guide](guide).',
  },
}
