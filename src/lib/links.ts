// Every destination the site links to, in one place. Routes into the compiler are permalinks
// at the pinned commit, so a link never points at a file the site's numbers were not
// measured from. No consumer of the library is named or linked anywhere.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { apiCategories, apiSlugByName } from './api-nav.ts'
import { facts } from './examples.ts'
import { apiCategoryCopy, copyFor, localePath, type Locale } from '../i18n/index.ts'

export interface Destination {
  readonly label: string
  readonly href: string
}

const mirror = facts.mirrorUrl
const at = (file: string): string => `${mirror}/blob/${facts.pinnedCommit}/${file}`
// This site's own repository, for the "edit this page" link every documentation site carries.
const siteRepo = 'https://github.com/typeshade/typeshade.github.io'

export const links = {
  home: { label: 'TypeShade', href: '/' },
  motivation: { label: 'Why TypeShade', href: '/guide/introduction/' },
  quickStart: { label: 'Quick start', href: '/guide/quick-start/' },
  guide: { label: 'Authoring guide', href: '/guide/authoring/' },
  checks: { label: 'Verification', href: '/guide/checks/' },
  examples: { label: 'Examples', href: '/guide/examples/' },
  api: { label: 'API reference', href: '/api/' },
  guideSource: { label: 'AUTHORING.md', href: at('AUTHORING.md') },
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

/** The dictionary file's own text, read once per locale so an edit link can find a key's line. */
function i18nSource(locale: Locale): string {
  const cached = i18nSourceByLocale.get(locale)
  if (cached !== undefined) return cached
  const text = readFileSync(path.resolve(`src/i18n/${locale}.ts`), 'utf8')
  i18nSourceByLocale.set(locale, text)
  return text
}

/** The line a top-level dictionary key starts on, 1-based. Fails the build if the key moves
 *  out of the top level or a call site misspells it, so the link can never go stale. */
function dictionaryLine(locale: Locale, key: string): number {
  const lines = i18nSource(locale).split('\n')
  const at = lines.findIndex((l) => l.startsWith(`  ${key}: {`) || l.startsWith(`  ${key}: `))
  if (at < 0) throw new Error(`[links] '${key}' is not a top-level key of src/i18n/${locale}.ts`)
  return at + 1
}

/** The file a hand-written page is written in, on GitHub. The copy is the page. Passing the
 *  page's own top-level dictionary key points the link at that key's line in the file. */
export function editCopy(locale: Locale, key?: string): string {
  const at = key === undefined ? '' : `#L${dictionaryLine(locale, key)}`
  return `${siteRepo}/blob/main/src/i18n/${locale}.ts${at}`
}

/** The line a guide section starts on in the vendored AUTHORING.md, on GitHub. */
export function editGuide(sourceLine: number): string {
  return `${links.guideSource.href}#L${sourceLine}`
}

/** The header's three links in one locale. GitHub is an icon beside them. */
export function navLinks(locale: Locale): readonly Destination[] {
  const t = copyFor(locale).nav
  return [
    { label: t.guide, href: localePath(locale, links.motivation.href) },
    { label: t.api, href: localePath(locale, links.api.href) },
    { label: t.examples, href: localePath(locale, links.examples.href) },
  ]
}

/** The page one public export is documented on, for a link in the copy. A name the compiler
 *  no longer exports fails the build. */
export function apiPage(name: string): string {
  const slug = apiSlugByName().get(name)
  if (!slug) throw new Error(`[links] the copy links to '${name}', which the compiler does not export`)
  return `/api/${slug}/`
}

/** The five hand-written documentation pages, in the sidebar's order. The footer lists them
 *  beside the reference; the sidebar puts them in its first three groups. */
export function docsPages(locale: Locale): readonly Destination[] {
  const d = copyFor(locale).docs
  const page = (key: 'motivation' | 'quickStart' | 'guide' | 'checks' | 'examples') => localePath(locale, links[key].href)
  return [
    { label: d.why, href: page('motivation') },
    { label: d.quickStart, href: page('quickStart') },
    { label: d.authoringGuide, href: page('guide') },
    { label: d.checks, href: page('checks') },
    { label: d.examples, href: page('examples') },
  ]
}

/** A sidebar link. An item one level in (a member of the open category) has depth 1. */
export interface SidebarItem extends Destination {
  readonly depth?: number
}

export interface SidebarGroup {
  readonly title: string
  readonly items: readonly SidebarItem[]
}

/** The docs sidebar in one locale: four groups. The guide's sections follow its overview, in
 *  the file's order, so previous and next walk the whole guide. Reference opens with the
 *  reference's own index and lists the category index pages after it; on a page of one
 *  category, that category's members follow it one level in, so the sidebar never carries
 *  every export at once. */
export function sidebar(locale: Locale, sections: readonly Destination[] = [], openCategory?: string): readonly SidebarGroup[] {
  const d = copyFor(locale).docs
  const pages = docsPages(locale)
  // The reference's front door is in the list, so it is the page after the guide's last one
  // and it carries aria-current when a reader is on it.
  const reference: SidebarItem[] = [{ label: d.api.h1, href: localePath(locale, links.api.href) }]
  for (const { category, members } of apiCategories()) {
    reference.push({ label: apiCategoryCopy(locale, category.slug).name, href: localePath(locale, `/api/${category.slug}/`) })
    if (category.slug !== openCategory) continue
    for (const m of members) reference.push({ label: m.name, href: localePath(locale, `/api/${m.slug}/`), depth: 1 })
  }
  return [
    { title: d.introduction, items: pages.slice(0, 2) },
    { title: d.authoring, items: [pages[2]!, ...sections] },
    { title: d.project, items: pages.slice(3) },
    { title: d.api.reference, items: reference },
  ]
}
