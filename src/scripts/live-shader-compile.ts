// The compiler, in the browser, for one live example. This module is imported lazily and is
// the only place the page reaches the vendored compiler from, so TypeScript (about a megabyte
// gzipped) stays out of a page until a reader edits something. Every instance on a page
// awaits the same import, so the chunk is fetched once however many canvases are on it.

import { compile, reflect } from '../../vendor/shader-dsl/src/index.ts'
import {
  composeSource,
  controlsFor,
  isControllable,
  isReserved,
  layoutFor,
  RESERVED_UNIFORMS,
  type ControlProps,
  type LiveControl,
} from '../lib/live-shader-contract.ts'
import type { ShaderData } from '../lib/shader-runtime.ts'

/** One message under the canvas. `line` and `character` are one-based and already moved back
 *  into the reader's own text, so they point at what the editor is showing. */
export interface LiveDiagnostic {
  readonly message: string
  readonly line: number
  readonly character: number
  readonly category: 'error' | 'warning' | 'message'
}

export interface LiveCompileResult {
  readonly diagnostics: readonly LiveDiagnostic[]
  /** The emitted program, when the compiler reported no error. */
  readonly data?: ShaderData
  readonly controls?: readonly LiveControl[]
}

/** Compile what the reader has typed. `compile()` at the pinned commit still returns WGSL
 *  beside an error diagnostic, so the gate here is the diagnostics, the way the Playground
 *  gates its own output. */
export function compileLive(
  id: string,
  title: string,
  source: string,
  props: ControlProps = {},
): LiveCompileResult {
  const { text, offset } = composeSource(source)
  let result: ReturnType<typeof compile>
  try {
    result = compile(text)
  } catch (error) {
    return {
      diagnostics: [
        {
          message: error instanceof Error ? error.message : String(error),
          line: 1,
          character: 1,
          category: 'error',
        },
      ],
    }
  }

  const diagnostics: LiveDiagnostic[] = result.diagnostics.map((d) => ({
    message: d.message,
    line: Math.max(1, d.line - offset),
    character: d.character,
    category: d.category,
  }))
  const failed = diagnostics.some((d) => d.category === 'error')
  if (failed) return { diagnostics }
  if (!result.wgsl || !result.glsl) {
    return {
      diagnostics: [...diagnostics, { message: 'no shader was emitted', line: 1, character: 1, category: 'error' }],
    }
  }

  let layout
  try {
    layout = layoutFor(id, reflect(result.module))
  } catch (error) {
    return {
      diagnostics: [
        ...diagnostics,
        {
          message: error instanceof Error ? error.message : String(error),
          line: 1,
          character: 1,
          category: 'error',
        },
      ],
    }
  }

  // A reserved field the reader has re-typed with the wrong type would be filled with numbers
  // that do not fit it, so it is reported the way the compiler reports a mistake.
  for (const field of layout.fields) {
    if (isReserved(field.name) && field.type !== RESERVED_UNIFORMS[field.name]) {
      return {
        diagnostics: [
          ...diagnostics,
          {
            message: `'${field.name}' is filled by the page as ${RESERVED_UNIFORMS[field.name]}, and this declares it as ${field.type}`,
            line: 1,
            character: 1,
            category: 'error',
          },
        ],
      }
    }
  }

  const uncontrolled = layout.fields.filter((f) => !isReserved(f.name) && !isControllable(f.type))
  const data: ShaderData = {
    id,
    title,
    wgsl: result.wgsl,
    vertex: result.glsl.vertex,
    fragment: result.glsl.fragment,
    layout,
    controls: {},
  }
  return {
    diagnostics: [
      ...diagnostics,
      ...uncontrolled.map((f) => ({
        message: `'${f.name}: ${f.type}' has no control, so it stays at zero`,
        line: 1,
        character: 1,
        category: 'warning' as const,
      })),
    ],
    data,
    controls: controlsFor(layout, props),
  }
}
