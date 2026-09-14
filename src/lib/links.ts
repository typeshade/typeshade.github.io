// Every destination the site links to, in one place. Routes into the compiler are permalinks
// at the pinned commit, so a link never points at a file the site's numbers were not
// measured from. No consumer of the library is named or linked anywhere.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { apiCategories, apiSlugByName } from './api-nav.ts'
import { facts } from './examples.ts'
import { translationDir } from './guide-translations.ts'
import { apiCategoryCopy, copyFor, localePath, type Locale } from '../i18n/index.ts'

export interface Destination {
  readonly label: string
  readonly href: string
}

const mirror = facts.mirrorUrl
const at = (file: string): string => `${mirror}/blob/${facts.pinnedCommit}/${file}`
const siteRepo = 'https://github.com/typeshade/typeshade.github.io'

export const links = {
  home: { label: 'TypeShade', href: '/' },
  motivation: { label: 'Introduction', href: '/guide/introduction/' },
  quickStart: { label: 'Use TypeShade', href: '/guide/quick-start/' },
  playground: { label: 'Playground', href: '/playground/' },
  concepts: { label: 'TypeScript and WebGPU concepts', href: '/guide/typescript-and-webgpu/' },
  guide: { label: 'Language guide', href: '/guide/language/' },
  languageTypes: { label: 'Types', href: '/guide/language/types/' },
  languageFunctions: { label: 'Functions', href: '/guide/language/functions/' },
  languageControlFlow: { label: 'Control flow', href: '/guide/language/control-flow/' },
  languageGpuTypes: { label: 'GPU types', href: '/guide/language/gpu-types/' },
  languageResources: { label: 'Resources', href: '/guide/language/resources/' },
  languageStages: { label: 'Shader stages', href: '/guide/language/stages/' },
  legacyAuthoring: { label: 'Compiler authoring guide', href: '/guide/authoring/' },
  internals: { label: 'Compiler internals', href: '/guide/internals/' },
  languageService: { label: 'Language service', href: '/guide/language-service/' },
  languageServiceDesign: { label: 'Language service design document', href: at('docs/language-service-api.md') },
  checks: { label: 'Verification', href: '/guide/checks/' },
  examples: { label: 'Examples', href: '/guide/examples/' },
  api: { label: 'API reference', href: '/api/' },
  guideSource: { label: 'Compiler guide source (AUTHORING.md)', href: at('AUTHORING.md') },
  surfaceSource: { label: 'TypeShade surface specification', href: at('docs/use-typeshade-surface.md') },
  mirror: { label: 'GitHub', href: mirror },
  docs: { label: 'README', href: at('README.md') },
  npm: { label: 'typeshade', href: 'https://www.npmjs.com/package/typeshade' },
  llms: { label: 'llms.txt', href: '/llms.txt' },
  commit: { label: facts.pinnedCommit, href: `${mirror}/tree/${facts.pinnedCommit}` },
  releases: { label: 'Watch releases', href: `${mirror}/releases` },
  license: { label: 'MIT License', href: at('LICENSE') },
  changelog: { label: 'Changelog', href: at('CHANGELOG.md') },
  examplesIndex: { label: 'examples/index.ts', href: at('examples/index.ts') },
  examplesDir: { label: 'the examples directory', href: `${mirror}/tree/${facts.pinnedCommit}/examples` },
  goldens: { label: 'emit-goldens.test.ts', href: at('examples/emit-goldens.test.ts') },
  packageJson: { label: 'package.json', href: at('package.json') },
  oracle: { label: 'src/core/oracle.ts', href: at('src/core/oracle.ts') },
  deepZoom: { label: 'fp64-deep-zoom.ts', href: at('examples/fp64-deep-zoom.ts') },
  compileGate: { label: 'scripts/compile-gate.ts', href: at('scripts/compile-gate.ts') },
  ciGates: { label: 'the CI workflow', href: `${siteRepo}/blob/main/.github/workflows/deploy.yml` },
  maplibreRoadmap: { label: 'MapLibre graphics modernization roadmap', href: 'https://maplibre.org/roadmap/maplibre-gl-js/graphics-modernization/' },
  deckglWebgpu: { label: 'deck.gl WebGPU guide', href: 'https://deck.gl/docs/developer-guide/webgpu' },
  pixijsMigration: { label: 'PixiJS v8 migration guide', href: 'https://pixijs.com/8.x/guides/migrations/v8' },
  survey: { label: facts.survey.title, href: facts.survey.url },
} as const satisfies Record<string, Destination>

/** The name of a destination above. Copy that carries a link as a key (src/i18n/en.ts) is
 *  typed with this, so a key no record has is a type error and not a crash at build time. */
export type LinkKey = keyof typeof links

const i18nSourceByLocale = new Map<Locale, string>()
function i18nSource(locale: Locale): string {
  const cached = i18nSourceByLocale.get(locale)
  if (cached !== undefined) return cached
  const text = readFileSync(path.resolve(`src/i18n/${locale}.ts`), 'utf8')
  i18nSourceByLocale.set(locale, text)
  return text
}
function dictionaryLine(locale: Locale, key: string): number {
  const lines = i18nSource(locale).split('\n')
  const at = lines.findIndex((l) => l.startsWith(`  ${key}: {`) || l.startsWith(`  ${key}: `))
  if (at < 0) throw new Error(`[links] '${key}' is not a top-level key of src/i18n/${locale}.ts`)
  return at + 1
}
export function editCopy(locale: Locale, key?: string): string {
  const at = key === undefined ? '' : `#L${dictionaryLine(locale, key)}`
  return `${siteRepo}/blob/main/src/i18n/${locale}.ts${at}`
}
export function editGuide(sourceLine: number): string { return `${links.guideSource.href}#L${sourceLine}` }
export function editGuideTranslation(locale: Locale, id: string): string { return `${siteRepo}/blob/main/${translationDir(locale)}/${id}.md` }

export function navLinks(locale: Locale): readonly Destination[] {
  const labels = copyFor(locale).docs.labels.nav
  return [
    { label: labels.use, href: localePath(locale, links.quickStart.href) },
    { label: labels.playground, href: localePath(locale, links.playground.href) },
    { label: labels.language, href: localePath(locale, links.guide.href) },
    { label: labels.api, href: localePath(locale, links.api.href) },
    { label: labels.examples, href: localePath(locale, links.examples.href) },
  ]
}

export function apiPage(name: string): string {
  const slug = apiSlugByName().get(name)
  if (!slug) throw new Error(`[links] the copy links to '${name}', which the compiler does not export`)
  return `/api/${slug}/`
}

/** The guide's own pages in the order the sidebar groups them, for the footer's site map. */
export function docsPages(locale: Locale): readonly Destination[] {
  return [
    docsPage(locale, 'motivation'),
    docsPage(locale, 'quickStart'),
    docsPage(locale, 'guide'),
    docsPage(locale, 'concepts'),
    docsPage(locale, 'examples'),
    docsPage(locale, 'internals'),
    docsPage(locale, 'languageService'),
    docsPage(locale, 'checks'),
  ]
}

type DocsPageKey = 'motivation' | 'quickStart' | 'playground' | 'guide' | 'concepts' | 'examples' | 'internals' | 'languageService' | 'checks'
/** One page of the guide as the sidebar and the footer name it, in one language. */
function docsPage(locale: Locale, key: DocsPageKey): Destination {
  const d = copyFor(locale).docs
  const labels: Record<DocsPageKey, string> = {
    motivation: d.introduction,
    quickStart: d.labels.nav.use,
    playground: d.labels.playground,
    guide: d.labels.languageGuide,
    concepts: d.labels.concepts,
    examples: d.examples,
    internals: d.labels.internals,
    languageService: d.labels.languageService,
    checks: d.checks,
  }
  return { label: labels[key], href: localePath(locale, links[key].href) }
}

export interface SidebarItem extends Destination {
  readonly depth?: number
  /** The label is an export's name, set in the code font. */
  readonly code?: boolean
}
export interface SidebarGroup { readonly title: string; readonly items: readonly SidebarItem[] }

/** The sidebar's groups. The reference lists its categories and opens the members of the one
 *  the reader is in; the compiler internals list their sections the same way, only while the
 *  reader is on one of them, so the sidebar never carries every page of the reference at once.
 *  `path` is the page's locale-neutral route. */
export function sidebar(locale: Locale, sections: readonly Destination[] = [], openCategory?: string, path?: string): readonly SidebarGroup[] {
  const d = copyFor(locale).docs
  const labels = d.labels.sidebarGroups
  const topicLabels = d.labels.topics
  const page = (key: DocsPageKey): SidebarItem => docsPage(locale, key)
  const languagePages: SidebarItem[] = [
    page('guide'),
    { label: topicLabels.types, href: localePath(locale, links.languageTypes.href), depth: 1 },
    { label: topicLabels.functions, href: localePath(locale, links.languageFunctions.href), depth: 1 },
    { label: topicLabels.controlFlow, href: localePath(locale, links.languageControlFlow.href), depth: 1 },
    { label: topicLabels.gpuTypes, href: localePath(locale, links.languageGpuTypes.href), depth: 1 },
    { label: topicLabels.resources, href: localePath(locale, links.languageResources.href), depth: 1 },
    { label: topicLabels.stages, href: localePath(locale, links.languageStages.href), depth: 1 },
  ]
  const reference: SidebarItem[] = [{ label: d.api.h1, href: localePath(locale, links.api.href) }]
  for (const { category, members } of apiCategories()) {
    reference.push({ label: apiCategoryCopy(locale, category.slug).name, href: localePath(locale, `/api/${category.slug}/`) })
    if (category.slug !== openCategory) continue
    for (const m of members) reference.push({ label: m.name, href: localePath(locale, `/api/${m.slug}/`), depth: 1, code: true })
  }
  reference.push(page('internals'))
  if (path?.startsWith(links.internals.href)) for (const s of sections) reference.push({ ...s, depth: 1 })
  reference.push(page('languageService'))
  return [
    { title: labels.getStarted, items: [page('motivation'), page('quickStart'), page('playground')] },
    { title: labels.language, items: languagePages },
    { title: labels.concepts, items: [page('concepts')] },
    { title: labels.examples, items: [page('examples')] },
    { title: labels.reference, items: reference },
    { title: labels.project, items: [page('checks')] },
  ]
}
