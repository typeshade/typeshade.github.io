// English copy: the source text every translation follows. Every number comes from the
// build (src/lib/examples.ts). Inline links are written as [text](key), where key names a
// record in src/lib/links.ts; inline code is written in backticks. Rich.astro renders both.
import { exampleFile, facts, hero } from '../lib/examples.ts'
import { typedError } from '../lib/typed-error.ts'

const glsl = facts.glslTarget
const err = typedError()
const std = facts.layoutStandards[0]
const split = facts.splitLabels ?? ['f32', 'f64']

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
    guide: 'Guide',
    examples: 'Examples',
    github: 'GitHub',
    llms: 'llms.txt',
    languages: 'Languages',
    theme: 'Toggle dark mode',
    menu: 'Menu',
  },
  docs: {
    introduction: 'Introduction',
    authoring: 'Authoring',
    reference: 'Reference',
    why: 'Why TypeShade',
    quickStart: 'Quick start',
    authoringGuide: 'Authoring guide',
    checks: 'Checks',
    examples: 'Examples',
    onThisPage: 'On this page',
    previous: 'Previous',
    next: 'Next',
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
    wgsl: 'The emitted WGSL fragment entry point',
    glsl: `The emitted ${glsl} fragment main`,
    print: "Printing an example's emits",
  },

  front: {
    hero: {
      before: '',
      accent: 'Typed shaders',
      after: 'for WebGPU and WebGL2',
      tagline: `A TypeScript library that writes a shader once and emits WGSL and ${glsl}. The same module runs on the CPU in double precision, so the compiler's output can be checked.`,
      getStarted: 'Get started',
      why: 'Why TypeShade',
      examples: 'Examples',
    },
    metaballs: {
      neutral: `Metaballs, from examples/${exampleFile('metaballs')}. The still is captured at build time.`,
      webgpu: 'Metaballs. The WGSL emit is drawing this frame on WebGPU.',
      webgl2: `Metaballs. The ${glsl} emit is drawing this frame on WebGL2.`,
      none: 'Metaballs. Rendered at build time; this browser has no WebGPU or WebGL2.',
      reduced: `Metaballs, compiled to WGSL and to ${glsl}. One frame is drawn here, since this system asks for reduced motion.`,
    },
    note: `Pre-release: the repository is at ${facts.mirrorVersion}, and ${facts.nextVersion} is not on npm yet. Install it as a git submodule from the [quick start](quickStart).`,
    highlights: [
      {
        h: 'One source',
        p: `One typed module emits WGSL for WebGPU and ${glsl} for WebGL2. ${facts.bothTargets} of the ${facts.examples} examples in the repository emit both from one file.`,
      },
      {
        h: 'Checked',
        p: "The same module runs on the CPU in f64, and the test suite checks the compiler's algebra against it. Every emit is compiled on Tint and linked on WebGL2 on each push.",
      },
      {
        h: 'Typed',
        p: `A misspelt uniform field or a wrong-typed return is a TypeScript error in the editor. \`reflect()\` reads bind groups and ${facts.layoutStandards.join(' and ')} layouts from the same intermediate representation.`,
      },
    ],
  },
  quickStart: {
    title: 'TypeShade quick start: install and a first shader',
    description: 'Add TypeShade as a git submodule and follow the fragment stage of the gradient example to the WGSL it emits, with a note on the pre-release status.',
    h1: 'Quick start',
      p1: `The package ships TypeScript source, so your build needs a toolchain that compiles it. This is the fragment stage of the gradient example, ${hero.authoredLines} lines as authored in \`${hero.file}\`:`,
      p2: 'It emits this WGSL entry point:',
      p3: `The ${glsl} stage for the same function, and the uniform layout [reflect()](reflectApi) recovers for it, are on the [examples page](examples). The [authoring guide](guide) covers the rest of the surface.`,
    status: {
      h: 'Status',
      p: `Pre-release. The repository is at version ${facts.mirrorVersion}; ${facts.nextVersion} is the release the npm name [typeshade](npm) is reserved for, and the manifest and the imports are renamed at that tag. Issues are welcome; pull requests cannot be merged yet, because changes land upstream and this tree is fast-forwarded from there. [Watch releases](releases) to hear about ${facts.nextVersion}.`,
    },
  },
  motivation: {
    title: 'Why one shader source for WebGPU and WebGL2, TypeShade',
    description: `Why TypeShade emits WGSL and ${glsl} from one typed TypeScript module: what maintaining two shader languages costs, with the Khronos survey figures.`,
    h1: 'Why TypeShade',
    paragraphs: [
      'A shader that has to run on WebGL2 and on WebGPU exists twice. The two languages disagree about types, entry points, resource binding and precision, so the second copy is a rewrite. A fix that lands in one copy and misses the other only shows up on the machines that take the other path, and a reviewer has to read two dialects to decide whether they still mean the same thing.',
      'The web is in the middle of one such move. The [MapLibre graphics modernization roadmap](maplibreRoadmap), the [deck.gl WebGPU guide](deckglWebgpu) and the [PixiJS v8 migration guide](pixijsMigration) each describe a WebGPU path arriving beside an existing WebGL one, so a custom layer written as GLSL will need a WGSL copy.',
      `In the [${facts.survey.title}](survey), ${facts.survey.figure64}% of the ${facts.survey.n}+ shader developers surveyed adapt shaders across platforms, APIs or tools, and nearly ${facts.survey.figure10}% describe it as a significant engineering cost or one of their largest.`,
      'TypeShade keeps one source. The module is typed TypeScript, so a misspelt field or a wrong-typed return is caught in the editor; one intermediate representation emits both languages; and the same module compiles to a CPU function in double precision, so what a backend produces can be checked against a reference computed from the same source. The [checks page](checks) says what runs on every push.',
      'What it does not do: TypeShade has no renderer and no scene graph. It returns strings and reflection metadata; creating pipelines, binding resources and issuing draws stay with the host. SPIR-V, MSL and HLSL come out of naga or Tint, fed the WGSL, because every native host already reaches WGSL through Dawn or wgpu.',
    ],
  },

  checks: {
    title: 'How TypeShade is checked: oracle, compile gate, goldens',
    description: "What TypeShade's CI runs on every push: a CPU oracle in f64, a compile gate on Tint and a real WebGL2 context, and golden files for every emit.",
    h1: 'Checks',
    intro: "The repository's CI runs these on every push and pull request, in [the CI workflow](ciGates):",
    items: [
      'The same module compiles to a CPU function that runs in f64 arithmetic. In its default mode only its equality tests round to f32 first, so they agree with the GPU; an f32 mode that rounds after every operation is opt-in. The test suite checks that function against known answers and against a second CPU backend, generated JavaScript, which must match it bit for bit. It says nothing about what rounding does on a driver, and no GPU output is compared against it in this repository. [src/core/oracle.ts](oracle)',
      `The compile gate emits every registered example, hands each WGSL emit to Tint inside headless Chromium, and compiles and links both ${glsl} stages of every renderable example on a real WebGL2 context. It also hands each compiler a shader that cannot compile: if either accepts that non-program, the gate fails and the verdicts on the examples do not count. [scripts/compile-gate.ts](compileGate)`,
      'Golden files hold the emitted bytes of every example, so any change in a backend surfaces as a diff in review. [emit-goldens.test.ts](goldens)',
    ],
    pairIntro: 'The gradient pass from the front page, drawn once by each backend. No pixel comparison between the two is committed yet.',
    gpuFrame: {
      neutral: 'The WGSL emit, drawn on WebGPU at build time.',
      webgpu: 'The WGSL emit, drawn here on WebGPU.',
      webgl2: `WebGPU is not available here, so the ${glsl} emit drew this frame on WebGL2.`,
      none: 'The WGSL emit, drawn on WebGPU at build time. This browser has no WebGPU or WebGL2.',
    },
    glFrame: {
      neutral: `The ${glsl} emit, drawn on WebGL2 at build time.`,
      webgpu: 'The WGSL emit, drawn here on WebGPU.',
      webgl2: `The ${glsl} emit, drawn here on WebGL2.`,
      none: `The ${glsl} emit, drawn on WebGL2 at build time. This browser has no WebGPU or WebGL2.`,
    },
    authorTime: {
      h: 'At author time',
      p: 'The uniform block is declared once, and every field read is typed against that declaration. Misspell one and TypeScript says so in the editor, before a string reaches a GPU.',
      caption: `The wrong read on line ${err.wrongLine}, the diagnostic it produces, and the ${std} layout [reflect()](reflectApi) recovers for the block it reads from: ${err.layout.size} bytes over ${err.layout.fields.length} fields. The gap after the first field is alignment.`,
    },
  },

  examples: {
    title: `TypeShade examples: ${facts.examples} shaders, GLSL emit, emulated f64`,
    description: `The ${facts.examples} TypeShade examples, the ${glsl} emit of the gradient pass, and a deep-zoom demo of emulated double precision.`,
    h1: 'Examples',
    intro: `There are ${facts.examples} runnable examples in the repository, covering cartographic passes, the ShaderToy-era screen-space effects, the emulated-double tier and a compute kernel. ${facts.bothTargets} of them emit WGSL and ${glsl} from one source. The compute kernel has no vertex or fragment stage to emit as ${glsl}, so it emits WGSL and reflection; its WebGL2 path is the opt-in emulation. ${facts.fp64Examples} use emulated double precision. The renderable ones are exported from [examples/index.ts](examplesIndex); browse [the examples directory](examplesDir).`,
    printIntro: 'The first command below prints WGSL, GLSL and reflection for every example; the second does one by id.',
    glsl: {
      h: `The gradient pass in ${glsl}`,
      p1: `The front page shows the fragment stage of \`${hero.file}\` and the WGSL entry point it emits. The same function emits this ${glsl} \`main\`:`,
      p2: `The whole module is ${hero.emit.wgslLines} lines of WGSL; the GLSL vertex stage is ${hero.emit.glslVertexLines} lines and the fragment stage ${hero.emit.glslFragmentLines}. Uniform types, byte offsets, bind-group entries and entry signatures come from [reflect()](reflectApi), which reads the same intermediate representation and stays off the emit path, so a host can pack its uniform buffer from that layout. The [checks page](checks) shows the reflected layout of a uniform block beside the diagnostic for a misspelt field.`,
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
    note: `Rendered from [AUTHORING.md](guideSource) at commit ${facts.pinnedCommit}. The package is imported here by its ${facts.nextVersion} name, \`typeshade\`.`,
  },
  notFound: {
    title: 'Page not found, TypeShade',
    description: 'There is nothing at this address on typeshade.dev.',
    h1: 'There is nothing at this address.',
    p: 'The page may have moved. The front page and the authoring guide are still here.',
    links: '[Go to the front page](home), or read the [authoring guide](guide).',
  },
}
