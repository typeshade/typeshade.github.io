import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'
import { verifyArtifacts } from './scripts/artifacts.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))

// typeshade.dev — static site, deployed to GitHub Pages from .github/workflows/deploy.yml.
// The compiler is consumed the documented way: vendor/shader-dsl is the read-only mirror
// (typeshade/typeshade) as a git submodule, and every code sample on the page is EMITTED
// at build time from it — the page shows the transform, not a description of it.
//
// Design-system §5's expressiveCode block moved to `ec.config.mjs` when it gained a renderer
// hook: EC's `<Code>` component serialises this file's options to JSON, so a function here
// fails the build. Nothing else about that block changed.
export default defineConfig({
  site: 'https://typeshade.dev',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    // og.png and the three icons are GENERATED (design §9) and committed with a .sha256 each.
    // Their capture scripts are 3-5 s of headless browser and run OUTSIDE the build; this
    // asserts the committed bytes instead — ~5 ms — so a stale or hand-edited artifact fails
    // the build rather than shipping. OG_REBASELINE=1 / ICONS_REBASELINE=1 is the one way past.
    {
      name: 'typeshade:artifact-hashes',
      hooks: { 'astro:build:start': () => verifyArtifacts(root) },
    },
    // `/og/` is a build-time INSTRUMENT, not a page (design §10: "deleted from dist/ after
    // capture"). `capture-og.ts` already removes it when it has taken its photograph — but a
    // plain `bun run build`, which is what deploy.yml uploads, never runs that script, so the
    // route was shipping: an orphan card with no nav, no footer and no way back, reachable at
    // typeshade.dev/og/. It leaves every build the same way now. `OG_REBASELINE=1` is the one
    // build that keeps it, because that is the build the capture is about to photograph.
    {
      name: 'typeshade:og-route',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          if (process.env.OG_REBASELINE === '1') return
          rmSync(fileURLToPath(new URL('og/', dir)), { recursive: true, force: true })
          logger.info('dist/og/ removed — the OG route is a capture instrument, not a page')
        },
      },
    },
    // Design §5's Expressive Code block lives in `ec.config.mjs` (see its header for why).
    expressiveCode(),
    sitemap({
      // R-12 / NFR-8: `/og/` is a build-time instrument, not a page — it exists so
      // `scripts/capture-og.ts` can photograph a real composited hero frame (R-13), and the
      // capture deletes it from `dist/` afterwards. It is `noindex` at the document level and
      // absent from the sitemap here, which are two independent guarantees rather than one.
      // `/spike` needs no rule: it was deleted.
      filter: (page) => new URL(page).pathname.replace(/\/$/, '') !== '/og',
    }),
  ],
  vite: { plugins: [tailwindcss()] },
})
