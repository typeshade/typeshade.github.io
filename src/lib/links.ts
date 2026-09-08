// Every destination the site links to, in one place. Routes into the compiler are permalinks
// at the pinned commit, so a link never points at a file the site's numbers were not
// measured from. No consumer of the library is named or linked anywhere.
import { facts } from './examples.ts'
import { copyFor, localePath, type Locale } from '../i18n/index.ts'

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
  reflectApi: { label: 'reflect()', href: at('src/core/reflect.ts') },
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

/** The file a hand-written page is written in, on GitHub. The copy is the page. */
export function editCopy(locale: Locale): string {
  return `${siteRepo}/blob/main/src/i18n/${locale}.ts`
}

/** The line a guide section starts on in the vendored AUTHORING.md, on GitHub. */
export function editGuide(sourceLine: number): string {
  return `${links.guideSource.href}#L${sourceLine}`
}

/** The header's two links in one locale. GitHub is an icon beside them. */
export function navLinks(locale: Locale): readonly Destination[] {
  const t = copyFor(locale).nav
  return [
    { label: t.guide, href: localePath(locale, links.motivation.href) },
    { label: t.examples, href: localePath(locale, links.examples.href) },
  ]
}

export interface SidebarGroup {
  readonly title: string
  readonly items: readonly Destination[]
}

/** The docs sidebar in one locale: three groups. The guide's sections follow its overview,
 *  in the file's order, so previous and next walk the whole guide. The footer's site map
 *  passes none of them and lists the five pages. */
export function sidebar(locale: Locale, sections: readonly Destination[] = []): readonly SidebarGroup[] {
  const d = copyFor(locale).docs
  const page = (key: 'motivation' | 'quickStart' | 'guide' | 'checks' | 'examples') => localePath(locale, links[key].href)
  return [
    { title: d.introduction, items: [{ label: d.why, href: page('motivation') }, { label: d.quickStart, href: page('quickStart') }] },
    { title: d.authoring, items: [{ label: d.authoringGuide, href: page('guide') }, ...sections] },
    { title: d.project, items: [{ label: d.checks, href: page('checks') }, { label: d.examples, href: page('examples') }] },
  ]
}
