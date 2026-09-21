// The `.shade.ts` corpus, as the site reads it. These are the compiler's `"use typeshade"`
// examples: one TypeScript file each, compiled by `compile()` instead of built with `fn()`.
// They are registered in `examples/_shade.ts` and not in `examples/index.ts`, because that
// barrel feeds src/lib/examples.ts, whose counts and its one WGSL-only row are written
// against the `fn()` corpus alone. So the two are read side by side and shown apart: the
// gallery groups these by the language feature each file is there to demonstrate, and the
// Playground opens any of them in the editor.
//
// Why the registry is parsed and not imported. `examples/_shade.ts` finds its own directory
// through `import.meta.url` and reads the files from there. Vite bundles a module the site
// imports into a chunk under dist/, where that URL is the chunk's, so the read misses. Every
// other build-time read here resolves from the site root instead (src/lib/api.ts,
// src/lib/guide.ts, src/lib/playground-examples.ts all say so), and this one does the same:
// the registration list is read out of the registry's own source with the TypeScript parser
// the reference already uses, and each file is compiled from its bytes.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { compile } from '../../vendor/shader-dsl/src/index.ts'
import type { ModuleDecl } from '../../vendor/shader-dsl/src/core/ir/nodes.ts'
import { shortBlurb } from './blurb.ts'

const EXT = '.shade.ts'
const examplesDir = path.resolve(process.cwd(), 'vendor/shader-dsl/examples')
const REGISTRY = 'vendor/shader-dsl/examples/_shade.ts'
const ORDER_NAME = 'SHADE_ORDER'

/** One `.shade.ts` example as a page shows it. */
export interface ShadeExample {
  readonly id: string
  /** The registry's own title, in English. Every other language writes its own. */
  readonly title: string
  /** The registry's own sentence about it, in English. */
  readonly blurb: string
  readonly file: string
  /** Has a GLSL ES 3.00 form, so a browser with no WebGPU can still draw it. */
  readonly renderable: boolean
  /** The `fn()` example this file is the source-language twin of, where it has one. */
  readonly twinOf?: string
}

/** The text of a string property, whether it is written as one literal, as a template with
 *  nothing in it, or as literals joined with `+` across several lines. */
function stringOf(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = stringOf(node.left)
    const right = stringOf(node.right)
    return left === undefined || right === undefined ? undefined : left + right
  }
  return undefined
}

function readRegistry(): readonly ShadeExample[] {
  const file = path.resolve(process.cwd(), REGISTRY)
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true)
  let array: ts.ArrayLiteralExpression | undefined
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== ORDER_NAME || !decl.initializer) continue
      const init = ts.isAsExpression(decl.initializer) ? decl.initializer.expression : decl.initializer
      if (ts.isArrayLiteralExpression(init)) array = init
    }
  }
  if (!array) throw new Error(`[shade] ${REGISTRY} declares no ${ORDER_NAME} array`)

  return array.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) throw new Error(`[shade] ${ORDER_NAME} holds something other than an object literal`)
    const fields = new Map<string, ts.Expression>()
    for (const property of element.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue
      fields.set(property.name.text, property.initializer)
    }
    const text = (key: string): string => {
      const node = fields.get(key)
      const value = node ? stringOf(node) : undefined
      if (value === undefined) throw new Error(`[shade] an entry of ${ORDER_NAME} has no string '${key}'`)
      return value
    }
    const renderable = fields.get('renderable')
    if (!renderable || (renderable.kind !== ts.SyntaxKind.TrueKeyword && renderable.kind !== ts.SyntaxKind.FalseKeyword)) {
      throw new Error(`[shade] '${text('id')}' has no boolean 'renderable'`)
    }
    const twin = fields.get('twinOf')
    const id = text('id')
    return {
      id,
      title: text('title'),
      blurb: text('blurb'),
      file: `${id}${EXT}`,
      renderable: renderable.kind === ts.SyntaxKind.TrueKeyword,
      ...(twin ? { twinOf: stringOf(twin) } : {}),
    }
  })
}

export const shadeExampleList: readonly ShadeExample[] = readRegistry()

/** Every id, in the registry's own order. */
export const shadeExampleIds: readonly string[] = shadeExampleList.map((e) => e.id)

// The registry against the directory, in both directions, the way the compiler's own drift
// test does it: a file nobody registered, or a registration with no file, stops the build.
{
  const onDisk = readdirSync(examplesDir).filter((n) => n.endsWith(EXT)).map((n) => n.slice(0, -EXT.length))
  const missing = shadeExampleIds.filter((id) => !onDisk.includes(id))
  const unlisted = onDisk.filter((id) => !shadeExampleIds.includes(id))
  const parts = [
    missing.length > 0 ? `registered with no file: ${missing.join(', ')}` : '',
    unlisted.length > 0 ? `in the directory with no registration: ${unlisted.join(', ')}` : '',
  ].filter(Boolean)
  if (parts.length > 0) throw new Error(`[shade] ${REGISTRY} and ${examplesDir} disagree (${parts.join('; ')})`)
}

/** What the copy counts: the corpus, and how much of it has a second target. */
export const shadeCounts = {
  total: shadeExampleList.length,
  renderable: shadeExampleList.filter((e) => e.renderable).length,
}

/** One example's compiled module, from the file's own bytes, the way the registry compiles
 *  it. An error diagnostic throws, so a file that stopped being a program cannot reach a
 *  page as an empty module. */
export function shadeModule(id: string): ModuleDecl {
  const example = shadeExampleList.find((e) => e.id === id)
  if (!example) throw new Error(`[shade] no example '${id}' in ${REGISTRY}`)
  const { diagnostics, module } = compile(readFileSync(path.join(examplesDir, example.file), 'utf8'))
  const errors = diagnostics.filter((d) => d.category === 'error')
  if (errors.length > 0) {
    throw new Error(`[shade] ${example.file} does not compile: ${errors.map((d) => `${d.line}:${d.character} ${d.message}`).join('; ')}`)
  }
  if (!module) throw new Error(`[shade] ${example.file} compiled to no module`)
  return module
}

/** The groups the gallery and the Playground's picker show, by the language feature each
 *  file is there for. The compiler files them all under one category, `source`, because to
 *  it they are one corpus written on the other authoring surface; a reader looking for
 *  inheritance or for a texture wants them apart. Each group's heading is copy and lives in
 *  the dictionaries under `examples.shade.groups`. */
export const SHADE_GROUPS = [
  { key: 'stages', ids: ['hello', 'hello-vsout', 'hello-vsin', 'bare-position', 'twin-structs'] },
  {
    key: 'resources',
    ids: [
      'hello-uniform', 'hello-uniform-struct', 'hello-camera', 'textured-quad', 'array-length',
      'storage-texture', 'shadow-compare', 'cube-env', 'cube-array-gather', 'msaa-resolve',
    ],
  },
  {
    key: 'values',
    ids: [
      'module-const', 'palette-const', 'array-literal-ramp', 'convert-grid', 'normal-matrix',
      'fp64-lane-stripes', 'bitfield-bands', 'block-scope', 'pick-composite', 'cutout',
      'default-args', 'bit-bump', 'bool-select',
    ],
  },
  {
    key: 'classes',
    ids: [
      'ray-class', 'orbit-inout', 'particle-step', 'shape-inheritance', 'mixin-surface',
      'generic-helpers', 'generic-class', 'tuple-and-brand',
    ],
  },
  {
    key: 'compute',
    ids: ['private-state', 'workgroup-scratch', 'workgroup-reduce', 'atomic-histogram', 'compute-reduction-twin'],
  },
  {
    key: 'twins',
    ids: [
      'hillshade-twin', 'plasma-twin', 'julia-twin', 'mandelbrot-twin', 'domain-warp-twin',
      'tunnel-twin', 'ocean-twin', 'starfield-twin', 'kaleidoscope-twin', 'gradient-twin',
    ],
  },
] as const

export type ShadeGroupKey = (typeof SHADE_GROUPS)[number]['key']

// Every id in exactly one group, checked against the registry in both directions, so a file
// added upstream stops the build here instead of going missing from the gallery.
{
  const grouped = SHADE_GROUPS.flatMap((g) => g.ids as readonly string[])
  const seen = new Set<string>()
  const twice = grouped.filter((id) => (seen.has(id) ? true : (seen.add(id), false)))
  const ungrouped = shadeExampleIds.filter((id) => !seen.has(id))
  const unknown = grouped.filter((id) => !shadeExampleIds.includes(id))
  const parts = [
    twice.length > 0 ? `in two groups: ${twice.join(', ')}` : '',
    ungrouped.length > 0 ? `registered with no group: ${ungrouped.join(', ')}` : '',
    unknown.length > 0 ? `in a group with no registration: ${unknown.join(', ')}` : '',
  ].filter(Boolean)
  if (parts.length > 0) throw new Error(`[shade] SHADE_GROUPS and ${REGISTRY} disagree (${parts.join('; ')})`)
}

/** The English title of every `.shade.ts` example, keyed by id. English is the compiler's own
 *  wording; every other language writes its own line against the same keys, in src/i18n. */
export function shadeTitles(): Record<string, string> {
  return Object.fromEntries(shadeExampleList.map((e) => [e.id, e.title]))
}

/** The English description of every one, shortened to its first clause the way the registry
 *  table's are. */
export function shadeDescriptions(): Record<string, string> {
  return Object.fromEntries(shadeExampleList.map((e) => [e.id, shortBlurb(e.blurb)]))
}

/** One locale's words for the corpus, checked against the registry, so an example added
 *  upstream cannot reach a page without a line in each language. */
export function checkedShade(what: string, words: Record<string, string>): Record<string, string> {
  const missing = shadeExampleIds.filter((id) => !words[id])
  const extra = Object.keys(words).filter((id) => !shadeExampleIds.includes(id))
  if (missing.length > 0) throw new Error(`[shade] no ${what} for ${missing.join(', ')}`)
  if (extra.length > 0) throw new Error(`[shade] ${what} for ${extra.join(', ')}, which the corpus has no file for`)
  return words
}
