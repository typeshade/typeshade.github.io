// The authoring guide is the compiler's own AUTHORING.md, read from the vendored checkout at
// the pinned commit, so the site never carries a copy that can drift from it.
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

export const collections = {
  guide: defineCollection({ loader: glob({ pattern: 'AUTHORING.md', base: './vendor/shader-dsl' }) }),
}
