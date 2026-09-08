// Every destination the site links to, in one place. Routes into the compiler are permalinks
// at the pinned commit, so a link never points at a file the site's numbers were not
// measured from. No consumer of the library is named or linked anywhere.
import { facts } from './examples.ts'

export interface Destination {
  readonly label: string
  readonly href: string
}

const mirror = facts.mirrorUrl
const at = (file: string): string => `${mirror}/blob/${facts.pinnedCommit}/${file}`

export const links = {
  home: { label: 'TypeShade', href: '/' },
  motivation: { label: 'Motivation', href: '/motivation' },
  checks: { label: 'Checks', href: '/checks' },
  examples: { label: 'Examples', href: '/examples' },
  guide: { label: 'Authoring guide', href: `${at('AUTHORING.md')}#1-the-authoring-surface` },
  mirror: { label: 'GitHub', href: mirror },
  docs: { label: 'README', href: at('README.md') },
  npm: { label: 'typeshade', href: 'https://www.npmjs.com/package/typeshade' },
  llms: { label: 'llms.txt', href: '/llms.txt' },
  commit: { label: facts.pinnedCommit, href: `${mirror}/tree/${facts.pinnedCommit}` },
  releases: { label: 'Watch releases', href: `${mirror}/releases` },

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

/** The header's links. The footer repeats them and adds llms.txt. */
export const navLinks = [links.motivation, links.checks, links.examples, links.guide, links.mirror] as const
