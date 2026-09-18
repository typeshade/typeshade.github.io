// The code fragments the front page's "What the language accepts" tiles show. Code is not
// copy, so it lives here and not in the dictionaries. Every fragment is a whole program the
// pinned compiler accepts: scripts/check-landing-fragments.ts compiles each one at the start
// of the build and fails on any diagnostic, so a tile can never show source the compiler
// refuses. A fragment with two files is compiled as a two-file module; `show` names the file
// the tile displays.

export interface LandingFragment {
  readonly id: string
  readonly files: Readonly<Record<string, string>>
  readonly show: string
}

const one = (id: string, code: string): LandingFragment => ({ id, files: { [`${id}.shade.ts`]: code }, show: `${id}.shade.ts` })

export const landingFragments: readonly LandingFragment[] = [
  one(
    'structs',
    `"use typeshade"

class VsOut {
  @builtin("position") pos: vec4
  @location(0) uv: vec2
}

@vertex
export function vs(@location(0) p: vec2): VsOut {
  const o: VsOut = { pos: vec4(p, 0., 1.), uv: p * 0.5 + 0.5 }
  return o
}
`,
  ),
  one(
    'resources',
    `"use typeshade"

class Params {
  time: f32
  scale: f32
}
declare const params: uniform<Params>
declare const heights: storage<array<f32>>
declare const atlas: texture_2d<f32>
declare const smp: sampler
declare const quality: override<f32>

class Color {
  @location(0) color: vec4
}

@fragment
export function fs(@location(0) uv: vec2): Color {
  const t = textureSample(atlas, smp, uv * params.scale)
  return { color: t * quality + heights[0] * params.time }
}
`,
  ),
  one(
    'entries',
    `"use typeshade"

declare let heights: storage<array<f32>>

function wave(x: f32): f32 {
  return sin(x * 0.1) * 0.5 + 0.5
}

@compute([64, 1, 1])
export function main(@builtin("global_invocation_id") id: vec3u) {
  heights[id.x] = wave(f32(id.x))
}
`,
  ),
  one(
    'control-flow',
    `"use typeshade"

export function band(x: f32): f32 {
  let acc = 0.
  for (let i: i32 = 0; i < 8; i++) {
    if (x > f32(i) * 0.125) {
      acc += 1.
    }
  }
  let r = 0.
  switch (i32(acc)) {
    case 8: r = 1.; break
    default: r = acc / 8.
  }
  return r
}
`,
  ),
  one(
    'literals',
    `"use typeshade"

export function pick(i: u32): vec3u {
  const stops: array<u32, 3> = [1, 2, 4]
  return vec3u(stops[i], 0, min(i, 4))
}
`,
  ),
  one(
    'f64',
    `"use typeshade"

export function widen(x: f32, y: f32): f64 {
  const z = f64(x) * f64(y)
  return z + f64(0.1)
}
`,
  ),
  one(
    'builtins',
    `"use typeshade"

export function shade(n: vec3, l: vec3, uv: vec2): f32 {
  const d = saturate(dot(n, l))
  const e = smoothstep(0.2, 0.8, length(uv))
  return mix(d, e, Math.sin(uv.x) * 0.5 + 0.5)
}
`,
  ),
  {
    id: 'modules',
    files: {
      'noise.shade.ts': `"use typeshade"

export function hash(p: vec2): f32 {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453)
}
`,
      'grain.shade.ts': `"use typeshade"
import { hash } from "./noise.shade"

export function grain(p: vec2): f32 {
  return hash(p) * 0.1
}
`,
    },
    show: 'grain.shade.ts',
  },
]
