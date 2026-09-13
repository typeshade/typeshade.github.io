// Build-time WGSL for hello.shade.ts. The front-page pair must show the same module,
// not the gradient example's fragment next to the triangle source.
import { compileTsSource } from '../../vendor/shader-dsl/src/compiler/ts/source-file.ts'
import { useTypeshadeSample } from './use-typeshade-sample.ts'

function emitSample(): { wgsl: string } {
  const result = compileTsSource(useTypeshadeSample, {
    fileName: 'hello.shade.ts',
    requireDirective: true,
  })
  const errors = result.diagnostics.filter((d) => d.category === 'error')
  if (errors.length > 0) {
    throw new Error(`[use-typeshade] sample failed: ${errors.map((e) => e.message).join('; ')}`)
  }
  if (!result.wgsl) {
    throw new Error('[use-typeshade] sample emitted no WGSL')
  }
  return { wgsl: result.wgsl }
}

export const useTypeshadeHero = emitSample()
