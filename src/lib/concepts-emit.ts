// Build-time WGSL and GLSL for the concepts page that compares the two targets. The same
// `"use typeshade"` file the front page shows goes through the pinned compiler three times
// here, so the page prints what the compiler writes and never a sample typed by hand.
import { compileTsSource } from '../../vendor/shader-dsl/src/compiler/ts/source-file.ts'
import { emitModule, emitGlslModule } from '../../vendor/shader-dsl/src/index.ts'
import { useTypeshadeSample } from './use-typeshade-sample.ts'

function emitBothTargets(): { wgsl: string; glslVertex: string; glslFragment: string } {
  const result = compileTsSource(useTypeshadeSample, {
    fileName: 'hello.shade.ts',
    requireDirective: true,
    emit: false,
  })
  const errors = result.diagnostics.filter((d) => d.category === 'error')
  if (errors.length > 0) {
    throw new Error(`[concepts-emit] sample failed: ${errors.map((e) => e.message).join('; ')}`)
  }
  const module = {
    consts: [...result.consts],
    structs: result.structs.map((s) => s.decl),
    bindings: [...result.bindings],
    funcs: [...result.funcs],
  }
  const emitted = {
    wgsl: emitModule(module),
    glslVertex: emitGlslModule(module, 'vertex'),
    glslFragment: emitGlslModule(module, 'fragment'),
  }
  for (const [target, text] of Object.entries(emitted)) {
    if (text.trim().length === 0) throw new Error(`[concepts-emit] the sample emitted no ${target}`)
  }
  return emitted
}

/** The sample compiled for both targets, for /guide/concepts/wgsl-and-glsl/. */
export const bothTargets = emitBothTargets()
