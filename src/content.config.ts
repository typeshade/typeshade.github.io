// The authoring guide is the compiler's own AUTHORING.md, read from the vendored checkout at
// the pinned commit, so the site never carries a copy that can drift from it. The file is one
// long document, so the loader stores one entry per top-level section and the site gives each
// section a page. Astro caches the store in node_modules/.astro, which the build script clears.
import { readFileSync } from 'node:fs'
import { defineCollection } from 'astro:content'
import type { Loader } from 'astro/loaders'
import { z } from 'astro/zod'
import { authoringSections } from './lib/authoring.ts'

const FILE = 'vendor/shader-dsl/AUTHORING.md'
const SECTIONS_MIN = 10

const authoring: Loader = {
  name: 'authoring-guide',
  load: async ({ store, renderMarkdown, logger }) => {
    const sections = authoringSections(readFileSync(FILE, 'utf8'))
    if (sections.length < SECTIONS_MIN) throw new Error(`[guide] ${sections.length} sections in ${FILE}; the guide changed shape`)
    store.clear()
    for (const { id, title, order, sourceLine, description, body } of sections) {
      const data = { title, order, sourceLine, description }
      store.set({ id, data, body, rendered: await renderMarkdown(body) })
    }
    logger.info(`${sections.length} sections from ${FILE}`)
  },
}

export const collections = {
  guide: defineCollection({
    loader: authoring,
    schema: z.object({
      title: z.string(),
      /** The section's place in AUTHORING.md, which the sidebar and the pager follow. */
      order: z.number(),
      sourceLine: z.number(),
      /** The opening sentences, where the section has prose to take them from. */
      description: z.string().optional(),
    }),
  }),
}
