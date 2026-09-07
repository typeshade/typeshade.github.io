// Every destination on the page, once. Nav, hero, footer, /404 and /llms.txt all render from
// THIS record, which is what makes three requirements checkable rather than hopeful:
//
//   R-12  /404.html's CTA is the hero's CTA — the same object, so equality is asserted, not
//         a string comparison between two places that were typed twice.
//   R-15  one destination, one wording (3.2.4). A second wording cannot be introduced without
//         adding a second entry here, in the open.
//   R-14  the built llms.txt generates from the same records the page renders from.
//
// The labels are 07-copy-deck.md §3 and §7 verbatim. Every URL that names the mirror is
// derived from `facts.mirrorUrl` (read from .gitmodules at build time), and every version and
// hash inside a label comes from `facts` — nothing here restates a number.
import { facts } from './examples.ts'

export interface Destination {
  /** The copy of record. Also the accessible name, so the `→` a button adds is aria-hidden. */
  readonly label: string
  readonly href: string
}

const mirror = facts.mirrorUrl

export const links = {
  /** The primary CTA, anchored past AUTHORING.md's 32-line preamble. Hero, §adopt, footer, 404. */
  guide: {
    label: 'Get started',
    href: `${mirror}/blob/main/AUTHORING.md#1-the-authoring-surface`,
  },
  /** Nav, hero secondary, §adopt, footer. */
  mirror: { label: 'GitHub', href: mirror },
  docs: { label: 'Docs', href: 'https://x-gis.github.io/X-GIS/shader-dsl/' },
  xgisSource: {
    label: 'X-GIS source',
    href: 'https://github.com/X-GIS/X-GIS/tree/main/shader-dsl',
  },
  /** The link text carries the package's actual state — deck §7, MSG §8. */
  npm: {
    label: `npm typeshade — reserved for ${facts.nextVersion}`,
    href: 'https://www.npmjs.com/package/typeshade',
  },
  llms: { label: 'llms.txt', href: '/llms.txt' },
  home: { label: 'TypeShade home', href: '/' },
  /** The pinned commit: the hash IS the link text (deck §4, §7). */
  commit: { label: facts.pinnedCommit, href: `${mirror}/tree/${facts.pinnedCommit}` },

  // ── Routes. A rail chip's route link, and every later slot that points at the same file,
  // render from ONE of these records — which is how R-15 stays checkable across sections
  // that are built in different steps. Mirror routes are permalinks at the pinned commit,
  // so a route can never resolve to a file the page's numbers were not measured from.
  // IA §4.2: where a rail chip and a later CTA point into the same area they carry DIFFERENT
  // URLs (chip → the gate spec; §agree's CTA → the `playground/e2e` directory).
  /** `RAIL.CHIP` 1 — the registry the example counts were measured over. */
  examplesIndex: {
    label: 'examples/index.ts',
    href: `${mirror}/blob/${facts.pinnedCommit}/examples/index.ts`,
  },
  /** `RAIL.CHIP` 2, and later `B1.EMIT`'s fourth row and `B2.COUNT` — one wording, three
   *  slots, because the byte-stability claim is delegated to this one suite. */
  goldens: {
    label: 'goldens diff byte for byte',
    href: `${mirror}/blob/${facts.pinnedCommit}/examples/emit-goldens.test.ts`,
  },
  /** `RAIL.CHIP` 3 — the absent `dependencies` field is the claim, so the file is the proof. */
  packageJson: {
    label: 'package.json',
    href: `${mirror}/blob/${facts.pinnedCommit}/package.json`,
  },
  /** `RAIL.CHIP` 4 and later `B2.LADDER` ② — X-GIS's CI, not the mirror's: the mirror's root
   *  holds no workflow file (IA X4), which is why the compile claims name X-GIS. */
  wgslGate: {
    label: '_wgsl-compile-gate.spec.ts',
    href: 'https://github.com/X-GIS/X-GIS/blob/main/playground/e2e/_wgsl-compile-gate.spec.ts',
  },
  /** `RAIL.CHIP` 5 and later `B2.LADDER` ③. */
  glslGate: {
    label: '_glsl-compile-gate.spec.ts',
    href: 'https://github.com/X-GIS/X-GIS/blob/main/playground/e2e/_glsl-compile-gate.spec.ts',
  },

  // ── Step 5's destinations. Each is a route a block's own proof rests on, and each carries
  // the ONE wording that destination has anywhere on the page (R-15).
  /** `B2.LADDER` ① — the oracle that executes the authored source on a CPU in f64. */
  oracle: {
    label: 'src/core/oracle.ts',
    href: `${mirror}/blob/${facts.pinnedCommit}/src/core/oracle.ts`,
  },
  /** §write's CTA. The examples DIRECTORY at the pinned commit — a different destination from
   *  `examplesIndex` (the registry file), so the two wordings stay injective. */
  examplesDir: {
    label: 'See the examples',
    href: `${mirror}/tree/${facts.pinnedCommit}/examples`,
  },
  /** §agree's CTA — the ONE file that wires BOTH compile gates into CI. The `playground/e2e`
   *  directory is forbidden as a destination (454 entries, deck §5). */
  ciGates: {
    label: 'Read the CI gates',
    href: 'https://github.com/X-GIS/X-GIS/blob/main/.github/workflows/test.yml',
  },
  /** §types has NO CTA button (design §0, X7): `reflect()` in its body is an inline link, and
   *  this record is that link. The link text is the function call itself. */
  reflectApi: {
    label: 'reflect()',
    href: `${mirror}/blob/${facts.pinnedCommit}/src/core/reflect.ts`,
  },
  /** §precision's CTA. */
  deepZoom: {
    label: 'Open the deep-zoom example',
    href: `${mirror}/blob/${facts.pinnedCommit}/examples/fp64-deep-zoom.ts`,
  },
  /** `B5.WATCH` — the page's only retention instrument: no account, no list, no visitor data. */
  releases: {
    label: `Watch releases for ${facts.nextVersion}`,
    href: `${mirror}/releases`,
  },

  // `BR.SOURCE` — the ONLY place a host name may appear, in visible text and in the href
  // alike (deck §5's host-name exemption). A citation under a claim is attribution, not an
  // integration claim; G11 counts three host names against four source links.
  maplibreRoadmap: {
    label: 'MapLibre graphics-modernization roadmap',
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
  /** The dated record beside §recognise's two figures — the page's own rule 6 gets no
   *  carve-out for one block, so the citation carries n and the field window. */
  survey: {
    label: `${facts.survey.title}, >${facts.survey.n} respondents, fielded ${facts.survey.fieldStart} → ${facts.survey.fieldEnd.slice(5)}`,
    href: facts.survey.url,
  },
} as const satisfies Record<string, Destination>
