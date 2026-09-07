// /llms.txt — the agent-native summary, GENERATED from the same `facts` and CTA records the
// page renders from (IA §4.1, R-14; deck §8 is the copy of record for the summary paragraph).
//
// It is a route rather than a file in `public/` for one reason: a hand-maintained copy becomes
// the stalest text in the repository the first time a number moves. Here the summary's target
// name, layout standards, version, licence and package name are interpolated from `facts`, the
// link table is `links`, and the five claims are `railClaims` — the very records the rail
// renders. Nothing below is typed twice.
//
// R-14 is then enforced HERE, at build time, rather than hoped for: every numeral in the body
// must appear in `facts` with the same value, and a numeral that does not fails the build.
import type { APIRoute } from 'astro'
import { facts } from '../lib/examples.ts'
import { links } from '../lib/links.ts'
import { railClaims } from '../lib/rail.ts'

/** deck §8's summary paragraph, with every name and number it states read from `facts`. */
const summary = [
  `TypeShade is an engine-agnostic shader compiler for TypeScript.`,
  `You author a typed node graph in TypeScript; one intermediate representation emits WGSL for`,
  `WebGPU and ${facts.glslTarget} for WebGL2, plus a CPU f64 oracle that executes the same source`,
  `in double precision so the two outputs can be checked rather than assumed. A wrong field is a`,
  `TypeScript error at author time; reflect() recovers ${facts.layoutStandards.join(' and ')}`,
  `layouts so no byte offset is hand-derived; emulated fp64 keeps the same syntax as f32. It has`,
  `zero runtime dependencies, is ${facts.license} licensed, and runs in production inside the`,
  `X-GIS globe engine as ${facts.packageName}. Version ${facts.nextVersion} is not published yet`,
  `and the npm name typeshade is reserved, so start from the read-only mirror and the authoring`,
  `guide.`,
].join(' ')

/** The link table — the page's own destinations, each under the ONE wording it has on the page
 *  (R-15), so an agent and a reader are sent to the same place under the same name. `note` is
 *  the only prose here, and it exists where a label alone does not say what an agent is
 *  fetching (a mirror it should consume as a submodule, a tracker it should file against). */
const table = [
  { dest: links.guide, note: 'the authoring guide' },
  { dest: links.mirror, note: 'read-only mirror; consume as a git submodule, its root is the package' },
  { dest: links.xgisSource, note: 'source of truth — issues and pull requests go here' },
  { dest: links.docs, note: '' },
  { dest: links.npm, note: '' },
  { dest: links.commit, note: 'the commit every number below was measured at' },
] as const

const body = `# TypeShade

> ${summary}

## Links

${table.map((r) => `- ${r.dest.label}${r.note ? ` (${r.note})` : ''} — ${r.dest.href}`).join('\n')}

## Measured at build time from the mirror pinned at ${facts.pinnedCommit}

${railClaims.map((c) => `- ${c.value}${c.rest} Source: ${c.route.label} — ${c.route.href}`).join('\n')}
`

// ── R-14, asserted rather than assumed ──────────────────────────────────────
// Every numeral in the body must appear in `facts` with the same value. URLs are excluded and
// that exclusion is deliberate: an address is not a claim, and every address here is already
// derived from `facts.mirrorUrl` / `facts.pinnedCommit` by `links.ts`. What remains is exactly
// the prose, which is where a stale number would do its damage.
const NUMERAL = /\d+(?:\.\d+)*/g
const prose = body.replace(/https?:\/\/\S+/g, ' ')
const known = new Set(JSON.stringify(facts).match(NUMERAL) ?? [])
const strays = [...new Set(prose.match(NUMERAL) ?? [])].filter((n) => !known.has(n))
if (strays.length > 0) {
  throw new Error(
    `[llms.txt] R-14: ${strays.join(', ')} ${strays.length === 1 ? 'is a numeral' : 'are numerals'} ` +
      `no fact carries. Every number in /llms.txt must come from src/lib/examples.ts, or it is a ` +
      `hand-maintained claim that will go stale.`,
  )
}

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
