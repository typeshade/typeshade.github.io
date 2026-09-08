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
  { text: `${facts.testFiles} test files.`, source: links.goldens },
  { text: `${facts.runtimeDeps} runtime dependencies.`, source: links.packageJson },
  {
    text: `On every push, Tint compiles every WGSL emit and a real WebGL2 context links every renderable example's ${facts.glslTarget}.`,
    source: links.compileGate,
  },
  { text: 'A CPU oracle executes the same source in double precision.', source: links.oracle },
]
