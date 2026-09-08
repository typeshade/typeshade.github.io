// The fixture the types section type-checks and reflects. typed-error.ts reads the text
// between the region markers, type-checks a copy with the `top` read misspelt, and imports
// the module below for its std140 layout. Keep the markers and exactly one read of `top`
// inside the region.

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
