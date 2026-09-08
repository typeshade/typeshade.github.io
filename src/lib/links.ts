// Every destination the page links to, in one place. Mirror routes are permalinks at the
// pinned commit, so a link never points at a file the page's numbers were not measured from.
import { facts } from './examples.ts'

export interface Destination {
  readonly label: string
  readonly href: string
}

const mirror = facts.mirrorUrl
const at = (file: string): string => `${mirror}/blob/${facts.pinnedCommit}/${file}`

export const links = {
  guide: { label: 'Get started', href: `${mirror}/blob/main/AUTHORING.md#1-the-authoring-surface` },
  mirror: { label: 'GitHub', href: mirror },
  docs: { label: 'Docs', href: 'https://x-gis.github.io/X-GIS/shader-dsl/' },
  xgisSource: { label: 'X-GIS source', href: 'https://github.com/X-GIS/X-GIS/tree/main/shader-dsl' },
  npm: { label: `npm: typeshade (reserved for ${facts.nextVersion})`, href: 'https://www.npmjs.com/package/typeshade' },
  llms: { label: 'llms.txt', href: '/llms.txt' },
  home: { label: 'Back to the front page', href: '/' },
  commit: { label: facts.pinnedCommit, href: `${mirror}/tree/${facts.pinnedCommit}` },
  releases: { label: `Watch releases for ${facts.nextVersion}`, href: `${mirror}/releases` },

  examplesIndex: { label: 'examples/index.ts', href: at('examples/index.ts') },
  examplesDir: { label: 'all 36 examples', href: `${mirror}/tree/${facts.pinnedCommit}/examples` },
  goldens: { label: 'emit-goldens.test.ts', href: at('examples/emit-goldens.test.ts') },
  packageJson: { label: 'package.json', href: at('package.json') },
  oracle: { label: 'src/core/oracle.ts', href: at('src/core/oracle.ts') },
  reflectApi: { label: 'reflect()', href: at('src/core/reflect.ts') },
  deepZoom: { label: 'fp64-deep-zoom.ts', href: at('examples/fp64-deep-zoom.ts') },
  wgslGate: {
    label: '_wgsl-compile-gate.spec.ts',
    href: 'https://github.com/X-GIS/X-GIS/blob/main/playground/e2e/_wgsl-compile-gate.spec.ts',
  },
  glslGate: {
    label: '_glsl-compile-gate.spec.ts',
    href: 'https://github.com/X-GIS/X-GIS/blob/main/playground/e2e/_glsl-compile-gate.spec.ts',
  },
  ciGates: { label: 'the CI workflow', href: 'https://github.com/X-GIS/X-GIS/blob/main/.github/workflows/test.yml' },

  maplibreRoadmap: {
    label: 'MapLibre graphics modernization roadmap',
    href: 'https://maplibre.org/roadmap/maplibre-gl-js/graphics-modernization/',
  },
  deckglWebgpu: { label: 'deck.gl WebGPU guide', href: 'https://deck.gl/docs/developer-guide/webgpu' },
  pixijsMigration: { label: 'PixiJS v8 migration guide', href: 'https://pixijs.com/8.x/guides/migrations/v8' },
  survey: { label: facts.survey.title, href: facts.survey.url },
} as const satisfies Record<string, Destination>
