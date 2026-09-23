// Build-time shader emission. Runs in Astro frontmatter only. It takes one
// example from the vendored registry and produces what shader-runtime.ts renders, including
// the uniform layout as reflect() recovers it. An example the runtime cannot render fails
// the build.

import { examples } from '../../vendor/shader-dsl/examples/index.ts';
import { shadeExampleList, shadeModule } from './shade-examples.ts';
import { emitModule, emitGlslModule, reflect } from '../../vendor/shader-dsl/src/index.ts';
import type { Control as MirrorControl } from '../../vendor/shader-dsl/examples/_shared.ts';
import type { Control, ShaderData, ShaderLayout } from './shader-runtime.ts';

/** Translate the registry's `Control` union into the runtime's. Throws on a kind the packer
 *  has no case for. */
function toRuntimeControl(id: string, field: string, c: MirrorControl): Control {
  switch (c.kind) {
    case 'time':
    case 'resolution':
    case 'mouse':
      return { kind: c.kind };
    case 'const':
      return { kind: 'const', value: [...c.value] };
    case 'slider':
      return { kind: 'slider', value: c.value };
    case 'toggle':
      return { kind: 'toggle', value: c.value };
    case 'logmag1d':
      return { kind: 'logmag1d', magField: c.magField, base: c.base, offset: c.offset };
    default:
      throw new Error(
        `[hero-shader] example '${id}' field '${field}' uses control kind '${c.kind}', ` +
          `which src/lib/shader-runtime.ts has no packer for. Add the case there first`,
      );
  }
}

// The three uniform-field names the runtime fills by itself, the same three the live blocks
// reserve (src/lib/live-shader-contract.ts states the contract).
const RESERVED: Readonly<Record<string, MirrorControl>> = {
  time: { kind: 'time' },
  resolution: { kind: 'resolution' },
  mouse: { kind: 'mouse' },
};

/** How a `.shade.ts` example's uniform fields are filled. The registration has no `controls`
 *  field, so there is nothing to read: the three names above fill themselves, and a source
 *  twin borrows what its `fn()` original declares, since the two are the same uniform block.
 *  A field neither covers has no value the page could invent, so the example gets no still
 *  and the gallery shows it with the plain tile. */
function shadeControls(
  id: string,
  twinOf: string | undefined,
  module: Parameters<typeof reflect>[0],
): Record<string, MirrorControl> {
  const twin = twinOf ? examples.find((e) => e.id === twinOf) : undefined;
  const out: Record<string, MirrorControl> = {};
  for (const field of reflect(module).uniforms[0]?.fields ?? []) {
    const control = twin?.controls?.[field.name] ?? RESERVED[field.name];
    if (!control) {
      throw new Error(
        `[hero-shader] '${id}' declares the uniform field '${field.name}', which the page has no value for; ` +
          'take it out of SHADE_STILL_EXAMPLES in scripts/artifacts.mjs',
      );
    }
    out[field.name] = control;
  }
  return out;
}

/** The value each uniform field starts at in the Playground's bindings panel, for a source
 *  twin: what its `fn()` original gives the field, which is the frame the gallery's still
 *  shows. A field the original drives from a slider starts at the slider's default; a log
 *  sweep or a pan starts at the coordinate it computes there. The three fields the page fills
 *  itself are left out, and a file with no twin starts from the panel's own defaults. */
export function twinUniformDefaults(twinOf: string | undefined): Record<string, number[]> {
  const twin = twinOf ? examples.find((e) => e.id === twinOf) : undefined;
  const controls = twin?.controls ?? {};
  const sliderValue = (field: string): number => {
    const c = controls[field];
    return c?.kind === 'slider' ? c.value : c?.kind === 'toggle' ? (c.value ? 1 : 0) : 0;
  };
  const out: Record<string, number[]> = {};
  for (const [field, c] of Object.entries(controls)) {
    switch (c.kind) {
      case 'const':
        out[field] = [...c.value];
        break;
      case 'slider':
        out[field] = [c.value];
        break;
      case 'toggle':
        out[field] = [c.value ? 1 : 0];
        break;
      case 'pan2d':
        out[field] = [...c.value];
        break;
      case 'logmag1d':
        out[field] = [c.base * Math.pow(10, sliderValue(c.magField)) + c.offset];
        break;
      case 'logmag2d':
        out[field] = c.base.map(
          (b, i) => b * Math.pow(10, sliderValue(c.magField)) + (c.offset[i] ?? 0),
        );
        break;
    }
  }
  return out;
}

/** The reflected interface of one module, reduced to what the runtime binds against. */
function layoutOf(id: string, module: Parameters<typeof reflect>[0]): ShaderLayout {
  const r = reflect(module);
  const group = r.bindGroups[0];
  const uniformEntry = group?.entries.find((e) => e.resourceKind === 'uniform-buffer');
  const block = r.uniforms[0];
  // A module may bind nothing at all: a `.shade.ts` example that draws from `vertex_index`
  // and constants has no uniform block, and the runtime already reads `size: 0` as "no
  // buffer, no bind group". A uniform binding whose block the reflection does not carry is
  // the broken half of the pair, and still stops the build.
  if (Boolean(uniformEntry) !== Boolean(block)) {
    throw new Error(`[hero-shader] '${id}' binds a uniform the reflection has no block for`);
  }

  const textures = (group?.entries ?? [])
    .filter((e) => e.resourceKind === 'texture')
    .map((e) => {
      // The runtime only supplies the compiler's fp64 guard texture (a 1x1 white texel).
      if (e.name !== '_fp64') {
        throw new Error(
          `[hero-shader] '${id}' declares texture '${e.name}'; the runtime only supplies the ` +
            `fp64 guard (_fp64) and would bind a white 1x1 texel to it`,
        );
      }
      return { name: e.name, binding: e.binding };
    });

  const entry = (stage: 'vertex' | 'fragment'): string => {
    const e = r.entries.find((x) => x.stage === stage);
    if (!e) throw new Error(`[hero-shader] '${id}' has no @${stage} entry point`);
    return e.name;
  };

  return {
    size: block?.size ?? 0,
    block: block?.name ?? '',
    group: uniformEntry?.group ?? 0,
    binding: uniformEntry?.binding ?? 0,
    fields: (block?.fields ?? []).map((f) => ({ name: f.name, type: f.type, offset: f.offset })),
    vertexEntry: entry('vertex'),
    fragmentEntry: entry('fragment'),
    textures,
  };
}

/** Emit one registry example as the runtime's payload: both targets plus the reflected layout.
 *  The registry's `blurb` is left out: nothing reads it, and it would ship prose the page
 *  never renders into every inlined payload. */
export function heroShader(id: string): ShaderData {
  // Both corpora: the `fn()` registry, and the `.shade.ts` files, whose registration has no
  // module in it, so the module is compiled from the file's own bytes here.
  const shade = shadeExampleList.find((e) => e.id === id);
  const fromShade = shade
    ? (() => {
        const module = shadeModule(id);
        return { ...shade, module, controls: shadeControls(id, shade.twinOf, module) };
      })()
    : undefined;
  const ex = examples.find((e) => e.id === id) ?? fromShade;
  if (!ex) throw new Error(`[hero-shader] no example '${id}' in the mirror's registry`);
  if (!ex.renderable) throw new Error(`[hero-shader] example '${id}' is not renderable (compute)`);

  const controls: Record<string, Control> = {};
  for (const [field, c] of Object.entries(ex.controls ?? {})) {
    controls[field] = toRuntimeControl(id, field, c);
  }

  return {
    id: ex.id,
    title: ex.title,
    wgsl: emitModule(ex.module),
    vertex: emitGlslModule(ex.module, 'vertex'),
    fragment: emitGlslModule(ex.module, 'fragment'),
    layout: layoutOf(id, ex.module),
    controls,
  };
}

/** The exact bytes ShaderCanvas.astro inlines for one example, with `<` escaped so a
 *  `</script` inside the JSON cannot close the block early. */
export function heroPayload(id: string): string {
  return JSON.stringify(heroShader(id)).replace(/</g, '\\u003c');
}
