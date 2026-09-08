# typeshade.dev

The TypeShade website. Astro, deployed to GitHub Pages by `.github/workflows/deploy.yml`.

The compiler is vendored at `vendor/shader-dsl` as a git submodule of
[typeshade/typeshade](https://github.com/typeshade/typeshade). Every code sample and every
number on the page is computed from that checkout at build time (`src/lib/examples.ts`), and
the shaders on the page are emitted from it (`src/lib/hero-shader.ts`).

```bash
git clone --recurse-submodules https://github.com/typeshade/typeshade.github.io
bun install
bun run dev
```

To move the pinned compiler forward: `git -C vendor/shader-dsl pull origin main`, then commit
the submodule pointer. If a measured number changes, `src/lib/examples.ts` stops the build and
asks you to update the copy.

## Routes

| Route | What it is |
| --- | --- |
| `/` | the front page, about 350 words |
| `/motivation`, `/checks`, `/examples` | the longer material the front page links to |
| `/ko/`, `/ko/motivation`, `/ko/checks`, `/ko/examples` | the same four pages in Korean; see DESIGN.md, Languages |
| `/404.html` | not found |
| `/llms.txt` | a plain-text summary generated from the same records as the page |
| `/og/` | the social card. Only exists so `scripts/capture-og.ts` can photograph it; removed from `dist/` on every build |

## Generated files

`public/og.png`, the three icons and `public/stills/*.png` are generated and committed with a
`.sha256` beside each. The build checks the hashes and never launches a browser. Regenerate
them when the mark, the fonts, the social-card wording in `src/lib/hero-copy.ts` or a mounted
shader changes:

| Command | Writes |
| --- | --- |
| `bun run build:icons` | `mask-icon.svg`, `favicon.ico`, `apple-touch-icon.png`, from `public/favicon.svg` |
| `bun run capture:stills` | one rendered frame per mounted example, shown under each canvas |
| `bun run capture:og` | `public/og.png`, a screenshot of `/og/` |
| `bun run capture` | all three, in that order |

The capture scripts use Playwright, which is not a dependency of this site. Point them at an
installation:

```bash
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM=/path/to/chrome \
  bun run capture
```

## Checks

- `bun run check:style` runs at the start of every build. It flags the writing patterns
  listed in `DESIGN.md`.
- `bun run qa:links` resolves every off-site URL in `dist/`. A 404 or 410 fails the deploy;
  a 403, 429 or timeout only warns, because a rate-limited runner cannot tell a dead URL from a
  live one.

`DESIGN.md` is the one document about how the page is written and designed.
