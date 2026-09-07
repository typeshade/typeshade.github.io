// The TypeShade mark — one stroke in, two identical strokes out (design §9).
//
// `public/favicon.svg` is the ONE source: every raster, `mask-icon.svg` and the two inline
// copies below are generated from — or asserted against — it. This record exists so the two
// places that draw the mark INLINE (the nav wordmark and the /og/ card) read the same path
// instead of hand-copying it a second and third time, and `scripts/build-icons.ts` asserts
// this record against the SVG on disk, so the constant cannot drift from the source it
// claims to mirror.
export const MARK = {
  viewBox: '0 0 32 32',
  /** Stroke 3.5/32 → 1.75 px at 16 px, the thinnest stroke that survives a tab strip. */
  strokeWidth: 3.5,
  /** One stroke in (7 → 14), two arms out, both 12.5 units, both terminating at x = 24. */
  d: 'M7 16H14M14 16L24 8.5M14 16L24 23.5',
} as const
