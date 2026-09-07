# typeshade.dev

The TypeShade website, deployed to GitHub Pages by `.github/workflows/deploy.yml`.

The compiler is consumed the documented way: `vendor/shader-dsl` is the read-only mirror
[typeshade/typeshade](https://github.com/typeshade/typeshade) as a git submodule, and every
code sample and every number on the page is computed at build time from it. Nothing on the page
is a typed number: `src/lib/examples.ts` measures the mirror, `src/lib/hero-shader.ts` emits the
shaders, and a measurement that stops matching what the copy was written against fails the
build rather than quietly restating a different fact.

```bash
git clone --recurse-submodules https://github.com/typeshade/typeshade.github.io
bun install
bun run dev
```

To move the pinned compiler forward: `git -C vendor/shader-dsl pull origin main`, then commit
the submodule pointer.

## Routes

| Route | What it is |
| --- | --- |
| `/` | the page — `Nav · Hero · Rail · write · recognise · agree · types · precision · adopt · Footer` |
| `/404.html` | not-found, rendering the hero's own CTA record |
| `/llms.txt` | generated from the same `facts` and CTA records the page renders from; every numeral in it must appear in `facts` with the same value, or the build fails |
| `/og/` | **not a page** — the 1200 × 630 composition `scripts/capture-og.ts` photographs. `noindex`, excluded from the sitemap, and removed from `dist/` by the capture |

## Generated artifacts

`public/og.png` and the three icons are **generated, never authored**, each committed beside a
`.sha256`. `bun run build` asserts those hashes (~5 ms) and never runs a capture — a headless
launch is 3–5 s against the 8 s build budget, and the Pages deploy builds from the committed
bytes. A stale or hand-edited artifact therefore fails the build instead of shipping.

| Command | Writes |
| --- | --- |
| `bun run build:icons` | `mask-icon.svg`, `favicon.ico` (32 × 32), `apple-touch-icon.png` (180 × 180) — all rasterised from `public/favicon.svg`, the one source, which it also asserts `src/lib/mark.ts` still describes |
| `bun run capture:og` | `public/og.png` — builds with `OG_REBASELINE=1`, serves `dist/` on loopback, and captures `/og/` on the reduced-motion pinned-clock path. It asserts WebGPU drew the frame, that exactly one frame was drawn, and that the composition resolved to its specified geometry before the shutter |
| `bun run capture` | both, in that order |

`bun run qa:links` resolves every off-site URL in `dist/` (copy deck §11's *verified 200 at
build*) and is a step of `deploy.yml` after the build: a 404 or 410 fails it, while a 403, 429
or timeout only warns, because a rate-limited CI runner cannot tell a dead URL from a live one.
The other QA instruments in `scripts/qa/` drive a real headless browser and are run by hand;
each one's header states what it measures and the traps that measurement has already paid for.

Both use Playwright, which is deliberately **not** a dependency of this site — it would put a
browser download into every `bun install` for two scripts that run when the mark or the hero
changes. Name the installation and the browser instead:

```bash
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM=/path/to/chrome-linux/headless_shell \
  bun run capture
```

`OG_REBASELINE=1` / `ICONS_REBASELINE=1` are the one deliberate way past a hash mismatch; the
failure prints both hashes and names the command that regenerates the file.

## Where the specification lives

`docs/design/` holds the documents the build is written from, in authority order: the brief, the
IA and wireframe, the spike reports, the design system (tokens, components, QA gates) and the
copy deck, which is the copy of record for every string on the page.
