// English copy: the source text every translation follows. Every number comes from the
// build (src/lib/examples.ts). Inline links are written as [text](key), where key names a
// record in src/lib/links.ts; inline code is written in backticks. Rich.astro renders both.
import { API_CATEGORIES } from '../lib/api.ts'
import { exampleFile, facts, hero, quickStartFile, registryBlurbs } from '../lib/examples.ts'
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
      playground: 'Playground',
      /** The sidebar's own group headings (src/lib/links.ts sidebar()). */
      sidebarGroups: {
        learn: 'Learn',
        language: 'Language',
        internals: 'Internals',
        project: 'Project',
      },
      topics: {
        types: 'Types',
        functions: 'Functions',
        controlFlow: 'Control flow',
        gpuTypes: 'GPU types',
        resources: 'Resources',
        stages: 'Shader stages'
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
    cpuFailed: 'The CPU oracle could not run this entry point.',
    entryCount: (n: number) => (n === 1 ? '1 entry point' : `${n} entry points`),
    // The example picker. Each example is one of the compiler's own .shade.ts files, named
    // and described here; the source text comes from the vendored checkout at build time.
    exampleLabel: 'Example',
    examples: {
      hello: {
        title: 'Hello triangle',
        description: 'A vertex entry that places three corners from the vertex index, and a fragment entry that paints them.',
      },
      'hello-vsout': {
        title: 'Vertex output',
        description: 'The vertex entry returns a struct, so the fragment entry reads the same fields back as interpolated values.',
      },
      'hello-vsin': {
        title: 'Vertex input',
        description: 'The vertex entry takes its position and texture coordinates from vertex buffer attributes.',
      },
      'hello-uniform': {
        title: 'Uniform scalar',
        description: 'A single uniform value declared at module level and read inside the fragment entry.',
      },
      'hello-camera': {
        title: 'Uniform struct',
        description: 'A uniform struct whose byte layout the reflection pane lays out field by field.',
      },
    },
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
    copyright: `Copyright © ${facts.year} ${facts.author} contributors`,
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
    use: {
      eyebrow: 'A shader language built around the TypeScript experience',
      title: 'TypeShade',
      subtitle: 'Start with `"use typeshade"`.',
      tagline: 'Keep the TypeScript authoring experience: types, functions, modules and editor feedback. Write with TypeShade GPU types and shader semantics, and emit WGSL or GLSL ES 3.00 from one source.',
      getStarted: 'Use TypeShade',
      playground: 'Write in the Playground',
      learn: 'Why TypeShade',
      language: 'Learn the language',
      examples: 'Explore examples',
      flowH: 'From TypeScript to a shader',
      flowP: 'A file-level `"use typeshade"` directive creates the boundary between ordinary application code and the TypeShade language.',
      flowLabels: ['TypeScript authoring', 'TypeShade semantics', 'shared IR', 'WGSL / GLSL ES 3.00'],
      flowAriaLabel: 'TypeShade compilation flow',
      codeH: 'Your first TypeShade program',
      codeP: 'The source looks familiar to a TypeScript developer. The compiler applies TypeShade types and GPU semantics, then produces shader code the host can consume.',
      conceptsH: 'If you know TypeScript, you already know the shape',
      conceptsP: 'TypeShade extends familiar TypeScript concepts with GPU-specific rules instead of making developers learn an unrelated shader authoring model. Start with these mappings, then go deeper into the language guide.',
      concepts: [
        ['File directive', '`"use typeshade"`', 'It uses the same file-leading directive position as JavaScript directives, but TypeShade uses it to opt the file into shader compilation semantics.'],
        ['Types', 'Type annotations → GPU types', 'Instead of only application-level types such as `number`, TypeShade statically checks GPU types such as `f32`, `vec2`, and `mat4` together with shader operation rules.'],
        ['Functions', 'Functions → entry points', 'The familiar declaration and call model remains, while TypeShade surface syntax such as `@vertex` and `@fragment` selects shader stages.'],
        ['Modules', 'import / export → shader modules', 'TypeScript module boundaries remain useful, while the compiler restricts the program graph to constructs it can lower into shader code.']
      ],
      highlights: [
        ['Start from TypeScript', 'Keep familiar concepts such as type annotations, functions, modules and control flow while shader-specific constraints are checked statically.'],
        ['`use typeshade` is the language boundary', '`"use typeshade"` is not a comment or a runtime call. It opts the file into TypeShade program semantics and its compilation model.'],
        ['Lower to host-ready GPU code', 'Emit WGSL for WebGPU or GLSL ES 3.00 for WebGL2 from the same TypeShade source. There is no TypeShade runtime to ship with the application.'],
      ]
    },
    hero: {
      before: '',
      accent: 'TypeShade',
      after: '',
      subtitle: 'The verifiable TypeScript shader library',
      tagline: `Start a file with \`"use typeshade"\`. TypeShade emits WGSL for WebGPU and ${glsl} for WebGL2. The same source runs on the CPU in double precision, so the compiler's output can be checked.`,
      getStarted: 'Get started',
      why: 'Why TypeShade',
      examples: 'Examples',
      prerelease: `Pre-release: ${facts.nextVersion} is not on npm yet. Install as a git submodule`,
    },
    metaballs: {
      neutral: `Metaballs, from examples/${exampleFile('metaballs')}, drawn at build time.`,
      webgpu: 'Metaballs, running live on WebGPU from the compiled WGSL.',
      webgl2: `Metaballs, running live on WebGL2 from the compiled ${glsl}.`,
      none: 'Metaballs, rendered at build time; this browser has no WebGPU or WebGL2.',
      reduced: 'Metaballs, drawn as one frame, since this system asks for reduced motion.',
    },
    code: {
      h: 'The authored file and its WGSL',
      p: 'A file that starts with `"use typeshade"`, and the WGSL it emits.',
      more: '[Quick start](quickStart)',
    },
    highlights: [
      {
        h: 'One source, two targets',
        p: `A file that starts with \`"use typeshade"\` emits WGSL for WebGPU and ${glsl} for WebGL2. ${facts.bothTargets} of the ${facts.examples} examples in the repository emit both from one file. The graph calls [\`emitModule()\`](apiEmitModule) and [\`emitGlslModule()\`](apiEmitGlsl) remain for the gallery.`,
      },
      {
        h: 'Checked against the CPU',
        p: "The same module runs on the CPU in f64, and [the test suite](checks) checks the compiler's algebra against it. Every emit is compiled on Tint and linked on WebGL2 on each push.",
      },
      {
        h: 'Typed in the editor',
        p: `A misspelt uniform field or a wrong-typed return is a TypeScript error in the editor. [\`reflect()\`](apiReflect) reads bind groups and ${facts.layoutStandards.join(' and ')} layouts from the same intermediate representation.`,
      },
    ],
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
    title: 'TypeShade quick start: install and a first shader',
    description: 'Add TypeShade as a git submodule and compile a file that starts with "use typeshade", with a note on the pre-release status.',
    h1: 'Quick start',
    installH: 'Install',
      p0: 'A file that starts with `"use typeshade"` is a shader compilation unit. Below is a first shader, written with a class and stage-decorated functions.',
      p1: `TypeShade also has a function-based authoring surface: the same pass declared with [\`fn\`](apiFn) and [\`module()\`](apiModule) instead of classes, ${quickStartFile.lines} lines from the import line to a call that emits WGSL:`,
      p2: 'Running it emits WGSL for both stages. Here is the fragment entry point:',
      p3: `The ${glsl} stage for the same function, and the uniform layout [\`reflect()\`](apiReflect) recovers for it, are on the [examples page](examples). The [language guide](guide) covers the rest of the surface.`,
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
    eyebrow: 'Language bridge',
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
    title: `TypeShade examples: ${facts.examples} shaders, GLSL emit, emulated f64`,
    description: `The ${facts.examples} TypeShade examples, the ${glsl} emit of the gradient pass, and a deep-zoom demo of emulated double precision.`,
    h1: 'Examples',
    intro: `There are ${facts.examples} runnable examples in the repository, covering cartographic passes, the ShaderToy-era screen-space effects, the emulated-double tier and a compute kernel. ${facts.fp64Examples} use emulated double precision. The renderable ones are exported from [examples/index.ts](examplesIndex); browse [the examples directory](examplesDir).`,
    categories: { cartographic: 'Cartographic', generic: 'Screen space', compute: 'Compute' },
    columns: { example: 'Example', category: 'Category', blurb: 'Description' },
    tableCaption: `${facts.bothTargets} of the ${facts.examples} examples below emit WGSL and ${glsl}. ${facts.wgslOnlyExample.title} has no vertex or fragment stage to emit as ${glsl}, so the table marks it WGSL only; its WebGL2 path is the opt-in emulation.`,
    wgslOnly: 'WGSL only',
    /** The Description column, one line per example, keyed by the registry's id. English
     *  takes the compiler's own wording; a translation writes the same lines in its language. */
    blurbs: registryBlurbs(),
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
        paramsTable: [['Part', 'Role'], ['<code>a</code>, <code>b</code>', 'GPU input values.'], ['<code>amount: f32</code>', 'A scalar input whose type participates in expression checking.'], ['<code>: vec4</code>', 'The GPU value shape returned to the caller.']],
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
        builtinTable: [['Form', 'Meaning'], ['<code>@builtin("global_invocation_id")</code>', 'Selects the GPU-provided compute input.'], ['<code>gid: vec3u</code>', 'The TypeShade type and local name for that input.'], ['<code>gid.x</code>', 'Reads the x component for the current invocation.']],
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
