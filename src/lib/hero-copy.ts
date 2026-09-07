// The hero's headline and subline — 07-copy-deck.md §3, and the two places that set them.
//
// Each is a fixed pair of BLOCK SPANS, never left to the wrapping engine: `font-display:
// optional` can serve the metric-matched fallback permanently, and a break that moves between
// font states makes INV-1 a hope instead of a check (design §3, §10 G3).
//
// It lives here rather than in `Hero.astro` because the /og/ card sets the same two lines at
// 64 px (design §9) — one authority, so the card and the page can never disagree about where
// the headline breaks, and INV-1 is asserted against the same strings on both.
export const heroCopy = {
  /** `Write the shader` measures 541.5 px at 72/600/−0.03em → 481.3 at the card's 64 (§5, §9). */
  h1: ['Write the shader', 'once.'],
  /** Breaks at the colon: 334.9 px and 402.5 px against 743.3 on one line (§5). */
  sub: ['Typed TypeScript, proven to agree:', 'WGSL and GLSL ES 3.00 from one source.'],
} as const

/** The hero mount's copy — deck §6's hero row over IA §6's backend-neutral server string.
 *  The stem is what the SERVER renders and is true on every path including the one where the
 *  script never runs; each state appends what actually happened. On `none` the sentence is the
 *  deck's own (X9): a missing backend prints the build-time fact instead of apologising about
 *  the visitor's hardware. The /og/ card mounts the same `metaballs` specimen, so it reads the
 *  same record rather than inventing a second set of strings for a frame nobody reads. */
const STEM = 'Compiled at build time from one typed source'
export const heroCaption = {
  neutral: `${STEM}.`,
  webgpu: `${STEM} — running live on WebGPU.`,
  webgl2: `${STEM} — running live on WebGL2.`,
  reduced: `${STEM}. Still frame — motion reduced by your system setting.`,
  none: 'Neither WebGPU nor WebGL2 here — the shaders on this page were still emitted at build time.',
}
