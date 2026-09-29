// The resources a module declares beyond its one uniform block, as plain data the runtime
// binds: the texels of a texture, a sampler's filter and address mode, the bytes a storage
// buffer starts from. The Playground builds these from the reflection and from what the
// reader picked; src/lib/shader-runtime.ts turns them into WebGPU and WebGL2 objects.
//
// Like the runtime, this file imports nothing from the compiler and touches no DOM, so the
// texels a reader sees are generated the same way wherever they are asked for.

import {
  depthRamp,
  generateTexels,
  lattice,
  textureSize,
  type TextureDim,
  type TextureSource,
} from './texture-sources.ts';

export { depthRamp, generateTexels, textureSize, type TextureDim, type TextureSource };

/** What a sampled texture holds. `depth` is a depth texture, filled with a ramp. */
export type SampleKind = 'float' | 'uint' | 'sint' | 'depth';

export const TEXTURE_SOURCES: readonly TextureSource[] = [
  'checker',
  'gradient',
  'noise',
  'solid',
  'faces',
  'image',
];

export type FilterMode = 'linear' | 'nearest';
export type AddressMode = 'repeat' | 'clamp-to-edge' | 'mirror-repeat';

export interface TextureSpec {
  readonly kind: 'texture';
  readonly name: string;
  readonly group: number;
  readonly binding: number;
  readonly dim: TextureDim;
  readonly sample: SampleKind;
  readonly width: number;
  readonly height: number;
  /** Array layers, six per cube, depth slices for a 3d texture, one otherwise. */
  readonly layers: number;
  /** RGBA8 texels per layer, row by row, `width * height * 4` bytes each. Empty for depth. */
  readonly texels: readonly Uint8Array<ArrayBuffer>[];
  /** Depth per layer in 0 to 1, `width * height` values each. Set only on a depth texture. */
  readonly depth?: readonly Float32Array<ArrayBuffer>[];
  /** The pass whose output this texture reads (compiler change 0026): the runtime binds that
   *  pass's target, the size of the canvas, and `texels` is empty. */
  readonly pass?: string;
  /** RGBA as floats per layer, `width * height * 4` each, read in place of `texels`: a pass's
   *  output as the CPU oracle drew it, which keeps a value outside 0 to 1 the way the GPU's
   *  float target does. */
  readonly floats?: readonly Float32Array<ArrayBuffer>[];
}

export interface SamplerSpec {
  readonly kind: 'sampler';
  readonly name: string;
  readonly group: number;
  readonly binding: number;
  readonly comparison: boolean;
  readonly filter: FilterMode;
  readonly address: AddressMode;
}

/** A storage buffer, with the bytes it starts from. A read-only one is what the shader reads;
 *  a read-write one is where it writes, and the host reads it back after a dispatch. */
export interface StorageBufferSpec {
  readonly kind: 'storage-buffer';
  readonly name: string;
  readonly group: number;
  readonly binding: number;
  readonly readOnly: boolean;
  readonly bytes: Uint8Array<ArrayBuffer>;
}

/** A storage texture a compute entry writes, and reads where its access allows. */
export interface StorageTextureSpec {
  readonly kind: 'storage-texture';
  readonly name: string;
  readonly group: number;
  readonly binding: number;
  readonly format: string;
  readonly access: 'write-only' | 'read-only' | 'read-write';
  readonly width: number;
  readonly height: number;
}

/** Bytes per texel of the storage formats a module can declare: the stride of a texture's
 *  readback on the GPU and of the oracle's copy on the CPU. */
export const TEXEL_BYTES: Readonly<Record<string, number>> = {
  rgba8unorm: 4,
  rgba8snorm: 4,
  rgba8uint: 4,
  rgba8sint: 4,
  r32float: 4,
  r32uint: 4,
  r32sint: 4,
  rg32float: 8,
  rg32uint: 8,
  rg32sint: 8,
  rgba16float: 8,
  rgba16uint: 8,
  rgba16sint: 8,
  rgba32float: 16,
  rgba32uint: 16,
  rgba32sint: 16,
};

/** A uniform buffer beyond the one block the render path packs every frame: a compute
 *  entry's parameters, or a bare scalar bound as a uniform. Written once, as given. */
export interface UniformBufferSpec {
  readonly kind: 'uniform-buffer';
  readonly name: string;
  readonly group: number;
  readonly binding: number;
  readonly bytes: Uint8Array<ArrayBuffer>;
}

export type ResourceSpec =
  TextureSpec | SamplerSpec | StorageBufferSpec | StorageTextureSpec | UniformBufferSpec;

/** The one vertex buffer a vertex entry with `@location` inputs reads: three vertices of
 *  interleaved floats, one attribute per input. */
export interface VertexBufferSpec {
  /** Bytes from one vertex to the next. */
  readonly stride: number;
  readonly attributes: readonly {
    readonly location: number;
    readonly components: 1 | 2 | 3 | 4;
    readonly offset: number;
  }[];
  /** `3 * stride / 4` floats. */
  readonly data: Float32Array<ArrayBuffer>;
}

/** Three vertices for a vertex entry's `@location` inputs, by what each input is called: a
 *  position is the corners of a triangle in the middle of the clip square, a `uv` the
 *  matching 0 to 1 corners, a colour red, green and blue, a normal facing the viewer, and
 *  anything else the `uv` corners padded with ones. Returns null for an input that is not
 *  `f32` or a `vecN<f32>`, which the page cannot put in a float buffer. */
export function triangleVertices(
  inputs: readonly { readonly name: string; readonly type: string; readonly location: number }[],
): VertexBufferSpec | null {
  const attributes: { location: number; components: 1 | 2 | 3 | 4; offset: number }[] = [];
  let offset = 0;
  for (const input of inputs) {
    const shape = input.type === 'f32' ? 1 : /^vec([234])<f32>$/.exec(input.type)?.[1];
    if (!shape) return null;
    const components = Number(shape) as 1 | 2 | 3 | 4;
    attributes.push({ location: input.location, components, offset });
    offset += components * 4;
  }
  const stride = offset;
  const data = new Float32Array((3 * stride) / 4);
  const corners = {
    position: [
      [-0.8, -0.8, 0, 1],
      [0.8, -0.8, 0, 1],
      [0, 0.8, 0, 1],
    ],
    uv: [
      [0, 0, 1, 1],
      [1, 0, 1, 1],
      [0.5, 1, 1, 1],
    ],
    colour: [
      [1, 0.2, 0.2, 1],
      [0.2, 0.8, 0.3, 1],
      [0.2, 0.4, 1, 1],
    ],
    normal: [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  };
  inputs.forEach((input, k) => {
    const a = attributes[k]!;
    const kind = /pos/i.test(input.name)
      ? 'position'
      : /colou?r|tint/i.test(input.name)
        ? 'colour'
        : /norm/i.test(input.name)
          ? 'normal'
          : 'uv';
    for (let v = 0; v < 3; v++) {
      const values = corners[kind][v]!;
      for (let c = 0; c < a.components; c++) data[(v * stride + a.offset) / 4 + c] = values[c] ?? 0;
    }
  });
  return { stride, attributes, data };
}

// ── Uniform values ──────────────────────────────────────────────────────────

/** How many numbers a field of this type takes, and how they are laid out in std140: a
 *  matrix is its columns, each padded to four floats except in a `mat2`/`mat*x2` column. */
export interface FieldShape {
  readonly scalar: 'f32' | 'i32' | 'u32' | 'f64' | 'bool';
  /** Components per column. */
  readonly rows: number;
  /** Columns, one for a scalar or a vector; the element count of an array. */
  readonly columns: number;
  /** A fixed-size array of scalars or vectors: its elements take `columns`, and std140 gives
   *  each one sixteen bytes whatever it holds. */
  readonly array?: true;
}

/** The shape of a DSL type key, or null for one this cannot fill (a struct, an array). */
export function fieldShape(type: string): FieldShape | null {
  if (type === 'f32' || type === 'i32' || type === 'u32' || type === 'f64' || type === 'bool') {
    return { scalar: type, rows: 1, columns: 1 };
  }
  const vec = /^vec([234])<(f32|i32|u32|f64|bool)>$/.exec(type);
  if (vec) return { scalar: vec[2] as FieldShape['scalar'], rows: Number(vec[1]), columns: 1 };
  const mat = /^mat([234])x([234])<f32>$/.exec(type);
  if (mat) return { scalar: 'f32', rows: Number(mat[2]), columns: Number(mat[1]) };
  const array = /^array<(.+),\s*(\d+)>$/.exec(type);
  if (array) {
    const inner = fieldShape(array[1]!);
    if (!inner || inner.columns !== 1 || inner.scalar === 'f64') return null;
    return { scalar: inner.scalar, rows: inner.rows, columns: Number(array[2]), array: true };
  }
  return null;
}

/** How many numbers a reader sets for a field: every component of every column. */
export const componentCount = (shape: FieldShape): number => shape.rows * shape.columns;

/** A column-major matrix as its columns, the way the CPU oracle and std140 both hold it. */
export const columnsOf = (values: readonly number[], shape: FieldShape): number[][] =>
  Array.from({ length: shape.columns }, (_, c) =>
    values.slice(c * shape.rows, c * shape.rows + shape.rows),
  );

/** std140 packing for one field's numbers: each matrix column starts on 16 bytes. Returns the
 *  float offsets, relative to the field's own, that each number is written at. */
export function std140Slots(shape: FieldShape): number[] {
  if (shape.columns === 1) return Array.from({ length: shape.rows }, (_, i) => i);
  const stride = 4;
  const slots: number[] = [];
  for (let c = 0; c < shape.columns; c++)
    for (let r = 0; r < shape.rows; r++) slots.push(c * stride + r);
  return slots;
}

/** The identity of a square or rectangular matrix, column-major. */
export function identity(shape: FieldShape): number[] {
  const out: number[] = [];
  for (let c = 0; c < shape.columns; c++)
    for (let r = 0; r < shape.rows; r++) out.push(r === c ? 1 : 0);
  return out;
}

/** A view matrix looking from `eye` at the origin with +Y up, column-major, the way a camera
 *  uniform expects it. */
export function lookAtOrigin(eye: readonly [number, number, number]): number[] {
  const [ex, ey, ez] = eye;
  const len = Math.hypot(ex, ey, ez) || 1;
  // Forward points from the eye to the origin; the view matrix maps it to -Z.
  const f = [-ex / len, -ey / len, -ez / len];
  let s = [f[1]! * 0 - f[2]! * 1, f[2]! * 0 - f[0]! * 0, f[0]! * 1 - f[1]! * 0];
  const sl = Math.hypot(s[0]!, s[1]!, s[2]!) || 1;
  s = s.map((x) => x / sl);
  const u = [
    s[1]! * f[2]! - s[2]! * f[1]!,
    s[2]! * f[0]! - s[0]! * f[2]!,
    s[0]! * f[1]! - s[1]! * f[0]!,
  ];
  const dot = (a: readonly number[]): number => a[0]! * ex + a[1]! * ey + a[2]! * ez;
  return [
    s[0]!,
    u[0]!,
    -f[0]!,
    0,
    s[1]!,
    u[1]!,
    -f[1]!,
    0,
    s[2]!,
    u[2]!,
    -f[2]!,
    0,
    -dot(s),
    -dot(u),
    dot(f),
    1,
  ];
}

/** A rotation about Y by `angle` radians, column-major, for a model matrix that turns. */
export function rotationY(angle: number, shape: FieldShape): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const full = [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  const out: number[] = [];
  for (let col = 0; col < shape.columns; col++)
    for (let r = 0; r < shape.rows; r++) out.push(full[col * 4 + r] ?? 0);
  return out;
}

/** The matrix presets a reader can put in a `mat` field, by name. */
export type MatrixPreset = 'identity' | 'camera' | 'turn';

export function matrixPreset(preset: MatrixPreset, shape: FieldShape): number[] {
  if (preset === 'identity') return identity(shape);
  if (preset === 'turn') return rotationY(Math.PI / 6, shape);
  if (shape.columns === 4 && shape.rows === 4) return lookAtOrigin([2, 1.5, 3]);
  // A camera is a 4x4 idea; a smaller matrix gets the upper-left block of one.
  const full = lookAtOrigin([2, 1.5, 3]);
  const out: number[] = [];
  for (let c = 0; c < shape.columns; c++)
    for (let r = 0; r < shape.rows; r++) out.push(full[c * 4 + r] ?? 0);
  return out;
}

// ── Storage ─────────────────────────────────────────────────────────────────

/** The generated contents a reader can start a storage buffer from. */
export type StoragePattern = 'ramp' | 'sine' | 'random' | 'ones' | 'zeros';

export const STORAGE_PATTERNS: readonly StoragePattern[] = [
  'ramp',
  'sine',
  'random',
  'ones',
  'zeros',
];

/** One element's value under a pattern, for element `i` of `length`. */
export function patternValue(
  pattern: StoragePattern,
  i: number,
  length: number,
  integer: boolean,
): number {
  let v: number;
  switch (pattern) {
    case 'ramp':
      v = integer ? i : i / Math.max(1, length - 1);
      break;
    case 'sine':
      v = Math.sin((i / Math.max(1, length)) * Math.PI * 4);
      if (integer) v = Math.round((v + 1) * 8);
      break;
    case 'random':
      v = lattice(i, 0, 1 << 30, 7);
      if (integer) v = Math.floor(v * 16);
      break;
    case 'ones':
      v = 1;
      break;
    case 'zeros':
      v = 0;
      break;
  }
  return v;
}
