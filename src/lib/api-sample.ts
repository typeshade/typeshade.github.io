// Fixture entries that render the reference page template at /api/template/ and
// /api/template-interface/ until the extractor (src/lib/api.ts) supplies real ones.
// Every field is the shape src/lib/api-types.ts describes; the words are illustrative.
import type { ApiEntry } from './api-types.ts'

export const sampleFunction: ApiEntry = {
  preview: true,
  name: 'clamp',
  slug: 'clamp',
  kind: 'function',
  category: { slug: 'builtins', name: 'Builtins', summary: 'The math and vector functions a shader calls, spelled once for both targets.' },
  summary: 'Restricts `x` to the range `[lo, hi]`, component by component, keeping the key of `x`.',
  description:
    'Both bounds take the same key as `x`, so a `vec3<f32>` is clamped against `vec3<f32>` bounds. ' +
    'A scalar bound is lifted to the vector key of `x`. The result carries the key of `x`.\n\n' +
    'On the CPU oracle the result is computed in f64 and rounded only when compared, as every builtin is.',
  signatures: [{ text: 'clamp<K extends FloatKey | IntKey>(x: NodeLike<K>, lo: NodeLike<K>, hi: NodeLike<K>): Node<K>' }],
  declaration: '',
  parameters: [
    { name: 'x', type: 'NodeLike<K>', optional: false, description: 'The value to restrict.' },
    { name: 'lo', type: 'NodeLike<K>', optional: false, description: 'The lower bound, inclusive.' },
    { name: 'hi', type: 'NodeLike<K>', optional: false, description: 'The upper bound, inclusive. Must not be below `lo`; the targets leave that case undefined.' },
  ],
  returns: { type: 'Node<K>', description: 'A node with the key of `x`.' },
  exceptions: [
    { name: 'ShaderDslError', description: 'When the keys of `x`, `lo` and `hi` cannot be unified, at authoring time.' },
  ],
  examples: [
    {
      title: 'Clamping a texture coordinate',
      description: 'The bounds are plain numbers; they lift to `f32`.',
      code: "const uv = p.vo.uv\nconst safe = clamp(uv, 0, 1)\nreturn textureSample(tex, samp, safe)",
    },
  ],
  targets: [
    { target: 'wgsl', support: 'native', note: '`clamp(x, lo, hi)`' },
    { target: 'glsl', support: 'native', note: '`clamp(x, lo, hi)`' },
    { target: 'cpu', support: 'native', note: 'Evaluated in f64.' },
  ],
  members: [],
  guideSections: [{ label: 'Values and mutation', href: '/guide/authoring/values-and-mutation/' }],
  seeAlso: [
    { label: 'min', href: '/api/min/' },
    { label: 'max', href: '/api/max/' },
    { label: 'saturate', href: '/api/saturate/' },
  ],
  source: { file: 'src/core/ir/node.ts', line: 1 },
}

export const sampleInterface: ApiEntry = {
  preview: true,
  name: 'Reflection',
  slug: 'reflection',
  kind: 'interface',
  category: { slug: 'reflection', name: 'Reflection', summary: 'What reflect() recovers from a module: bind groups, byte layouts, entry points.' },
  summary: 'The target-neutral pipeline metadata `reflect(module)` recovers from a module.',
  description: 'Read-only over the IR and never on the emit path. A host packs its uniform buffers from `layouts` and builds its bind group layouts from `bindGroups`.',
  signatures: [],
  declaration: 'interface Reflection {\n  readonly bindGroups: readonly BindGroup[]\n  readonly layouts: Readonly<Record<string, StructLayout>>\n  readonly entries: readonly EntryInfo[]\n  readonly vertex: VertexLayout | null\n}',
  parameters: [],
  returns: null,
  exceptions: [],
  examples: [],
  targets: [],
  members: [
    { name: 'bindGroups', kind: 'property', type: 'readonly BindGroup[]', optional: false, readonly: true, description: 'One entry per `@group(N)`, sorted by group.' },
    { name: 'layouts', kind: 'property', type: 'Readonly<Record<string, StructLayout>>', optional: false, readonly: true, description: 'Every struct the module declares, by name, with its std140 or std430 byte layout.' },
    { name: 'entries', kind: 'property', type: 'readonly EntryInfo[]', optional: false, readonly: true, description: 'The entry points: stage, parameters and return interface.' },
    { name: 'vertex', kind: 'property', type: 'VertexLayout | null', optional: false, readonly: true, description: 'The vertex-buffer layout of the `@vertex` entry, or null when the module has none.' },
  ],
  guideSections: [{ label: 'The authoring surface', href: '/guide/authoring/the-authoring-surface/' }],
  seeAlso: [
    { label: 'reflect', href: '/api/reflect/' },
    { label: 'StructLayout', href: '/api/structlayout/' },
  ],
  source: { file: 'src/core/reflect.ts', line: 1 },
}
