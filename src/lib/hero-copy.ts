// The headline and subline, shared by the front page and the social card.
export const heroCopy = {
  h1: 'One shader source for WebGPU and WebGL2.',
  sub: 'TypeShade is a TypeScript library for writing shaders. You write a shader once, with types, and it emits WGSL and GLSL ES 3.00. The same source also runs on the CPU in double precision, so the two GPU outputs can be checked against it.',
} as const

/** Captions for a mount, by what actually drew the frame. */
export const heroCaption = {
  neutral: 'Metaballs, compiled from one TypeScript source.',
  webgpu: 'Metaballs, compiled from one TypeScript source. Running on WebGPU.',
  webgl2: 'Metaballs, compiled from one TypeScript source. Running on WebGL2.',
  reduced: 'Metaballs, compiled from one TypeScript source. Still frame, because your system asks for reduced motion.',
  none: 'Metaballs, compiled from one TypeScript source. This browser has no WebGPU or WebGL2, so this is the frame rendered at build time.',
}
