// English copy: the source text every translation follows. Every number comes from the
// build (src/lib/examples.ts). Inline links are written as [text](key), where key names a
// record in src/lib/links.ts; inline code is written in backticks. Rich.astro renders both.
import { API_CATEGORIES } from '../lib/api.ts';
import { exampleFile, facts, hero, quickStartFile, registryBlurbs } from '../lib/examples.ts';
import { shadeDescriptions, shadeTitles } from '../lib/shade-examples.ts';
import { guideSections } from '../lib/guide.ts';
import type { LinkKey } from '../lib/links.ts';
import { typedError } from '../lib/typed-error.ts';

const glsl = facts.glslTarget;
const err = typedError();
const std = facts.layoutStandards[0];
const split = facts.splitLabels ?? ['f32', 'f64'];

// A title and a description for every section of the authoring guide, keyed by the id the
// loader takes from its heading. English reads both off the section itself, so this map
// cannot drift from the file the pages are rendered from. Every section opens with a
// sentence that says what the reader can do after it; the loader takes that sentence as the
// description. The entries here replace the ones the loader had to cut short (a page
// description is plain text, so they carry no markdown code marks, the way describe() in
// src/lib/authoring.ts strips them from a derived one).
const written: Record<string, string> = {
  'your-first-shader': `After this page you have a two-entry shader module written in TypeScript, emitted as WGSL and as ${glsl}, and you know which call produced each string.`,
  'functions-and-entry-points':
    'After this page you can declare a helper, call it from another function, write an entry point for any stage, and collect them in the module that carries them.',
  'emitting-and-reflection':
    'After this page you can turn a module into WGSL, into both GLSL stages or into a fragment a host composes, and read the pipeline metadata a host binds from.',
  diagnostics:
    'After this page you can read a coded error, branch on its code, get every failure in a module in one report, and print the TypeScript line an error came from.',
  'conditional-programs':
    'After this page you can decide which of several programs to build from one source, tell when a variant is one constant instead, and hand the choice to the host.',
  'capabilities-extensions':
    'After this page you can declare the GPU features a module needs, read what each costs on each target, and check a booted device against them before it emits.',
  'glsl-float-precision':
    'After this page you know when to emit a GLSL stage at mediump, what that one option changes in the emitted source, and what it leaves alone.',
};
const sections: Record<string, { title: string; description: string }> = Object.fromEntries(
  guideSections
    .filter((s) => s.id !== 'overview')
    .map((s) => {
      const description = written[s.id] ?? s.description;
      if (!description)
        throw new Error(
          `[guide] section '${s.id}' has no prose to describe it; write one in src/i18n/en.ts`,
        );
      return [s.id, { title: s.title, description }];
    }),
);

// The reference's categories, named and described where the entries are read, so the index
// pages cannot drift from the categories the entries sit in. Korean writes its own.
const apiCategories: Record<string, { name: string; summary: string }> = Object.fromEntries(
  API_CATEGORIES.map((c) => [c.slug, { name: c.name, summary: c.summary }]),
);

// Two lists of copy carry a link as a key of src/lib/links.ts, so the locale prefix and the
// pinned commit stay in one place. The two functions are identities: the parameter types the
// list where it is written, so a key no record has is a type error here, before the page
// that renders it is built. ko.ts is typed against the same shapes.
interface NextLink {
  readonly linkKey: LinkKey;
  readonly label: string;
}
interface PathStep extends NextLink {
  readonly title: string;
  readonly text: string;
}
const nextLinks = (items: readonly NextLink[]): readonly NextLink[] => items;
const pathSteps = (items: readonly PathStep[]): readonly PathStep[] => items;

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
        reference: 'Reference',
        examples: 'Examples',
      },
      languageGuide: 'Language guide',
      languageReference: 'Language reference',
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
        wgslAndGlsl: 'WGSL and GLSL',
      },
      topics: {
        types: 'Types',
        functions: 'Functions',
        controlFlow: 'Control flow',
        gpuTypes: 'GPU types',
        resources: 'Resources',
        stages: 'Shader stages',
      },
      /** The four construct-mapping pages, after the topics in the Language group. */
      mapping: {
        fromTypescript: 'From TypeScript',
        fromWgsl: 'From WGSL',
        fromGlsl: 'From GLSL',
        builtins: 'Builtin functions',
      },
      /** The sections of the three mapping sets, one page each. The sidebar opens a set's
       *  sections under its index while the reader is inside it, so these are the short
       *  names a 240px row holds; the page's own h1 is the longer heading. */
      mappingSections: {
        fromTypescript: {
          declarations: 'Declarations',
          functions: 'Functions',
          classes: 'Classes',
          controlFlow: 'Control flow',
          expressions: 'Expressions',
          double: 'Emulated double',
        },
        fromWgsl: {
          types: 'Types',
          resources: 'Resources',
          entries: 'Entry points',
          statements: 'Statements',
        },
        fromGlsl: {
          types: 'Types',
          uniforms: 'Uniforms',
          variables: 'Builtin variables',
          functions: 'Functions',
        },
      },
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
      title: 'TypeShade compiler API reference for host applications',
      description:
        'Every public export of the TypeShade compiler on its own page: syntax, parameters, return value, examples and which targets support it.',
      h1: 'Compiler API reference',
      intro: `Every export of the typeshade package, generated from the compiler at commit ${facts.pinnedCommit}. One page per function, type, interface and class.`,
      audience:
        'This is the surface a host application and the [`fn()`](apiFn) builder call. A shader author writes the [language reference](reference) instead.',
      reference: 'Reference',
      breadcrumbs: 'Breadcrumbs',
      // The title names the export, its kind and its category, and grows a suffix only as
      // far as it fits under the 60-character limit check-seo.mjs enforces (the SEO review,
      // onpage, title length). 'clamp(): function in Builtins, TypeShade API reference'. A
      // short base (a short name in a short category) tried the two shortest suffixes first
      // and landed under the review's 45-character floor, so the longest suffix now leads.
      pageTitle: (heading: string, kind: string, category: string) => {
        const base = `${heading}: ${kind.toLowerCase()} in ${category}`;
        const suffixes = [
          ', TypeShade API reference for developers',
          ', TypeShade API reference',
          ', TypeShade API',
          ', TypeShade',
        ];
        const fitting = suffixes.find((suffix) => (base + suffix).length <= 60);
        return fitting ? base + fitting : base;
      },
      categoryTitle: (name: string) => `${name}, a category in the TypeShade API reference`,
      categoryDescription: (name: string, summary: string) =>
        `${name} in the TypeShade API reference. ${summary}`,
      pageDescription: (name: string, kind: string, category: string, summary: string) => {
        // 'interface' is the one kind that starts with a vowel, so the article follows the word.
        const k = kind.toLowerCase();
        return `${name}, ${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k} in ${category}. ${summary}`;
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
      previewNote:
        'Template preview. The words on this page are a fixture; the compiler supplies the real ones.',
      line: (n: number) => `line ${n}`,
      atCommit: (sha: string) => `at commit ${sha}`,
      members: (n: number) => `${n} members`,
      kindMeta: 'Kind',
      kinds: {
        function: 'Function',
        constant: 'Constant',
        interface: 'Interface',
        type: 'Type',
        class: 'Class',
      },
      targetNames: { wgsl: 'WGSL (WebGPU)', glsl: `${glsl} (WebGL2)`, cpu: 'CPU oracle' },
      support: {
        native: 'Supported',
        emulated: 'Emulated',
        stub: 'Stub',
        none: 'Not supported',
        'n/a': 'Does not apply',
      },
      categories: apiCategories,
    },
    // The language reference at /reference/: the words around the entries generated from the
    // compiler's own language service (src/lib/language-reference.ts). The signature and the
    // sentence under every name are the compiler's, in English on every locale, the way the
    // API reference already carries its JSDoc.
    reference: {
      title: 'TypeShade language reference for shader authors',
      description: `Every name a \`"use typeshade"\` file can write, ${facts.languageEntries} of them: types, attributes, builtin values, functions, constants and \`Math\` members.`,
      h1: 'Language reference',
      intro: `The language a file that starts with \`"use typeshade"\` is written in. ${facts.languageEntries} names, read from the compiler's own language service at commit ${facts.pinnedCommit}, which is the table the editor answers a hover from.`,
      audience:
        'This is the reference for shader authors. The surface a host application and the [`fn()`](apiFn) builder call is the [compiler API reference](api).',
      reference: 'Reference',
      breadcrumbs: 'Breadcrumbs',
      note: `The signature and the sentence under each name are the compiler's own text at commit ${facts.pinnedCommit}.`,
      readingH: 'Reading an entry',
      numberP:
        'A `number` in a parameter or a return position is the scalar slot. The ambient file declares a GPU scalar as a branded number whose brand is optional, so a literal and any branded scalar both fill it.',
      widthP:
        "A declaration you write still needs a width, and a bare `number` on a field or a parameter is refused; [the TypeScript constructs page](languageFromTypescript) carries that row with the compiler's own message.",
      positionsP:
        'A parameter named by position (`a0`, `a1`) carries a name the ambient file generates. A call passes its arguments in order and names none of them.',
      helpersP:
        'A signature may name a type the ambient file declares for its own use. These are those declarations.',
      swizzlesP: (n: number) =>
        `The \`…\` line stands for ${n} more members, the swizzles. A swizzle reads two to four components as a new vector of the same element type. The components come in any order and may repeat, and their letters come from one set, \`xyzw\` or \`rgba\`.`,
      readingP: `An entry holds the declaration the editor loads for that name, the compiler's sentence about it, and for a builtin function the WGSL and the ${glsl} text each backend writes. The [builtin table](languageBuiltins) is the scanning view over the same calls, four columns wide.`,
      sourceP:
        'Every entry on these pages is read from the compiler at the pinned commit, and none of it is typed here.',
      entries: (n: number) => `${n} names`,
      signature: 'Signature',
      emits: 'Emits',
      wgsl: 'WGSL',
      glsl,
      noForm: 'No form on this target.',
      preEmit: 'Rewritten into a pair of `f32` lanes before either backend runs.',
      inTable: 'Builtin table',
      validIn: 'Valid in',
      anyStage: 'The compiler holds this id to no stage of the pipeline.',
      stageRule: (stage: string, direction: string) => `${stage} ${direction}`,
      stages: { vertex: 'vertex', fragment: 'fragment', compute: 'compute' },
      directions: { input: 'input', output: 'output' },
      // The title of a kind page, with the longest suffix that stays inside the 60 characters
      // check-seo.mjs allows; the shortest name plus the shortest suffix stays over its
      // 45-character floor.
      kindTitle: (name: string) => {
        const suffixes = [
          ', the TypeShade language reference for shaders',
          ', the TypeShade language reference',
          ', TypeShade language reference',
          ', TypeShade',
        ];
        return name + (suffixes.find((suffix) => (name + suffix).length <= 60) ?? '');
      },
      // One documented name on a page of its own, at /reference/<kind>/<name>/. The page
      // keeps MDN's order, the order /api/ already keeps: Syntax, Parameters, Return value,
      // Description, Targets, Examples, See also, and leaves out a section the compiler
      // supplies nothing for.
      entry: {
        // The title carries the name and what kind of name it is, and takes the longest
        // suffix that stays inside the 60 characters check-seo.mjs allows. Measured over
        // every name in the reference, the shortest of them `E` and the longest
        // `textureSampleCompareLevel`: the titles run from 45 to 60 characters.
        title: (name: string, kind: string) => {
          const suffixes = [
            `: ${kind} in the TypeShade language reference`,
            `: ${kind}, TypeShade language reference`,
            `: ${kind}, TypeShade reference`,
          ];
          return (
            name +
            (suffixes.find((suffix) => (name + suffix).length <= 60) ??
              suffixes[suffixes.length - 1]!)
          );
        },
        // 'attribute' is the one kind that starts with a vowel, so the article follows the word.
        description: (name: string, kind: string, summary: string) =>
          `${name}, ${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind} in the TypeShade language reference. ${summary}`,
        kindNames: {
          type: 'Type',
          attribute: 'Attribute',
          builtin: 'Builtin value',
          function: 'Function',
          constant: 'Constant',
          math: 'Math member',
        },
        kindWords: {
          type: 'type',
          attribute: 'attribute',
          builtin: 'builtin value',
          function: 'function',
          constant: 'constant',
          math: 'Math member',
        },
        kindMeta: 'Kind',
        syntax: 'Syntax',
        parameters: 'Parameters',
        returnValue: 'Return value',
        descriptionHeading: 'Description',
        targets: 'Targets',
        examples: 'Examples',
        seeAlso: 'See also',
        optional: 'optional',
        // A decorator, under its Parameters heading. `@vertex` is written on its own, and
        // `@compute` has that form beside the one that takes a workgroup size, so the two
        // lines are apart. The third names the values the declaration carries for the
        // TypeScript decorator runtime, which a call never writes.
        decoratorNone: 'This decorator is written on its own and takes no arguments.',
        decoratorBareToo: 'It is also written on its own, with no arguments.',
        decoratorProtocol:
          'The declaration also names what the TypeScript decorator runtime hands a decorator, `target` and `context`. A call passes neither.',
        // What the CPU oracle does with the name, from the two tables it keeps its own
        // builtins and its GPU stubs in. The wording is the one the API reference's Targets
        // table already gives the same two cases.
        oracleEvaluates: 'Evaluated in f64 by the CPU oracle.',
        oracleStub:
          'The CPU oracle has no texture memory and no neighbouring fragments. The call throws unless the module was compiled with `{ gpuStubs: true }`, which returns a placeholder.',
      },
      kinds: {
        type: {
          name: 'Types',
          summary: 'The scalar, vector, matrix and memory types a declaration names.',
          description: `The ${facts.languageTypes} types a \`"use typeshade"\` file declares a value with: the scalars, the vectors, every matrix, the textures and samplers, and the memory the GPU holds.`,
        },
        attribute: {
          name: 'Attributes',
          summary: 'The decorators that mark an entry point and bind a field to the pipeline.',
          description: `The ${facts.languageAttributes} decorators the compiler reads: they mark an entry, bind a field to the pipeline, qualify a varying or an output, or set how an entry reports a check.`,
        },
        builtin: {
          name: 'Builtin values',
          summary: 'The `@builtin(...)` ids the pipeline supplies, with the stage each belongs to.',
          description: `The ${facts.languageBuiltinValues} \`@builtin(...)\` ids the pipeline hands a shader or takes back from it, each with the type WGSL fixes for it and the stage it belongs to.`,
        },
        function: {
          name: 'Functions',
          summary: 'The functions a shader calls, by family, with the text each backend writes.',
          description: `The ${facts.languageFunctions} functions a shader calls, by family, each with its signature and with the WGSL and ${glsl} text the compiler writes for it.`,
        },
        constant: {
          name: 'Constants',
          summary: 'The compile-time literals the compiler inlines, and `discard`.',
          description: `The ${facts.languageConstants} names a shader reads without declaring them: the maths literals the compiler inlines at compile time, and the fragment \`discard\`.`,
        },
        math: {
          name: 'Math members',
          summary: 'The `Math` members a shader may reach, each routed to a builtin or a literal.',
          description: `The ${facts.languageMathMembers} \`Math\` members a shader may reach. Each one routes to a builtin call or to an inlined literal, so a familiar name compiles to the target's own.`,
        },
      },
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
        f64: 'Emulated double',
        constructors: 'Constructors',
        resources: 'Arrays and bindings',
      },
    },
    // The error codes at /reference/errors/: one page per code in the compiler's two
    // registries (src/lib/error-codes.ts). The registry text and every compiler message stay
    // the compiler's own English in every language; these are the words around them.
    errors: {
      title: 'TypeShade error codes: every compiler diagnostic, by code',
      description: `The ${facts.errorCodesTs} front-end codes and ${facts.errorCodesSd} core codes the TypeShade compiler reports, each with its meaning and, where a program can raise it, that program fixed.`,
      summary: 'The code on a diagnostic, what it means and how to fix it.',
      h1: 'Error codes',
      intro: `Every code the compiler puts on a diagnostic, read from its two registries at commit ${facts.pinnedCommit}. The \`"use typeshade"\` front end has ${facts.errorCodesTs} codes and the core IR layer under it has ${facts.errorCodesSd}.`,
      verified: (n: number) =>
        `${n} pages carry a program that raises the code and the same program fixed. Both are compiled at build time against the pinned compiler, and the build stops when a program no longer raises its code or a fix no longer compiles clean. A row with an Example tag is one of them.`,
      note: "The registry text and every compiler message on these pages are the compiler's own English.",
      codes: (n: number) => `${n} codes`,
      frontEndH: 'Front-end codes',
      frontEndP:
        'The `TS80xx` codes, from `TS_CODES` in the front end. A `"use typeshade"` file is checked against these before any IR is built.',
      coreH: 'Core codes',
      coreP:
        'The `SDxxxx` codes, from the `CODES` catalogue in `typeshade/dev`. The core IR layer raises them under the [`fn()`](apiFn) builder and under a `"use typeshade"` file alike, and the front end refuses many of the same mistakes first under a code of its own.',
      numberingH: 'Numbering',
      numberingP: "The front end's registry explains its numbers in its own header:",
      exampleTag: 'Example',
      groups: {
        file: 'The file',
        types: 'Types and names',
        functions: 'Functions and classes',
        controlFlow: 'Control flow',
        entries: 'Entry points and IO',
        resources: 'Resources and memory',
        f64: 'Emulated double',
        targets: 'Targets',
        builder: 'Builder calls',
        lint: 'Lint rules',
        portable: 'Portable kernels',
        retired: 'Retired numbers',
        other: 'Other codes',
      },
      // One code on a page of its own, at /reference/errors/<code>/. The page keeps MDN's
      // order for an error: the code and what it means, when it fires, an example, how to
      // fix it and see also, then the source lines, and leaves out a section with nothing
      // true to put in it.
      entry: {
        // The first candidate that lands inside the 45 to 60 characters check-seo.mjs allows.
        // An SD code carries its summary, a TS code its constant, and a retired number only
        // itself. Measured over every code at the pin, the titles run from 45 to 60.
        title: (head: string, summary: string) => {
          const candidates = [
            ...(summary
              ? [
                  `${head}: ${summary}, a TypeShade error code`,
                  `${head}: ${summary} in TypeShade`,
                  `${head}: ${summary}`,
                ]
              : []),
            `${head}: an error code of the TypeShade compiler`,
            `${head}: a TypeShade compiler error code`,
            `${head}: TypeShade error code`,
          ];
          return (
            candidates.find((t) => t.length >= 45 && t.length <= 60) ??
            candidates[candidates.length - 1]!
          );
        },
        description: (head: string, line: string) =>
          `${head}, an error code of the TypeShade compiler. ${line}`,
        fill: 'Its page quotes the registry, shows where the compiler raises it and how to fix it.',
        kindTs: 'Front-end code',
        kindSd: 'Core code',
        kindRetired: 'Retired number',
        kindMeta: 'Kind',
        undocumented:
          'The registry has no documentation comment for this constant, so the line above is written by this site from the messages the compiler raises it with.',
        whenH: 'When it fires',
        exampleH: 'Example',
        fixH: 'How to fix it',
        frontEndH: 'In the front end',
        seeAlsoH: 'See also',
        sourceH: 'Source',
        // The design rules the code enforces (src/lib/design-rules.ts): a rule whose Enforced by
        // names the code, or a rule the code's registry text names.
        ruleH: (n: number): string =>
          n === 1 ? 'The rule this enforces' : 'The rules this enforces',
        compiled: 'Compiled at build time against the pinned compiler, this program gets:',
        backend:
          'Compiled at build time against the pinned compiler, this program gets a `TS8015` diagnostic, the front end reporting a backend that refused the module. The error the backend threw carries the code:',
        diagnose:
          '`compile()` does not run the lint rules. `diagnose()` from `typeshade/dev` does, on the module `compile()` returns, and reports:',
        deprecations:
          'Compiled with `{ deprecations: true }`, the option that turns this warning on.',
        consoleGpu:
          "Compiled with `{ console: 'gpu' }`, the option under which the WGSL records console calls.",
        hint: "The registry's hint:",
        fixed: 'The same program, corrected. It compiles with no diagnostic.',
        fixedDiagnose:
          'The same program, corrected. It compiles with no diagnostic, and `diagnose()` no longer reports the code.',
        lineAt: (line: number) => `line ${line}`,
        retired:
          'This number is retired. No diagnostic carries it, and the registry never gives it to another rule.',
        frontEnd:
          'A `"use typeshade"` file never reaches this check with the same mistake: the front end refuses it first, under its own code. This program, compiled at build time, gets:',
        builder:
          'No `"use typeshade"` program on this site raises this code, so the page has no example. The [`fn()`](apiFn) builder builds the IR directly and reaches the check at the lines under Source.',
        internal:
          'The registry calls this an internal invariant: it means the compiler itself went wrong, and no program is meant to raise it.',
        unwritten: 'No example is written for this code at this commit yet.',
        sourceP: (commit: string) =>
          `Where the compiler raises this code at commit ${commit}, one line per file:`,
        sites: (n: number) => (n === 1 ? 'one site' : `${n} sites`),
        noSites: 'The compiler source names this code nowhere outside its registry.',
        index: 'Error codes',
        builderPage: 'The `fn()` builder',
      },
      // The line a front-end code leads with where its constant has no JSDoc. When the
      // registry documents one of these, the build stops and asks for its line to go.
      lines: {
        MISSING_DIRECTIVE:
          'A file compiled as TypeShade that has no `"use typeshade"` directive at all.',
        UNKNOWN_TYPE: 'A type name the compiler does not know.',
        TYPE_MISMATCH:
          'Two types that do not fit where they meet: an operator, a declaration, a return or an argument.',
        UNKNOWN_FN: 'A call to a function the file neither declares nor imports.',
        CONST_ASSIGN:
          'An assignment to a name that cannot change, such as a `const` or a read-only resource.',
        LOOP_BOUND:
          'A counted `for` loop whose exit the compiler cannot prove: the counter is not compared to a bound, or the body writes the bound.',
        LOOP_INFINITE:
          'A loop that certainly never ends: `while (true)` with no `break` or `return`, or a step that moves the counter away from its bound.',
        LOOP_INDUCTION:
          'A `for` loop whose counter is not one `let` of type `i32` or `u32`, or whose update is not a constant step.',
        BREAK_OUTSIDE: 'A `break` with no loop or `switch` around it.',
        STRUCT_FIELD:
          "A struct literal or an entry's IO that does not match its declaration: a field missing, a field the struct does not have, or a `@location` that does not line up.",
        HOST_API: 'A JavaScript host API, such as `window` or `fetch`, named inside a shader file.',
        HOST_STMT:
          'A JavaScript statement a shader has no form for, such as `try`, `throw` or `await`.',
        TOP_LEVEL:
          'Something at the top level of the file the compiler cannot declare: a bare statement, or a module-level declaration of a shape it refuses.',
        BACKEND:
          "A backend that refused to emit a module the front end accepted. The message is the backend's own.",
        INDEX_OOB: 'A constant index outside the length of what it indexes.',
      },
    },
    // The design rules at /reference/rules/: one page per rule of the compiler's design
    // document, read from its traceability tree (src/lib/design-rules.ts). The rule text and
    // the parts under it stay the compiler's own English in every language; these are the
    // words around them.
    rules: {
      title: "TypeShade design rules: the language's rules, by chapter",
      description: `The ${facts.rules} rules the TypeShade language is designed by, each with its rationale, what it derives from, how it is verified and the error codes that enforce it.`,
      summary: 'What the language may contain and how it may change, one rule per page.',
      h1: 'Design rules',
      intro: `Every rule of the compiler's design document, \`docs/language-design.md\`, read from its traceability tree at commit ${facts.pinnedCommit}. A rule constrains an author writing a \`"use typeshade"\` file or the compiler itself. Each one states one requirement, why it holds, what it derives from, and where the compiler enforces it.`,
      verifiedP: 'How each rule is verified, as the traceability tree records it:',
      note: "The rule text and the parts under it are the compiler's own English, as the design document writes them.",
      rulesCount: (n: number) => `${n} rules`,
      // The badge a row and a page carry, one per value of `verification` in the item.
      kinds: {
        test: 'Test',
        code: 'Code only',
        pending: 'Not enforced',
        review: 'Review',
      },
      // What each value means, the way reqs/README.md in the compiler defines it.
      kindCounts: {
        test: `${facts.rulesTest} rules: a test, a gate script or a CI workflow names the rule.`,
        code: `${facts.rulesCode} rules: only the implementation carries the rule, and no test checks it yet.`,
        pending: `${facts.rulesPending} rule: listed as not yet enforced, in Appendix B of the design document.`,
        review: `${facts.rulesReview} rules: held by review, and no file checks them.`,
      },
      // The chapters of the design document, as its headings name them. The build holds this
      // list to the headings at the pin, so a renamed chapter stops it here.
      chapters: {
        1: 'Introduction',
        2: 'Sources of the surface',
        3: 'Textual structure and names',
        4: 'Types',
        5: 'Literals and typing',
        6: 'Declarations and resources',
        7: 'Expressions and statements',
        8: 'Functions and entry points',
        9: 'Built-in functions and the TypeShade extensions',
        10: 'Extensions and capabilities',
        11: 'Targets and the oracle',
        12: 'Diagnostics',
        13: 'Change control',
      } as Record<number, string>,
      chapterH: (n: number, title: string) => `${n}. ${title}`,
      guaranteesP:
        '[What is guaranteed](rulesGuarantees) lists the rules of each kind, with the files that verify each one.',
      // The note a guide page shows beside a rule it names that nothing checks yet, by the
      // rule's `verification` at the pin. A rule a test or review holds gets none.
      flags: {
        pending: 'not yet enforced by the compiler',
        code: 'no test checks this yet',
      },
      // What moved in the rules since the pin before this one, on the index
      // (src/lib/rule-history.ts). The compiler has no release yet, so a version of the language
      // here is a commit the site pinned.
      changes: {
        h: 'Changes since the previous pin',
        first: (current: string) =>
          `The site records no pin before ${current}, so there is nothing to compare its rules with.`,
        predates: (previous: string, date: string, current: string) =>
          `The previous pin, ${previous} (${date}), predates the compiler's traceability tree, which this pin, ${current}, is the first to carry. There is nothing to compare the rules with yet. From the next pin on, this section lists the rules added, removed or changed since the one before.`,
        none: (previous: string, current: string) =>
          `No rule was added, removed or changed between the previous pin, ${previous}, and this one, ${current}.`,
        lead: (previous: string, date: string, current: string) =>
          `Between the previous pin, ${previous} (${date}), and this one, ${current}, as the compiler's traceability tree records them. A rule changed when its fingerprint moved, which happens when its text or the files that verify it change.`,
        counts: `${facts.rulesAdded} added, ${facts.rulesRemoved} removed, ${facts.rulesChanged} changed.`,
        addedH: 'Added',
        removedH: 'Removed',
        changedH: 'Changed',
        was: (kind: string) => `verified as ${kind} before`,
        commits: 'compiler commits',
        removedItem: 'its item at the previous pin',
      },
      // The rules grouped by how each is verified, at /reference/rules/guarantees/.
      guarantees: {
        title: 'What TypeShade guarantees: its design rules, by verification',
        description: `How each of the ${facts.rules} TypeShade design rules is held: ${facts.rulesTest} checked by a test, ${facts.rulesCode} by the implementation alone, ${facts.rulesPending} not yet enforced and ${facts.rulesReview} by review, with the files that verify each.`,
        h1: 'What is guaranteed',
        lead: `The compiler's traceability tree records how each design rule is held at commit ${facts.pinnedCommit}: a test checks it, only the code that carries it out names it, nothing checks it yet, or review holds it. Below, the ${facts.rules} rules under those four headings, each with its first sentence and the files that verify it at the pin.`,
        heads: {
          test: 'Checked by a test',
          code: 'Implementation only, no test yet',
          pending: 'Not yet enforced',
          review: 'Held by review',
        },
        // One sentence under each heading, led by the count.
        groups: {
          test: `${facts.rulesTest} rules. A test, a gate script or a CI workflow names each one, and the compiler's traceability check fails when a listed file stops naming its rule.`,
          code: `${facts.rulesCode} rules. The implementation names each one in an \`Implements:\` tag, and no test checks it yet: each is a gap for a test to close. A guide page that names one of these rules says so beside the name.`,
          pending: `${facts.rulesPending} rule. Appendix B of the design document lists it as not yet enforced, and no file checks it. A guide page that names it says so beside the name.`,
          review: `${facts.rulesReview} rules. Each one says review holds it, and no file checks it.`,
        },
        none: 'No rule is held this way at the pin.',
        filesLabel: {
          test: 'Verified by',
          code: 'Implemented in',
        },
      },
      // One rule on a page of its own, at /reference/rules/<n-m>/.
      entry: {
        // The first candidate that lands inside the 45 to 60 characters check-seo.mjs allows.
        title: (rule: string, chapter: string) => {
          const candidates = [
            `Rule ${rule}: ${chapter}, a TypeShade design rule`,
            `Rule ${rule}, ${chapter}: a TypeShade language design rule`,
            `Rule ${rule}: ${chapter} in the TypeShade language`,
            `Rule ${rule}: ${chapter} in TypeShade`,
            `Rule ${rule}: ${chapter}`,
            `Rule ${rule}: a design rule of the TypeShade shader language`,
          ];
          return (
            candidates.find((t) => t.length >= 45 && t.length <= 60) ??
            candidates[candidates.length - 1]!
          );
        },
        heading: (rule: string) => `Rule ${rule}`,
        description: (rule: string, chapter: string, line: string) =>
          `Rule ${rule} of the TypeShade language design, in ${chapter}. ${line}`,
        fill: 'Its page gives the rationale, the sources, and the files and error codes that hold it.',
        kindLine: (n: number, title: string) => `Chapter ${n}, ${title}`,
        kindMeta: 'Verification',
        rationaleH: 'Rationale',
        derivesH: 'Derives from',
        verifiedH: 'How it is verified',
        explainedH: 'Explained in',
        codesH: 'Error codes that enforce it',
        seeAlsoH: 'See also',
        sourceH: 'Source',
        // How it is verified, one sentence per value of `verification`.
        how: {
          test: 'Checked by a test. A test, a gate script or a CI workflow names this rule, and the traceability check fails when a file listed below stops naming it.',
          code: 'Only the implementation carries it; no test checks it yet. The file below names the rule in an `Implements:` tag.',
          pending:
            'Listed as not yet enforced. Appendix B of the design document records the rule, and no file checks it.',
          review: 'Held by review. No file checks it, and the rule names review as what holds it.',
        },
        enforcedP: 'Where the rule says the compiler enforces it:',
        filesP: (commit: string) =>
          `The files that verify it at commit ${commit}, each at the first line that names the rule:`,
        evidence: "checked by the compiler's own test",
        explainedP: (commit: string) =>
          `The sections of the surface document that explain this rule, at commit ${commit}:`,
        section: (n: number, title: string) => `§${n} ${title}`,
        codesP:
          'The diagnostic codes the rule names under Enforced by, or whose registry text names the rule:',
        sourceP: (commit: string) => `The rule at commit ${commit}:`,
        designDoc: 'the design document',
        item: 'its traceability item',
      },
    },
  },
  // The Playground at /playground/: the words around the Monaco editor and the WGSL the
  // compiler writes from what is typed into it. Monaco carries its own English inside the
  // editor box.
  playground: {
    h1: 'Playground',
    intro:
      'Write a TypeShade TypeScript file, compile it in your browser, and inspect the generated WGSL and diagnostics.',
    fileName: 'hello.shade.ts',
    help: 'Author TypeShade in a Monaco editor and compile it here.',
    run: 'Compile',
    reset: 'Reset example',
    editor: 'TypeShade source',
    output: 'Compiler output',
    // The tabs over the result column: the canvas the module draws, one per file the
    // compiler emits, and the reflection. `reflection` below names the last one.
    resultTab: 'Result',
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
    cpuNoResources:
      'The CPU oracle takes entry arguments only, so an entry that reads a uniform or a storage binding cannot run here yet.',
    canvas: 'CPU canvas',
    // The Result tab draws on the backend the reader picks: the GPU in the runtime's own
    // order, WebGPU alone, WebGL2 alone, or the CPU oracle, which runs the fragment entry once
    // per pixel. The GPU runs the very program the WGSL and GLSL tabs hold, through the
    // runtime every figure on the site uses. `WebGPU` and `WebGL2` are the options' own names.
    engine: 'Draw with',
    engineGpu: 'GPU',
    engineCpu: 'CPU oracle',
    gpuIdle: 'Compile a module with a vertex entry and a fragment entry to see it drawn.',
    gpuWebgpu: 'Running on WebGPU.',
    gpuWebgl2: 'Running on WebGL2.',
    gpuNone:
      'This browser has no WebGPU and no WebGL2, so nothing drew. The CPU oracle still runs.',
    gpuNoWebgpu:
      'You picked WebGPU, and this browser has no WebGPU device, so nothing drew. GPU falls back to WebGL2.',
    gpuNoWebgl2: 'You picked WebGL2, and this browser has no WebGL2 context, so nothing drew.',
    gpuNoGlsl:
      'This module has no GLSL ES 3.00 form, so WebGL2 has nothing to run. WebGPU runs its WGSL.',
    gpuNoGlslFeatures:
      'GLSL ES 3.00 has no {features}, which this module needs, so WebGL2 has nothing to run. WebGPU runs its WGSL.',
    gpuNoFeature:
      'This GPU does not offer the WebGPU feature {features}, which this module needs, so nothing drew.',
    gpuFailed: '{backend} could not run this program: {reason}',
    gpuNeedsStages:
      'Drawing needs a vertex entry and a fragment entry. This module has no such pair.',
    gpuNeedsAttributes:
      'The canvas draws three vertices and binds no vertex buffer. This module reads {fields} from one, so the GPU cannot run it here.',
    gpuNeedsBindings:
      'The bindings panel has no value for {names}, so this module cannot run here.',
    computeNeedsWebgpu:
      'A compute entry runs on WebGPU or on the CPU oracle. GLSL ES 3.00 has no compute stage.',
    computeRan:
      'Ran {entry} over {invocations} invocations on {backend} in {ms} ms. The canvas plots what it wrote.',
    // The Console tab: the lines a compute run's console calls delivered, from the CPU oracle's
    // sink or, on WebGPU, from the console buffer the compiler adds (surface §66). A module that
    // draws logs one clicked pixel at a time, run on the CPU oracle.
    consoleTab: 'Console',
    consoleIdle:
      'Call `console.log` in a shader to see its lines here. A compute module logs every invocation; in a module that draws, click a pixel of the canvas.',
    consoleLines: '{lines} lines from {backend}, in the order the CPU runs the invocations.',
    consoleNone: 'The run on {backend} logged nothing.',
    consoleDropped: '{dropped} more lines did not fit the buffer.',
    consoleMore: '{more} more lines are not shown.',
    consoleIndex: '(index)',
    consoleValue: 'Value',
    consolePixelHint:
      'This module draws, and its fragment entry runs once for every pixel. Click a pixel of the canvas to see what that pixel logs.',
    consolePixel:
      'What pixel ({x}, {y}) logged. It ran on the CPU oracle with the inputs the canvas gives it.',
    consolePixelNone: 'Pixel ({x}, {y}) reached no console call.',
    consolePixelOutside:
      'Pixel ({x}, {y}) is outside the triangle the vertex entry draws, so no fragment runs there.',
    consolePixelFailed: 'Pixel ({x}, {y}) did not run on the CPU oracle: {reason}',
    consolePixelNoRaster:
      "The CPU oracle cannot place this module's triangle. Its vertex entry needs `vertex_index` or the generated vertices, and a `position` output.",
    pixelNote: 'Console lines from pixel ({x}, {y}): {lines}.',
    // The panel under the canvas: one block per binding the module declares, with what the
    // reader supplies it with. The texture sources and matrix presets are the choices a
    // select offers; the filter and address values are WebGPU's own words and stay in code.
    bindings: {
      title: 'Bindings',
      empty: 'This module binds nothing.',
      runtime: 'filled by the page every frame',
      overrides: 'Overrides',
      source: 'source',
      sources: {
        checker: 'UV checker',
        gradient: 'Gradient',
        noise: 'Noise',
        solid: 'Solid colour',
        faces: 'Cube faces',
        image: 'Your image',
      },
      dropImage: 'image file',
      depthRamp: 'A depth ramp from 0 at the top left to 1 at the bottom right.',
      filter: 'filter',
      address: 'address',
      compare: 'compare',
      preset: 'preset',
      presets: { identity: 'Identity', camera: 'Camera on the origin', turn: 'Turn about Y' },
      fill: 'fill',
      elements: 'elements',
      written: 'After the dispatch',
      size: 'size',
      noControl: 'No control for',
      hostOwned:
        'The host owns this binding. Here the page supplies a stand-in value, which you can change.',
      vertices:
        'The vertex entry reads these from a buffer. The page gives it the three corners of a triangle, each input filled by what it is called.',
    },
    draw: 'Draw on the CPU',
    stop: 'Stop',
    canvasIdle: 'Run the fragment entry once per pixel, with no GPU.',
    resolution: 'Resolution',
    canvasTooBig:
      'This browser will not back a canvas this large, so nothing can be drawn at this resolution. Choose a smaller one.',
    canvasProgress: '{done}/{total} tiles, {running} running, {waiting} waiting',
    canvasDrawn: '{px} px in {ms} ms on {workers} worker(s)',
    canvasNeedsVertex:
      'Drawing needs a vertex entry driven by vertex_index and a fragment entry. This module has no such pair, so there is no triangle to cover.',
    // What the canvas says when the pair is there and the three corners it got have no area.
    // The canvas runs the vertex entry at the indices 0, 1 and 2 and has no value for any
    // other input, so it leaves those at zero, and a stage that reads one collapses.
    canvasFlat:
      'The vertex entry returned three corners with no area between them, so there is no triangle to cover.',
    canvasFlatInputs:
      'The canvas runs the vertex entry at the indices 0, 1 and 2 and has no value for {fields}, so it left those at 0. The three corners it got back have no area between them.',
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
    // Shown while the file declares no `@vertex` entry of its own, which is when the page
    // compiles it behind the fullscreen triangle src/lib/live-shader-contract.ts fixes.
    preludeNote:
      'This file declares no `@vertex` entry, so it is compiled behind a fullscreen triangle that hands the fragment stage a `uv` running 0 to 1. The tabs and the canvas show that program.',
    // The emit options the compiler takes, as controls over what the code tabs show.
    emit: {
      title: 'Emit options',
      optimization: 'WGSL optimization',
      levels: { O0: 'O0 (no passes)', O1: 'O1 (value-safe)', O2: 'O2 (default)' },
      parens: 'Parentheses',
      minify: 'Minify',
      numbers: 'Number literals',
      obfuscate: 'Obfuscate',
      fp64: 'f64 emulation',
      precision: `${glsl} float precision`,
      levelNote:
        'At O0 and O1 the compiler emits WGSL from the level alone, so parentheses, minify, the number literals, obfuscate and the f64 emulation reach the GLSL tabs only. The f64 emulation still reaches the reflection at every level, since `reflect()` takes it on its own.',
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
    outputNote:
      'The whole module the compiler saw. The page added the vertex entry and the `VsOut` struct it returns; the rest is the file above.',
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
    error: (code: number, line: number, column: number) =>
      `error TS${code} at line ${line}, column ${column}:`,
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
      caption:
        'The file on the left, drawn on the right. Edit a line or move a control and the picture follows.',
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
      p: `${facts.examples} examples ship with the compiler, from cartographic passes to a compute kernel. Each tile is the frame its shader drew at build time, and opens the page that runs it.`,
      all: 'All examples',
      /** What a canvas of one example says under it, by what drew the frame. The front page's
       *  tiles are stills and carry none of this; the example's own page runs the shader. */
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
        [
          '"use typeshade"',
          'The directive is the language boundary',
          "It is the first statement of the file, where a JavaScript directive goes. A file without it does not compile as a shader; with it, everything under it is checked as TypeShade and lowered to the compiler's intermediate representation.",
        ],
        [
          'f32, vec3, mat4, sin(x)',
          'GPU types and builtins are globals',
          '`f32`, `vec3`, `mat4` and the builtins such as `sin` and `vec4(...)` need no import, and `Math.sin` and `Math.PI` are aliases of the same operations. The checker applies the shader rules to them in the editor, before any code is emitted.',
        ],
        [
          'class VsIn { @location(0) uv: vec2 }',
          'A type or a class is a value layout',
          'Plain data is a `type` alias; a `class` carries per-field metadata such as `@location` and `@builtin`, and its fields lay out the struct both targets receive.',
        ],
        [
          'new Circle(center, 0.3).coverage(p)',
          'A class is a TypeScript class',
          'Fields, a constructor and `new`, methods and static functions, `extends` with `super` and `abstract`, generic classes and functions, and the mixin pattern all compile. A method lowers to a function that takes the struct first, and a generic is compiled once per set of type arguments. The [gallery](examples) has a file for each of them.',
        ],
        [
          'declare const u: uniform<Camera>',
          'declare names a resource the host fills',
          '`uniform<T>` reads a uniform block, and `storage<T, "read_write">` is a storage buffer the shader writes. There is no initializer: the host owns the slot, in the order the file declares them, and [`reflect()`](apiReflect) reports its layout.',
        ],
        [
          '@fragment export function fs(v: VsOut): vec4',
          'A decorated export is an entry point',
          '`@vertex`, `@fragment` and `@compute([64, 1, 1])` name the stage; a function without one is a helper. Stage inputs are explicit parameters, a `@builtin("vertex_index")` or a `@location`. There is no hidden global.',
        ],
      ],
    },
    oracle: {
      h: 'Checked against the CPU',
      p: "The same module runs on the CPU in f64, and [the test suite](checks) checks the compiler's algebra against it. Every emit is compiled on Tint and linked on WebGL2 on each push. Below, the gradient pass drawn by each backend from the same file.",
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
      boundaryP:
        'TypeShade source is authored with TypeScript syntax, but a file marked with `"use typeshade"` follows the shader language rules. TypeScript types and syntax form the authoring surface; TypeShade GPU types, resources and shader-stage rules define the shader semantics.',
      boundaryBullets: [
        '`"use typeshade"` declares the language boundary.',
        'GPU entry inputs are explicit parameters such as `@builtin(...)`, not hidden globals.',
        'Resource types such as `uniform<T>` and `storage<T>` express GPU resource semantics.',
      ],
      hostWgslLabel: 'Where the host consumes WGSL',
      hostP1:
        'TypeShade is not the rendering runtime. Write and compile the shader in TypeScript, then let the host application pass the generated WGSL or GLSL ES 3.00 source to WebGPU or WebGL2.',
      hostP2:
        'TypeShade owns the language semantics and shader emission. The host owns runtime objects and their lifetimes, including the device, pipeline, bind groups, buffers, textures and command encoders.',
      nextLearnP: 'Now connect familiar TypeScript concepts to their TypeShade GPU meaning.',
      nextLinks: nextLinks([
        { linkKey: 'languageTypes', label: 'Types: value shapes and GPU structs' },
        { linkKey: 'languageFunctions', label: 'Functions: helpers and entry points' },
        { linkKey: 'languageControlFlow', label: 'Control flow: GPU execution' },
        { linkKey: 'languageGpuTypes', label: 'GPU types: scalars, vectors, matrices and arrays' },
        { linkKey: 'languageResources', label: 'Resources: uniform and storage' },
        { linkKey: 'languageStages', label: 'Shader stages: compute, vertex and fragment' },
      ]),
      nextLearnAllLink: 'Read the full Language Guide',
    },
    title: 'Use TypeShade: install and write your first shader',
    description:
      'Add TypeShade as a git submodule and compile a file that starts with "use typeshade", with a note on the pre-release status.',
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
      description:
        'Learn TypeShade as a shader language: start from TypeScript concepts, cross the use typeshade boundary, and compile to host-ready GPU code.',
      h1: 'A shader language that starts in TypeScript',
      sections: [
        [
          'What does TypeShade change?',
          'TypeShade is not a runtime that executes ordinary TypeScript on the GPU. It starts from familiar TypeScript syntax and tooling, then interprets the file as a separate shader language with its own types and semantics.',
        ],
        [
          '`use typeshade` is the language boundary',
          'The file-level `"use typeshade"` directive declares a TypeShade program. Once present, the compiler applies TypeShade shader semantics instead of treating the file as ordinary application code. Understanding this line is the first step to understanding the language.',
        ],
        [
          'What stays familiar from TypeScript?',
          'Functions, type annotations, modules, expressions and control flow form the familiar authoring surface. That does not mean every TypeScript feature is available unchanged. TypeShade deliberately constrains features that do not map cleanly to the GPU execution model and reports those constraints statically.',
        ],
        [
          'Where does TypeScript end and TypeShade begin?',
          'TypeScript describes general-purpose program types and execution. TypeShade additionally describes GPU values, vectors and matrices, resources, entry points, target capabilities and shader-specific restrictions. A familiar `function` or `if` still has to make sense for the target GPU program.',
        ],
        [
          'What does the compiler produce?',
          'TypeShade source is lowered to one intermediate representation and then emitted as host-consumable shader source. The current targets are WGSL for WebGPU and GLSL ES 3.00 for WebGL2. There is no TypeShade runtime to ship with the application.',
        ],
        [
          'Where should you go next?',
          'Start with Quick start and make one real `"use typeshade"` file. Then use the Language guide to learn types, values and expressions, functions, control flow and GPU semantics. Move to Verification and the API reference once you know the authoring model.',
        ],
      ],
      familiarH: 'Your TypeScript knowledge is the starting point',
      familiarP:
        'TypeShade keeps familiar language concepts, then makes the GPU-specific differences explicit instead of hiding them in generated shader strings.',
      rows: [
        [
          'Functions',
          'Declarations and calls',
          'Shader functions and entry-point rules are added.',
        ],
        [
          'Types',
          'Annotations and inference',
          'GPU-native values plus vector and matrix types are added.',
        ],
        ['Modules', 'import / export', 'Shader compilation-unit and emit rules apply.'],
        [
          'Control flow',
          'if / for and related syntax',
          'The program must satisfy GPU execution and target constraints.',
        ],
        [
          'Execution',
          'JavaScript runtime',
          'The host executes generated code through WebGPU or WebGL2.',
        ],
      ],
      furtherH: 'Keep the TypeScript and JavaScript references nearby',
      furtherP:
        'TypeShade documentation focuses on what is different. When a TypeScript or JavaScript concept is new to you, use the language references below as the background layer.',
      further: [
        [
          'TypeScript Handbook — Everyday Types',
          'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
          'Types, annotations, unions and other everyday TypeScript concepts',
        ],
        [
          'TypeScript Handbook — Functions',
          'https://www.typescriptlang.org/docs/handbook/2/functions.html',
          'Function declarations, parameters, return types and calls',
        ],
        [
          'MDN — JavaScript Guide',
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          'The JavaScript background for expressions, control flow, functions and modules',
        ],
      ],
      columns: ['Concept', 'Familiar from TypeScript', 'What TypeShade adds'],
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
    description:
      "What TypeShade's CI runs on every push: a CPU oracle in f64, a compile gate on Tint and a real WebGL2 context, and golden files for every emit.",
    h1: 'Verification',
    ciH: 'On every push',
    intro:
      "The repository's CI runs these on every push and pull request, in [the CI workflow](ciGates):",
    items: [
      `The same module compiles to a CPU function that runs in f64 arithmetic. In its default mode only its equality tests round to f32 first, so they agree with the GPU; an f32 mode that rounds after every operation is opt-in. The test suite checks that function against known answers and against a second CPU backend, generated JavaScript, which must match it bit for bit. It says nothing about what rounding does on a driver, and no GPU output is compared against it in this repository. Where WGSL fixes a result and ${glsl} does not, the oracle follows WGSL (Rule 11.5). [src/core/oracle.ts](oracle)`,
      `The compile gate emits every registered example, hands each WGSL emit to Tint inside headless Chromium, and compiles and links both ${glsl} stages of every renderable example on a real WebGL2 context. It also hands each compiler a shader that cannot compile: if either accepts that non-program, the gate fails and the verdicts on the examples do not count. [scripts/compile-gate.ts](compileGate)`,
      'Golden files hold the emitted bytes of every example, so any change in a backend surfaces as a diff in review. [emit-goldens.test.ts](goldens)',
    ],
    pairH: 'The same pass on both backends',
    pairIntro:
      'The gradient pass from the front page, drawn once by each backend. No pixel comparison between the two is committed yet.',
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
    description:
      'How TypeScript types, functions and modules map to TypeShade GPU values, entry points and shader modules, and where WebGPU begins.',
    h1: 'TypeScript and WebGPU concepts',
    lead: 'TypeShade starts from TypeScript authoring and adds GPU-specific semantics. This page connects the concepts you already know to the concepts you need to write shaders.',
    startH: 'Start with a TypeScript file',
    startP:
      '`"use typeshade"` marks the file as a TypeShade compilation unit. The rest of the program still uses familiar TypeScript-shaped constructs: functions, parameters, return types, objects, imports and exports.',
    modelH: 'The mental model',
    adds: 'TypeShade adds',
    model: [
      [
        'TypeScript types',
        'Type annotations describe values and make incorrect programs visible to tooling.',
        'GPU value types such as `f32`, `u32`, `vec2`, `vec3` and `vec4`, plus rules for shader operations.',
      ],
      [
        'Functions',
        'A function has parameters, a return type and a body.',
        'Stage decorators such as `@vertex` and `@fragment` to identify entry points.',
      ],
      [
        'Modules',
        '`import` and `export` define reusable program boundaries.',
        'Shader-module constraints so the compiler can lower the reachable program to GPU code.',
      ],
      [
        'Web APIs',
        'The host application owns devices, pipelines, buffers and rendering.',
        'Shader source and reflection metadata; it does not replace the WebGPU or WebGL host API.',
      ],
    ],
    fitH: 'Where WebGPU fits',
    fitP: 'Think of TypeShade as the authoring and compilation layer above the browser graphics API. TypeShade produces shader code; the application still creates a `GPUDevice`, configures a pipeline, binds resources and submits work.',
    fitLinks: [
      ['TypeScript documentation ↗', 'https://www.typescriptlang.org/docs/'],
      ['MDN WebGPU API ↗', 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'],
      [
        'MDN JavaScript directives ↗',
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode',
      ],
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
      description:
        'What the GPU hands one invocation, why a shader has no heap, no strings and no recursion, and which TypeShade rule follows from each of those facts.',
      h1: 'CPU and GPU',
      lead: 'A TypeShade file is TypeScript to your editor and a GPU program to the compiler. The restrictions the language guide states are not house style. Each one follows from something the hardware does, so this page gives the fact first and the rule after it.',
      invocationH: 'Invocations',
      invocationP:
        'A TypeScript function runs once when you call it. An entry point is called by the GPU instead, once for every vertex in a draw, once for every fragment a primitive covers, and once for every work item in a dispatch. Those runs happen beside each other and cannot read each other. Nothing outside the function tells one of them which one it is.',
      invocationRule:
        'What follows: a stage decorator says which of the three is calling, and a `@builtin(...)` parameter is how an invocation learns its own place in the work. [Shader stages](languageStages) states the decorators and [Functions](languageFunctions) states the parameters.',
      memoryH: 'Memory',
      memoryP:
        'An invocation works in registers and in the buffers and textures the host bound before the draw. There is no heap under it, so a shader has nothing to allocate from, no array that can grow and no string to build. A class in a TypeShade file describes the bytes of a GPU struct, and the host writes those bytes.',
      memoryRule:
        "What follows: `new` builds a value and not an object with identity, the order of a class's fields is the layout of the bytes the host writes, and every resource arrives through `declare`. [Types](languageTypes) states the struct surface and [Resources](languageResources) states the declarations.",
      callsH: 'Calls',
      callsP:
        'A shader has no call stack to return through, and the call graph is flattened before a driver sees it. A function that calls itself, directly or through another function, leaves the compiler with nothing to flatten.',
      callsRule:
        'What follows: recursion is rejected, and a helper is an ordinary function the compiler can follow to its leaves. [Functions](languageFunctions) states what a call may be.',
      loopsH: 'Loops',
      loopsP:
        'The invocations of a stage move through a loop together, and the ones that leave early wait for the rest. A counted loop compares its counter to a bound the body does not write and steps toward it, which is what the compiler checks; the bound itself may be a value the program learns at run time.',
      loopsRule:
        'What follows: a `for` counts toward a bound its body does not move, and a `while` ends where its condition or a `break` says. [Control flow](languageControlFlow) states which conditions and loops compile.',
      typesH: 'Value types',
      typesP:
        'A GPU register has a width and a layout, fixed when the shader is compiled. A variable therefore holds one value type from its declaration to the end of its scope, with no union of two value types and nothing at run time that could choose between them.',
      typesRule:
        'What follows: every value carries a written GPU type such as `f32`, `u32` or `vec4`. [Types](languageTypes) states the type surface and [GPU types](languageGpuTypes) states the values.',
      tableH: 'Facts and rules',
      tableP:
        'The facts above with the rule each produces, and the page of the language guide that states it.',
      tableColumns: ['What the GPU does', 'What TypeShade asks for', 'Stated in'],
      tableRows: [
        [
          'Calls an entry point once per vertex, fragment or work item',
          'A stage decorator on the entry point and a parameter for every builtin input',
          '[Shader stages](languageStages)',
        ],
        [
          'Gives an invocation registers and bound resources, with no heap under them',
          'No growing array and no string; `new` builds a value, a class is a layout and a resource is a `declare`',
          '[Resources](languageResources)',
        ],
        [
          'Runs without a call stack',
          'A call graph the compiler can flatten, so no recursion',
          '[Functions](languageFunctions)',
        ],
        [
          'Moves the invocations of a stage through a loop together',
          'A loop bound the compiler can read',
          '[Control flow](languageControlFlow)',
        ],
        [
          'Holds a value of one width in a register',
          'One value type per variable, written out',
          '[GPU types](languageGpuTypes)',
        ],
      ],
      furtherH: 'Further reading',
      furtherItems: [
        '[WGSL specification](specWgsl) writes down the execution model these facts come from, including what an invocation is and what it may hold.',
        '[MDN WebGPU API](mdnWebgpu) is the browser side of the same model, written for a JavaScript developer.',
      ],
      nextP:
        'Next in this path: [The pipeline](conceptsPipeline), which says what each stage is handed and what it produces.',
    },

    pipeline: {
      title: 'The shader pipeline',
      description:
        'What a vertex stage, a fragment stage and a compute stage are each handed, what each produces, and how an entry point signature maps onto them.',
      h1: 'The pipeline',
      lead: 'A shader never runs on its own. It sits at one of the fixed points of a GPU pipeline, and that point decides what the entry point is handed and what it has to give back. This page describes the points TypeShade emits for, and leaves the syntax to the language guide.',
      stagesH: 'Stages',
      stagesP: 'Each row is one stage of the pipeline the host set up.',
      stagesColumns: ['Stage', 'What it is handed', 'What it produces'],
      stagesRows: [
        [
          'Vertex',
          'One vertex of the draw: its index in the draw, and the fields the host laid out in the vertex buffers.',
          'A clip-space position, and the values the fragment stage will read.',
        ],
        [
          'Fragment',
          'The values the vertex stage produced, weighed for this fragment, and the fragment’s own position.',
          'A value for each colour attachment the pipeline declares.',
        ],
        [
          'Compute',
          'Its own place in the dispatch grid, and the resources the host bound.',
          'Nothing given back; a compute entry writes through the resources it holds.',
        ],
      ],
      entryH: 'Entry points',
      entryP:
        'The signature of an entry point is that stage interface written out. A `@builtin(...)` parameter is a value the stage hands the invocation, such as the vertex index or the fragment position. A struct parameter is per-vertex input in a vertex stage and a weighed value in a fragment stage. The return type is what the stage gives back to the pipeline, so a vertex entry returns a position and a fragment entry returns colour. [Shader stages](languageStages) has the decorators and the spellings; this page stays with the meaning.',
      entryNote:
        'Reading a signature therefore tells you which stage the function belongs to, what the pipeline has to supply, and what the pipeline receives.',
      interpolationH: 'Interpolation',
      interpolationP:
        'Between the vertex stage and the fragment stage the rasterizer works out which fragments a primitive covers. For each of them it weighs the values the vertices produced by how near the fragment lies to each vertex, and hands the fragment stage the result. A vertex entry writes a value per vertex and a fragment entry reads a value per fragment, so the two are different values with the same name.',
      interpolationNote:
        'A float `@location` field is weighed this way unless `@interpolate` asks for another mode. An integer cannot be weighed, so the compiler gives `id` the `flat` qualifier on both targets without being asked, and the fragment reads the value one vertex of the primitive produced. `@interpolate("flat")` asks the same for `tint`. [Types](languageTypes) states the field decorators.',
      computeH: 'Compute',
      computeP:
        'A compute stage has no rasterizer in front of it and no attachment behind it. The host dispatches a grid of work items, the entry point reads its own coordinates in that grid from a builtin parameter, and everything it produces goes through a storage resource. [Resources](languageResources) states how a writable resource is declared.',
      furtherH: 'Further reading',
      furtherItems: [
        '[WebGPU specification](specWebgpu) defines the render and compute pipelines these stages belong to.',
        '[MDN GPURenderPipeline](mdnRenderPipeline) and [MDN GPUComputePassEncoder](mdnComputePass) show the host code that drives them.',
      ],
      nextP:
        'Next in this path: [WebGPU and WebGL2](conceptsWebgpu), which divides the work between the host application and the compiler.',
    },

    webgpuAndWebgl2: {
      title: 'WebGPU and WebGL2',
      description:
        'What the host application owns, what TypeShade owns, how the compiler’s reflection feeds a bind group layout, and where WebGL2 differs.',
      h1: 'WebGPU and WebGL2',
      lead: 'TypeShade produces shader text and the data a host needs in order to bind resources to it. The rest of the GPU side belongs to the application: the device, the pipelines, the bind groups, the buffers and the textures. Knowing which side owns what is most of what a first TypeShade program needs.',
      ownsH: 'Ownership',
      ownsP: 'One row per object a WebGPU application creates.',
      ownsColumns: ['Object', 'What the application does', 'What TypeShade contributes'],
      ownsRows: [
        [
          'Device',
          'Asks for an adapter and a `GPUDevice`, and keeps them for the life of the page.',
          'Nothing. No TypeShade code touches a WebGPU object.',
        ],
        [
          'Pipeline',
          'Creates a render or compute pipeline and names an entry point for each stage.',
          'The shader text of the module, and the name of every entry point in it.',
        ],
        [
          'Bind group layout',
          'Describes each binding by its group, its index, its kind and the stages that see it.',
          'That same description, read back from the compiled module by `reflect()`.',
        ],
        [
          'Buffer',
          'Allocates the buffer and writes the bytes into it.',
          'The offset, the size and the type of every field of a uniform struct.',
        ],
        [
          'Texture and sampler',
          'Creates them and puts them in a bind group.',
          'The binding the shader declares and the type it expects to find there.',
        ],
      ],
      reflectionH: 'Reflection',
      reflectionP: `\`reflect()\` reads a compiled module and returns its bindings: the group and index the shader declared, the address space, the access the shader needs, and for a uniform struct the fields with their offsets and sizes under the ${facts.layoutStandards.join(' and ')} layouts. A host builds its bind group layout entries out of that list and packs its uniform buffer from those offsets. The numbers the shader was compiled with are the numbers the host writes, so the two sides stay in step.`,
      reflectionNote:
        'A field renamed in the shader changes the reflection at the next build, and the host code that reads the reflection follows it.',
      runtimeH: 'No runtime',
      runtimeP: `The compiler runs where the shader text is produced: in a build, in a test, or in an editor through the [language service](languageService). What reaches the browser is the emitted shader source and the host code the application already had. TypeShade installs ${facts.runtimeDeps} runtime dependency, TypeScript, which \`compile()\` and the language service read source with, and there is no TypeShade object to create at startup and none to keep alive.`,
      webgl2H: 'Where WebGL2 differs',
      webgl2P: 'The same source compiles for WebGL2, and the host side of it looks different.',
      webgl2Items: [
        'There are no bind groups. A uniform block is bound to a binding point on the linked program and a sampler is set through its uniform location, so a host uses the same reflection in a different shape.',
        `There is no compute stage. A module with a \`@compute\` entry emits WGSL and refuses to emit ${facts.glslTarget}.`,
        `Precision belongs to the source. Every emitted ${facts.glslTarget} program declares its default precision above its declarations, which WGSL has no need of.`,
        'A GPU feature is turned on by the host, which asks the context for the extension, and where the extension has a directive the emitted source declares it as well. [Compiler internals](internals) describes how the compiler splits those halves.',
      ],
      furtherH: 'Further reading',
      furtherItems: [
        '[MDN WebGPU API](mdnWebgpu) and [MDN GPUBindGroupLayout](mdnBindGroupLayout) are the host objects this page names.',
        '[MDN WebGL2RenderingContext](mdnWebgl2) is the older context, with the uniform and sampler calls the WebGL2 path uses.',
        '[WebGPU specification](specWebgpu) and the [WebGL2 specification](specWebgl2) define the two host APIs.',
      ],
      nextP:
        'Next in this path: [WGSL and GLSL](conceptsWgsl), which prints what one source compiles to on both targets.',
    },

    wgslAndGlsl: {
      title: `WGSL and ${facts.glslTarget}`,
      description: `The two shader languages one TypeShade source compiles to, the emitted text for one small shader, and where the targets differ.`,
      h1: `WGSL and ${facts.glslTarget}`,
      lead: `One \`"use typeshade"\` file reaches WebGPU as WGSL and WebGL2 as ${facts.glslTarget}. The blocks on this page are compiled while the page is built, from the file above them, by the compiler pinned at ${facts.pinnedCommit}.`,
      sourceH: 'The source',
      sourceP:
        'A triangle, with a vertex entry that places it and a fragment entry that colours it. The two structs give each stage its output shape.',
      sourceLabel: 'hello.shade.ts',
      wgslH: 'WGSL',
      wgslP:
        'WGSL is the language a WebGPU device accepts, and one module holds every stage. The structs survive as structs, each entry point keeps its stage attribute, and the builtin input stays an attribute on the parameter that receives it.',
      wgslLabel: 'The emitted WGSL module',
      glslH: `${facts.glslTarget}`,
      glslP: `A WebGL2 program is linked from one vertex shader and one fragment shader, so the compiler emits a separate program for each stage. Each one opens with its version line and its default precision, the vertex index arrives under the name the language reserves for it, and the fragment output becomes a declared out variable.`,
      glslVertexLabel: `The emitted ${facts.glslTarget} vertex shader`,
      glslFragmentLabel: `The emitted ${facts.glslTarget} fragment shader`,
      diffH: 'Where the targets differ',
      diffP: `Each difference is named by the page of the guide that handles it. Where the two disagree, WGSL defines what a construct means, and ${facts.glslTarget} is a target the compiler writes to (Rule 1.2).`,
      diffColumns: ['What differs', 'WGSL', `${facts.glslTarget}`],
      diffRows: [
        [
          '[Compute stages](languageStages)',
          'A `@compute` entry emits a compute shader carrying its workgroup size.',
          'The target has no compute stage, so a module that declares one emits WGSL alone.',
        ],
        [
          '[Precision](languageGpuTypes)',
          'A type carries its own width, so the program declares nothing.',
          'The program opens with a default precision for floating-point and integer values.',
        ],
        [
          '[Builtin inputs](languageStages)',
          'A builtin stays an attribute on the parameter that receives it.',
          'A builtin becomes the name the language reserves for it, and the parameter goes away.',
        ],
        [
          '[Stage outputs](languageTypes)',
          'A stage returns a struct whose fields carry their locations.',
          'A stage writes to declared out variables, and the position goes to the reserved one.',
        ],
        [
          '[Extensions](internals)',
          'A GPU feature is turned on by a declaration at the top of the module.',
          'A GPU feature is turned on by a preprocessor line, and the host asks the context for the matching extension.',
        ],
      ],
      furtherH: 'Further reading',
      furtherItems: [
        '[WGSL specification](specWgsl) defines the first of the two targets.',
        `[${facts.glslTarget} specification](specGlslEs) and the [WebGL2 specification](specWebgl2) define the second.`,
        '[MDN WebGPU API](mdnWebgpu) and [MDN WebGL2RenderingContext](mdnWebgl2) show how a host hands each of them to a driver.',
      ],
      nextP:
        'Next: [Examples](examples), where every example in the compiler’s registry names the targets it emits.',
    },
  },

  /** The language service page at /guide/language-service/, rendered by
   *  src/components/pages/LanguageServicePage.astro. The TypeScript sample is not copy, so it stays there. */
  languageService: {
    title: 'TypeShade language service for editors and language servers',
    description:
      'The editor-neutral layer behind the Playground: TypeScript and TypeShade diagnostics, completions, hover, rename and compiled output from one document API.',
    h1: 'Language service',
    intro:
      "The language service is the layer between the compiler's front end and an editor. It takes text and positions and returns data, and it touches no DOM or Node API. The Playground reads its diagnostics, completions and hover from it today, through the Monaco editor, and a language server for VS Code and other editors will read the same layer later, so the two cannot drift apart.",
    layersH: 'Layers',
    layersP: `The front end parses a \`"use typeshade"\` file, checks its types, structs and bindings, and reports diagnostics with source positions. The language service sits on top of the front end and of the TypeScript language service, which runs over an ambient declaration of the TypeShade globals, and answers requests about documents it holds by \`uri\`. Adapters sit above it and do nothing semantic: the Playground's Monaco adapter converts coordinates and owns the editor's markers, and an LSP server would carry the same answers over JSON-RPC. A judgement about TypeShade belongs in the service; an adapter converts.`,
    requestsH: 'Requests',
    requestsP: 'One document API answers the requests an editor makes.',
    requests: [
      [
        'Diagnostics',
        'TypeScript and TypeShade diagnostics in one list. Each carries a `source` of `typeshade` or `typescript` and a code, so an adapter can tell the two apart, and a TypeScript parse error appears once, under its TypeScript code.',
      ],
      [
        'Completions',
        'The symbols in scope, the keywords, and TypeShade items where the context calls for them: attribute names after `@`, builtin input names inside `@builtin("`, GPU type names in a type position, and snippets for vectors and entry functions.',
      ],
      [
        'Hover',
        'Quick info for a symbol, with the TypeShade type name where TypeScript would say `number`, and documentation for GPU types, attributes and builtin inputs.',
      ],
      [
        'Signature help',
        'The signatures of the function under the cursor and the parameter being typed.',
      ],
      [
        'Definition and references',
        'Where a symbol is declared and where it is used, across the documents the service holds.',
      ],
      [
        'Document symbols',
        'The functions, structs, fields and resources of a document as an outline, with an entry function labelled by its stage.',
      ],
      [
        'Rename',
        'The edits that rename a symbol in every document that uses it, after a check that the position can be renamed at all.',
      ],
      [
        'Semantic tokens',
        'The tokens in document order, with GPU types, entry functions, resources and the names inside `@builtin(...)` marked as such.',
      ],
      [
        'Compiled output',
        'The WGSL or GLSL a document compiles to, on demand for an output pane. Diagnostics produce no shader text, so a keystroke does not run a backend.',
      ],
    ],
    documentsH: 'Documents and positions',
    documentsP1:
      "Import `createTypeshadeLanguageService` from the `typeshade/language-service` subpath and open a document by `uri` with its text and an optional version. Update it with the whole text on each change and close it when the editor does; every other method takes the `uri` and, where it applies, a position. Nothing in the service is asynchronous, and a result for a stale version is the adapter's to drop.",
    documentsP2:
      "Positions are zero-based line and character pairs, with the character counted in UTF-16 code units, and a range is half-open with its end exclusive. These are the conventions LSP uses, so a language server passes them through field for field. Monaco counts from one, so the Playground's adapter adds one on its own side and takes it off on the way back; that adapter is the only place the two coordinate systems meet.",
    packagingH: 'Packaging',
    packagingP:
      'The service runs on `typescript`, which the package lists as a required peer dependency. The main entry needs it too, because `compile()` reads a `"use typeshade"` file with the TypeScript parser, so a program that imports only the compiler installs it as well, and `typeshade/language-service` uses that same copy.',
    exampleH: 'Example',
    exampleP:
      'A host opens one document, asks for its diagnostics and for the hover at a position, and compiles it for an output pane.',
    furtherH: 'Further reading',
    furtherP:
      "The [Playground](playground) is the service at work in a browser. The [design document](languageServiceDesign) in the compiler's repository, at the pinned commit, records the conventions, the adapter contracts and the order of work.",
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
          linkKey: 'quickStart',
        },
        {
          title: '2. Values and types',
          text: 'See how TypeScript type aliases and classes become GPU value layouts.',
          label: 'Types',
          linkKey: 'languageTypes',
        },
        {
          title: '3. Compose functions',
          text: 'Combine helper functions with stage entries to build shader calculations.',
          label: 'Functions',
          linkKey: 'languageFunctions',
        },
        {
          title: '4. GPU data',
          text: 'Connect vectors, matrices, arrays, and host-owned shader resources.',
          label: 'Resources',
          linkKey: 'languageResources',
        },
        {
          title: '5. Real examples',
          text: 'Read the repository examples and combine the language pieces into complete shaders.',
          label: 'Source examples',
          linkKey: 'examplesDir',
        },
      ]),
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
      p: `${facts.shadeExamples} more examples in the same directory are TypeScript files that open with \`"use typeshade"\`, compiled by \`compile()\` from the file's own bytes. Each one is there for one part of the language, and they are grouped here that way. ${facts.shadeRenderable} have a ${glsl} form and the others emit WGSL alone. The ones the page can draw carry a picture.`,
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
    /** The page one example gets, at /guide/examples/<id>/. Every tile in the gallery links
     *  here, and the file on GitHub is one link in the row at the foot of the page. */
    page: {
      // The title names the example and takes the longest suffix that still fits under the
      // 60-character ceiling check-seo.mjs enforces, the way docs.api.pageTitle does. The
      // suffixes step down by no more than 15, so every name up to 47 characters lands over the
      // SEO review's 45-character floor. A longer name is the compiler's own title written as
      // a sentence ("An integer varying, and the interpolation it has no choice about"), and
      // no suffix fits it; the title then takes the name up to its first comma, which names
      // the example on its own, and the page's heading keeps the whole of it.
      // src/components/pages/ExamplePage.astro asserts both ends for all of them.
      title: (name: string) => {
        const suffixes = [
          ', a TypeShade example with its source and emitted code',
          ', a TypeShade example and the code it emits',
          ', a TypeShade shader example',
          ' in TypeShade',
        ];
        const fit = (n: string): string | undefined => {
          const suffix = suffixes.find((s) => (n + s).length <= 60);
          return suffix === undefined ? undefined : n + suffix;
        };
        // A name over 60 with no comma to cut at ("Local functions that read and write the
        // variables around them") is cut at a word, and the page's heading keeps the whole.
        const cut = (n: string): string =>
          n.length <= 60 ? n : `${n.slice(0, 59).replace(/\s+\S*$/, '')}…`;
        return fit(name) ?? fit(name.split(', ')[0]!) ?? cut(name);
      },
      description: (name: string, blurb: string) => `${name}, a TypeShade example. ${blurb}`,
      /** Added when an example's own line leaves the description under the 70 characters the
       *  SEO checks want. */
      descriptionPad: `The source, the WGSL it emits and the ${glsl} stages, on one page.`,
      source: 'Source',
      tabs: 'Source and emitted output',
      /** What the line under the card says, by what drew the frame. The front page's tiles
       *  used to carry this wording; they are stills now, so the example pages keep it. */
      canvas: (name: string) => ({
        neutral: `${name}, drawn at build time.`,
        webgpu: `${name}, running on WebGPU.`,
        webgl2: `${name}, running on WebGL2.`,
        none: `${name}, drawn at build time; this browser has no WebGPU or WebGL2.`,
        reduced: `${name}, one frame, since this system asks for less motion.`,
      }),
      emittedNote: `The WGSL and GLSL tabs are the compiler's own output at commit ${facts.pinnedCommit}, read from the goldens its emit suite bakes ([emit-goldens.test.ts](goldens)).`,
      wgsl: 'WGSL',
      /** The tab over a pane. Four tabs share the card's right half, so a tab carries the
       *  language and the stage; the full target name is in the line under the card and on
       *  the pane itself. */
      glslVertexTab: 'GLSL vertex',
      glslFragmentTab: 'GLSL fragment',
      /** The pane's own accessible name, where the target is named in full. */
      glslVertex: `${glsl} vertex`,
      glslFragment: `${glsl} fragment`,
      github: 'File on GitHub',
      playground: 'Open in the Playground',
      /** The line over the tool on a `.shade.ts` example's page, which carries the whole
       *  Playground seeded with that file. */
      editable:
        "The editor holds this example's own file. An edit recompiles it in your browser, and the tabs beside the editor follow.",
      /** The line on an `fn()` example's page, which carries the static card instead. */
      builder:
        'This example is written against the `fn()` builder API, which the editor in the [Playground](playground) does not take.',
      /** What the page says where it draws no picture, one line per reason in
       *  NO_STILL_REASONS (scripts/artifacts.mjs). */
      noPicture: {
        'no-glsl': `This example has no ${glsl} form, and the canvas runs one program on both backends, so the page shows no picture.`,
        control:
          'This example is steered by a control the page has no value for, so the page shows no picture.',
        texture:
          'This example reads a texture the page has no data for, so the page shows no picture.',
        uniform:
          'This example declares a uniform field the page has no value for, so the page shows no picture.',
        'vertex-buffer':
          'This example reads its vertex attributes from a buffer the page does not bind, so the page shows no picture.',
      },
    },
    printIntro:
      'From a checkout of the repository, the first command prints WGSL, GLSL and reflection for every example; the second does one by id.',
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
    description:
      'The authoring surface of TypeShade, section by section: values, control flow, layouts, diagnostics, emulated f64, production emit and migrating a GLSL shader.',
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
      description:
        'A progressive guide to TypeShade syntax and GPU semantics for TypeScript developers, with examples and concept mapping.',
      h1: 'TypeShade language guide',
      intro:
        'Do not learn TypeShade as a list of syntax forms. Start from TypeScript concepts you already know, then learn what changes when the same idea must execute on a GPU. Each topic moves from syntax to meaning, a small example, and a real shader use.',
      boundaryH: '1. Start with `use typeshade`',
      boundaryP:
        '`"use typeshade"` is a language boundary, not just a string literal. Inside the file, TypeScript-like authoring is combined with TypeShade rules for types, resources, stages and builtin inputs.',
      boundaryNote:
        'The first directive tells you that this file is not interpreted as an ordinary TypeScript module.',
      syntaxH: '2. TypeScript syntax is the starting point',
      syntaxP:
        'Variables, functions, type aliases, classes, conditionals and loops provide a familiar authoring surface. A shader does not execute like a JavaScript program, though. A construct has TypeShade meaning only when the compiler can lower its values and operations to GPU code.',
      syntaxTableHeader1: 'TypeScript concept',
      syntaxTableHeader3: 'What changes',
      syntaxTableRows: [
        ['function', 'helper / entry', 'The body must be GPU-lowerable.'],
        ['type', 'GPU value shape', 'The shape is checked against GPU value semantics.'],
        [
          'class',
          'GPU struct',
          'A struct and the functions written with it, with no runtime object.',
        ],
        [
          'if / for',
          'GPU control flow',
          'Only flow that compiles to GPU execution, not the whole JavaScript runtime.',
        ],
      ],
      gpuH: '3. GPU concepts stay visible in the source',
      gpuP: 'TypeShade makes the GPU interface explicit. Resources use `declare`, stages use decorated top-level functions, and builtin inputs are declared as `@builtin(...)` parameters.',
      gpuNote:
        'The shader does not create `camera` or `pixels`. `gid` is not injected as a global either; it is declared as an input to the function.',
      functionH: '4. Functions describe value flow',
      functionP:
        'As in TypeScript, parameters and return types describe a function contract. TypeShade adds shader-specific meaning through stages and builtin inputs.',
      functionNote:
        '`addBias` is a reusable helper; `paint` is a compute entry. They share function syntax but have different roles in the pipeline.',
      resourceH: '5. Resources form the host boundary',
      resourceP:
        '`uniform<T>` and `storage<T>` are GPU resources supplied by the host, not JavaScript objects created by the shader. `declare` records that ownership boundary in source.',
      resourceNote:
        'A resource is always declared `const`. Whether the shader may write a `storage` binding is part of its type, `storage<T, "read_write">`.',
      stageH: '6. Entry functions start a pipeline stage',
      stageP:
        '`@vertex`, `@fragment` and `@compute` declare which shader stage owns an entry function. Builtins are explicit parameters instead of automatically injected globals.',
      completeH: '7. Put the pieces together',
      completeP:
        'Read the following example from top to bottom. The language directive, GPU struct, resources, compute stage and builtin parameter form one explicit program contract.',
      tsH: '8. What TypeScript gives you, and what changes',
      tsRows: [
        ['`declare`', '`declare` describes host-provided GPU resources.'],
        ['function parameter', 'GPU value or explicit stage builtin input.'],
        ['class', 'GPU struct and field metadata.'],
        ['number', 'Use explicit GPU numeric types such as `f32`, `i32`, `u32`.'],
      ],
      tsNote:
        'TypeShade is therefore not a copy of TypeScript syntax. It connects the TypeScript authoring experience to a GPU language model.',
      refsH: '9. Further reading',
      refsP:
        'When learning a TypeShade concept, read the matching TypeScript type or function documentation, check the JavaScript execution model, and then connect it to the GPU concept.',
      nextH: '10. Learning path',
      nextP:
        'Build a first file in Quick start, then expand through Types, Functions, Control flow, GPU types, Resources and Shader stages, in that order.',
      nextLink: 'Quick start',
    },
    topics: {
      types: {
        title: 'TypeShade types',
        description:
          'How TypeScript type and class concepts map to TypeShade GPU values, structs and field layout.',
        h1: 'Types: from TypeScript types to GPU values',
        intro:
          'TypeShade starts from TypeScript’s type surface, but the final meaning is a GPU value model. Learn the TypeScript idea first: structural typing and type aliases describe value shape. When GPU layout metadata is required, use classes and field decorators.',
        ts: 'Start from the TypeScript concept',
        tsP: 'A type alias gives a name to a value shape. TypeShade keeps that surface, while shader semantics determine which types and expressions are valid in a shader.',
        alias: '1. Use type aliases for plain data',
        aliasP:
          'When fields do not need decorators, a type alias is the smallest representation. It is also useful when the same GPU value shape is shared across helper parameters and return values.',
        struct: '2. A class is a struct and its functions',
        structP:
          'A TypeShade class is a GPU struct and the functions written with it. The fields are the bytes the host writes. A constructor, a method and a static function each lower to a plain function, so `new Ray(o, d)` calls `Ray_new` and `r.at(t)` calls `Ray_at(r, t)`. Nothing keeps an object alive between them.',
        attrs: '3. Field decorators describe layout',
        attrsP:
          'A field takes `@location` and `@builtin`, which bind it to the pipeline, and `@interpolate`, `@invariant` and `@blend_src`, which qualify a varying or an output. `@align` is read and refused, and `@size`, `@offset` and `@ignore` are not attributes the compiler knows. The whole set it accepts is `@vertex`, `@fragment`, `@compute`, `@builtin`, `@location`, `@interpolate`, `@invariant`, `@blend_src` and `@diagnostic`.',
        boundary: '4. Where TypeScript classes stop',
        boundaryItems: [
          'An entry point is a top-level function, not a method.',
          'A class with no fields is not a struct, so write its functions as functions.',
          'A getter and a setter each lower to a function of their own, and a class has one constructor, as in TypeScript.',
          '`new` builds a value inside a function body, and a module constant takes an object literal.',
          'Prefer a type alias when no field needs a decorator.',
        ],
        mapping: '5. Concept mapping',
        mappingRows: [
          ['TypeScript', 'TypeShade'],
          ['type alias / object shape', 'GPU value shape'],
          ['class fields', 'GPU struct fields'],
          ['class method', 'A function taking the struct first'],
          ['`new`', 'A call of the generated constructor'],
          ['`extends` with `super`', 'The base fields spliced in and the body lowered again'],
          ['decorator metadata', 'GPU layout / stage metadata'],
          ['runtime object', 'not applicable'],
          ['structural compatibility', 'applies within shader type checking'],
        ],
        example: '6. Connect the type to an entry point',
        exampleP:
          'After defining a struct, use it as an entry point parameter. The value shape and field metadata then define the meaning of that shader input.',
        next: 'Next: Functions',
      },
      functions: {
        title: 'TypeShade functions',
        description:
          'A detailed guide to TypeShade functions: TypeScript-style parameters and returns, helpers, shader entries, stages and explicit builtins.',
        h1: 'Functions: from TypeScript functions to GPU functions',
        intro:
          'Functions are the basic unit for naming computation and making inputs and outputs explicit. TypeShade keeps the TypeScript function shape, but every function in a `"use typeshade"` file must describe computation that can be lowered to GPU IR.',
        anatomy: '1. Anatomy of a function',
        anatomyP:
          'A function has a name, parameter list, return type and body. TypeShade keeps that familiar structure while giving parameters and return values GPU semantics.',
        anatomyNote:
          'Here <code>value</code> is the input parameter, <code>f32</code> is the GPU type of both the input and result, and <code>return</code> produces the value for the caller.',
        params: '2. Parameters and return types',
        paramsP:
          'A parameter is an input to the function and the return type describes the shape of its result. Types are part of compilation: they tell the compiler which values and operations are valid.',
        paramsTable: [
          ['Part', 'Role'],
          ['`a`, `b`', 'GPU input values.'],
          ['`amount: f32`', 'A scalar input whose type participates in expression checking.'],
          ['`: vec4`', 'The GPU value shape returned to the caller.'],
        ],
        helper: '3. Helper functions',
        helperP:
          'A top-level function without a stage decorator is a helper. Helpers let you name repeated calculations and keep shader entries focused on pipeline inputs, resources and outputs.',
        helperNote:
          'A helper has no stage decorator because it is not a pipeline entry. This keeps reusable math separate from the pipeline interface.',
        call: '4. Calling a function',
        callP:
          'A call looks like an ordinary TypeScript call, but its callee and arguments must stay inside the TypeShade GPU type model. Do not treat the shader as a place to call arbitrary JavaScript APIs.',
        callNote:
          'The call looks like a normal function call, but both the argument and the result of `addBias` must be values supported by the TypeShade GPU model.',
        entry: '5. Shader entry functions',
        entryP:
          'A pipeline entry is declared as a top-level `export function` with a stage decorator. `@compute`, `@vertex` and `@fragment` attach the function to a GPU execution stage.',
        entryNote:
          '`export` keeps the familiar module surface and exposes the function to the compiler as an entry candidate. The stage decorator adds the GPU-specific stage information.',
        builtin: '6. Builtins are parameters',
        builtinP:
          'GPU-provided stage inputs are explicit function parameters, not hidden global variables. Reading the signature tells you exactly which external inputs the entry expects.',
        builtinTable: [
          ['Form', 'Meaning'],
          ['`@builtin("global_invocation_id")`', 'Selects the GPU-provided compute input.'],
          ['`gid: vec3u`', 'The TypeShade type and local name for that input.'],
          ['`gid.x`', 'Reads the x component for the current invocation.'],
        ],
        compute: '7. Reading a compute entry',
        computeP:
          '`@compute([64, 1, 1])` declares the workgroup size. `gid` is a parameter receiving the `global_invocation_id` builtin, and `gid.x` reads the current invocation’s x coordinate.',
        computeNote:
          'When reading this function, first identify the stage and workgroup size, then inspect the parameters for external GPU inputs, and finally follow the body’s calculation.',
        graphics: '8. Vertex and fragment entries',
        graphicsP:
          'Graphics stages use the same function model. The decorator selects the stage, while parameters and the return type describe the pipeline interface.',
        graphicsNote:
          'The vertex function has two different inputs: `vid` is a GPU builtin and `vin` is a user-defined struct. The fragment function makes its builtin input, `pid`, explicit as well, so the signature documents the stage interface.',
        scope: '9. Functions and scope',
        scopeP:
          'Local variables belong to the current function invocation. Keep them conceptually separate from resources and builtin inputs supplied by the shader interface.',
        scopeNote:
          '`factor` is a local value scoped to the function. Resources such as `camera` and `pixels` belong to the host-facing shader interface, while builtin parameters are inputs supplied by the GPU stage.',
        boundary: '10. Where TypeScript functions stop',
        boundaryItems: [
          'Do not call arbitrary JavaScript runtime APIs.',
          'Do not assume dynamic object creation or general runtime side effects can become shader computation.',
          'Entry points are top-level exported functions, not class methods.',
          'Builtins are explicit parameters, not implicit globals.',
          'Parameters and return types must have valid GPU value semantics.',
        ],
        example: '11. From a small helper to a real entry',
        exampleP:
          'The example below keeps reusable math in a helper and lets the entry connect the builtin input and resources.',
        exampleNote:
          'The important distinction is the boundary: `addBias` is reusable computation, while `paint` connects the stage, builtin input and resources to an actual GPU invocation.',
        next: 'Next: Control flow',
      },
      controlFlow: {
        title: 'TypeShade control flow',
        description:
          'How familiar TypeScript conditionals and loops map to the TypeShade GPU execution model.',
        h1: 'Control flow: familiar syntax, explicit GPU execution',
        intro:
          'TypeShade uses familiar TypeScript conditional and loop syntax, but the code executes on the GPU. Understand control flow in terms of compilable computation, not the full dynamic behavior of the JavaScript runtime.',
        ts: '1. Start from the TypeScript control-flow model',
        tsP: 'Syntax such as if/else and for is familiar, but every condition and loop in TypeShade must be lowerable to GPU code. Matching syntax does not imply that all JavaScript runtime semantics are available.',
        branch: '2. Branching',
        branchP:
          'Use if/else to express calculation paths. Inside a branch, keep values and resources within the TypeShade GPU model.',
        loop: '3. Loops',
        loopP:
          "Write a for loop, a while loop, or for...of over an array. A for loop may count to a value known only at run time, such as a uniform field or the length of an array. An array's map, forEach, some, every and reduce compile too, each to a counted loop, and map takes an array with a fixed length.",
        boundary: '4. Where JavaScript control flow stops',
        boundaryItems: [
          'Write filter, find and the other array methods that change a length or search for an element as a loop.',
          'Do not rely on general runtime objects.',
          'Keep conditions and loop ranges based on GPU-compilable values.',
          'A control-flow pattern valid in TypeScript is not automatically valid under TypeShade shader semantics.',
        ],
        next: 'Next: GPU types',
      },
      gpuTypes: {
        title: 'TypeShade GPU types',
        description:
          'How TypeScript type syntax maps to TypeShade scalar, vector, matrix and array GPU values.',
        h1: 'GPU types: from TypeScript syntax to GPU values',
        intro:
          'TypeShade uses TypeScript syntax but does not inherit every JavaScript runtime value type as a shader value. This page focuses on the values that are actually represented and computed on the GPU.',
        mapping: '1. TypeScript types and GPU types',
        mappingP:
          'Instead of treating a broad runtime type such as `number` as a shader value, TypeShade uses explicit GPU representations such as `f32`, `i32` and `u32`. `vec*` and `mat*` are GPU arithmetic values, not JavaScript objects.',
        scalar: '2. Scalars',
        scalarP:
          'Single numeric values are represented as GPU scalar types and can be used in resource and struct field declarations.',
        vector: '3. Vectors',
        vectorP:
          'vec2, vec3 and vec4 group scalar values into a GPU value. They are common in shader calculations and stage inputs.',
        matrix: '4. Matrices',
        matrixP:
          'Types such as mat4 represent GPU arithmetic values used for transforms. They are not JavaScript objects.',
        arrays: '5. Arrays',
        arraysP:
          'array represents a sequence of GPU values. Combined with a resource element type, it describes the shape of host-provided buffer data.',
        live: '6. Live example',
        liveP:
          'The entry below names a GPU type on every line: `vec2` for the position, `f32` for the distance and the radius, `vec3` for the colour.',
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
        next: 'Next: Resources',
      },
      resources: {
        title: 'TypeShade resources',
        description:
          'Map TypeScript declaration concepts to TypeShade uniform and storage resources, access modes and the host binding contract.',
        h1: 'Resources: from TypeScript declarations to GPU resources',
        intro:
          'A TypeShade resource is a host-filled binding slot, not a JavaScript object owned by the shader. Product code makes that boundary explicit with `declare`.',
        mapping: '1. Map the TypeScript declaration model',
        mappingP:
          'Just as TypeScript `declare` describes a value at the type level without creating a runtime value, TypeShade `declare` describes a GPU resource supplied by the host. TypeShade additionally uses `uniform<T>` and `storage<T>` to express GPU memory semantics.',
        decl: '2. Declare resources with `declare`',
        declP: 'Declare the resource type and access mode without an initializer.',
        access: '3. The type states the access',
        accessP:
          'A uniform is read-only, and `uniform<T>` takes one type argument. A storage binding is read-only as `storage<T>` and read-write as `storage<T, "read_write">`. The access mode is the second type argument, where WGSL writes it too. Every resource is declared with `const`.',
        slots: '4. Resource slots are a host contract',
        slotsP:
          'Resource slots follow declaration order in the file. Keep binding details as part of the compiler/host reflection contract instead of scattering binding numbers through shader code.',
        invalid: '5. Common mistakes',
        invalidItems: [
          'Do not declare `declare const x: f32`; a resource needs a space such as `uniform<T>` or `storage<T>`.',
          'Do not declare a resource with `let`. The compiler refuses `declare let x: storage<T>` and names the `declare const` line to write instead.',
          'Do not assign to a read-only resource.',
          'Do not model a resource as a class or bind-group instance.',
        ],
        next: 'Next: Shader stages',
      },
      stages: {
        title: 'TypeShade shader stages',
        description:
          'Map TypeScript function and module concepts to compute, vertex and fragment entry points with explicit builtins in TypeShade.',
        h1: 'Shader stages: explicit GPU entry points',
        intro:
          'TypeShade entry points are top-level exported functions. A decorator marks the shader stage and any stage-specific metadata.',
        mapping: '1. Start from TypeScript functions and modules',
        mappingP:
          'In TypeScript, `export function` makes a function part of a module’s public surface. In TypeShade, adding a stage decorator gives that function the GPU meaning of a pipeline entry point. An undecorated function remains a reusable helper.',
        compute: '2. Compute',
        computeP:
          '`@compute` carries the workgroup size. A compute builtin such as `global_invocation_id` is an explicit function parameter, not an injected global.',
        graphics: '3. Vertex and fragment',
        graphicsP:
          '`@vertex` and `@fragment` describe graphics-pipeline entry points. Inputs, outputs and builtins are expressed explicitly in the function signature.',
        helper: '4. Helper functions',
        helperP:
          'An undecorated function is a helper, not an entry point. Do not put entry points on classes or treat `this` as a pipeline object.',
        next: 'Back to the language overview',
      },
    },

    // The four construct-mapping pages: /guide/language/from-typescript/, from-wgsl/,
    // from-glsl/ and builtins/. Each page component reads one block. The builtin table is
    // generated from the compiler's spelling registry (src/lib/builtin-table.ts), so its
    // rows are not copy and only the words around them live here.
    mapping: {
      fromTypescript: {
        title: 'TypeScript constructs and what each one lowers to',
        description: `What ${facts.constructRows} TypeScript constructs become in a "use typeshade" file: declarations, functions, classes, control flow, and the shader text the compiler writes.`,
        h1: 'TypeScript constructs',
        intro: `TypeShade is TypeScript's syntax, checked by a shader compiler. A construct either lowers to shader code or is refused with a reason, and the emitted pane of every card is what the compiler wrote at the pinned commit. There are ${facts.constructRows} of them, on the section pages below.`,
        readingH: 'How to read a card',
        readingP:
          'The head of a card names the construct, and a badge marks one the language refuses. The sentence under it says what becomes of the construct. The left pane is the TypeScript, taken from a `"use typeshade"` program that is compiled while this page is built. The right pane is the emitted WGSL, cut out of that program by name, and a refused card carries the compiler\'s own code and message there instead.',
        guidesP:
          'A card says what happens. The pages before this one say why: [types](languageTypes), [functions](languageFunctions), [control flow](languageControlFlow), [GPU types](languageGpuTypes) and [resources](languageResources). The builtins have [a table of their own](languageBuiltins).',
        paneTs: 'TypeScript',
        paneWgsl: 'Emitted WGSL',
        paneDiagnostic: 'Compiler diagnostic',
        refused: 'Refused',
        /** The index names its sections and links each one; the cards themselves are on
         *  those pages. The count beside a section is that section's own row count, read
         *  off the generator. */
        pagesH: 'Sections',
        constructs: (n: number) => `${n} constructs`,
        pages: {
          declarations: {
            title: 'Declarations in TypeShade and what they lower to',
            description:
              'What a constant, a variable, an enum, a type alias, an interface and a namespace become in a "use typeshade" file, and what is emitted for each.',
          },
          functions: {
            title: 'Functions in TypeShade and what they lower to',
            description:
              'Helpers, arrow functions, overloads, recursion, entry points and the calls the compiler refuses, each with the shader text written for it.',
          },
          classes: {
            title: 'Classes in TypeShade, and what each one lowers to',
            description:
              'Constructors, methods, static members, inheritance, mixins and generics, each with the struct and the functions the compiler writes for it.',
          },
          controlFlow: {
            title: 'Control flow in TypeShade and what it lowers to',
            description:
              'Conditions, counted loops, while, switch, the ternary, break, continue and discard, with the shader text written for each and the loops refused.',
          },
          expressions: {
            title: 'TypeShade expressions and types, and what they lower to',
            description:
              'Assertions, destructuring, spreads, literals and the values a shader cannot build while it runs, each with the shader text or the refusal it gets.',
          },
          double: {
            title: 'Emulated double precision in a TypeShade file',
            description:
              'Neither target has a 64-bit float, so a double is a pair of single words. What the compiler rewrites, and the calls it puts in place of the arithmetic.',
          },
        },
        sections: {
          declarations: {
            h: 'Declarations',
            p: 'A declaration names a constant, a variable or a layout. Which of the three it is decides whether anything is emitted for it at all.',
          },
          functions: {
            h: 'Functions',
            p: 'Every function is a function of the module. There are no function values, no environment to close over and no call stack.',
          },
          classes: {
            h: 'Classes',
            p: 'A class is a struct with functions around it. Dispatch is static, so inheritance, a mixin and a generic are settled while the file is compiled.',
          },
          controlFlow: {
            h: 'Control flow',
            p: 'A loop has to be one the GPU can finish, and a choice between two values has to be one the target has an operator for.',
          },
          expressions: {
            h: 'Expressions and types',
            p: 'A type claim is erased, a shape the GPU has a word for is kept, and a value TypeScript would build at run time is refused where it is written.',
          },
          double: {
            h: 'Emulated double',
            p: `Neither target has a 64-bit float. An \`f64\` is a pair of \`f32\` words, rewritten into \`vec2<f32>\` and \`df64_\` calls before either backend sees it. [fp64-lane-stripes](shadeLaneStripes) draws the ${split[0]} and ${split[1]} paths side by side.`,
          },
        },
        rows: {
          constScalar: {
            name: 'Scalar `const`',
            p: 'A module constant. A scalar folds to one value at its declaration. [module-const](shadeModuleConst)',
          },
          constVector: {
            name: 'Vector `const`',
            p: 'A vector or array constant carries its value as an expression each backend evaluates. [palette-const](shadePaletteConst)',
          },
          letNoInit: {
            name: 'Local `let`',
            p: 'A mutable local. The annotation carries the type, and WGSL gives it a zero. [bitfield-bands](shadeBitfieldBands)',
          },
          moduleLet: {
            name: 'Module `let`',
            p: 'A module variable, one per invocation. [private-state](shadePrivateState)',
          },
          varRefused: {
            name: '`var`',
            p: '`let` is the per-invocation variable and `const` the module constant.',
          },
          enumRow: {
            name: '`enum`',
            p: 'One module constant per member, named `Enum_Member` and typed `i32`.',
          },
          constEnum: {
            name: '`const enum`',
            p: 'The same constants. A `const enum` is no different here.',
          },
          typeAlias: {
            name: '`type` alias',
            p: 'Another name for its target, resolved wherever a type may stand.',
          },
          interfaceRow: {
            name: '`interface`',
            p: 'A struct, the same one a class of those fields would give.',
          },
          classStruct: {
            name: 'Class as a struct',
            p: 'A struct, whose fields lay out the memory the host fills. [ray-class](shadeRayClass)',
          },
          namespaceRow: {
            name: '`namespace`',
            p: 'The members flatten to `Ns_member`, and the namespace itself emits nothing.',
          },
          topFunction: {
            name: 'Top-level function',
            p: 'A module function of the same name, parameters and return type.',
          },
          localFunction: {
            name: 'Local function',
            p: 'A function of the module, named after the function that declares it.',
          },
          closure: {
            name: 'Closure over a name',
            p: 'The local function takes each name it reads from the function around it as a parameter, and a name it writes by reference.',
          },
          defaultArgs: {
            name: 'Default argument',
            p: 'Every parameter stays, and the argument left out is written at the call. [default-args](shadeDefaultArgs)',
          },
          overloads: {
            name: 'Overload signature',
            p: 'The signatures are skipped and the implementation is lowered once.',
          },
          recursion: {
            name: 'Recursive call',
            p: 'WGSL has no call stack, and the check reads the call graph.',
          },
          callStatement: {
            name: 'Call as a statement',
            p: 'A statement of its own. A value-returning builtin standing alone computes nothing, so the optimizer drops it.',
          },
          phonyAssign: {
            name: 'Call with an effect',
            p: "A builtin that returns a value and has an effect takes WGSL's phony assignment, `_ =`, since Tint treats it as must-use. [atomic-histogram](shadeAtomicHistogram)",
          },
          mathAlias: {
            name: '`Math` names',
            p: '`Math.sin` is the same builtin as `sin`, and `Math.PI` folds to its value.',
          },
          constructorNew: {
            name: '`constructor` and `new`',
            p: '`new` is a call of `Ray_new`, which builds the struct and hands it back.',
          },
          method: {
            name: 'Method',
            p: 'A function whose first parameter is the struct, and `this` reads as that parameter.',
          },
          staticFn: {
            name: '`static` method',
            p: 'A function with no receiver, under the class name.',
          },
          thisAssign: {
            name: 'Method that writes `this`',
            p: `A method that writes its object takes it by pointer on WGSL, and by \`inout\` on ${glsl}. [orbit-inout](shadeOrbitInout)`,
          },
          extendsSuper: {
            name: '`extends` and `super`',
            p: "The base's fields come first, an inherited method is lowered again, and `super` is a function of its own. [shape-inheritance](shadeShapeInheritance)",
          },
          abstractRow: {
            name: '`abstract` class',
            p: 'No struct for the abstract class. Each subclass carries the fields and its own copy of the method.',
          },
          implementsRow: {
            name: '`implements`',
            p: "Checked by TypeScript alone. The struct is the class's own fields.",
          },
          accessModifiers: {
            name: 'Access modifiers',
            p: 'Accepted, and they mean nothing to the shader. TypeScript is what enforces them.',
          },
          getter: {
            name: 'Getter and setter',
            p: 'Each half is a function of the module, `Disc_get_area` and `Disc_set_area`, and a read or a write calls it. [class-syntax](shadeClassSyntax)',
          },
          mixin: {
            name: 'Mixin function',
            p: 'The function runs while the file is compiled. Its members are spliced in, and `Tinted` is emitted nowhere. [mixin-surface](shadeMixinSurface)',
          },
          genericFunction: {
            name: 'Generic function',
            p: 'One function per set of type arguments the file uses, and nothing called `pick`. [generic-helpers](shadeGenericHelpers)',
          },
          genericClass: {
            name: 'Generic class',
            p: 'One struct per set of type arguments, each with its own copy of every method. [generic-class](shadeGenericClass)',
          },
          ifRow: { name: '`if`', p: 'An `if`, as written.' },
          forRow: {
            name: 'Counted `for`',
            p: 'A counted loop: an integer variable, a constant step, and an exit that compares it to a bound the body does not write. [block-scope](shadeBlockScope)',
          },
          forRuntime: {
            name: '`for` to a runtime bound',
            p: 'The start and the bound may be values the program learns at run time, and no trip count is too many.',
          },
          whileRow: {
            name: '`while`',
            p: 'A loop with a counter the compiler adds. Nothing checks that the body moves toward the bound.',
          },
          switchRow: {
            name: '`switch`',
            p: 'A `switch`. Each case ends with a `break`, which the lowering drops. A case whose end is reachable is refused (`TS8017`), because TypeScript would run on into the next case and WGSL runs only the one. [bitfield-bands](shadeBitfieldBands)',
          },
          ternaryScalar: {
            name: 'Ternary on a scalar',
            p: `A \`select\` on WGSL, and the ternary each ${glsl} driver has.`,
          },
          ternaryStruct: {
            name: 'Ternary on a struct',
            p: 'Neither target has an operator for it, so the value is hoisted into a slot and an `if`. [pick-composite](shadePickComposite)',
          },
          breakRow: {
            name: '`break`',
            p: 'A `break`, which is how a counted loop leaves early. [julia-twin](shadeJuliaTwin)',
          },
          continueRow: {
            name: '`continue`',
            p: 'A `continue`. In a `switch` that no loop encloses it is refused.',
          },
          discardRow: {
            name: '`discard`',
            p: 'A `discard`, in a fragment entry or in a function one calls. [cutout](shadeCutout)',
          },
          destructuring: {
            name: 'Destructuring',
            p: 'One declaration per name, in the order written.',
          },
          spread: {
            name: 'Object spread',
            p: 'One read per field of the struct, with the fields written after it over them.',
          },
          arrayLiteral: {
            name: 'Array literal',
            p: 'An array initializer, and only where the declaration states `array<T, N>`. [array-literal-ramp](shadeArrayLiteralRamp)',
          },
          tuple: {
            name: 'Tuple',
            p: 'A tuple is an array of a length the type fixes, a return included. [tuple-and-brand](shadeTupleAndBrand)',
          },
          literalUnion: {
            name: 'Literal union',
            p: 'A union whose members all name one type names that type.',
          },
          brand: {
            name: 'Branded type',
            p: 'The brand is erased and the parameter is an `f32`. [tuple-and-brand](shadeTupleAndBrand)',
          },
          typeClaims: {
            name: 'Type claims',
            p: 'A claim about a type, not a conversion, so each emits what its operand emits.',
          },
          power: { name: 'Exponent operator', p: '`pow` on both targets.' },
          logicalScalar: {
            name: '`&&` on a `bool`',
            p: 'The operator both targets have, on one `bool` at a time.',
          },
          logicalVector: {
            name: '`&&` on a mask',
            p: 'Combine masks with `all`, `any` or a `select`. [bool-select](shadeBoolSelect)',
          },
          optionalMember: {
            name: 'Optional field',
            p: 'A struct field is always there in the memory the host fills.',
          },
          stringValue: {
            name: 'String value',
            p: 'There is no string on the GPU; write the cases as an enum.',
          },
          numberType: { name: '`number`', p: 'A number on the GPU has a width.' },
          booleanType: { name: '`boolean`', p: 'The shader spelling is `bool`.' },
          integerLiteral: {
            name: 'Integer literal',
            p: 'The literal takes the type its position declares, and folds in it.',
          },
          increment: {
            name: 'Increment and decrement',
            p: 'An assignment of the value one step on.',
          },
          f64Scalar: {
            name: '`f64` scalar',
            p: 'A pair of `f32` words, with a `df64_` call for each operation. [fp64-lane-stripes](shadeLaneStripes)',
          },
          f64Literal: {
            name: '`f64` literal',
            p: 'A literal in a declared `f64` position keeps the whole double.',
          },
          f64Vector: {
            name: '`f64` vector',
            p: 'A vector of doubles, lowered into a hi plane and a lo plane. `vec2d` is the short spelling of `vec2f64`.',
          },
          f64Builtin: {
            name: 'Builtin on an `f64`',
            p: 'Ten builtins have an emulated body on a scalar and thirteen on a vector.',
          },
          f64Refused: {
            name: 'Builtin with no `f64` body',
            p: 'Refused at the call, which names the ten and the narrow to write.',
          },
          f64Guard: {
            name: '`f64` in a uniform',
            p: 'A `_fp64` texture is injected, which the host fills with `1.0`. Reflection lists it like any binding.',
          },
          f64Varying: {
            name: '`f64` across stages',
            p: 'Read the double in the stage that needs it, or narrow it to an `f32` at the boundary.',
          },
        },
        sourceP:
          'Every program on this page is compiled at the pinned commit while the site is built, and a snippet that stops compiling stops the build. The grammar itself is [the surface document](surfaceSource).',
      },
      fromWgsl: {
        title: 'WGSL in TypeShade: types, resources and entries',
        description:
          'The WGSL surface construct by construct, with the TypeShade spelling of each one: scalars, vectors, textures, address spaces, stage attributes and statements.',
        h1: 'WGSL in TypeShade',
        intro:
          'A reader who already writes WGSL needs one thing from this site, which is the TypeShade spelling of the construct in front of them. This page reads in that direction: a WGSL form on the left, what to write in a `"use typeshade"` file on the right, and a note where the two do not line up.',
        readingH: 'How to read a row',
        readingP: `The right column is source text the compiler at commit ${facts.pinnedCommit} accepts, and the left column is the WGSL that same compiler writes for it. Both are measured when this page is built, so a spelling the compiler stops writing arrives here at the next pin as a changed row.`,
        colWgsl: 'WGSL',
        colSource: 'TypeShade',
        colType: 'Type',
        colNote: 'Note',
        colInstead: 'What to write',
        /** The index names its four sections and links each one; the tables are on those
         *  pages. */
        pagesH: 'Sections',
        pages: {
          types: {
            title: 'WGSL scalars, vectors, matrices and their spelling',
            description:
              'The WGSL type surface with the TypeShade spelling of each one: scalars, vectors, matrices, arrays and atomics, textures and samplers.',
          },
          resources: {
            title: 'WGSL resources and address spaces in TypeShade',
            description:
              'A resource is a declare, the address space and the access mode are the wrapper type on the annotation, and the slot index is the source order.',
          },
          entries: {
            title: 'WGSL entry points and attributes in TypeShade',
            description:
              'Stage attributes, workgroup size, what a vertex entry has to return, the builtin ids the pipeline supplies, and the names WGSL does not have.',
          },
          statements: {
            title: 'WGSL statements and expressions, and how to write them',
            description:
              'The statements are TypeScript, and each one means what the WGSL beside it means. The text comes from one file compiled while this page is built.',
          },
        },
        typesH: 'Types',
        typesP:
          'A type is written where WGSL writes one, on a declaration, a parameter, a field and a return. The element type rides inside the name where WGSL takes a type argument, so `vec3<u32>` is `vec3u` and there is nothing in angle brackets to get wrong.',
        scalarsH: 'Scalars',
        f64P: 'A double has no WGSL type behind it. The declaration is written `f64`, and a pass rewrites every one into a pair of `f32` lanes and a library of functions over them before the writer runs. A multiplication of two doubles reaches the WGSL as one call.',
        vectorsH: 'Vectors',
        vectorsP:
          '`vec2` and `vec4` read the same way as the three above. `vec3` and `vec3f` are one type, and so are `vec3d` and `vec3f64`.',
        matricesH: 'Matrices',
        matricesP:
          'A square matrix also answers to the short name both targets give it, so `mat4` and `mat4x4` are the same declaration. The `C` and the `R` mean what they mean in WGSL, columns then rows.',
        arraysH: 'Arrays and atomics',
        arraysP:
          'A tuple is a list of a length the type fixes, which is what an array of a known size is, so `[f32, f32]` and `array<f32, 2>` reach the same type. A runtime-sized array and an atomic each live in a storage binding.',
        texturesH: 'Textures and samplers',
        texturesP:
          'A texture and a sampler are written bare, with no address-space wrapper, because a handle lives in no address space. A sampled texture takes `f32`, `i32` or `u32`, and the element decides both the WGSL spelling and which reads apply to it. A storage texture takes a format and an access mode as string literal types, which `tsc` checks before this compiler does.',
        resourcesH: 'Resources and address spaces',
        resourcesP:
          'A resource is a `declare`, which is TypeScript for a value something else provides. The address space and the access mode are the wrapper type on the annotation: a `storage` binding a shader writes is `storage<T, "read_write">`, and every resource is a `const`.',
        slotsP:
          'There is no `@group` or `@binding` to write. The slot index is the source order of the `declare` in the file, and the WGSL above shows what that came out as. A texture or a sampler takes the next slot the same way.',
        stagesH: 'Entry points and attributes',
        stagesP:
          'A stage attribute is a decorator on an exported function. A function with none of them is a helper. Workgroup size is the only payload on `@compute`, written as a list; the compiler carries the first number and refuses a shape whose y or z is anything but 1.',
        returnsP:
          'A vertex entry has to produce a position. A return typed `vec4` carries the position builtin on its own, and a struct return carries it in a field and adds as many `@location` varyings as the program wants. A struct return with no position field, a `void` return and a bare type that is not a `vec4` are each refused, naming the field or the type to write.',
        builtinValuesH: 'Builtin values',
        builtinValuesP: `The \`@builtin(...)\` vocabulary is WGSL's, ${facts.wgslBuiltinIds} names passed through as a string, so the WGSL attribute is the same id with no quotes around it. A typo is a \`tsc\` error at the line the author wrote, since the parameter is a closed union of them. WGSL fixes the type of every id but one, so the type column is what the annotation has to say.`,
        clipDistancesP: "The one id with no fixed type. The array length is the author's.",
        absentH: 'Names WGSL does not have',
        absentP:
          'Three names a GLSL author reaches for have no WGSL builtin behind them. The front end refuses each one at the declaration and lists the names it does take. The right column is the sentence the backends print after the attribute name, which says what to reach for instead.',
        statementsH: 'Statements and expressions',
        statementsP:
          "The statements are TypeScript's, and each one means what the WGSL beside it means. The emitted text comes from one file compiled at build time, so the parentheses and the folded constants are the writer's own.",
        functionsH: 'Builtin functions',
        functionsP:
          'Every builtin the compiler can spell, with the WGSL text it writes for each one, is on [the builtin table](languageBuiltins). A function the file declares wins over a builtin of the same name.',
        refusals: {
          'scalars.f16':
            'No type name in this surface. `"enable f16"` beside `"use typeshade"` emits WGSL\'s `enable f16;`, and the reflection names the capability a host requests as `shader-f16`, but there is still no `f16` to declare a value with.',
          'scalars.f64':
            'WGSL has no 64-bit float. The pass below rewrites the declaration before the writer sees it.',
          'vectors.vec3d': 'WGSL has no 64-bit vector either, and the same pass rewrites this one.',
        },
        notes: {
          'stages.vertex': 'One stage decorator per entry point, on an exported function.',
          'stages.fragment':
            'A fragment entry may also return nothing, which is what a program that only writes to a storage binding does.',
          'stages.compute':
            'The list is the workgroup size. `@compute` with no list is `[64, 1, 1]`.',
          'stages.location':
            'A location sits on an entry parameter, on a class field and on the return.',
          'stages.vertexBare':
            'A return typed `vec4` carries the position builtin on its own, so the smallest vertex shader needs no struct and no parameters.',
          'stages.vertexStruct':
            'A struct return carries the position in a field and adds as many varyings beside it as the program wants.',
          'stages.fragmentReturn':
            'A bare fragment return takes location 0 at any width, so `f32`, `vec2`, `vec3` and `vec4` are all draw-buffer formats. A struct return is the multiple-render-target form.',
          'statements.let':
            'A WGSL `let` is a value that stays as it was, which is what `const` says in TypeScript.',
          'statements.var':
            'A WGSL `var` is a local that changes. `let b: f32` with no initializer declares one and leaves the value for a later assignment; WGSL zeroes it and GLSL leaves it undefined, so assign before you read (Rule 7.6).',
          'statements.for':
            'A `for` is counted: an integer induction variable, a constant step, and an exit that compares it to a bound the body does not write. The start and the bound may be runtime values, and no trip count is too many. The step may be `+=`, `-=`, `*=` or `/=`.',
          'statements.while':
            'A `while` takes the place of `loop`. It is an open loop: it ends when its condition fails, or at a `break` or a `return`, and `while (true)` needs one of the two in its body.',
          'statements.switch':
            'Each case ends with `break`, which a WGSL case does without and the lowering drops. A case whose end is reachable would run on into the next case in TypeScript, so it is refused (`TS8017`). The last case needs no `break`. A label is an integer constant that may appear once. Two labels stacked over one body are one case with two selectors, `case 0, 1:` on WGSL.',
          'statements.select':
            'WGSL has no ternary, so a scalar or vector conditional becomes `select`, whose first argument is the arm the condition does not choose. A conditional on a struct or an array is hoisted into a slot and an `if`, since neither target has an operator for that.',
          'statements.call': 'A function called for what it does, with its result dropped.',
          'statements.phony':
            'A value-returning builtin dropped the same way takes the phony assignment, because Tint reads every such builtin as `@must_use`.',
          'statements.discard': 'The same word, and the same statement.',
          'statements.struct':
            'A WGSL struct is a class. A type alias of an object shape and an interface both reach the same declaration.',
          'statements.fn': 'A function with no stage decorator is a helper of the module.',
        },
      },
      fromGlsl: {
        title: `${glsl} in TypeShade: types and uniform blocks`,
        description: `The ${glsl} surface construct by construct, with the TypeShade spelling of each one: samplers, uniform blocks, varyings, builtin variables and functions.`,
        h1: `${glsl} in TypeShade`,
        intro: `A shader written for WebGL2 is written in ${glsl}, and most of it has a TypeShade spelling that emits the same program for both targets. This page reads in that direction, and it says which constructs have no form on WebGPU and which ones the compiler refuses on both.`,
        readingH: 'How to read a row',
        readingP: `The right column is source text the compiler at commit ${facts.pinnedCommit} accepts, and the left column is the ${glsl} that same compiler writes for it. Where this target has no form for a row, the cell carries the compiler's own sentence about it instead of a spelling it never writes.`,
        colGlsl: glsl,
        colSource: 'TypeShade',
        colNote: 'Note',
        colMessage: 'What the compiler says',
        colInstead: 'What to write',
        colCapability: 'Capability',
        colDirective: 'Source directive',
        colExtension: 'WebGL2 extension',
        noDirective: 'None. The host turns the extension on before it links the program.',
        /** The index names its four sections and links each one; the tables are on those
         *  pages. */
        pagesH: 'Sections',
        pages: {
          types: {
            title: `${glsl} types and their TypeShade spelling`,
            description: `The ${glsl} type surface with the TypeShade spelling of each one: scalars, vectors, matrices, arrays, samplers, and the types this target refuses.`,
          },
          uniforms: {
            title: `Uniforms and buffers in ${glsl} and TypeShade`,
            description: `A uniform binding is a struct the writer emits as a block, a varying is a field on both sides, and each capability this target knows is one row.`,
          },
          variables: {
            title: `Builtin variables from ${glsl} in TypeShade`,
            description: `A gl_ global is a builtin attribute on a parameter, on a class field or on the return, and the writer decides which global that becomes.`,
          },
          functions: {
            title: `Functions and operators in ${glsl} and TypeShade`,
            description: `A call carries one neutral name and each backend writes its own spelling. The derivative, texture, bit and remainder forms a GLSL author looks for.`,
          },
        },
        typesH: 'Types',
        typesP:
          "The scalar and vector names are WGSL's, since one source has to serve both targets, and the GLSL writer spells each one in this target's terms. A declaration therefore says `f32` where the emitted shader says `float`.",
        scalarsH: 'Scalars',
        vectorsH: 'Vectors',
        vectorsP:
          '`vec2` and `vec4` read the same way, and so do the integer, unsigned and boolean forms of each. A vector of doubles has no form on either target and is rewritten into `f32` lanes before the writer runs.',
        arraysH: 'Matrices and arrays',
        matricesH: 'Matrices',
        matricesP:
          "A square matrix keeps the short name every driver's error messages use, and the other six shapes are written `matCxR`, columns then rows, the same way this target writes them.",
        arraysP:
          'A tuple is a list of a length the type fixes, so `[f32, f32]` and `array<f32, 2>` reach the same type. An array whose length is not known until the program runs is a storage buffer, which this target has no form for, so a module with one is rewritten to read from a data texture instead.',
        samplersH: 'Samplers',
        samplersP:
          'This target fuses the texture and the sampler into one combined sampler, and WebGPU keeps them apart. A TypeShade file declares the two the WebGPU way and the GLSL writer fuses them, so the sampler argument disappears from every read and the binding it stood in is dropped from the layout the host binds.',
        shadowP:
          'A depth texture is the exception that proves the fusing: its combined type depends on how the module reads it, so the binding emit decides it. Every read of one this surface admits is a comparison, which makes it the shadow form.',
        noFormH: 'Types with no GLSL form',
        noFormP:
          'Each of these is refused by the writer, and the cell beside it is the sentence the writer throws. A module carrying one still emits its WGSL, so these are the lines that make a shader WebGPU only.',
        uniformsH: 'Uniforms and buffers',
        uniformsP:
          'A uniform binding is a struct, which the writer emits as a std140 block. A storage buffer has no form on this target at all, so a module with one is rewritten to read from a data texture before the capability gate runs.',
        varyingsH: 'Varyings',
        varyingsP:
          'A value that travels from the vertex stage to the fragment stage is a `@location(n)` field on both sides. This target links them by name and WebGPU by number, so the field name is what has to match in the emitted GLSL.',
        capabilitiesH: 'Extensions and capabilities',
        capabilitiesP: `An \`#extension\` line is one half of a GPU feature and the host's \`getExtension\` call is the other. The profile for this target has ${facts.glslCapabilities} rows, and one of them puts a directive in the source; everything with no row at all fails the module closed here before any text is written.`,
        enablesP:
          'A `"use typeshade"` file has no spelling for these four. `"enable ..."` takes WGSL extension names and none of the four is one, so a module that needs one is assembled with `module({ enables: [...] })` on the `fn()` surface. What a module\'s shape implies, such as a storage binding, a compute entry or a `@builtin("clip_distances")`, is derived from the file, and none of those has a row here.',
        variablesH: 'Builtin variables',
        variablesP:
          'A `gl_*` global is a `@builtin(...)` attribute on a parameter, on a class field or on the return. The attribute says which value it is and the writer decides which global that becomes, which is how one file reaches both targets.',
        absentH: 'Variables neither writer takes',
        absentP:
          'Two of them have no name in this surface. The front end refuses the spelling at the declaration, and the sentence below is what the WGSL backend prints for the same name, which says what to reach for instead.',
        functionsH: 'Functions and operators',
        functionsP:
          'A call carries one neutral name through the compiler and each backend writes its own spelling, so the name to write is the one in the right column. These are the ones a GLSL author goes looking for.',
        operatorsP:
          'The operators divide the same way. A comparison of two vectors is written with the operator and reaches this target as the function it has, and a per-component choice is `select` on both.',
        operatorsH: 'Operators',
        restP:
          'Every builtin the compiler can spell, with the text it writes for each one on both targets, is on [the builtin table](languageBuiltins).',
        edslH: 'The fn() spelling',
        edslP:
          'This page is the `"use typeshade"` surface. The compiler also has an embedded surface, built out of `fn()` and `uniformStruct()` and their kin, and the same GLSL constructs are put against that spelling in [Migrating a GLSL shader](internalsGlslShader). The WGSL side of this page is [WGSL in TypeShade](languageFromWgsl).',
        refusals: {
          'uniforms.precision': 'Nothing to write.',
        },
        notes: {
          'uniforms.block':
            'The class is the block and the `declare` is the instance. The field order is the layout.',
          'uniforms.loose':
            'A default-block uniform set through `glUniform*` has no spelling here, so a uniform binding of a bare scalar, vector or matrix reaches WebGPU alone.',
          'uniforms.storage':
            'The buffer becomes a data texture, and the host uploads the same numbers as texels.',
          'uniforms.fetch':
            'An index into the buffer becomes a fetch through this function, which the writer defines in the modules that call it.',
          'uniforms.define':
            'A specialization constant has no GLSL form, so the default is written as a preprocessor substitution the host can override before it compiles the stage.',
          'uniforms.precision':
            'The writer puts the qualifier at the top of every stage it emits, and the `floatPrecision` option decides whether the float line reads `highp` or `mediump`. The integer line stays `highp`, since a read back through a data texture needs the whole range.',
          'varyings.out': 'Written on the field of the struct a vertex entry returns.',
          'varyings.in':
            'Written on the fragment entry parameter that reads it, under the same name.',
          'varyings.target':
            'A bare fragment return takes location 0, and the writer names the output itself.',
          'variables.glPosition':
            'The same id on a vertex output. A vertex entry returning a bare `vec4` carries it with nothing written.',
          'variables.glFragCoord':
            'The same id on a fragment input. The y origin differs: this target counts from the bottom of the window and WebGPU from the top, so a shader that reads `.y` needs a flip of its own.',
          'variables.glVertexID':
            'An index is a `u32` here and an `int` there, so the read is wrapped in the declared type.',
          'variables.glInstanceID': 'The same wrap, for the same reason.',
          'variables.glFrontFacing': 'A `bool` on both targets, so the read needs no cast.',
          'variables.glFragDepth':
            'Written as a field of the struct a fragment entry returns, beside its colour.',
          'functions.dpdx': 'The same derivative under the WGSL name.',
          'functions.dpdy': 'The same, along the other axis.',
          'functions.dpdxCoarse':
            'The coarse and fine variants keep their names on WGSL and collapse here, since this target has one derivative per axis.',
          'functions.dpdyFine': 'The same collapse.',
          'functions.mod':
            "The floor remainder, which is what this target's `mod` already is. The `%` operator is the other one.",
          'functions.textureSample':
            'The sampler argument goes, because the combined sampler already holds it.',
          'functions.textureLoad': 'A texel read at an integer coordinate and a mip level.',
          'functions.textureDimensions':
            "The size comes back unsigned, so the writer wraps this target's signed answer.",
          'functions.faceForward': 'A spelling difference and nothing more.',
          'functions.inverseSqrt': 'A spelling difference and nothing more.',
          'functions.round':
            'The rounding both targets share is the one that sends a half to the even neighbour.',
          'functions.countOneBits':
            'This target has none of the bit builtins, so the writer defines a small function over the shifts and masks it does have.',
          'functions.firstLeadingBit': 'Another of those, defined only in a module that calls it.',
          'operators.mod': 'The floor remainder, whose sign follows the divisor.',
          'operators.remainder':
            'The truncating remainder, whose sign follows the dividend. This target has no `%` on floats, so the writer spells it out.',
          'operators.lessThan':
            'A vector comparison is a function on this target and an operator on the other, so it is written as the operator.',
          'operators.equal': 'The same, and the strict form is the one TypeScript takes.',
          'operators.select':
            'A scalar choice is the ternary here and `select` on WGSL, so one name serves both.',
          'operators.vectorSelect':
            'A per-component choice over a boolean vector is `mix` on this target, which is the shape a GLSL author already writes.',
        },
      },
      builtins: {
        title: `Builtin functions and their WGSL and ${glsl} forms`,
        description: `Every builtin the compiler can spell, ${facts.builtins} in all, beside the WGSL and the ${glsl} text it writes for each one, grouped by family.`,
        h1: 'Builtin functions',
        intro: `A builtin is a function the GPU already has. A call carries one neutral name through the compiler, and each backend writes its own spelling for that name, so the call is written once and emitted twice. The registry holds ${facts.builtins} names.`,
        readingH: 'How to read a row',
        readingP: `The first column is the name the call carries, with a placeholder argument in each position it takes. The next two are the text the WGSL backend and the ${glsl} backend write for that call, run from the compiler's own spelling table at the pinned commit. ${facts.portableBuiltins} of the names are spelled the same way on both targets, and ${facts.glslAbsentBuiltins} have no ${glsl} form at all, where the cell carries the compiler's own message. ${facts.mathAliasBuiltins} answer to a \`Math.\` name as well, which the last column of the maths and cast tables shows.`,
        idsP: `A few of these names are chosen by the compiler and never written by hand. A layered texture read, a depth comparison, a storage fetch and a texel read at an unsigned coordinate each take a name of their own, so the argument order of a call never depends on the texture it landed on. An \`abs\` of an unsigned value and an integer \`dot\` take one too, because ${glsl} has no overload for either.`,
        precedenceH: 'A name the file declares',
        precedenceP:
          "A function the file declares wins over a builtin of the same name. Such a name meant the author's own function before it was a builtin, and an addition does not change what a program already means.",
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
          f64: 'Emulated double',
        },
        bitsP: `${glsl} has none of the bit builtins, so the column above names a small function the GLSL writer defines over the shifts, masks and comparisons that target does have. A module that calls none of them carries none of the definitions.`,
        helpersH: 'GLSL helper functions',
        helpersP: `A storage buffer has no ${glsl} form, so a read of one is rewritten into a read from a data texture. These are the functions that read stands for, and the GLSL writer emits the definition of each one a module calls.`,
        sourceP:
          'Every row on this page is read from [the spelling registry](intrinsicRegistry) at the pinned commit, and none of it is typed here.',
      },
    },
  },

  notFound: {
    title: 'Page not found, TypeShade',
    description: 'There is nothing at this address on typeshade.dev.',
    h1: 'There is nothing at this address.',
    p: 'The page may have moved. The front page and the authoring guide are still here.',
    links: '[Go to the front page](home), or read the [authoring guide](guide).',
  },
};
