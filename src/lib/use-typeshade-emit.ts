// Build-time WGSL and GLSL for hello.shade.ts. The front-page pair must show the same module,
// not the gradient example's fragment next to the triangle source.
import { compile } from '../../vendor/shader-dsl/src/compiler/ts/compile.ts'
import { useTypeshadeSample } from './use-typeshade-sample.ts'

function emitSample(): { wgsl: string; glsl: string } {
  const result = compile(useTypeshadeSample, { fileName: 'hello.shade.ts' })
  const errors = result.diagnostics.filter((d) => d.category === 'error')
  if (errors.length > 0) {
    throw new Error(`[use-typeshade] sample failed: ${errors.map((e) => e.message).join('; ')}`)
  }
  if (!result.wgsl) {
    throw new Error('[use-typeshade] sample emitted no WGSL')
  }
  const glsl = result.glsl?.fragment
  if (!glsl) {
    throw new Error('[use-typeshade] sample emitted no GLSL fragment')
  }
  return { wgsl: result.wgsl, glsl }
}

export const useTypeshadeHero = emitSample()
