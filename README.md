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
| `/` | the front page: the headline, the live shader, three points, Quick start, Status |
| `/guide/introduction/`, `/guide/quick-start/` | why one source, and the install and first shader |
| `/guide/authoring/` | the authoring guide, rendered from `vendor/shader-dsl/AUTHORING.md` at the pinned commit |
| `/guide/checks/`, `/guide/examples/` | what CI runs, and the examples |
| `/ko/…` | the same pages in Korean; the authoring guide's body stays English. See DESIGN.md, Languages |
| `/motivation/`, `/checks/`, `/examples/`, `/guide/` | the first routes; they redirect |
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
| `bun run build:fonts` | `ibm-plex-sans-kr-400.woff2`, `-600.woff2` and their sidecar: IBM Plex Sans KR subset to the KS X 1001 syllables plus every character the translated copy uses. Needs `pip install fonttools brotli`. The build fails if the Korean copy uses a character the subset lacks |

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
- `bun run check:copy` runs next. Every translated string is compared with its English one:
  the same numerals, link keys and code spans; no label wider than about 1.35 times the
  English label it replaces; and none of the translation tells the
  [im-not-ai](https://github.com/epoko77-ai/im-not-ai) rulebook makes countable.
- The build then clears `node_modules/.astro`, where Astro caches the rendered guide, so a
  change to `src/lib/remark-package-name.mjs` always reaches `dist/`.
- `bun run qa:links` resolves every off-site URL in `dist/`. A 404 or 410 fails the deploy;
  a 403, 429 or timeout only warns, because a rate-limited runner cannot tell a dead URL from a
  live one.
- `bun run qa:seo` reads every page in `dist/`: title and description lengths, canonical and
  sitemap agreement, alternates, one `h1`, `alt` on every image, `noindex` on the 404 only, and
  no internal link without a trailing slash.
- `bun run qa:openseo` crawls `dist/` with the site-audit engine of
  [OpenSEO](https://github.com/every-app/open-seo), checked out at a pinned commit under
  `node_modules/.cache`, serving the files the way GitHub Pages does. A warning or critical
  issue fails the deploy.

`DESIGN.md` is the one document about how the page is written and designed. `.claude/skills/typeshade-site/SKILL.md`
is the working procedure for changing copy, layout or the Korean dictionary with Claude Code.
