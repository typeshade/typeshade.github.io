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
| `/data/examples/`                            | the Worker: the current release's index (`ReleaseIndex`)              |
| `/data/examples/<id>/`                       | the Worker: one example with its file and its emitted text            |
| `/data/releases/`                            | the Worker: the releases D1 records, newest first                     |
| `/data/shares/` (POST)                       | the Worker: stores a Playground link in D1, answers its short link    |
| `/s/<id>`                                    | the Worker: a redirect to the page and fragment the share stored      |
| `/guide/examples/<id>/`, `/ko/...` built     | the static page, through the Worker                                   |
| `/guide/examples/<id>/`, `/ko/...` not built | the Worker: the template page, filled in from the release (see below) |

`wrangler.jsonc` binds three things to the Worker (`worker/index.ts`):

- `ASSETS`: `dist/`.
- `DATA`: the R2 bucket `typeshade-data`. A release is `releases/<release>/index.json` and
  `releases/<release>/examples/<id>.json`, shaped by `src/lib/example-data.ts`.
- `DB`: the D1 database `typeshade`. `releases` is the history and
  `settings.current_release` names the release the Worker serves
  (`worker/migrations/0001_releases.sql`); `shares` holds the Playground's short links
  (`0002_shares.sql`).

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

- **Share** in the Playground writes the file and its options into the page's fragment, as it
  always has, then posts the page's path and that fragment to `/data/shares/` and copies the
  short link it gets back, `typeshade.dev/s/<id>`. The id is the first eight characters of the
  SHA-256 of the two, so the same file shared twice is one row and one link; a different share
  that already holds those eight characters takes a longer id. The Worker takes only the
  Playground and an example's page, in either language, and a fragment that starts `code=`, of
  64 KB at most; anything else, or no Worker, and Share copies the long link, which carries the
  whole file and opens with no service at all.

Without the Worker (`astro dev`, `astro preview`), `/data/` does not answer JSON
and every page shows what its build has.

A page filled in from the data compiles in the reader's browser with the compiler the build
pinned. A new example that needs a compiler change the pin does not have yet shows that
compiler's diagnostics until the pin moves. The emitted tabs of an `fn()` example are the
compiler's own goldens at the published commit, so they are right either way.

## Headers

`public/_headers` sets the cache the static assets get: a year, immutable, for the files whose
names carry their content hash (`/_astro/`, Pagefind's fragments and index), and a week for the
fonts. Everything else keeps the asset handler's default, `max-age=0, must-revalidate`, so a
page is never older than the last deploy.

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

The Worker reads the pointer at most once a minute, and `/data/` answers carry a minute of
edge cache.

## Deploying

`deploy.yml`'s `cloudflare` job deploys `dist/` and the Worker on every push to `main`
(`wrangler d1 migrations apply`, then `wrangler deploy`), and `cloudflare-preview` uploads a
version of each pull request under a preview URL of its own (the job summary has it).

The jobs need one secret, `CLOUDFLARE_API_TOKEN`: the account is `account_id` in
`wrangler.jsonc`, and the publisher reaches R2 and D1 through the same API wrangler does. It is
an organization secret of `typeshade` shared with this repository (Organization settings >
Secrets and variables > Actions); a repository secret of the same name would do as well.

The API token needs: Workers Scripts edit, Workers R2 Storage edit, D1 edit, and, for the
domain, Workers Routes edit and DNS edit on the `typeshade.dev` zone.

## The domain

`typeshade.dev` is the Worker's custom domain (Workers > typeshade-site > Settings > Domains &
Routes). It moved from GitHub Pages on 2026-09-28: the A and AAAA records that pointed at
GitHub Pages were removed and the custom domain attached in their place. The
`_github-pages-challenge-typeshade` TXT record stays, since it keeps the domain verified to the
organization on GitHub.

## Locally

```bash
bun run build
bunx wrangler d1 migrations apply typeshade --local
bunx wrangler dev          # http://localhost:8787, with a local D1 and R2
```

`wrangler dev` starts with an empty local bucket and database; put a release in them with
`wrangler r2 object put --local` and `wrangler d1 execute --local`, or run it with `--remote`
against the real ones.
