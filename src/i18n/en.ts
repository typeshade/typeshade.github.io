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

// A title and a description for every section of the language guide, keyed by the id the
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
    description: `Start a file with \`"use typeshade"\` and emit WGSL for WebGPU and ${glsl} for WebGL2. The same source runs on the CPU in f64, so its output can be checked.`,
    ogAlt: 'TypeShade: one shader source for WebGPU and WebGL2, with a rendered metaballs shader.',
  },

  nav: {
    primary: 'Primary', guide: 'Guide', api: 'API', examples: 'Examples', github: 'GitHub', llms: 'llms.txt',
    languages: 'Languages', theme: 'Toggle dark mode', menu: 'Menu', search: 'Search', close: 'Close',
    searchUnavailable: 'Search is available on the built site',
    searchUi: { placeholder: 'Search', clear_search: 'Clear', load_more: 'Load more results', search_label: 'Search this site', filters_label: 'Filters', zero_results: 'No results for [SEARCH_TERM]', many_results: '[COUNT] results for [SEARCH_TERM]', one_result: '[COUNT] result for [SEARCH_TERM]', alt_search: 'No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM]', search_suggestion: 'No results for [SEARCH_TERM]. Try one of these searches:', searching: 'Searching for [SEARCH_TERM]' },
    version: 'Version', prerelease: `Pre-release; ${facts.nextVersion} is next`, releases: 'Releases', commit: 'Pinned commit', changelog: 'Changelog',
  },
  docs: {
    introduction: 'Introduction', authoring: 'Authoring', project: 'Project', why: 'Why TypeShade', quickStart: 'Quick start',
    authoringGuide: 'Language guide', checks: 'Verification', examples: 'Examples', onThisPage: 'On this page', previous: 'Previous', next: 'Next', editPage: 'Edit this page', permalink: 'Link to heading',
    api: {
      title: 'TypeShade API reference: functions, types and interfaces',
      description: 'Every public export of TypeShade on its own page: syntax, parameters, return value, examples and which targets support it.',
      h1: 'API reference', intro: `Every export of the typeshade package, generated from the compiler at commit ${facts.pinnedCommit}. One page per function, type, interface and class.`, reference: 'Reference', breadcrumbs: 'Breadcrumbs',
      pageTitle: (heading: string, kind: string, category: string) => { const base = `${heading}: ${kind.toLowerCase()} in ${category}`; const suffixes = [', TypeShade API reference for developers', ', TypeShade API reference', ', TypeShade API', ', TypeShade']; const fitting = suffixes.find((suffix) => (base + suffix).length <= 60); return fitting ? base + fitting : base },
      categoryTitle: (name: string) => `${name}, a category in the TypeShade API reference`, categoryDescription: (name: string, summary: string) => `${name} in the TypeShade API reference. ${summary}`,
      pageDescription: (name: string, kind: string, category: string, summary: string) => { const k = kind.toLowerCase(); return `${name}, ${/^[aeiou]/.test(k) ? 'an' : 'a'} ${k} in ${category}. ${summary}` }, kindLine: (kind: string, category: string) => `${kind} in ${category}`,
      note: `The signature, the description and the examples come from the compiler's own source at commit ${facts.pinnedCommit}.`, syntax: 'Syntax', parameters: 'Parameters', returnValue: 'Return value', exceptions: 'Exceptions', descriptionHeading: 'Description', examples: 'Examples', targets: 'Targets', target: 'Target', supportHeading: 'Support', notes: 'Notes', constructor: 'Constructor', instanceProperties: 'Instance properties', instanceMethods: 'Instance methods', inGuide: 'In the guide', seeAlso: 'See also', source: 'Source', optional: 'optional', readonly: 'read only', deprecated: 'deprecated', previewNote: 'Template preview. The words on this page are a fixture; the compiler supplies the real ones.', line: (n: number) => `line ${n}`, atCommit: (sha: string) => `at commit ${sha}`, members: (n: number) => `${n} members`, kindMeta: 'Kind', kinds: { function: 'Function', constant: 'Constant', interface: 'Interface', type: 'Type', class: 'Class' }, targetNames: { wgsl: 'WGSL (WebGPU)', glsl: `${glsl} (WebGL2)`, cpu: 'CPU oracle' }, support: { native: 'Supported', emulated: 'Emulated', stub: 'Stub', none: 'Not supported', 'n/a': 'Does not apply' }, categories: apiCategories,
    },
  },
  footer: { docs: 'Documentation', project: 'Project', languages: 'Languages', readme: 'README', releases: 'Releases', npm: 'npm package', license: 'Released under the [MIT License](license).', copyright: `Copyright © ${facts.year} ${facts.author} contributors`, builtFrom: 'Built from commit' },

  // Keep the remainder of the existing locale object below this point unchanged.
  ...({} as Record<string, unknown>),
} as typeof import('./en.ts').en
