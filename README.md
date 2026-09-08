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
| `/` | the front page: the headline, the release pill, the live shader, the authored fragment beside the WGSL it emits, three points |
| `/guide/introduction/`, `/guide/quick-start/` | why one source, and the install and first shader |
| `/guide/authoring/`, `/guide/authoring/<section>/` | the authoring guide, rendered from `vendor/shader-dsl/AUTHORING.md` at the pinned commit, one page per section: the overview, then a page for each `##` heading. The first mention of a public export in inline code becomes a link to its reference page (`src/lib/remark-api-links.mjs`) |
| `/guide/checks/`, `/guide/examples/` | how the compiler is verified, and a table of every example in the registry |
| `/api/` | the API reference's index: every category with the number of exports in it |
| `/api/<category>/` | one category's index: every export in it, alphabetically, with its summary |
| `/api/<export>/` | one public export, on MDN's page shape. Generated from the compiler's own source at the pinned commit (`src/lib/api.ts`), so the reference moves only when the submodule does. `bun run check:api` prints the categories and their counts and fails on an export with no documentation or a slug that its name and kind did not ask for |
| `/ko/…` | the same pages in Korean. The authoring guide's sections are translated by hand in `content/guide/ko/`, one file per section, each recording the hash of the English it was translated from; a section without a file shows the English body under a note. See DESIGN.md, Languages |
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

`bun run build` ends by running [Pagefind](https://pagefind.app) over `dist/`, which writes
the search index and the search UI into `dist/pagefind/`. It runs on every build, in CI too,
so none of it is committed. Pagefind reads the elements marked `data-pagefind-body` in the
layouts and keeps one index per `html lang`.

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
- `bun run check:api` reads the reference out of the compiler before it reaches a page: an
  export with no documentation, a slug two exports share or that its name and kind did not
  ask for, an export with no category, a category with no exports, a Targets table under its
  floor, or a text that names a consumer fails it. The build runs it after `check:copy`.
- `bun run check:guide` runs after it: every translated guide section against its English source at the pinned commit (the same code blocks, code spans, numerals, links and headings; Korean register and the translation tells), and the build stops if a file was translated from an older English (its recorded hash no longer matches).
- `bun run check:copy` runs next. Every translated string is compared with its English one:
  the same numerals, link keys and code spans; no label wider than about 1.35 times the
  English label it replaces; and none of the translation tells the
  [im-not-ai](https://github.com/epoko77-ai/im-not-ai) rulebook makes countable.
- The build then clears `node_modules/.astro`, where Astro caches the rendered guide and the
  reference, so a change to `src/lib/remark-package-name.mjs` or
  `src/lib/remark-api-links.mjs` always reaches `dist/`.
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
