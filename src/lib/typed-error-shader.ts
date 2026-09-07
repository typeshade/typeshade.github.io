// ═══ typeshade.dev — the shader fragment section 4 puts a red squiggle on ═══
//
// ONE authority for all three arms of the typed-error proof. `typed-error.ts` reads this
// file's TEXT (the snippet between the region markers), type-checks a COPY of that text with
// the field read misspelt (the diagnostic), and imports the module below (the std140 layout,
// from `reflect()`). Nothing about the proof is written twice, so nothing can drift.
//
// Keep the `#region snippet` / `#endregion snippet` markers, and keep exactly ONE read of the
// `top` field inside the region: typed-error.ts fails the build if either goes missing.

import {
  builtin,
  f32,
  f32T,
  fn,
  ioStruct,
  location,
  mix,
  module,
  vec4,
  vec2fT,
  vec4fT,
  uniformStruct,
} from '../../vendor/shader-dsl/src/index.ts'

const VsOut = ioStruct('VsOut', { pos: builtin('position', vec4fT), uv: location(0, vec2fT) })

// #region snippet
const U = uniformStruct('Uniforms', { group: 0, binding: 0, as: 'U' }, {
  time: f32T, top: vec4fT, bottom: vec4fT,
})

const fsGradient = fn('fs_gradient', { vo: VsOut }, (p) => {
  const t = p.vo.uv.y.add(U.field.time.mul(0.05))
  return vec4(mix(U.field.bottom.rgb, U.field.top.rgb, t), f32(1))
}, { stage: 'fragment', retAttr: '@location(0)' })
// #endregion snippet

export const gradientModule = module({
  structs: [U.decl, VsOut.decl],
  bindings: [U.binding],
  funcs: [fsGradient],
})
