// The pictures the Playground binds to a texture it has no image for, as RGBA8 texels, and the
// depth ramp a depth texture starts from. Pure functions with no imports: the Playground draws
// from them (src/lib/shader-bindings.ts), and a project the Playground downloads carries this
// file as it is, as `src/textures.ts` (src/lib/project-export.ts), so the texels a reader sees
// on the site and in their own project are made by the same code.

/** The texture dimensions reflect() reports, in WebGPU's own spelling. */
export type TextureDim = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d' | '2d-ms';

/** The built-in pictures a reader can bind to a texture, and `image` for one they dropped in. */
export type TextureSource = 'checker' | 'gradient' | 'noise' | 'solid' | 'faces' | 'image';

// ── Texels ──────────────────────────────────────────────────────────────────

/** The side a generated texture is made at, by dimension. Small enough to upload on every
 *  edit, large enough that a checker still reads as one under a filter. */
export function textureSize(dim: TextureDim): { width: number; height: number; layers: number } {
  switch (dim) {
    case '1d':
      return { width: 128, height: 1, layers: 1 };
    case '3d':
      return { width: 16, height: 16, layers: 16 };
    case 'cube':
      return { width: 64, height: 64, layers: 6 };
    case 'cube-array':
      return { width: 64, height: 64, layers: 12 };
    case '2d-array':
      return { width: 64, height: 64, layers: 4 };
    case '2d-ms':
    case '2d':
      return { width: 128, height: 128, layers: 1 };
  }
}

/** One colour per cube face, in WebGPU's face order (+X, -X, +Y, -Y, +Z, -Z), each the axis
 *  colour a graphics reader expects: red for X, green for Y, blue for Z, and the complement
 *  on the negative side. */
const FACE_COLOURS: readonly (readonly [number, number, number])[] = [
  [230, 60, 60],
  [60, 200, 200],
  [70, 190, 70],
  [200, 70, 200],
  [70, 110, 230],
  [220, 200, 60],
];

/** A hash of two lattice coordinates to 0..1, periodic in `period`, so the noise tile wraps
 *  with no seam under a repeat sampler. */
export const lattice = (x: number, y: number, period: number, seed: number): number => {
  const xi = ((x % period) + period) % period;
  const yi = ((y % period) + period) % period;
  let h = (xi * 374761393 + yi * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

/** Value noise over a periodic lattice, two octaves, in 0..1. */
const noiseAt = (u: number, v: number, seed: number): number => {
  let sum = 0;
  let weight = 0;
  for (const [period, amp] of [
    [8, 0.65],
    [16, 0.35],
  ] as const) {
    const x = u * period;
    const y = v * period;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = lattice(x0, y0, period, seed);
    const b = lattice(x0 + 1, y0, period, seed);
    const c = lattice(x0, y0 + 1, period, seed);
    const d = lattice(x0 + 1, y0 + 1, period, seed);
    sum += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
    weight += amp;
  }
  return sum / weight;
};

/** The RGBA8 texels of one layer of a generated texture. `layer` changes the picture a little
 *  per layer, so an array or a 3d texture shows which layer the shader read. `solid` is the
 *  colour a solid source fills with, 0 to 1 per channel. */
export function generateTexels(
  source: Exclude<TextureSource, 'image'>,
  width: number,
  height: number,
  layer: number,
  layers: number,
  solid: readonly number[] = [1, 1, 1, 1],
): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(width * height * 4);
  const t = layers > 1 ? layer / (layers - 1) : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      let r = 0;
      let g = 0;
      let b = 0;
      if (source === 'checker') {
        // A UV checker: the squares alternate light and dark, and the light ones are tinted by
        // where they sit, red across u and green down v, so a flipped axis shows at a glance.
        const on = (Math.floor(u * 8) + Math.floor(v * 8)) % 2 === 0;
        const base = on ? 1 : 0.22;
        r = base * (0.35 + 0.65 * u);
        g = base * (0.35 + 0.65 * v);
        b = base * (0.35 + 0.65 * t);
      } else if (source === 'gradient') {
        r = u;
        g = v;
        b = layers > 1 ? t : 1 - u;
      } else if (source === 'noise') {
        const n = noiseAt(u, v, layer + 1);
        r = n;
        g = n;
        b = n;
      } else if (source === 'solid') {
        r = solid[0] ?? 1;
        g = solid[1] ?? 1;
        b = solid[2] ?? 1;
      } else {
        // One colour per face, with a faint grid so the face's orientation reads too.
        const [fr, fg, fb] = FACE_COLOURS[layer % 6]!;
        const line =
          Math.min(Math.abs(((u * 4) % 1) - 0.5), Math.abs(((v * 4) % 1) - 0.5)) > 0.45 ? 0.7 : 1;
        r = (fr / 255) * line;
        g = (fg / 255) * line;
        b = (fb / 255) * line;
      }
      const at = (y * width + x) * 4;
      out[at] = Math.round(Math.min(1, Math.max(0, r)) * 255);
      out[at + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
      out[at + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
      out[at + 3] =
        source === 'solid' ? Math.round(Math.min(1, Math.max(0, solid[3] ?? 1)) * 255) : 255;
    }
  }
  return out;
}

/** A depth ramp for one layer: 0 at the top left corner, 1 at the bottom right, shifted a
 *  little per layer. A comparison against it is a diagonal edge, which is the picture a
 *  shadow lookup should give. */
export function depthRamp(
  width: number,
  height: number,
  layer: number,
  layers: number,
): Float32Array<ArrayBuffer> {
  const out = new Float32Array(width * height);
  const shift = layers > 1 ? (layer / layers) * 0.2 : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      out[y * width + x] = Math.min(1, Math.max(0, (u + v) * 0.5 + shift));
    }
  }
  return out;
}
