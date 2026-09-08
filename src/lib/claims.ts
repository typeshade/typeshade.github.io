// The measured claims the front page and /llms.txt both state, each with the file that
// backs it.
import { facts } from './examples.ts'
import { links, type Destination } from './links.ts'

export interface Claim {
  readonly text: string
  readonly source: Destination
}

export const claims: readonly Claim[] = [
  {
    text: `${facts.bothTargets} of the ${facts.examples} examples emit WGSL and ${facts.glslTarget} from one source.`,
    source: links.examplesIndex,
  },
  { text: `${facts.testFiles} test files in the pinned compiler.`, source: links.goldens },
  { text: `${facts.runtimeDeps} runtime dependencies.`, source: links.packageJson },
  { text: 'Every shader variant X-GIS ships is compiled by Tint in CI.', source: links.wgslGate },
  { text: `Every ${facts.glslTarget} variant X-GIS ships is compiled on a real WebGL2 context in CI.`, source: links.glslGate },
]
