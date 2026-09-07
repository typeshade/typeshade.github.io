import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import expressiveCode from 'astro-expressive-code'

// typeshade.dev — static site, deployed to GitHub Pages from .github/workflows/deploy.yml.
// The compiler is consumed the documented way: vendor/shader-dsl is the read-only mirror
// (typeshade/typeshade) as a git submodule, and every code sample on the page is EMITTED
// at build time from it — the page shows the transform, not a description of it.
export default defineConfig({
  site: 'https://typeshade.dev',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    expressiveCode({
      themes: ['github-dark-default'],
      styleOverrides: {
        borderRadius: '10px',
        borderColor: '#1f2830',
        codeFontFamily: "'Geist Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
        codeFontSize: '12.5px',
        codeLineHeight: '1.55',
        frames: { shadowColor: 'transparent', editorActiveTabIndicatorTopColor: '#7dd3fc' },
      },
      defaultProps: { wrap: false },
    }),
    sitemap(),
  ],
  vite: { plugins: [tailwindcss()] },
})
