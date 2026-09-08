// The wording on the social card at /og/. The front page writes its own prose.
import { facts } from './examples.ts'

export const heroCopy = {
  h1: 'TypeShade',
  sub: `A TypeScript library for writing shaders. One typed module emits WGSL for WebGPU and ${facts.glslTarget} for WebGL2, and the same module runs on the CPU in double precision.`,
} as const
