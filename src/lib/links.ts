// Every destination the site links to, in one place. Routes into the compiler are permalinks
// at the pinned commit, so a link never points at a file the site's numbers were not
// measured from. No consumer of the library is named or linked anywhere.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { apiCategories, apiSlugByName } from './api-nav.ts';
import { facts } from './examples.ts';
import { languageSections } from './language-reference.ts';
import { shadeExampleList } from './shade-examples.ts';
import { translationDir } from './guide-translations.ts';
import { apiCategoryCopy, copyFor, localePath, type Locale } from '../i18n/index.ts';

export interface Destination {
  readonly label: string;
  readonly href: string;
}

const mirror = facts.mirrorUrl;
const at = (file: string): string => `${mirror}/blob/${facts.pinnedCommit}/${file}`;
/** One `.shade.ts` example, by the id the registry carries it under. The construct page links
 *  a row to the file that demonstrates it; a renamed or dropped example stops the build here
 *  instead of leaving the row pointing at nothing. */
const shade = (id: string): Destination => {
  const example = shadeExampleList.find((e) => e.id === id);
  if (!example)
    throw new Error(`[links] no '.shade.ts' example called '${id}' at ${facts.pinnedCommit}`);
  return { label: example.file, href: at(`examples/${example.file}`) };
};
const siteRepo = 'https://github.com/typeshade/typeshade.github.io';

export const links = {
  home: { label: 'TypeShade', href: '/' },
  motivation: { label: 'Introduction', href: '/guide/introduction/' },
  quickStart: { label: 'Use TypeShade', href: '/guide/quick-start/' },
  playground: { label: 'Playground', href: '/playground/' },
  concepts: { label: 'TypeScript and WebGPU concepts', href: '/guide/typescript-and-webgpu/' },
  conceptsCpuGpu: { label: 'CPU and GPU', href: '/guide/concepts/cpu-and-gpu/' },
  conceptsPipeline: { label: 'The pipeline', href: '/guide/concepts/the-pipeline/' },
  conceptsWebgpu: { label: 'WebGPU and WebGL2', href: '/guide/concepts/webgpu-and-webgl2/' },
  conceptsWgsl: { label: 'WGSL and GLSL', href: '/guide/concepts/wgsl-and-glsl/' },
  guide: { label: 'Language guide', href: '/guide/language/' },
  languageTypes: { label: 'Types', href: '/guide/language/types/' },
  languageFunctions: { label: 'Functions', href: '/guide/language/functions/' },
  languageControlFlow: { label: 'Control flow', href: '/guide/language/control-flow/' },
  languageGpuTypes: { label: 'GPU types', href: '/guide/language/gpu-types/' },
  languageResources: { label: 'Resources', href: '/guide/language/resources/' },
  languageStages: { label: 'Shader stages', href: '/guide/language/stages/' },
  languageFromTypescript: {
    label: 'TypeScript constructs',
    href: '/guide/language/from-typescript/',
  },
  languageFromWgsl: { label: 'WGSL in TypeShade', href: '/guide/language/from-wgsl/' },
  languageFromGlsl: {
    label: `${facts.glslTarget} in TypeShade`,
    href: '/guide/language/from-glsl/',
  },
  // The sections of the three mapping sets, one page each. The index at the address above
  // introduces the set and links these; the sidebar opens them under it while the reader is
  // inside the set, so previous and next walk a set without going back to its index.
  fromTsDeclarations: {
    label: 'Declarations',
    href: '/guide/language/from-typescript/declarations/',
  },
  fromTsFunctions: { label: 'Functions', href: '/guide/language/from-typescript/functions/' },
  fromTsClasses: { label: 'Classes', href: '/guide/language/from-typescript/classes/' },
  fromTsControlFlow: {
    label: 'Control flow',
    href: '/guide/language/from-typescript/control-flow/',
  },
  fromTsExpressions: { label: 'Expressions', href: '/guide/language/from-typescript/expressions/' },
  fromTsDouble: { label: 'Emulated double', href: '/guide/language/from-typescript/double/' },
  fromWgslTypes: { label: 'Types', href: '/guide/language/from-wgsl/types/' },
  fromWgslResources: { label: 'Resources', href: '/guide/language/from-wgsl/resources/' },
  fromWgslEntries: { label: 'Entry points', href: '/guide/language/from-wgsl/entries/' },
  fromWgslStatements: { label: 'Statements', href: '/guide/language/from-wgsl/statements/' },
  fromGlslTypes: { label: 'Types', href: '/guide/language/from-glsl/types/' },
  fromGlslUniforms: { label: 'Uniforms', href: '/guide/language/from-glsl/uniforms/' },
  fromGlslVariables: { label: 'Builtin variables', href: '/guide/language/from-glsl/variables/' },
  fromGlslFunctions: { label: 'Functions', href: '/guide/language/from-glsl/functions/' },
  languageBuiltins: { label: 'Builtin functions', href: '/guide/language/builtins/' },
  legacyAuthoring: { label: 'Compiler authoring guide', href: '/guide/authoring/' },
  internals: { label: 'Compiler internals', href: '/guide/internals/' },
  internalsGlslShader: {
    label: 'Migrating a GLSL shader',
    href: '/guide/internals/migrating-a-glsl-shader/',
  },
  languageService: { label: 'Language service', href: '/guide/language-service/' },
  languageServiceDesign: {
    label: 'Language service design document',
    href: at('docs/language-service-api.md'),
  },
  checks: { label: 'Verification', href: '/guide/checks/' },
  examples: { label: 'Examples', href: '/guide/examples/' },
  api: { label: 'Compiler API reference', href: '/api/' },
  reference: { label: 'Language reference', href: '/reference/' },
  errors: { label: 'Error codes', href: '/reference/errors/' },
  guideSource: { label: 'Compiler guide source (AUTHORING.md)', href: at('AUTHORING.md') },
  surfaceSource: {
    label: 'TypeShade surface specification',
    href: at('docs/use-typeshade-surface.md'),
  },
  mirror: { label: 'GitHub', href: mirror },
  docs: { label: 'README', href: at('README.md') },
  npm: { label: 'typeshade', href: 'https://www.npmjs.com/package/typeshade' },
  llms: { label: 'llms.txt', href: '/llms.txt' },
  commit: { label: facts.pinnedCommit, href: `${mirror}/tree/${facts.pinnedCommit}` },
  releases: { label: 'Watch releases', href: `${mirror}/releases` },
  license: { label: 'MIT License', href: at('LICENSE') },
  changelog: { label: 'Changelog', href: at('CHANGELOG.md') },
  examplesIndex: { label: 'examples/index.ts', href: at('examples/index.ts') },
  examplesDir: {
    label: 'the examples directory',
    href: `${mirror}/tree/${facts.pinnedCommit}/examples`,
  },
  goldens: { label: 'emit-goldens.test.ts', href: at('examples/emit-goldens.test.ts') },
  packageJson: { label: 'package.json', href: at('package.json') },
  oracle: { label: 'src/core/oracle.ts', href: at('src/core/oracle.ts') },
  intrinsicRegistry: { label: 'src/core/intrinsics.ts', href: at('src/core/intrinsics.ts') },
  deepZoom: { label: 'fp64-deep-zoom.ts', href: at('examples/fp64-deep-zoom.ts') },
  compileGate: { label: 'scripts/compile-gate.ts', href: at('scripts/compile-gate.ts') },
  ciGates: { label: 'the CI workflow', href: `${siteRepo}/blob/main/.github/workflows/deploy.yml` },
  maplibreRoadmap: {
    label: 'MapLibre graphics modernization roadmap',
    href: 'https://maplibre.org/roadmap/maplibre-gl-js/graphics-modernization/',
  },
  deckglWebgpu: {
    label: 'deck.gl WebGPU guide',
    href: 'https://deck.gl/docs/developer-guide/webgpu',
  },
  pixijsMigration: {
    label: 'PixiJS v8 migration guide',
    href: 'https://pixijs.com/8.x/guides/migrations/v8',
  },
  mdnWebgpu: {
    label: 'MDN WebGPU API',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API',
  },
  mdnGpuDevice: {
    label: 'MDN GPUDevice',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice',
  },
  mdnBindGroupLayout: {
    label: 'MDN GPUBindGroupLayout',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/GPUBindGroupLayout',
  },
  mdnRenderPipeline: {
    label: 'MDN GPURenderPipeline',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/GPURenderPipeline',
  },
  mdnComputePass: {
    label: 'MDN GPUComputePassEncoder',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder',
  },
  mdnWebgl2: {
    label: 'MDN WebGL2RenderingContext',
    href: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext',
  },
  specWebgpu: { label: 'WebGPU specification', href: 'https://www.w3.org/TR/webgpu/' },
  specWgsl: { label: 'WGSL specification', href: 'https://www.w3.org/TR/WGSL/' },
  specWebgl2: {
    label: 'WebGL2 specification',
    href: 'https://registry.khronos.org/webgl/specs/latest/2.0/',
  },
  specGlslEs: {
    label: `${facts.glslTarget} specification`,
    href: 'https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf',
  },
  survey: { label: facts.survey.title, href: facts.survey.url },
  // The `.shade.ts` example behind a row of /guide/language/from-typescript/.
  shadeModuleConst: shade('module-const'),
  shadePaletteConst: shade('palette-const'),
  shadePrivateState: shade('private-state'),
  shadeBitfieldBands: shade('bitfield-bands'),
  shadeRayClass: shade('ray-class'),
  shadeDefaultArgs: shade('default-args'),
  shadeAtomicHistogram: shade('atomic-histogram'),
  shadeOrbitInout: shade('orbit-inout'),
  shadeClassSyntax: shade('class-syntax'),
  shadeShapeInheritance: shade('shape-inheritance'),
  shadeMixinSurface: shade('mixin-surface'),
  shadeGenericHelpers: shade('generic-helpers'),
  shadeGenericClass: shade('generic-class'),
  shadeBlockScope: shade('block-scope'),
  shadePickComposite: shade('pick-composite'),
  shadeCutout: shade('cutout'),
  shadeJuliaTwin: shade('julia-twin'),
  shadeArrayLiteralRamp: shade('array-literal-ramp'),
  shadeTupleAndBrand: shade('tuple-and-brand'),
  shadeBoolSelect: shade('bool-select'),
  shadeLaneStripes: shade('fp64-lane-stripes'),
} as const satisfies Record<string, Destination>;

/** The name of a destination above. Copy that carries a link as a key (src/i18n/en.ts) is
 *  typed with this, so a key no record has is a type error and not a crash at build time. */
export type LinkKey = keyof typeof links;

/** The three construct-mapping sets. Each one is an index that introduces the set and links
 *  its sections, and one page per section in this order, which is the order the sidebar
 *  lists them in and the order previous and next walk them in. The rows themselves stay in
 *  the generators; this is only the shape of the routes. */
export const mappingSets = [
  {
    index: 'languageFromTypescript',
    sections: [
      { key: 'declarations', link: 'fromTsDeclarations' },
      { key: 'functions', link: 'fromTsFunctions' },
      { key: 'classes', link: 'fromTsClasses' },
      { key: 'controlFlow', link: 'fromTsControlFlow' },
      { key: 'expressions', link: 'fromTsExpressions' },
      { key: 'double', link: 'fromTsDouble' },
    ],
  },
  {
    index: 'languageFromWgsl',
    sections: [
      { key: 'types', link: 'fromWgslTypes' },
      { key: 'resources', link: 'fromWgslResources' },
      { key: 'entries', link: 'fromWgslEntries' },
      { key: 'statements', link: 'fromWgslStatements' },
    ],
  },
  {
    index: 'languageFromGlsl',
    sections: [
      { key: 'types', link: 'fromGlslTypes' },
      { key: 'uniforms', link: 'fromGlslUniforms' },
      { key: 'variables', link: 'fromGlslVariables' },
      { key: 'functions', link: 'fromGlslFunctions' },
    ],
  },
] as const;

export type MappingIndexKey = (typeof mappingSets)[number]['index'];
export type MappingSectionKey = (typeof mappingSets)[number]['sections'][number]['link'];

/** One set by the index it belongs to, for the page components that render it. */
export function mappingSet<K extends MappingIndexKey>(
  index: K,
): Extract<(typeof mappingSets)[number], { index: K }> {
  const found = mappingSets.find((set) => set.index === index);
  if (!found) throw new Error(`[links] no mapping set called '${index}'`);
  return found as Extract<(typeof mappingSets)[number], { index: K }>;
}

const i18nSourceByLocale = new Map<Locale, string>();
function i18nSource(locale: Locale): string {
  const cached = i18nSourceByLocale.get(locale);
  if (cached !== undefined) return cached;
  const text = readFileSync(path.resolve(`src/i18n/${locale}.ts`), 'utf8');
  i18nSourceByLocale.set(locale, text);
  return text;
}
function dictionaryLine(locale: Locale, key: string): number {
  const lines = i18nSource(locale).split('\n');
  const at = lines.findIndex((l) => l.startsWith(`  ${key}: {`) || l.startsWith(`  ${key}: `));
  if (at < 0) throw new Error(`[links] '${key}' is not a top-level key of src/i18n/${locale}.ts`);
  return at + 1;
}
export function editCopy(locale: Locale, key?: string): string {
  const at = key === undefined ? '' : `#L${dictionaryLine(locale, key)}`;
  return `${siteRepo}/blob/main/src/i18n/${locale}.ts${at}`;
}
export function editGuide(sourceLine: number): string {
  return `${links.guideSource.href}#L${sourceLine}`;
}
export function editGuideTranslation(locale: Locale, id: string): string {
  return `${siteRepo}/blob/main/${translationDir(locale)}/${id}.md`;
}

export function navLinks(locale: Locale): readonly Destination[] {
  const labels = copyFor(locale).docs.labels.nav;
  return [
    { label: labels.use, href: localePath(locale, links.quickStart.href) },
    { label: labels.playground, href: localePath(locale, links.playground.href) },
    { label: labels.language, href: localePath(locale, links.guide.href) },
    { label: labels.reference, href: localePath(locale, links.reference.href) },
    { label: labels.examples, href: localePath(locale, links.examples.href) },
  ];
}

export function apiPage(name: string): string {
  const slug = apiSlugByName().get(name);
  if (!slug)
    throw new Error(`[links] the copy links to '${name}', which the compiler does not export`);
  return `/api/${slug}/`;
}

/** The guide's own pages in the order the sidebar groups them, for the footer's site map.
 *  A set whose members are listed and linked by a page of its own is one row here, the way
 *  the compiler internals are: the three mapping indexes stand for their fourteen sections
 *  and /guide/internals/ for its own, so the map stays a map. */
export function docsPages(locale: Locale): readonly Destination[] {
  return [
    docsPage(locale, 'motivation'),
    docsPage(locale, 'quickStart'),
    docsPage(locale, 'guide'),
    docsPage(locale, 'languageFromTypescript'),
    docsPage(locale, 'languageFromWgsl'),
    docsPage(locale, 'languageFromGlsl'),
    docsPage(locale, 'languageBuiltins'),
    docsPage(locale, 'concepts'),
    docsPage(locale, 'conceptsCpuGpu'),
    docsPage(locale, 'conceptsPipeline'),
    docsPage(locale, 'conceptsWebgpu'),
    docsPage(locale, 'conceptsWgsl'),
    docsPage(locale, 'examples'),
    docsPage(locale, 'reference'),
    docsPage(locale, 'internals'),
    docsPage(locale, 'languageService'),
    docsPage(locale, 'checks'),
  ];
}

type DocsPageKey =
  | 'motivation'
  | 'quickStart'
  | 'playground'
  | 'guide'
  | 'languageFromTypescript'
  | 'languageFromWgsl'
  | 'languageFromGlsl'
  | 'languageBuiltins'
  | MappingSectionKey
  | 'concepts'
  | 'conceptsCpuGpu'
  | 'conceptsPipeline'
  | 'conceptsWebgpu'
  | 'conceptsWgsl'
  | 'examples'
  | 'reference'
  | 'internals'
  | 'languageService'
  | 'checks';
/** One page of the guide as the sidebar and the footer name it, in one language. */
function docsPage(locale: Locale, key: DocsPageKey): Destination {
  const d = copyFor(locale).docs;
  const m = d.labels.mappingSections;
  const labels: Record<DocsPageKey, string> = {
    motivation: d.introduction,
    quickStart: d.labels.nav.use,
    playground: d.labels.playground,
    guide: d.labels.languageGuide,
    languageFromTypescript: d.labels.mapping.fromTypescript,
    languageFromWgsl: d.labels.mapping.fromWgsl,
    languageFromGlsl: d.labels.mapping.fromGlsl,
    languageBuiltins: d.labels.mapping.builtins,
    concepts: d.labels.concepts,
    conceptsCpuGpu: d.labels.conceptPages.cpuAndGpu,
    conceptsPipeline: d.labels.conceptPages.pipeline,
    conceptsWebgpu: d.labels.conceptPages.webgpuAndWebgl2,
    conceptsWgsl: d.labels.conceptPages.wgslAndGlsl,
    examples: d.examples,
    reference: d.labels.languageReference,
    internals: d.labels.internals,
    languageService: d.labels.languageService,
    checks: d.checks,
    // The sections of the three mapping sets. The sidebar row takes the short name; the
    // page's own h1 is the longer heading the set's copy already carries.
    fromTsDeclarations: m.fromTypescript.declarations,
    fromTsFunctions: m.fromTypescript.functions,
    fromTsClasses: m.fromTypescript.classes,
    fromTsControlFlow: m.fromTypescript.controlFlow,
    fromTsExpressions: m.fromTypescript.expressions,
    fromTsDouble: m.fromTypescript.double,
    fromWgslTypes: m.fromWgsl.types,
    fromWgslResources: m.fromWgsl.resources,
    fromWgslEntries: m.fromWgsl.entries,
    fromWgslStatements: m.fromWgsl.statements,
    fromGlslTypes: m.fromGlsl.types,
    fromGlslUniforms: m.fromGlsl.uniforms,
    fromGlslVariables: m.fromGlsl.variables,
    fromGlslFunctions: m.fromGlsl.functions,
  };
  return { label: labels[key], href: localePath(locale, links[key].href) };
}

export interface SidebarItem extends Destination {
  readonly depth?: number;
  /** The label is an export's name, set in the code font. */
  readonly code?: boolean;
}
export interface SidebarGroup {
  readonly title: string;
  readonly items: readonly SidebarItem[];
}

/** The sidebar's groups. The reference lists its categories and opens the members of the one
 *  the reader is in; the compiler internals list their sections the same way, only while the
 *  reader is on one of them, so the sidebar never carries every page of the reference at once.
 *  `path` is the page's locale-neutral route. */
export function sidebar(
  locale: Locale,
  sections: readonly Destination[] = [],
  openCategory?: string,
  path?: string,
): readonly SidebarGroup[] {
  const d = copyFor(locale).docs;
  const labels = d.labels.sidebarGroups;
  const topicLabels = d.labels.topics;
  const page = (key: DocsPageKey): SidebarItem => docsPage(locale, key);
  const languagePages: SidebarItem[] = [
    page('guide'),
    { label: topicLabels.types, href: localePath(locale, links.languageTypes.href), depth: 1 },
    {
      label: topicLabels.functions,
      href: localePath(locale, links.languageFunctions.href),
      depth: 1,
    },
    {
      label: topicLabels.controlFlow,
      href: localePath(locale, links.languageControlFlow.href),
      depth: 1,
    },
    {
      label: topicLabels.gpuTypes,
      href: localePath(locale, links.languageGpuTypes.href),
      depth: 1,
    },
    {
      label: topicLabels.resources,
      href: localePath(locale, links.languageResources.href),
      depth: 1,
    },
    { label: topicLabels.stages, href: localePath(locale, links.languageStages.href), depth: 1 },
  ];
  // A mapping set is an index one level in, the way a topic is, with its own sections one
  // level further in. They open only while the reader is inside the set, the way the
  // compiler internals open their sections, so the Language group never carries every
  // section of all three sets at once.
  for (const set of mappingSets) {
    languagePages.push({ ...page(set.index), depth: 1 });
    if (path?.startsWith(links[set.index].href)) {
      for (const s of set.sections) languagePages.push({ ...page(s.link), depth: 2 });
    }
  }
  languagePages.push({ ...page('languageBuiltins'), depth: 1 });
  // The Reference group opens with the language reference, the surface a shader author
  // writes, and its six kind pages one level in; then the compiler's own API reference with
  // its categories, then the internals and the language service.
  const reference: SidebarItem[] = [page('reference')];
  for (const section of languageSections()) {
    reference.push({
      label: d.reference.kinds[section.kind].name,
      href: localePath(locale, `/reference/${section.slug}/`),
      depth: 1,
    });
  }
  // The diagnostic codes sit with the language reference: a code is what a reader of a
  // `"use typeshade"` file meets when the file does not compile.
  reference.push({ label: d.errors.h1, href: localePath(locale, links.errors.href), depth: 1 });
  reference.push({ label: d.api.h1, href: localePath(locale, links.api.href) });
  for (const { category, members } of apiCategories()) {
    reference.push({
      label: apiCategoryCopy(locale, category.slug).name,
      href: localePath(locale, `/api/${category.slug}/`),
    });
    if (category.slug !== openCategory) continue;
    for (const m of members)
      reference.push({
        label: m.name,
        href: localePath(locale, `/api/${m.slug}/`),
        depth: 1,
        code: true,
      });
  }
  reference.push(page('internals'));
  if (path?.startsWith(links.internals.href))
    for (const s of sections) reference.push({ ...s, depth: 1 });
  reference.push(page('languageService'));
  return [
    {
      title: labels.getStarted,
      items: [page('motivation'), page('quickStart'), page('playground')],
    },
    { title: labels.language, items: languagePages },
    {
      title: labels.concepts,
      items: [
        page('concepts'),
        page('conceptsCpuGpu'),
        page('conceptsPipeline'),
        page('conceptsWebgpu'),
        page('conceptsWgsl'),
      ],
    },
    { title: labels.examples, items: [page('examples')] },
    { title: labels.reference, items: reference },
    { title: labels.project, items: [page('checks')] },
  ];
}
