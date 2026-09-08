// /llms.txt, generated from the same records the page renders from. Every numeral in it must
// exist in `facts` with the same value, or the build fails.
import type { APIRoute } from 'astro'
import { claims } from '../lib/claims.ts'
import { facts } from '../lib/examples.ts'
import { links } from '../lib/links.ts'

const summary = [
  `TypeShade is a TypeScript library for writing shaders.`,
  `You author one typed module, and one intermediate representation emits WGSL for WebGPU and`,
  `${facts.glslTarget} for WebGL2. The same module also compiles to a CPU function that runs in double`,
  `precision, and the test suite checks the compiler's algebra against it. A misspelt uniform field is`,
  `a TypeScript error at author time; reflect() recovers`,
  `${facts.layoutStandards.join(' and ')} layouts, so a host packs its uniform buffer from the compiler's`,
  `own layout; emulated double precision is authored with the same syntax as f32. It has`,
  `${facts.runtimeDeps} runtime dependencies and is ${facts.license} licensed. Its own CI compiles every`,
  `WGSL emit on Tint and links every renderable example on WebGL2, on every push. Version`,
  `${facts.nextVersion} is not published yet and the npm name typeshade is reserved, so start from the`,
  `mirror and the authoring guide.`,
].join(' ')

const table = [
  { dest: links.guide, note: 'the authoring guide' },
  {
    dest: links.mirror,
    note: 'mirror; pull requests cannot be merged there yet; consume as a git submodule, its root is the package',
  },
  { dest: links.docs, note: "the repository's README" },
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
