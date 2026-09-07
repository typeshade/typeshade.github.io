// The rail's five claims — copy 07-copy-deck.md §4, IA R-4's shape (a value or a name, its
// condition, and the route that proves it).
//
// It lives here rather than inside `Rail.astro` because `/llms.txt` publishes the same five
// claims with the same routes (R-14, deck §8: "its section list and link table generate from
// the same facts / CTA records the page renders from"). One record, two renderings — so an
// agent reading the text file and a visitor reading the page cannot be told different numbers.
//
// Every value is a build-time measurement from the pinned mirror: `35 of 36` is a loop over
// the registry running both emitters, `146` a walk of the package root, `0` the ABSENCE of all
// three dependency fields. None of the three is typed here.
import { facts } from './examples.ts'
import { links, type Destination } from './links.ts'

export interface RailClaim {
  /** Line 1 — the value or the name, set in accent mono where it is a numeral. */
  readonly value: string
  /** The rest of the sentence, including its leading space. */
  readonly rest: string
  /** The route that proves it. */
  readonly route: Destination
}

export const railClaims: readonly RailClaim[] = [
  {
    value: `${facts.bothTargets} of ${facts.examples}`,
    rest: ` examples emit WGSL and ${facts.glslTarget} from one source.`,
    route: links.examplesIndex,
  },
  {
    value: `${facts.testFiles}`,
    rest: ' test files in the pinned mirror.',
    route: links.goldens,
  },
  {
    value: `${facts.runtimeDeps}`,
    rest: " runtime dependencies — no dependencies field in the mirror's package.json.",
    route: links.packageJson,
  },
  {
    value: 'WGSL → Tint',
    rest: ' — every shader variant X-GIS emits, in CI.',
    route: links.wgslGate,
  },
  {
    value: `${facts.glslTarget} → WebGL2`,
    rest: ' — every shader variant X-GIS emits, in CI.',
    route: links.glslGate,
  },
]
