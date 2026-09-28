# typeshade.dev on Cloudflare

The site is two things with two clocks:

- **The build.** `bun run build` turns the pinned compiler into `dist/`: every page, every
  example with its still, its goldens and both languages' words, checked against each other. A
  mismatch stops it, which is what keeps a built page true, and it moves when the pin moves.
- **The example data.** `scripts/publish-examples.ts` reads the compiler's examples at its
  `main`, gives each the site's words where the dictionaries have them, and uploads a release to
  R2. It fails soft where the build fails hard, and it moves when the compiler does.

A Cloudflare Worker serves both from one origin, so an example merged upstream is on the site
within the hour, before the pin bump and the build that make it a built page.

## What serves what

| Path                                         | Served by                                                             |
| -------------------------------------------- | --------------------------------------------------------------------- |
| everything in `dist/`                        | Workers static assets; the Worker never runs                          |
| `/api/examples/`                             | the Worker: the current release's index (`ReleaseIndex`)              |
| `/api/examples/<id>/`                        | the Worker: one example with its file and its emitted text            |
| `/api/releases/`                             | the Worker: the releases D1 records, newest first                     |
| `/guide/examples/<id>/`, `/ko/...` built     | the static page, through the Worker                                   |
| `/guide/examples/<id>/`, `/ko/...` not built | the Worker: the template page, filled in from the release (see below) |

`wrangler.jsonc` binds three things to the Worker (`worker/index.ts`):

- `ASSETS`: `dist/`.
- `DATA`: the R2 bucket `typeshade-data`. A release is `releases/<release>/index.json` and
  `releases/<release>/examples/<id>.json`, shaped by `src/lib/example-data.ts`.
- `DB`: the D1 database `typeshade`. `releases` is the history and
  `settings.current_release` names the release the Worker serves
  (`worker/migrations/0001_releases.sql`).

## What a page does with the data

- **The gallery** (`/guide/examples/`) ends with a hidden section. `src/scripts/examples-runtime.ts`
  fetches the index and adds a tile for each example no tile on the page links to yet.
- **An example's page.** The build also renders `/guide/examples/runtime-example/`, a template:
  `ExamplePage.astro` with the dictionary's stand-in words, both corpora's halves, `noindex`
  and out of the sitemap and the search index. For an example the build does not have, the
  Worker serves that page through `HTMLRewriter`: the title, the meta description, the
  canonical and alternate URLs, the heading, the line under it, the file, and either the
  Playground seeded with the file (a `.shade.ts` example) or the source and emitted tabs (an
  `fn()` example). The template itself answers 404.
- **The Playground** adds the release's `.shade.ts` examples it does not have to its picker, in
  a group of their own, so `#example=<id>` opens one.

Without the Worker (`astro dev`, `astro preview`, GitHub Pages), `/api/` does not answer JSON
and every page shows what its build has.

A page filled in from the data compiles in the reader's browser with the compiler the build
pinned. A new example that needs a compiler change the pin does not have yet shows that
compiler's diagnostics until the pin moves. The emitted tabs of an `fn()` example are the
compiler's own goldens at the published commit, so they are right either way.

## Publishing a release

`.github/workflows/publish-examples.yml` runs at :23 and :53 every hour, on
`repository_dispatch: compiler-updated`, and by hand (Actions > publish-examples > Run
workflow, with a compiler ref). By hand, from a checkout with the Cloudflare variables set:

```bash
git -C vendor/shader-dsl fetch origin main && git -C vendor/shader-dsl checkout FETCH_HEAD
bun scripts/publish-examples.ts read      # the examples, at the compiler's main
git submodule update vendor/shader-dsl
bun scripts/publish-examples.ts words     # the site's words and page meta, at the pin
bun scripts/publish-examples.ts upload    # R2, then settings.current_release in D1
```

A release is named `<compiler commit>-<site commit>`, so a run whose two commits have not moved
uploads nothing (`--force` uploads anyway). To go back to an earlier release:

```bash
bunx wrangler d1 execute typeshade --remote \
  --command "UPDATE settings SET value = '<release>' WHERE key = 'current_release'"
```

The Worker reads the pointer at most once a minute, and `/api/` answers carry a minute of
edge cache.

## Deploying

`deploy.yml`'s `cloudflare` job deploys `dist/` and the Worker on every push to `main`
(`wrangler d1 migrations apply`, then `wrangler deploy`), and `cloudflare-preview` uploads a
version of each pull request under a preview URL of its own (the job summary has it). Until the
domain moves, the Pages steps keep publishing to GitHub Pages as before.

The jobs need five repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and for
R2's S3 API `CLOUDFLARE_ACCESS_KEY_ID`, `CLOUDFLARE_SECRET_ACCESS_KEY`,
`CLOUDFLARE_S3_API_ENDPOINT`. `scripts/cloudflare-setup.ps1` sets them, and moves the domain.

The API token needs: Workers Scripts edit, Workers R2 Storage edit, D1 edit, and, for the
domain, Workers Routes edit and DNS edit on the `typeshade.dev` zone.

## Moving the domain

`typeshade.dev` is proxied by Cloudflare to GitHub Pages today. Once the Worker answers on its
`workers.dev` URL, the domain moves in one step: attach `typeshade.dev` to the Worker as a
custom domain (Workers > typeshade-site > Settings > Domains & Routes, or the script above),
which replaces the DNS record that points at GitHub Pages. Then the Pages steps in
`deploy.yml` and `public/CNAME` can go, in a pull request of their own.

## Locally

```bash
bun run build
bunx wrangler d1 migrations apply typeshade --local
bunx wrangler dev          # http://localhost:8787, with a local D1 and R2
```

`wrangler dev` starts with an empty local bucket and database; put a release in them with
`wrangler r2 object put --local` and `wrangler d1 execute --local`, or run it with `--remote`
against the real ones.
