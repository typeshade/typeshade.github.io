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
  quickStart: { label: 'Quick start', href: '/guide/quick-start/' },
  guide: { label: 'Language guide', href: '/guide/language/' },
  languageTypes: { label: 'Types', href: '/guide/language/types/' },
  languageFunctions: { label: 'Functions', href: '/guide/language/functions/' },
  languageControlFlow: { label: 'Control flow', href: '/guide/language/control-flow/' },
  languageGpuTypes: { label: 'GPU types', href: '/guide/language/gpu-types/' },
  languageResources: { label: 'Resources', href: '/guide/language/resources/' },
  languageStages: { label: 'Shader stages', href: '/guide/language/stages/' },
  legacyAuthoring: { label: 'Compiler authoring guide', href: '/guide/authoring/' },
  checks: { label: 'Verification', href: '/guide/checks/' },
  examples: { label: 'Examples', href: '/guide/examples/' },
  api: { label: 'API reference', href: '/api/' },
  guideSource: { label: 'AUTHORING.md', href: at('AUTHORING.md') },
  surfaceSource: { label: 'use-typeshade-surface.md', href: at('docs/use-typeshade-surface.md') },
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
  ciGates: { label: 'the CI workflow', href: at('.github/workflows/ci.yml') },

  maplibreRoadmap: {
    label: 'MapLibre graphics modernization roadmap',
    href: 'https://maplibre.org/roadmap/maplibre-gl-js/graphics-modernization/',
  },
  deckglWebgpu: { label: 'deck.gl WebGPU guide', href: 'https://deck.gl/docs/developer-guide/webgpu' },
  pixijsMigration: { label: 'PixiJS v8 migration guide', href: 'https://pixijs.com/8.x/guides/migrations/v8' },
  survey: { label: facts.survey.title, href: facts.survey.url },
} as const satisfies Record<string, Destination>

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

export function editGuide(sourceLine: number): string {
  return `${links.guideSource.href}#L${sourceLine}`
}

export function editGuideTranslation(locale: Locale, id: string): string {
  return `${siteRepo}/blob/main/${translationDir(locale)}/${id}.md`
}

export function navLinks(locale: Locale): readonly Destination[] {
  const labels = locale === 'ko'
    ? { learn: '학습', language: '언어', api: 'API', examples: '예제' }
    : { learn: 'Learn', language: 'Language', api: 'API', examples: 'Examples' }
  return [
    { label: labels.learn, href: localePath(locale, links.motivation.href) },
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

export function docsPages(locale: Locale): readonly Destination[] {
  const d = copyFor(locale).docs
  const page = (key: 'motivation' | 'quickStart' | 'guide' | 'checks' | 'examples') => localePath(locale, links[key].href)
  return [
    { label: d.why, href: page('motivation') },
    { label: d.quickStart, href: page('quickStart') },
    { label: d.languageGuide ?? (locale === 'ko' ? '언어 가이드' : 'Language guide'), href: page('guide') },
    { label: d.checks, href: page('checks') },
    { label: d.examples, href: page('examples') },
  ]
}

export interface SidebarItem extends Destination { readonly depth?: number }
export interface SidebarGroup { readonly title: string; readonly items: readonly SidebarItem[] }

export function sidebar(locale: Locale, sections: readonly Destination[] = [], openCategory?: string): readonly SidebarGroup[] {
  const d = copyFor(locale).docs
  const pages = docsPages(locale)
  const labels = locale === 'ko'
    ? { learn: '학습', language: '언어', project: '프로젝트' }
    : { learn: 'Learn', language: 'Language', project: 'Project' }
  const languagePages: SidebarItem[] = [
    pages[2]!,
    { label: locale === 'ko' ? '타입' : 'Types', href: localePath(locale, links.languageTypes.href), depth: 1 },
    { label: locale === 'ko' ? '함수' : 'Functions', href: localePath(locale, links.languageFunctions.href), depth: 1 },
    { label: locale === 'ko' ? '제어 흐름' : 'Control flow', href: localePath(locale, links.languageControlFlow.href), depth: 1 },
    { label: locale === 'ko' ? 'GPU 타입' : 'GPU types', href: localePath(locale, links.languageGpuTypes.href), depth: 1 },
    { label: locale === 'ko' ? '리소스' : 'Resources', href: localePath(locale, links.languageResources.href), depth: 1 },
    { label: locale === 'ko' ? '셰이더 스테이지' : 'Shader stages', href: localePath(locale, links.languageStages.href), depth: 1 },
    ...sections,
  ]
  const reference: SidebarItem[] = [{ label: d.api.h1, href: localePath(locale, links.api.href) }]
  for (const { category, members } of apiCategories()) {
    reference.push({ label: apiCategoryCopy(locale, category.slug).name, href: localePath(locale, `/api/${category.slug}/`) })
    if (category.slug !== openCategory) continue
    for (const m of members) reference.push({ label: m.name, href: localePath(locale, `/api/${m.slug}/`), depth: 1 })
  }
  return [
    { title: labels.learn, items: pages.slice(0, 2) },
    { title: labels.language, items: languagePages },
    { title: labels.project, items: pages.slice(3) },
    { title: d.api.reference, items: reference },
  ]
}
