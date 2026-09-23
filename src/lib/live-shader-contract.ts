// The contract between a live shader sample and the controls a page shows for it.
//
// Two surfaces read this file: <LiveShader> (src/components/LiveShader.astro, the guide and
// concept pages) and the Playground's live canvas. It imports nothing from the compiler and
// touches no DOM, so the build-time half and the browser half can both hold it, and the two
// surfaces cannot disagree about what a uniform field means.
//
// The three rules it fixes:
//
//   1. Reserved fields. `time`, `resolution` and `mouse` are filled by the runtime and are
//      never shown as controls. See RESERVED_UNIFORMS for the type and the units of each.
//   2. Controls. Every other uniform field the reflection reports becomes one control, with
//      its range, its step and its default taken from the component's props and, failing
//      that, from DEFAULTS below.
//   3. Fragment-only samples. A sample that declares no vertex entry is compiled with
//      FRAGMENT_PRELUDE in front of it, so the reader writes a fragment program and gets a
//      fullscreen triangle with a `uv` for free.

import type { ShaderLayout, UniformField } from './shader-runtime.ts'

// ── Reserved uniform fields ─────────────────────────────────────────────────

/** The uniform fields the runtime fills every frame. A sample declares the ones it reads and
 *  leaves out the rest; a page shows no control for any of them.
 *
 *  `mouse` here is a `vec2` and is not the `mouse` control of src/lib/shader-runtime.ts, which
 *  is the registry examples' `vec4` of [x, y, down, used]. A registry example routed through
 *  this contract is refused for that reason, and never packed into the wrong bytes.
 *
 *  - `time`: seconds since the canvas mounted, as an `f32`.
 *  - `resolution`: the drawing buffer's size in device pixels, as a `vec2`.
 *  - `mouse`: the pointer over the canvas in 0 to 1, origin at the bottom left, which is the
 *    space the prelude's `uv` is in, so `mouse` and `uv` compare directly and
 *    `mouse * resolution` is the pointer in pixels. A canvas the pointer has not touched
 *    holds (0.5, 0.5), so the first frame is the one a still capture sees.
 */
export const RESERVED_UNIFORMS: Readonly<Record<string, string>> = {
  time: 'f32',
  resolution: 'vec2<f32>',
  mouse: 'vec2<f32>',
}

export const isReserved = (field: string): boolean => field in RESERVED_UNIFORMS

/** What the runtime writes into a reserved field. `seconds` is the shader clock, `width` and
 *  `height` the drawing buffer in device pixels, `pointer` the 0 to 1 pointer position. */
export function reservedValue(
  field: string,
  seconds: number,
  width: number,
  height: number,
  pointer: readonly [number, number],
): readonly number[] | null {
  if (field === 'time') return [seconds]
  if (field === 'resolution') return [width, height]
  if (field === 'mouse') return [pointer[0], pointer[1]]
  return null
}

// ── The shape of a sample ───────────────────────────────────────────────────
//
// A live sample is a complete file the reader could paste into a project, the way every
// Book of Shaders page shows a whole `.frag` and every MDN example shows something that runs.
// The one thing a page supplies is the vertex half, which is what glslCanvas supplies there:
// a fullscreen triangle and the `uv` it hands the fragment stage. Nothing else is hidden, so
// every name in front of the reader is declared in front of the reader.
//
// The fragment half then reads the way a GLSL or WGSL author expects:
//
//   uniform vec2 u_resolution;      class Uniforms { resolution: vec2 }
//                                   declare const u: uniform<Uniforms>
//   void main() {                   @fragment
//                                   export function main(@location(0) uv: vec2): vec4 {
//     vec2 st = gl_FragCoord.xy       // uv is already 0 to 1
//               / u_resolution;
//     gl_FragColor = vec4(c, 1.);     return vec4(c, 1.)
//   }                               }
//
// `uv` arrives as a `@location(0)` parameter instead of the fragment position, because the
// two backends disagree about the position builtin: WGSL counts y down from the top and
// GLSL's `gl_FragCoord` counts it up from the bottom, so a shader that read it would render
// upside down on one of them. The varying is written once in the vertex half and linked by
// name on both.

export type SampleShape = 'fragment' | 'module'

/** The source with comments and string bodies blanked, for a test that reads code alone. A
 *  sample that says `// the @vertex half is written for you` is still a fragment sample.
 *  Exported for the Playground, which reads the source for the same kind of test. */
export const codeOnly = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/(['"`])(?:[^\\]|\\.)*?\1/g, '""')

/** Which shape a sample is. The test is the `@vertex` decorator, which is how the compiler
 *  finds the entry point too. */
export const sampleShape = (source: string): SampleShape =>
  /@vertex\b/.test(codeOnly(source)) ? 'module' : 'fragment'

/** The vertex half a fragment sample is compiled behind: the fullscreen triangle every Book
 *  of Shaders page draws on, and the varying it hands the fragment stage. Three vertices at
 *  (-1,-1), (3,-1) and (-1,3) cover the clip square with one triangle, and `uv` is that
 *  position in 0 to 1 with the origin at the bottom left.
 *
 *  A fragment sample names none of this. It declares its own uniform block, takes `uv` as a
 *  `@location(0)` parameter and returns a `vec4`. */
export const FRAGMENT_PRELUDE = `class VsOut {
  @builtin("position") pos: vec4
  @location(0) uv: vec2
}

@vertex
export function fullscreen(@builtin("vertex_index") i: u32): VsOut {
  const x = i === 1 ? 3. : -1.
  const y = i === 2 ? 3. : -1.
  return { pos: vec4(x, y, 0., 1.), uv: vec2(x * 0.5 + 0.5, y * 0.5 + 0.5) }
}
`

const DIRECTIVE = '"use typeshade"'

/** The source the compiler sees, and how many lines were put in front of the reader's first
 *  one. A diagnostic's line is reported against the composed source, so a page subtracts
 *  `offset` to underline the line the reader is looking at. */
export function composeSource(source: string): { readonly text: string; readonly offset: number } {
  const body = source.replace(/^\s*(['"])use typeshade\1\s*\n?/, '')
  const head =
    sampleShape(body) === 'module' ? `${DIRECTIVE}\n\n` : `${DIRECTIVE}\n\n${FRAGMENT_PRELUDE}\n`
  // A sample that carries the directive itself loses those lines here, so the reader's first
  // line sits that much higher in the composed text and a diagnostic has to come back further.
  const dropped = source.split('\n').length - body.split('\n').length
  return { text: head + body, offset: head.split('\n').length - 1 - dropped }
}

// ── Controls ────────────────────────────────────────────────────────────────

/** How one uniform field is shown. A `vec2<f32>` is a two-axis pad, a `vec3<f32>` or
 *  `vec4<f32>` the author marks as a colour is a colour picker, and the rest are one row
 *  each: a slider for a float, a stepper for an integer, a checkbox for a flag. */
export type ControlKind = 'slider' | 'stepper' | 'checkbox' | 'pad' | 'color'

/** The range, step, default and label a page gives one field. Every part is optional; what
 *  is left out comes from DEFAULTS. A vector field takes one number for every component, or
 *  one number for all of them. */
export interface ControlProp {
  /** The name the page prints beside the field name, from the dictionaries. */
  readonly label?: string
  readonly min?: number | readonly number[]
  readonly max?: number | readonly number[]
  readonly step?: number | readonly number[]
  readonly value?: number | boolean | readonly number[]
  /** Show a `vec3<f32>` or `vec4<f32>` as a colour picker over 0 to 1 per channel. */
  readonly color?: boolean
  /** Show a `u32` or `i32` as a checkbox that writes 1 or 0. WGSL has no `bool` in a uniform
   *  block, so this is how a live sample carries a flag. */
  readonly toggle?: boolean
}

export type ControlProps = Readonly<Record<string, ControlProp>>

/** One control on the page, and where it writes. `offset` is the field's std140 byte offset
 *  as `reflect()` reported it, and `scalar` is how the packer writes those bytes.
 *
 *  A control is only ever as fresh as the reflection it came from. A consumer that writes by
 *  `offset` re-reads the controls after every compile; one that writes by name can keep the
 *  values it has. */
export interface LiveControl {
  readonly field: string
  readonly kind: ControlKind
  /** The field's DSL type key, `'f32'` or `'vec3<f32>'`. */
  readonly type: string
  readonly scalar: 'f32' | 'i32' | 'u32' | 'bool'
  readonly components: number
  readonly offset: number
  readonly label?: string
  readonly min: readonly number[]
  readonly max: readonly number[]
  readonly step: readonly number[]
  readonly value: readonly number[]
}

/** The field types a control can be generated for, and what a page gives each one when the
 *  author says nothing. A float runs 0 to 1 in 500 steps, an integer 0 to 16 by one, a pad
 *  sits in the middle of its square and a colour starts white.
 *
 *  `bool` is absent on purpose. WGSL forbids it in the uniform address space, so a module
 *  that declares one compiles here and is refused by the device; a flag is a `u32` with
 *  `toggle: true`, which is what ControlProp.toggle is for. */
const DEFAULTS: Readonly<
  Record<string, { kind: ControlKind; scalar: LiveControl['scalar']; n: number; min: number; max: number; step: number; value: number }>
> = {
  f32: { kind: 'slider', scalar: 'f32', n: 1, min: 0, max: 1, step: 0.002, value: 0.5 },
  i32: { kind: 'stepper', scalar: 'i32', n: 1, min: 0, max: 16, step: 1, value: 0 },
  u32: { kind: 'stepper', scalar: 'u32', n: 1, min: 0, max: 16, step: 1, value: 0 },
  'vec2<f32>': { kind: 'pad', scalar: 'f32', n: 2, min: 0, max: 1, step: 0.002, value: 0.5 },
  'vec3<f32>': { kind: 'slider', scalar: 'f32', n: 3, min: 0, max: 1, step: 0.002, value: 0.5 },
  'vec4<f32>': { kind: 'slider', scalar: 'f32', n: 4, min: 0, max: 1, step: 0.002, value: 0.5 },
}

/** A field type this file has no control for is left out of the page and left at zero in the
 *  buffer. `f64` and the matrices are the ones a sample can still declare. */
export const isControllable = (type: string): boolean => type in DEFAULTS

const spread = (v: number | readonly number[] | undefined, n: number, fallback: number): number[] =>
  v === undefined
    ? Array.from({ length: n }, () => fallback)
    : typeof v === 'number'
      ? Array.from({ length: n }, () => v)
      : Array.from({ length: n }, (_, i) => v[i] ?? fallback)

/** One control for one uniform field, or null when the field is reserved or has a type no
 *  control covers. `prop` is what the page's author wrote for this field. */
export function controlFor(field: UniformField, prop: ControlProp = {}): LiveControl | null {
  if (isReserved(field.name)) return null
  const base = DEFAULTS[field.type]
  if (!base) return null
  const numeric = typeof prop.value === 'boolean' ? (prop.value ? 1 : 0) : prop.value
  const kind: ControlKind =
    prop.color && (field.type === 'vec3<f32>' || field.type === 'vec4<f32>')
      ? 'color'
      : prop.toggle && (field.type === 'u32' || field.type === 'i32')
        ? 'checkbox'
        : base.kind
  const colourDefault = kind === 'color' ? 1 : base.value
  return {
    field: field.name,
    kind,
    type: field.type,
    scalar: base.scalar,
    components: base.n,
    offset: field.offset,
    ...(prop.label ? { label: prop.label } : {}),
    min: spread(prop.min, base.n, kind === 'color' ? 0 : base.min),
    max: spread(prop.max, base.n, kind === 'color' ? 1 : base.max),
    step: spread(prop.step, base.n, kind === 'color' ? 1 / 255 : base.step),
    value: spread(numeric, base.n, colourDefault),
  }
}

/** Every control one module's uniform block asks for, in declaration order. */
export function controlsFor(layout: ShaderLayout, props: ControlProps = {}): LiveControl[] {
  const out: LiveControl[] = []
  for (const field of layout.fields) {
    const control = controlFor(field, props[field.name])
    if (control) out.push(control)
  }
  return out
}

/** The field names in `props` that the module has no uniform field for. A page that renames
 *  a field in its sample and forgets its prop would otherwise show the default range for it
 *  and say nothing, so the build stops on this. */
export function strayProps(layout: ShaderLayout, props: ControlProps = {}): string[] {
  const known = new Set(layout.fields.map((f) => f.name))
  return Object.keys(props).filter((name) => !known.has(name))
}

// ── Layout ──────────────────────────────────────────────────────────────────
// The shape of `reflect()`'s answer, restated structurally so this file imports nothing from
// the compiler. The compiler's own Reflection satisfies it, and the build (live-shader-emit.ts)
// and the browser (src/scripts/live-shader-compile.ts) derive a layout through this one
// function, so an edit cannot land on different byte offsets from the first frame.

export interface ReflectedBinding {
  readonly name: string
  readonly group: number
  readonly binding: number
  readonly resourceKind: string
}

export interface ReflectedStruct {
  readonly name: string
  readonly size: number
  readonly fields: readonly { readonly name: string; readonly type: string; readonly offset: number }[]
}

export interface ShaderReflection {
  readonly bindGroups: readonly { readonly group: number; readonly entries: readonly ReflectedBinding[] }[]
  readonly uniforms: readonly ReflectedStruct[]
  readonly entries: readonly { readonly name: string; readonly stage: string }[]
}

/** The reflected interface of one live module, as the runtime binds it. A live sample may
 *  bind no uniform block at all, so a size of 0 is a normal answer here. Throws when the
 *  module has no vertex or no fragment entry, or binds a texture the runtime cannot fill. */
export function layoutFor(id: string, reflection: ShaderReflection): ShaderLayout {
  const group = reflection.bindGroups[0]
  const uniformEntry = group?.entries.find((e) => e.resourceKind === 'uniform-buffer')
  const block = reflection.uniforms[0]

  const textures = (group?.entries ?? [])
    .filter((e) => e.resourceKind === 'texture')
    .map((e) => {
      // The runtime supplies the compiler's fp64 fast-math guard, a 1x1 white texel, and has
      // no data to put in any other texture.
      if (e.name !== '_fp64') throw new Error(`[live-shader] '${id}' declares texture '${e.name}'`)
      return { name: e.name, binding: e.binding }
    })

  const entry = (stage: 'vertex' | 'fragment'): string => {
    const e = reflection.entries.find((x) => x.stage === stage)
    if (!e) throw new Error(`[live-shader] '${id}' has no @${stage} entry point`)
    return e.name
  }

  return {
    size: block?.size ?? 0,
    block: block?.name ?? '',
    group: uniformEntry?.group ?? 0,
    binding: uniformEntry?.binding ?? 0,
    instance: uniformEntry?.name ?? '',
    fields: (block?.fields ?? []).map((f) => ({ name: f.name, type: f.type, offset: f.offset })),
    vertexEntry: entry('vertex'),
    fragmentEntry: entry('fragment'),
    textures,
  }
}

// ── Packing ─────────────────────────────────────────────────────────────────

/** The current value of every control, keyed by field name. The page owns this object and
 *  the runtime reads it once per frame. */
export type ControlValues = Readonly<Record<string, readonly number[]>>

/** The starting value of every control, as a page hands it to the runtime. */
export const initialValues = (controls: readonly LiveControl[]): Record<string, number[]> =>
  Object.fromEntries(controls.map((c) => [c.field, [...c.value]]))

/** Hold one number inside its control's range, on its step. A page runs a reader's input
 *  through this, so a typed number cannot write a value outside what the author allowed. */
export function clamp(control: LiveControl, index: number, raw: number): number {
  const min = control.min[index] ?? 0
  const max = control.max[index] ?? 1
  const step = control.step[index] ?? 0
  if (!Number.isFinite(raw)) return min
  const held = Math.min(max, Math.max(min, raw))
  const stepped = step > 0 ? Math.round((held - min) / step) * step + min : held
  // A range whose span is not a whole number of steps would otherwise round past its own end.
  const inside = Math.min(max, Math.max(min, stepped))
  return control.scalar === 'f32' ? inside : Math.round(inside)
}
