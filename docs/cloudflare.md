# typeshade.dev on Cloudflare

The site is two things with two clocks:

- **The build.** `bun run build` turns the pinned compiler into `dist/`: every page, every
  example with its still, its goldens and both languages' words, checked against each other. A
  mismatch stops it, which is what keeps a built page true, and it moves when the pin moves.
- **The example data.** `scripts/publish-examples.ts` reads the compiler's examples at its
  `main`, gives each the site's words where the dictionaries have them, and uploads a release to
  R2. It fails soft where the build fails hard, and it moves when the compiler does.

A Cloudflare Worker serves both from one origin, so an example merged upstream is on the site
within the hour, before the pin bump and the build that make it a built page. It also opens the
issues a reader files from the site with no GitHub account (Issues, below).

## What serves what

| Path                                         | Served by                                                             |
| -------------------------------------------- | --------------------------------------------------------------------- |
| everything in `dist/`                        | Workers static assets; the Worker never runs                          |
| `/data/examples/`                            | the Worker: the current release's index (`ReleaseIndex`)              |
| `/data/examples/<id>/`                       | the Worker: one example with its file and its emitted text            |
| `/data/releases/`                            | the Worker: the releases D1 records, newest first                     |
| `/data/shares/` (POST)                       | the Worker: stores a Playground link in D1, answers its short link    |
| `/data/shares/<id>/`                         | the Worker: a share's page, views, and when it was made and opened    |
| `/data/gallery/`                             | the Worker: GET the approved entries; POST sends a share in, pending  |
| `/data/notice/`                              | the Worker: the notice over every page, or null                       |
| `/data/issues/` (GET)                        | the Worker: whether the issue dialog can open an issue here           |
| `/data/issues/` (POST)                       | the Worker: opens the dialog's issue on GitHub, answers its number    |
| `/data/issue-images/<name>`                  | the Worker: an image an issue shows, from R2                          |
| `/s/<id>/`                                   | the Worker: a redirect to the page and fragment the share stored      |
| `/guide/examples/<id>/`, `/ko/...` built     | the static page, through the Worker                                   |
| `/guide/examples/<id>/`, `/ko/...` not built | the Worker: the template page, filled in from the release (see below) |

`wrangler.jsonc` binds three things to the Worker (`worker/index.ts`):

- `ASSETS`: `dist/`.
- `DATA`: the R2 bucket `typeshade-data`. A release is `releases/<release>/index.json` and
  `releases/<release>/examples/<id>.json`, shaped by `src/lib/example-data.ts`; the images the
  issues show are under `issue-images/`.
- `DB`: the D1 database `typeshade`. `releases` is the history and
  `settings.current_release` names the release the Worker serves
  (`worker/migrations/0001_releases.sql`); `shares` holds the Playground's short links
  (`0002_shares.sql`), with how often each was opened (`0003_share_views.sql`); `submissions` is the gallery's
  queue (`0004_gallery.sql`); `notices` holds the notice over every page (`0005_notices.sql`);
  `issues` holds the issues the dialog opened (`0006_issues.sql`).

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
  short link it gets back, `typeshade.dev/s/<id>/`. It ends in a slash as every route does, so
  it opens in one redirect, not two. The id is the first eight characters of the SHA-256 of the
  two, so the same file shared twice is one row and one link; a different share that already
  holds those eight characters takes a longer id. The Worker takes only the Playground and an
  example's page, in either language, and a fragment that starts `code=`, of 64 KB at most;
  anything else, or no Worker, and Share copies the long link, which carries the whole file and
  opens with no service at all.
- **A short link's views.** Each open of `/s/<id>/` adds one to the share's `views` and sets
  `last_opened_at`, after the redirect is sent; the redirect is `no-store`, so a browser that
  opens it again is counted again. `/data/shares/<id>/` answers the count. A cron
  (`triggers.crons` in `wrangler.jsonc`, daily at 03:17 UTC) deletes the shares nobody has
  opened for a year (`SHARE_TTL_DAYS`); a link never opened counts from the day
  it was made. The shares most opened:

  ```bash
  bunx wrangler d1 execute typeshade --remote \
    --command "SELECT id, path, views, last_opened_at FROM shares ORDER BY views DESC LIMIT 20"
  ```

- **The gallery** (`/playground/gallery/`). Submit, beside Share in the Playground, asks for a
  title and, if the reader wants, a name, stores the file as a share and posts it to
  `/data/gallery/`, where it waits as `pending`. The page lists the approved entries, the last
  approved first, each a card whose link is the share's short link. A title is at most 60
  characters and a name 40 (`GALLERY_TITLE_MAX` and `GALLERY_AUTHOR_MAX` in
  `src/lib/example-data.ts`); one address sends at most five in a day, counted by a hash of the
  address, which is never stored itself. A share sent to the gallery is never expired by the
  cron.

Without the Worker (`astro dev`, `astro preview`), `/data/` does not answer JSON
and every page shows what its build has.

A page filled in from the data compiles in the reader's browser with the compiler the build
pinned. A new example that needs a compiler change the pin does not have yet shows that
compiler's diagnostics until the pin moves. The emitted tabs of an `fn()` example are the
compiler's own goldens at the published commit, so they are right either way.

## The notice

A notice is one line under the header of every page, in the reader's language, changed with a
row in D1 and no build (`src/components/SiteNotice.astro`). The Worker serves the newest row
that is active and whose window holds the current time, and keeps that answer in the edge cache
for a minute, so a change shows within a minute. A reader who closes a notice does not see it
again in that browser; the next notice shows. Post one, with an optional link (a path on the site
or an `https://` address) and an optional window:

```bash
bunx wrangler d1 execute typeshade --remote --command \
  "INSERT INTO notices (text_en, text_ko, href, ends_at) VALUES ('TypeShade 0.1.0 is out.', 'TypeShade 0.1.0을 공개했습니다.', 'https://github.com/typeshade/typeshade/releases', '2026-10-31T00:00:00Z')"
```

Take it down, or list what is there:

```bash
bunx wrangler d1 execute typeshade --remote --command "UPDATE notices SET active = 0 WHERE active = 1"
bunx wrangler d1 execute typeshade --remote --command "SELECT id, text_en, href, starts_at, ends_at, active FROM notices ORDER BY id DESC"
```

## Reviewing the gallery

Nothing appears in the gallery until it is approved. The queue, oldest first, with the link
that opens each one:

```bash
bunx wrangler d1 execute typeshade --remote --command \
  "SELECT share_id, title, author, created_at FROM submissions WHERE status = 'pending' ORDER BY created_at"
```

Open `https://typeshade.dev/s/<share_id>/` to read the file, then approve it or turn it down:

```bash
bunx wrangler d1 execute typeshade --remote --command \
  "UPDATE submissions SET status = 'approved', reviewed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE share_id = '<share_id>'"
bunx wrangler d1 execute typeshade --remote --command \
  "UPDATE submissions SET status = 'rejected', reviewed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE share_id = '<share_id>'"
```

Setting an approved entry back to `rejected` takes it off the page within a minute (the list
carries a minute of edge cache). A title can be corrected the same way, with `SET title = ...`.

## Issues

Every "Report an issue" link opens a dialog on the page it is on: a title, a description if
the reader has one, images (a button, a paste or a drop), and Send (`IssueDialog.astro`,
`src/scripts/issue-dialog.ts`). Every documentation page has one beside Edit this page, and it
names the repository its text is written in (the compiler, `typeshade/typeshade`, or this
site); the footer's goes to the compiler, and so does the Playground's header. The page's
address goes along, and where the page holds a Playground, so does its program, as a chip the
reader can take out, in the fragment the way Share carries it. With no script, the link is
GitHub's own new-issue form.

The dialog asks `/data/issues/` whether the Worker can open an issue. Where it can, Send posts
multipart form data there. The Worker opens the issue on GitHub under the label `site form`
and answers its number, and the dialog links to it. The body starts with where it came from:
the dialog, the page, and the commit of the compiler the page was built from. The reader's
words follow, then the images, then the program: its short link (`/s/<id>/`), which the cron
then never expires, and each file.

GitHub's API takes no attachment, so the Worker keeps the images itself: in the `DATA` bucket
under `issue-images/`, named by their content, and served at `/data/issue-images/<name>` for a
year, which is where the issue shows them from. It takes PNG, JPEG, GIF and WebP, known by
their first bytes, up to 5 MB each and 4 to an issue (`ISSUE_IMAGE_BYTES`, `ISSUE_IMAGES_MAX`
in `src/lib/issue-data.ts`). An image stays when its issue is deleted; remove it by name:

```bash
bunx wrangler r2 object delete typeshade-data/issue-images/<name> --remote
```

The Worker holds the credential, so a reader needs no GitHub account:

- A GitHub App (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`) opens the issue as its bot. For each
  issue the Worker signs a JWT with the key and mints an installation token for that
  repository with Issues: write and nothing else, which it keeps until five minutes before it
  expires. The key can be the file GitHub downloads (`BEGIN RSA PRIVATE KEY`) or PKCS#8.
- Without an App, a fine-grained token (`GITHUB_TOKEN`) with Issues: Read and write on the two
  repositories opens it as the token's owner.

What stands between the dialog and GitHub:

- The request comes from the site itself (`Origin`), and a field hidden from people is empty.
- Five issues a day from one address and 20 from every reader together (`ISSUES_PER_ADDRESS`
  and `ISSUES_PER_DAY` in `worker/index.ts`), counted over the `issues` rows of the last day. An
  address is kept as a hash, the way the gallery keeps its senders.
- Cloudflare Turnstile, where the Worker holds `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
  The dialog loads the widget only then, and it shows itself only when it needs the reader to
  act.
- The same title, text and images sent twice are one issue: the row's id is a hash of them.
- A mention (`@name`) in the reader's words is set as code, so the dialog notifies nobody. A
  code fence the reader leaves open is closed and an HTML comment is written out as text, so
  neither hides the images and the program under them.

Where the Worker cannot open an issue (no credential, a pull request's preview version, `astro
dev` or `astro preview`), Send becomes Continue on GitHub and opens GitHub's own form in a new
tab, prefilled with what the reader wrote; images are added there. Where the Worker refuses or
GitHub does, the dialog says so and links the same form. A preview answers at workers.dev with
the production secrets, so it opens no issue at all: the Worker opens one only at
`typeshade.dev` and under `wrangler dev`.

Setting it up is the owner's (the Worker's secrets and the App are account settings):

1. Create the App: Organization settings > Developer settings > GitHub Apps > New GitHub App.
   Homepage `https://typeshade.dev/`, Webhook off, Repository permissions > Issues: Read and
   write, installable on this account only. Generate a private key (a `.pem` file downloads),
   then Install App on `typeshade` for the two repositories.
2. For Turnstile, which the dialog should have before it is announced: Cloudflare dashboard >
   Turnstile > Add widget, hostname `typeshade.dev`, Managed.
3. From a checkout, after `gh auth login` and `bunx wrangler login`, in PowerShell:

   ```powershell
   ./scripts/setup-issue-form.ps1 -AppId <App ID> -KeyFile <path to the .pem> -Turnstile
   ```

   It creates the `site form` label in both repositories and puts the secrets on the Worker
   (`wrangler secret put`), asking for the Turnstile keys at the prompt. The secrets take
   effect at once; the dialog opens issues from the first deploy that carries it.

The dialog's issues, newest first:

```bash
bunx wrangler d1 execute typeshade --remote \
  --command "SELECT repo, number, created_at FROM issues ORDER BY created_at DESC LIMIT 20"
```

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

The Worker has no `workers.dev` address of its own (`workers_dev: false` in `wrangler.jsonc`),
so no second copy of the site answers outside the domain. A pull request's preview version still
answers at `pr-<n>-typeshade-site.<account>.workers.dev` (`preview_urls: true`).

## Locally

```bash
bun run build
bunx wrangler d1 migrations apply typeshade --local
bunx wrangler dev          # http://localhost:8787, with a local D1 and R2
```

`wrangler dev` starts with an empty local bucket and database; put a release in them with
`wrangler r2 object put --local` and `wrangler d1 execute --local`, or run it with `--remote`
against the real ones.

The issue dialog reads its secrets from `.dev.vars`, which git ignores. `GITHUB_API_URL` there
points the Worker at a stand-in for `api.github.com`, so a local run files nothing:

```bash
GITHUB_TOKEN=test
GITHUB_API_URL=http://localhost:9999
```
