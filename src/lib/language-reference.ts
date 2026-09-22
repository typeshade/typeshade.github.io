// The data behind /reference/, the reference for the language a file that starts with
// "use typeshade" is written in. Nothing here is typed by hand. The documented surface is
// the compiler's own: the six `*_DOCS` tables in vendor/shader-dsl/src/language-service/
// docs.ts hold one Markdown sentence per name, and `SHADE_DTS` in ambient.ts is the ambient
// `.d.ts` the editor loads, which carries the declaration of every one of them. Both are
// public through the compiler's ./language-service subpath, and the same pair feeds hover
// and completion in the Playground, so a reference page and an editor tooltip cannot say
// two different things.
//
// The tables are imported. api.ts and builtin-table.ts transpile a compiler file and run it
// in a bare module object instead, because they read tables out of modules the barrel does
// not export; the language service's index does export these, and its import chain
// (docs.ts -> compiler/ts/type-map.ts -> typescript) resolves the same way the rest of the
// site's vendor imports already do (src/lib/concepts-emit.ts, src/lib/examples.ts).
//
// What an entry carries: the name, the declaration lifted out of SHADE_DTS, the sentence
// from its table, and for a builtin function the WGSL and GLSL ES 3.00 text the spelling
// registry writes (src/lib/builtin-table.ts, which already runs those templates). A
// documented name with no declaration, or a declaration with no documented name, stops the
// build and is named in the message.
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  ATTRIBUTE_DOCS,
  BUILTIN_DOCS,
  CONSTANT_DOCS,
  FUNCTION_DOCS,
  MATH_MEMBER_DOCS,
  SHADE_DTS,
  TYPE_DOCS,
  WGSL_BUILTIN_NAMES,
} from '../../vendor/shader-dsl/src/language-service/index.ts'
import { WGSL_BUILTIN_TYPES, typeKey } from '../../vendor/shader-dsl/src/index.ts'
import { builtinGroups, type BuiltinFamily, type BuiltinRow } from './builtin-table.ts'

const ROOT = 'vendor/shader-dsl'

/** The six tables, in the order the reference lists them. */
export type LanguageKind = 'type' | 'attribute' | 'builtin' | 'function' | 'constant' | 'math'
export const LANGUAGE_KINDS: readonly LanguageKind[] = ['type', 'attribute', 'builtin', 'function', 'constant', 'math']

/** The route segment each kind sits under. `builtin-values` keeps the `@builtin(...)` ids
 *  apart from the builtin functions, which the guide's builtin table also calls builtins. */
export const LANGUAGE_SLUGS: Readonly<Record<LanguageKind, string>> = {
  type: 'types',
  attribute: 'attributes',
  builtin: 'builtin-values',
  function: 'functions',
  constant: 'constants',
  math: 'math',
}

/** The sections the functions page is cut into. The first ten are the families the builtin
 *  table already groups the spelling registry by (src/lib/builtin-table.ts); the last two
 *  hold the names the registry has no id for, which the front end lowers itself. */
export type LanguageFamily = BuiltinFamily | 'constructors' | 'resources'
export const LANGUAGE_FAMILIES: readonly LanguageFamily[] = [
  'maths', 'geometry', 'derivatives', 'bits', 'packing', 'casts',
  'textures', 'atomics', 'barriers', 'f64', 'constructors', 'resources',
]

// The families of the documented functions the spelling registry carries no id for: the
// vector and matrix constructors, the array and binding declarators, and the five maths
// names the CPU oracle and the front end lower without an intrinsic. A documented function
// in neither the registry nor this table stops the build in build().
const FAMILY_OF: Readonly<Record<string, LanguageFamily>> = {
  bool: 'casts',
  log10: 'maths', log1p: 'maths', expm1: 'maths', cbrt: 'maths', hypot: 'maths', random: 'maths',
  vec2: 'constructors', vec3: 'constructors', vec4: 'constructors',
  vec2f: 'constructors', vec3f: 'constructors', vec4f: 'constructors',
  vec2i: 'constructors', vec3i: 'constructors', vec4i: 'constructors',
  vec2u: 'constructors', vec3u: 'constructors', vec4u: 'constructors',
  vec2b: 'constructors', vec3b: 'constructors', vec4b: 'constructors',
  vec2f64: 'constructors', vec3f64: 'constructors', vec4f64: 'constructors',
  mat2: 'constructors', mat2x2: 'constructors', mat2x3: 'constructors', mat2x4: 'constructors',
  mat3: 'constructors', mat3x2: 'constructors', mat3x3: 'constructors', mat3x4: 'constructors',
  mat4: 'constructors', mat4x2: 'constructors', mat4x3: 'constructors', mat4x4: 'constructors',
  array: 'resources', fill: 'resources', uniform: 'resources', storage: 'resources',
}

/** Which stage and direction a `@builtin(...)` id is valid in, as the compiler's front end
 *  checks it. An id with no rule is unconstrained. */
export interface BuiltinStageRule {
  readonly stage: string
  readonly direction: string
}

/** What the two backends write for a builtin function, from the spelling registry. */
export interface LanguageSpelling {
  readonly wgsl: string | null
  readonly glsl: string | null
  /** The registry's own message when GLSL ES 3.00 has no form, with its target prefix gone. */
  readonly glslMessage: string
  readonly preEmit: boolean
  /** The family the builtin table groups this id under, for the link back to that table. */
  readonly family: BuiltinFamily
}

/** One documented name. */
export interface LanguageEntry {
  readonly kind: LanguageKind
  /** The name the table carries it under, which is also the id of its anchor. */
  readonly name: string
  /** What the entry is headed with: `@vertex` for an attribute, `Math.abs` for a member. */
  readonly title: string
  /** The declaration, lifted out of SHADE_DTS. Every overload, one per line. */
  readonly signature: string
  /** The compiler's own sentence, Markdown with inline code. */
  readonly summary: string
  readonly family: LanguageFamily
  /** The two target spellings, for a function the spelling registry has an id for. */
  readonly spelling: LanguageSpelling | null
  /** Where a `@builtin(...)` id may be used. Empty means the compiler constrains it nowhere. */
  readonly stages: readonly BuiltinStageRule[]
}

export interface LanguageGroup {
  readonly family: LanguageFamily
  readonly entries: readonly LanguageEntry[]
}

export interface LanguageSection {
  readonly kind: LanguageKind
  readonly slug: string
  readonly entries: readonly LanguageEntry[]
  /** The functions page runs in family sections; the other five are one list. */
  readonly groups: readonly LanguageGroup[]
}

// ── SHADE_DTS, parsed once ────────────────────────────────────────────────────────────────

interface Declarations {
  readonly functions: ReadonlyMap<string, readonly string[]>
  readonly types: ReadonlyMap<string, string>
  readonly values: ReadonlyMap<string, string>
  readonly mathMembers: ReadonlyMap<string, { readonly text: string; readonly callable: boolean }>
}

function declarations(): Declarations {
  const source = ts.createSourceFile('shade.d.ts', SHADE_DTS, ts.ScriptTarget.ES2022, true)
  const functions = new Map<string, string[]>()
  const types = new Map<string, string>()
  const values = new Map<string, string>()
  const mathMembers = new Map<string, { text: string; callable: boolean }>()
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const overloads = functions.get(statement.name.text) ?? []
      overloads.push(statement.getText(source))
      functions.set(statement.name.text, overloads)
    } else if (ts.isTypeAliasDeclaration(statement)) {
      types.set(statement.name.text, statement.getText(source))
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) values.set(d.name.text, statement.getText(source))
      }
    } else if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'MathObject') {
      for (const member of statement.members) {
        const name = member.name
        if (!name || !(ts.isIdentifier(name) || ts.isStringLiteral(name))) continue
        mathMembers.set(name.text, { text: member.getText(source), callable: ts.isMethodSignature(member) })
      }
    }
  }
  if (mathMembers.size === 0) throw new Error('[language-reference] SHADE_DTS no longer declares a MathObject interface')
  return { functions, types, values, mathMembers }
}

// ── the stage rules, read off the front end's own table ───────────────────────────────────

/** `BUILTIN_STAGE_RULES` in src/compiler/ts/builtin-check.ts, which the compiler keeps as a
 *  module-level `const` and does not export, so it is read from the AST of the file it lives
 *  in. The stage and the direction are string literals, so the table needs no evaluation. */
function stageRules(): ReadonlyMap<string, readonly BuiltinStageRule[]> {
  const file = 'src/compiler/ts/builtin-check.ts'
  const abs = path.resolve(process.cwd(), ROOT, file)
  const source = ts.createSourceFile(file, readFileSync(abs, 'utf8'), ts.ScriptTarget.ES2022, true)
  const out = new Map<string, readonly BuiltinStageRule[]>()
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'BUILTIN_STAGE_RULES' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue
        if (!property.name || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) continue
        if (!ts.isArrayLiteralExpression(property.initializer)) continue
        const rules: BuiltinStageRule[] = []
        for (const element of property.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue
          const read = (key: string): string | undefined => {
            for (const p of element.properties) {
              if (ts.isPropertyAssignment(p) && p.name && ts.isIdentifier(p.name) && p.name.text === key && ts.isStringLiteral(p.initializer)) {
                return p.initializer.text
              }
            }
            return undefined
          }
          const stage = read('stage')
          const direction = read('direction')
          if (stage && direction) rules.push({ stage, direction })
        }
        out.set(property.name.text, rules)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (out.size === 0) throw new Error(`[language-reference] ${file} no longer keeps its stage rules in BUILTIN_STAGE_RULES`)
  return out
}

// ── the entries ───────────────────────────────────────────────────────────────────────────

let cache: readonly LanguageSection[] | null = null

function build(): readonly LanguageSection[] {
  const decl = declarations()
  const rules = stageRules()

  // The spelling registry, keyed by the id a call carries, and the family the builtin table
  // groups it under. A documented function whose name is one of these ids shows both target
  // spellings and links the row of that table it belongs to.
  const spellings = new Map<string, { row: BuiltinRow; family: BuiltinFamily }>()
  for (const group of builtinGroups()) for (const row of group.rows) spellings.set(row.id, { row, family: group.family })

  // Every `declare function` in the ambient file belongs to one of the two tables that
  // document a call: the attributes and the functions. A name in neither is an undocumented
  // call the editor would still offer, so it stops the build here.
  const documentedCalls = new Set([...Object.keys(FUNCTION_DOCS), ...Object.keys(ATTRIBUTE_DOCS)])
  const undocumented = [...decl.functions.keys()].filter((n) => !documentedCalls.has(n))
  if (undocumented.length > 0) {
    throw new Error(`[language-reference] SHADE_DTS declares ${undocumented.join(', ')}, which no *_DOCS table documents`)
  }
  const mathUndocumented = [...decl.mathMembers.keys()].filter((n) => !Object.prototype.hasOwnProperty.call(MATH_MEMBER_DOCS, n))
  if (mathUndocumented.length > 0) {
    throw new Error(`[language-reference] SHADE_DTS declares Math.${mathUndocumented.join(', Math.')}, which MATH_MEMBER_DOCS does not document`)
  }
  const builtinNames = new Set<string>(WGSL_BUILTIN_NAMES)
  const strayBuiltins = [...builtinNames].filter((n) => !Object.prototype.hasOwnProperty.call(BUILTIN_DOCS, n))
  if (strayBuiltins.length > 0) {
    throw new Error(`[language-reference] the compiler knows the builtin id ${strayBuiltins.join(', ')}, which BUILTIN_DOCS does not document`)
  }

  const missing = (kind: LanguageKind, name: string, where: string): never => {
    throw new Error(`[language-reference] the ${kind} '${name}' is documented and has no ${where}`)
  }

  const entriesOf = (kind: LanguageKind, docs: Readonly<Record<string, string>>): LanguageEntry[] =>
    Object.entries(docs).map(([name, summary]) => {
      let title = name
      let signature: string
      let family: LanguageFamily = 'constructors'
      let spelling: LanguageSpelling | null = null
      let stages: readonly BuiltinStageRule[] = []
      switch (kind) {
        case 'type':
          signature = decl.types.get(name) ?? missing(kind, name, 'type alias in SHADE_DTS')
          break
        case 'attribute':
          title = `@${name}`
          signature = (decl.functions.get(name) ?? missing(kind, name, 'declaration in SHADE_DTS')).join('\n')
          break
        case 'builtin': {
          if (!builtinNames.has(name)) missing(kind, name, 'id in the compiler\'s WGSL_BUILTIN_NAMES')
          title = `@builtin("${name}")`
          // The ambient file types the decorator's argument as a string, so a builtin id has
          // no declaration of its own. What it does have is the type WGSL fixes for it, in
          // the compiler's WGSL_BUILTIN_TYPES, and the stage rules the front end checks it
          // against. `clip_distances` is the one id whose type the author picks, so its line
          // stops at the attribute.
          const fixed = (WGSL_BUILTIN_TYPES as Readonly<Record<string, Parameters<typeof typeKey>[0]>>)[name]
          signature = fixed ? `${title}: ${typeKey(fixed)}` : title
          stages = rules.get(name) ?? []
          break
        }
        case 'function': {
          signature = (decl.functions.get(name) ?? missing(kind, name, 'declaration in SHADE_DTS')).join('\n')
          const known = spellings.get(name)
          if (known) {
            family = known.family
            spelling = {
              wgsl: known.row.wgsl,
              glsl: known.row.glsl,
              glslMessage: known.row.glslMessage,
              preEmit: known.row.preEmit,
              family: known.family,
            }
          } else {
            const own = FAMILY_OF[name]
            if (!own) throw new Error(`[language-reference] the function '${name}' is in no family; the spelling registry has no id for it, so add one to FAMILY_OF`)
            family = own
          }
          break
        }
        case 'constant':
          signature = decl.values.get(name) ?? missing(kind, name, 'declaration in SHADE_DTS')
          break
        case 'math': {
          const member = decl.mathMembers.get(name) ?? missing(kind, name, 'member of MathObject in SHADE_DTS')
          title = `Math.${name}`
          // The member's own text with `Math.` in front of it, so the line reads the way the
          // call is written. A value member is declared `readonly`, which the qualified name
          // makes redundant.
          signature = `Math.${member.text.replace(/^readonly\s+/, '')}`
          break
        }
      }
      return { kind, name, title, signature, summary, family, spelling, stages }
    })

  const tables: Readonly<Record<LanguageKind, Readonly<Record<string, string>>>> = {
    type: TYPE_DOCS,
    attribute: ATTRIBUTE_DOCS,
    builtin: BUILTIN_DOCS,
    function: FUNCTION_DOCS,
    constant: CONSTANT_DOCS,
    math: MATH_MEMBER_DOCS,
  }

  return LANGUAGE_KINDS.map((kind) => {
    const entries = entriesOf(kind, tables[kind])
    if (entries.length === 0) throw new Error(`[language-reference] the ${kind} table is empty; the page would have nothing on it`)
    const anchors = new Set(entries.map((e) => e.name))
    if (anchors.size !== entries.length) throw new Error(`[language-reference] two ${kind} entries share an anchor`)
    const groups =
      kind === 'function'
        ? LANGUAGE_FAMILIES.map((family) => ({ family, entries: entries.filter((e) => e.family === family) })).filter((g) => g.entries.length > 0)
        : []
    if (kind === 'function') {
      const placed = groups.reduce((n, g) => n + g.entries.length, 0)
      if (placed !== entries.length) throw new Error(`[language-reference] ${entries.length} functions, ${placed} placed in a family`)
    }
    return { kind, slug: LANGUAGE_SLUGS[kind], entries, groups }
  })
}

function sections(): readonly LanguageSection[] {
  if (!cache) cache = build()
  return cache
}

/** Every section, in the order the index and the sidebar list them. */
export const languageSections = (): readonly LanguageSection[] => sections()

/** One section by kind. */
export function languageSection(kind: LanguageKind): LanguageSection {
  const found = sections().find((s) => s.kind === kind)
  if (!found) throw new Error(`[language-reference] no section for '${kind}'`)
  return found
}

/** How many names each table documents, and how many in all, so no count is typed. */
export function languageCounts(): Readonly<Record<LanguageKind, number>> & { readonly total: number } {
  const per = Object.fromEntries(sections().map((s) => [s.kind, s.entries.length])) as Record<LanguageKind, number>
  return { ...per, total: sections().reduce((n, s) => n + s.entries.length, 0) }
}

/** Where one entry sits: the page's locale-neutral route and the id of its heading. The two
 *  are apart because a caller prefixes the route with its locale (localePath) and an anchor
 *  takes no prefix. */
export interface LanguageEntryLink {
  readonly path: string
  readonly anchor: string
}

/** The entry for one name of one kind, or undefined when that table has no such name. */
export function languageEntryLink(kind: LanguageKind, name: string): LanguageEntryLink | undefined {
  const section = languageSection(kind)
  return section.entries.some((e) => e.name === name) ? { path: `/reference/${section.slug}/`, anchor: name } : undefined
}

/** The function entry for a builtin the spelling registry has an id for, or undefined for an
 *  id the language surface does not name (the layered texture forms the compiler picks
 *  itself, the storage fetches, the fp64 helpers). The builtin table links each row with it. */
export const languageBuiltinLink = (id: string): LanguageEntryLink | undefined => languageEntryLink('function', id)
