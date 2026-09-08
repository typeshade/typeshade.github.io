// /llms.txt, generated from the same records the page renders from. Every numeral in it must
// exist in `facts` with the same value, or the build fails.
import type { APIRoute } from 'astro'
import { claims } from '../lib/claims.ts'
import { facts } from '../lib/examples.ts'
import { links } from '../lib/links.ts'

const summary = [
  `TypeShade is a TypeScript library for writing shaders.`,
  `You write a typed shader once and one intermediate representation emits WGSL for WebGPU and`,
  `${facts.glslTarget} for WebGL2. A CPU f64 oracle executes the same source in double precision so the`,
  `two outputs can be checked. A wrong field is a TypeScript error at author time; reflect() recovers`,
  `${facts.layoutStandards.join(' and ')} layouts so no byte offset is hand-derived; emulated fp64 uses the`,
  `same syntax as f32. It has ${facts.runtimeDeps} runtime dependencies, is ${facts.license} licensed, and runs in`,
  `production inside the X-GIS globe engine as ${facts.packageName}. Version ${facts.nextVersion} is not`,
  `published yet and the npm name typeshade is reserved, so start from the read-only mirror and the`,
  `authoring guide.`,
].join(' ')

const table = [
  { dest: links.guide, note: 'the authoring guide' },
  { dest: links.mirror, note: 'read-only mirror; consume as a git submodule, its root is the package' },
  { dest: links.xgisSource, note: 'source of truth; issues and pull requests go here' },
  { dest: links.docs, note: '' },
  { dest: links.npm, note: '' },
  { dest: links.commit, note: 'the commit every number below was measured at' },
] as const

const body = `# TypeShade

> ${summary}

## Links

${table.map((r) => `- ${r.dest.label}${r.note ? ` (${r.note})` : ''}: ${r.dest.href}`).join('\n')}

## Measured at build time from the compiler pinned at ${facts.pinnedCommit}

${claims.map((c) => `- ${c.text} Source: ${c.source.label}, ${c.source.href}`).join('\n')}
`

const NUMERAL = /\d+(?:\.\d+)*/g
const prose = body.replace(/https?:\/\/\S+/g, ' ')
const known = new Set(JSON.stringify(facts).match(NUMERAL) ?? [])
const strays = [...new Set(prose.match(NUMERAL) ?? [])].filter((n) => !known.has(n))
if (strays.length > 0) {
  throw new Error(`[llms.txt] numerals with no fact behind them: ${strays.join(', ')}`)
}

export const GET: APIRoute = () => new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
