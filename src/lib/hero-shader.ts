// Build-time shader emission. Runs in Astro frontmatter only. It takes one
// example from the vendored registry and produces what shader-runtime.ts renders, including
// the uniform layout as reflect() recovers it. An example the runtime cannot render fails
// the build.

import { examples } from '../../vendor/shader-dsl/examples/index.ts'
import { emitModule, emitGlslModule, reflect } from '../../vendor/shader-dsl/src/index.ts'
import type { Control as MirrorControl } from '../../vendor/shader-dsl/examples/_shared.ts'
import type { Control, ShaderData, ShaderLayout } from './shader-runtime.ts'

/** Translate the registry's `Control` union into the runtime's. Throws on a kind the packer
 *  has no case for. */
function toRuntimeControl(id: string, field: string, c: MirrorControl): Control {
  switch (c.kind) {
    case 'time':
    case 'resolution':
    case 'mouse':
      return { kind: c.kind }
    case 'const':
      return { kind: 'const', value: [...c.value] }
    case 'slider':
      return { kind: 'slider', value: c.value }
    case 'toggle':
      return { kind: 'toggle', value: c.value }
    case 'logmag1d':
      return { kind: 'logmag1d', magField: c.magField, base: c.base, offset: c.offset }
    default:
      throw new Error(
        `[hero-shader] example '${id}' field '${field}' uses control kind '${c.kind}', ` +
          `which src/lib/shader-runtime.ts has no packer for. Add the case there first`,
      )
  }
}

/** The reflected interface of one module, reduced to what the runtime binds against. */
function layoutOf(id: string, module: Parameters<typeof reflect>[0]): ShaderLayout {
  const r = reflect(module)
  const group = r.bindGroups[0]
  const uniformEntry = group?.entries.find((e) => e.resourceKind === 'uniform-buffer')
  const block = r.uniforms[0]
  if (!uniformEntry || !block) throw new Error(`[hero-shader] '${id}' binds no uniform block`)

  const textures = (group?.entries ?? [])
    .filter((e) => e.resourceKind === 'texture')
    .map((e) => {
      // The runtime only supplies the compiler's fp64 guard texture (a 1x1 white texel).
      if (e.name !== '_fp64') {
        throw new Error(
          `[hero-shader] '${id}' declares texture '${e.name}'; the runtime only supplies the ` +
            `fp64 guard (_fp64) and would bind a white 1x1 texel to it`,
        )
      }
      return { name: e.name, binding: e.binding }
    })

  const entry = (stage: 'vertex' | 'fragment'): string => {
    const e = r.entries.find((x) => x.stage === stage)
    if (!e) throw new Error(`[hero-shader] '${id}' has no @${stage} entry point`)
    return e.name
  }

  return {
    size: block.size,
    block: block.name,
    group: uniformEntry.group,
    binding: uniformEntry.binding,
    fields: block.fields.map((f) => ({ name: f.name, type: f.type, offset: f.offset })),
    vertexEntry: entry('vertex'),
    fragmentEntry: entry('fragment'),
    textures,
  }
}

/** Emit one registry example as the runtime's payload: both targets plus the reflected layout.
 *  The registry's `blurb` is left out: nothing reads it, and it would ship prose the page
 *  never renders into every inlined payload. */
export function heroShader(id: string): ShaderData {
  const ex = examples.find((e) => e.id === id)
  if (!ex) throw new Error(`[hero-shader] no example '${id}' in the mirror's registry`)
  if (!ex.renderable) throw new Error(`[hero-shader] example '${id}' is not renderable (compute)`)

  const controls: Record<string, Control> = {}
  for (const [field, c] of Object.entries(ex.controls ?? {})) {
    controls[field] = toRuntimeControl(id, field, c)
  }

  return {
    id: ex.id,
    title: ex.title,
    wgsl: emitModule(ex.module),
    vertex: emitGlslModule(ex.module, 'vertex'),
    fragment: emitGlslModule(ex.module, 'fragment'),
    layout: layoutOf(id, ex.module),
    controls,
  }
}

/** The exact bytes ShaderCanvas.astro inlines for one example, with `<` escaped so a
 *  `</script` inside the JSON cannot close the block early. */
export function heroPayload(id: string): string {
  return JSON.stringify(heroShader(id)).replace(/</g, '\\u003c')
}
