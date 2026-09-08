// English copy: the source text every translation follows. Every number comes from the
// build (src/lib/examples.ts). Inline links are written as [text](key), where key names a
// record in src/lib/links.ts; inline code is written in backticks. Rich.astro renders both.
import { API_CATEGORIES } from '../lib/api.ts'
import { exampleFile, facts, hero, quickStartFile, registryBlurbs } from '../lib/examples.ts'
import { guideSections } from '../lib/guide.ts'
import { typedError } from '../lib/typed-error.ts'

const glsl = facts.glslTarget
const err = typedError()
const std = facts.layoutStandards[0]
const split = facts.splitLabels ?? ['f32', 'f64']

// A title and a description for every section of the authoring guide, keyed by the id the
// loader takes from its heading. English reads both off the section itself, so this map
// cannot drift from the file the pages are rendered from. Two sections open with a table or
// with pairs of code blocks and have no sentence to take, so they are described here.
const written: Record<string, string> = {
  'before-after': 'The ceremony the authoring surface removed, in pairs: the old hand-synced code beside the one-declaration form that took its place.',
  'quick-reference': 'One table for the whole authoring surface: what you need in the left column, and the call that writes it in the right.',
}
const sections: Record<string, { title: string; description: string }> = Object.fromEntries(
  guideSections
    .filter((s) => s.id !== 'overview')
    .map((s) => {
      const description = s.description ?? written[s.id]
      if (!description) throw new Error(`[guide] section '${s.id}' has no prose to describe it; write one in src/i18n/en.ts`)
      return [s.id, { title: s.title, description }]
    }),
)

// The reference's categories, named and described where the entries are read, so the index
// pages cannot drift from the categories the entries sit in. Korean writes its own.
const apiCategories: Record<string, { name: string; summary: string }> = Object.fromEntries(
  API_CATEGORIES.map((c) => [c.slug, { name: c.name, summary: c.summary }]),
)

export const en = {
  lang: 'en',
  /** How this locale names itself, shown in the language switch of other locales. */
  name: 'English',
  skip: 'Skip to content',

  meta: {
    title: 'TypeShade: typed shaders in TypeScript for WebGPU and WebGL2',
    description: `Write a shader once in TypeScript and emit WGSL for WebGPU and ${glsl} for WebGL2. The same module runs on the CPU in f64, so its output can be checked.`,
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
    introduction: 'Introduction',
    authoring: 'Authoring',
    project: 'Project',
    why: 'Why TypeShade',
    quickStart: 'Quick start',
    authoringGuide: 'Authoring guide',
    checks: 'Verification',
    examples: 'Examples',
    onThisPage: 'On this page',
    previous: 'Previous',
    next: 'Next',
    editPage: 'Edit this page',
    permalink: 'Link to heading',
    // The API reference: the words around a generated ApiEntry (src/lib/api-types.ts).
    api: {
      title: 'TypeShade API reference',
      description: 'Every public export of TypeShade on its own page: syntax, parameters, return value, examples and which targets support it.',
      h1: 'API reference',
      intro: `Every export of the typeshade package, generated from the compiler at commit ${facts.pinnedCommit}. One page per function, type, interface and class.`,
      reference: 'Reference',
      breadcrumbs: 'Breadcrumbs',
      pageTitle: (name: string) => `${name}, TypeShade API reference`,
      categoryTitle: (name: string) => `${name} in the TypeShade API reference`,
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
  },

  front: {
    hero: {
      before: '',
      accent: 'TypeShade',
      after: '',
      subtitle: 'The verifiable TypeScript shader library',
      tagline: `Write a shader once in TypeScript, and TypeShade emits WGSL and ${glsl}. The same module runs on the CPU in double precision, so the compiler's output can be checked.`,
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
      h: 'The authored fragment and its WGSL',
      p: `The fragment stage of the gradient example as written, ${hero.authoredLines} lines, and the WGSL entry point it emits. The ${glsl} stage comes from the same function.`,
      more: '[Quick start](quickStart)',
    },
    highlights: [
      {
        h: 'One source, two targets',
        p: `One typed module emits WGSL for WebGPU through [\`emitModule()\`](apiEmitModule) and ${glsl} for WebGL2 through [\`emitGlslModule()\`](apiEmitGlsl). ${facts.bothTargets} of the ${facts.examples} examples in the repository emit both from one file.`,
      },
      {
        h: 'Checked against the CPU',
        p: "The same module runs on the CPU in f64, and the test suite checks the compiler's algebra against it. Every emit is compiled on Tint and linked on WebGL2 on each push.",
      },
      {
        h: 'Typed in the editor',
        p: `A misspelt uniform field or a wrong-typed return is a TypeScript error in the editor. [\`reflect()\`](apiReflect) reads bind groups and ${facts.layoutStandards.join(' and ')} layouts from the same intermediate representation.`,
      },
    ],
  },
  quickStart: {
    title: 'TypeShade quick start: install and a first shader',
    description: 'Add TypeShade as a git submodule and run a complete file, the gradient example, to the WGSL it emits, with a note on the pre-release status.',
    h1: 'Quick start',
    installH: 'Install',
      p1: `The package ships TypeScript source, so your build needs a toolchain that compiles it. Here is a complete file: the gradient example's uniform block and both stages, declared with [\`fn\`](apiFn) and built with [\`module()\`](apiModule), ${quickStartFile.lines} lines from the import line to a call that emits WGSL:`,
      p2: 'Running it emits WGSL for both stages. Here is the fragment entry point:',
      p3: `The ${glsl} stage for the same function, and the uniform layout [\`reflect()\`](apiReflect) recovers for it, are on the [examples page](examples). The [authoring guide](guide) covers the rest of the surface.`,
    status: {
      h: 'Status',
      p: `Pre-release. The repository is at version ${facts.mirrorVersion}; ${facts.nextVersion} is the release the npm name [typeshade](npm) is reserved for, and the manifest and the imports are renamed at that tag. Until then this is a mirror: the import above resolves at \`${quickStartFile.importPath}\`, inside the submodule itself. Issues are welcome; pull requests cannot be merged yet, because changes land upstream and this tree is fast-forwarded from there. [Watch releases](releases) to hear about ${facts.nextVersion}.`,
    },
  },
  motivation: {
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
        p: 'TypeShade keeps one source. The module is typed TypeScript, so a misspelt field or a wrong-typed return is caught in the editor; one intermediate representation emits both languages; and the same module compiles to a CPU function in double precision, so what a backend produces can be checked against a reference computed from the same source. [Verification](checks) says what runs on every push.',
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

  examples: {
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
      p1: `The front page shows the fragment stage of \`${hero.file}\` and the WGSL entry point it emits. The same function emits this ${glsl} \`main\`:`,
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
    note: `Rendered from [AUTHORING.md](guideSource) at commit ${facts.pinnedCommit}. The package is imported here by its ${facts.nextVersion} name, \`typeshade\`.`,
    noteUntranslated: `Rendered from [AUTHORING.md](guideSource) at commit ${facts.pinnedCommit}. The package is imported here by its ${facts.nextVersion} name, \`typeshade\`.`,
  },
  notFound: {
    title: 'Page not found, TypeShade',
    description: 'There is nothing at this address on typeshade.dev.',
    h1: 'There is nothing at this address.',
    p: 'The page may have moved. The front page and the authoring guide are still here.',
    links: '[Go to the front page](home), or read the [authoring guide](guide).',
  },
}
