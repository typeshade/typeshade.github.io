// One page per example, at /guide/examples/<id>/. Both corpora are on it: the `fn()` registry
// in examples/index.ts and the `"use typeshade"` files the `.shade.ts` registry lists. The
// gallery's tiles link here instead of to GitHub, so a reader who clicks an example sees it
// run on the site and keeps the file on GitHub as one link in the footer row.
//
// Everything a page shows is read at build time: the example's own source file, the emitted
// text the compiler baked into examples/__emit-goldens__/ at the pinned commit, and the group
// the pager walks. Nothing here is copy; the words around it are `examples.page` in every
// dictionary.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { examples } from '../../vendor/shader-dsl/examples/index.ts'
import { NO_STILL_REASONS, NO_STILL_REASON_KEYS, SHADE_STILL_EXAMPLES, STILL_EXAMPLES } from '../../scripts/artifacts.mjs'
import { facts } from './examples.ts'
import { playgroundExampleIds } from './playground-examples.ts'
import { SHADE_GROUPS, shadeExampleList } from './shade-examples.ts'

/** Which registry an example is written in. The two are shown apart everywhere else on the
 *  site, and the pager keeps them apart here too. */
export type Corpus = 'registry' | 'shade'

/** Why the page draws no picture for one example. The sentence each one gets is copy and
 *  lives in the dictionaries under `examples.page.noPicture`; the table behind it is
 *  NO_STILL_REASONS in scripts/artifacts.mjs. */
export type NoPictureReason = 'no-glsl' | 'control' | 'texture' | 'uniform' | 'vertex-buffer'

export const noPictureReasons = NO_STILL_REASON_KEYS as readonly NoPictureReason[]

/** The emitted text of one example, as the compiler baked it at the pinned commit. An
 *  example with no GLSL ES 3.00 form has the WGSL alone. */
export interface Emitted {
  readonly wgsl: string
  readonly glsl?: { readonly vertex: string; readonly fragment: string }
}

/** One example page. `title` is the registry's own English wording; a `.shade.ts` example's
 *  title and description are translated and read from the dictionary by the page. */
export interface ExamplePage {
  readonly id: string
  readonly corpus: Corpus
  /** The file in the compiler's examples directory, for the code frame and the GitHub link. */
  readonly file: string
  readonly title: string
  /** The group the pager walks: a registry category, or a `.shade.ts` group key. */
  readonly group: string
  /** The page draws the example live over its build-time still. */
  readonly drawn: boolean
  /** Why it does not, where it does not. */
  readonly reason?: NoPictureReason
  readonly source: string
  readonly emitted: Emitted
  readonly previous?: string
  readonly next?: string
  /** The Playground opens this file from `#example=<id>`. */
  readonly inPlayground: boolean
}

const examplesDir = path.resolve(process.cwd(), 'vendor/shader-dsl/examples')
const goldensDir = path.join(examplesDir, '__emit-goldens__')

// The compiler's own files cite its issue tracker as "<project> #1840". The site names no
// consumer of the library anywhere (scripts/check-seo.mjs enforces it, and src/lib/blurb.ts
// already drops the same citations from the registry's sentences), so the project's name
// comes off the number and the number stays. Nothing else about a file is rewritten.
const FORMER_HOST = /\bX-?GIS (#\d+)/g
const NAMES_FORMER_HOST = /x-?gis/i

/** One golden file, read from the pinned checkout. The compiler bakes these in its own emit
 *  suite (examples/emit-goldens.test.ts), so the text a page prints is what the compiler
 *  produced at that commit and costs the site nothing to show. A golden the build expects and
 *  does not find stops the build with the id that wanted it. */
function golden(id: string, name: string): string {
  const file = path.join(goldensDir, name)
  if (!existsSync(file)) {
    throw new Error(
      `[example-pages] '${id}' expects examples/__emit-goldens__/${name}, which the compiler pinned at ` +
        `${facts.pinnedCommit} does not have. Bake the goldens upstream, then move the pin`,
    )
  }
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trimEnd()
  // A page prints a golden as the compiler wrote it, so nothing is rewritten here; a bake
  // that started citing the former host would have to be fixed upstream.
  if (NAMES_FORMER_HOST.test(text)) throw new Error(`[example-pages] the golden examples/__emit-goldens__/${name} names the former host`)
  return text
}

/** The goldens of one example. The rule is the compiler's own: a WGSL file for every example,
 *  and both GLSL ES 3.00 stages for the ones the registry marks as having a GLSL form. */
function emittedFor(id: string, renderable: boolean): Emitted {
  const wgsl = golden(id, `${id}.wgsl`)
  if (!renderable) return { wgsl }
  return { wgsl, glsl: { vertex: golden(id, `${id}.vertex.glsl`), fragment: golden(id, `${id}.fragment.glsl`) } }
}

function sourceOf(file: string): string {
  const full = path.join(examplesDir, file)
  if (!existsSync(full)) throw new Error(`[example-pages] examples/${file} is not in the pinned checkout`)
  const text = readFileSync(full, 'utf8').replace(/\r\n/g, '\n').trimEnd().replace(FORMER_HOST, '$1')
  if (NAMES_FORMER_HOST.test(text)) throw new Error(`[example-pages] examples/${file} still names the former host after the citations came off`)
  return text
}

// The order the gallery already shows: the registry's three categories, then the `.shade.ts`
// groups. The pager walks one of these lists at a time, so previous and next stay inside the
// group a reader arrived from.
const REGISTRY_ORDER = ['cartographic', 'generic', 'compute'] as const

const drawn = new Set<string>([...STILL_EXAMPLES, ...SHADE_STILL_EXAMPLES])
const reasons = NO_STILL_REASONS as Record<string, NoPictureReason>
const inPlayground = new Set<string>(playgroundExampleIds)

/** The reason table against both registries, in both directions. An example that stops being
 *  drawable upstream needs a line here before it can reach a page as an empty frame, and a
 *  reason for an example that is drawn again is stale and says so. */
{
  const all = [...examples.map((e) => e.id), ...shadeExampleList.map((e) => e.id)]
  const missing = all.filter((id) => !drawn.has(id) && !reasons[id])
  const stale = Object.keys(reasons).filter((id) => !all.includes(id) || drawn.has(id))
  const unknown = Object.entries(reasons).filter(([, r]) => !noPictureReasons.includes(r)).map(([id]) => id)
  const parts = [
    missing.length > 0 ? `no reason for ${missing.join(', ')}` : '',
    stale.length > 0 ? `a reason for ${stale.join(', ')}, which the page draws or the registry has dropped` : '',
    unknown.length > 0 ? `an unknown reason on ${unknown.join(', ')}` : '',
  ].filter(Boolean)
  if (parts.length > 0) throw new Error(`[example-pages] NO_STILL_REASONS in scripts/artifacts.mjs is out of date (${parts.join('; ')})`)
}

function withPager(group: readonly ExamplePage[]): readonly ExamplePage[] {
  return group.map((page, i) => ({
    ...page,
    ...(i > 0 ? { previous: group[i - 1]!.id } : {}),
    ...(i < group.length - 1 ? { next: group[i + 1]!.id } : {}),
  }))
}

function build(): readonly ExamplePage[] {
  const registry = REGISTRY_ORDER.flatMap((category) =>
    withPager(
      examples
        .filter((e) => e.category === category)
        .map((e) => ({
          id: e.id,
          corpus: 'registry' as const,
          file: e.file,
          title: e.title,
          group: category,
          drawn: drawn.has(e.id),
          ...(reasons[e.id] ? { reason: reasons[e.id]! } : {}),
          source: sourceOf(e.file),
          emitted: emittedFor(e.id, e.renderable),
          inPlayground: inPlayground.has(e.id),
        })),
    ),
  )
  const byId = new Map(shadeExampleList.map((e) => [e.id, e]))
  const shade = SHADE_GROUPS.flatMap((g) =>
    withPager(
      g.ids.map((id) => {
        const e = byId.get(id)!
        return {
          id,
          corpus: 'shade' as const,
          file: e.file,
          title: e.title,
          group: g.key,
          drawn: drawn.has(id),
          ...(reasons[id] ? { reason: reasons[id]! } : {}),
          source: sourceOf(e.file),
          emitted: emittedFor(id, e.renderable),
          inPlayground: inPlayground.has(id),
        }
      }),
    ),
  )
  return [...registry, ...shade]
}

/** Every example page, in the order the gallery lists them. */
export const examplePages: readonly ExamplePage[] = build()

const pageById = new Map(examplePages.map((p) => [p.id, p]))

export function examplePage(id: string): ExamplePage {
  const page = pageById.get(id)
  if (!page) throw new Error(`[example-pages] no example '${id}' in either registry`)
  return page
}

/** The routes the two dynamic route files build, one per example in each language. */
export function examplePaths(): { params: { id: string } }[] {
  return examplePages.map((p) => ({ params: { id: p.id } }))
}

/** Where one example's file sits on GitHub, at the pinned commit. */
export function exampleSourceHref(file: string): string {
  return `${facts.mirrorUrl}/blob/${facts.pinnedCommit}/examples/${file}`
}

/** The route of one example's page, locale-neutral. */
export function examplePath(id: string): string {
  return `/guide/examples/${id}/`
}
