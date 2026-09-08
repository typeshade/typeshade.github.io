# How typeshade.dev is written and designed

One page. Anyone editing the site, including an agent, reads this first. `bun run check:style`
enforces the parts that can be checked mechanically and runs at the start of every build.

## Voice

- Say what the tool does. The front page states what; a linked page explains how or why.
- The second sentence a reader meets carries a number.
- Short sentences. One idea per sentence. Plain verbs: "emits", "runs", "checks".
- Numbers come from the build (`src/lib/examples.ts`). A number that is not measured is not on the page.
- Do not praise the page or the tool. Words like "honest", "measured" and "proven" go. <!-- ok -->
- Do not write "X, not Y", "X, never Y", or "rather than". State X. <!-- ok -->
- No em dashes. Use a comma, a colon or a new sentence.
- No all-caps emphasis in prose or comments.
- No lists of three for rhythm. Use the number of items there are.
- Headings are short nouns in sentence case: Quick start, Motivation, Checks. A heading is
  never a slogan and never a full sentence.
- Comments in code say why in one or two lines. They do not cite design documents.

## Type

- Text: IBM Plex Sans (variable), self-hosted, latin subset. Korean: IBM Plex Sans KR 400 and 600.
- Code and identifiers: IBM Plex Mono 400 and 500.
- Body 16px / 1.65. h3 18px, h2 24px, h1 32 to 36px. The column holds about 72
  characters of prose.
- No uppercase labels, no tracked "eyebrow" lines above headings, no single-word labels <!-- ok -->
  under blocks, no "a · b · c" metadata strings. <!-- ok -->

## Colour

- Light by default; dark follows `prefers-color-scheme`, or the switch in the header, which
  is remembered in `localStorage`. Both palettes live in `src/styles/global.css` and nowhere
  else; the code themes follow through `ec.config.mjs`.
- One accent, TypeScript's blue (#3178c6), for links, the mark and the accent line of the
  front page's headline; one red for diagnostics. No colour gradients, no glows, no coloured
  card borders.
- Tailwind is kept only for its `@theme` tokens and preflight. No utility classes appear in
  the markup.

## Layout

- A full-width header bar (56px, one rule under it) and a full-width footer on a soft ground
  frame every page. Under 48rem the header's links, the language menu and the dark-mode switch
  sit in a panel behind a menu button.
- The front page is centred on a 960px measure: the name as the headline in the accent colour,
  the category line under it ("The verifiable TypeScript shader library", the way react.dev
  sets its one line under "React" and vuejs.org attaches "Progressive"), one sentence, three links, a pill with the release state, the live shader, the authored fragment beside the WGSL
  it emits, three short points. Get started is the one filled button (accent background, the
  way vuejs.org fills its own Get Started); Why TypeShade and Examples stay the plain surface
  button. Under 40rem the three links are a grid, Get started across the
  top; the two code frames stack under 48rem. The layout follows vuejs.org's front page.
- Every other page is one content column, 740px, left-aligned, with code blocks and figures at
  the same width. Sections are 48 to 56px apart.
- The one thing that should stand out is a rendered shader. Everything else is quiet.
- Every canvas has a still image underneath it, captured at build time
  (`bun run capture:stills`), so the page never shows an empty frame.
- The figure frame (`.figure-frame`) has a 1px border and a 6px radius. No shadows. A table
  sits at its natural width with a caption above it.

## Structure of the site

The front page answers "what is it" in about 350 words, the length of comparable library
front pages (htmx, esbuild, wgpu, TypeGPU are 250 to 350). Everything that explains how or
why lives on its own page.

- `/`: the name, the category line, one sentence, three links (Get started, Why TypeShade, Examples), a
  bordered pill with the release state that links to the quick start, the live metaballs
  shader, the fragment stage of the gradient example beside the WGSL it emits, and three
  points.
- `/guide/…`: the documentation, on the layout every documentation site uses (VitePress,
  Docusaurus): a sidebar on the left with three groups, the document in the middle, and on a
  wide screen an outline of the page on the right. Under 64rem the sidebar is a bar under the
  header that names the current page. Every page carries its own headings in that outline,
  and closes with a link to the file it is written in ("Edit this page", the VitePress
  convention) and with previous and next.
  - Introduction: `/guide/introduction/` (why one source; the hosts' migration guides; the
    survey figures; what TypeShade does not do) and `/guide/quick-start/` (the submodule
    command, the authored fragment, the WGSL it emits, the release state).
  - Authoring: the compiler's AUTHORING.md, rendered from the vendored checkout at the pinned
    commit. A custom content loader (`src/content.config.ts`) cuts the file at its top-level
    headings and stores one entry per section, so the guide is one page per section:
    `/guide/authoring/` is the overview and `/guide/authoring/<section>/` the rest, in the
    file's order, which the sidebar and the pager follow. The package name is shown as its
    release name; an environment variable keeps its real name, the one the pinned compiler
    reads. No page sends a reader to GitHub for something the site can show; the edit
    link points at the section's line in AUTHORING.md.
  - Project: `/guide/checks/` (the oracle, the compile gate, the golden files, the same pass
    on both backends, the typed diagnostic) and `/guide/examples/`, which opens with a table of
    every example in the compiler's registry, grouped by category, each row linking to its
    source file at the pinned commit and naming the targets it emits.
- `/api/…`: the API reference, on the same documentation layout. `/api/` lists the categories with
  the number of exports in each and one line on what each holds; `/api/<category>/` lists that
  category's exports alphabetically with the sentence each opens with; `/api/<export>/` is one
  page per public export. A category's slug and an export's slug share the space under `/api/`,
  so the build asserts that no category takes a page an export needs (the Reflection category
  is `/api/reflection-api/`, because the compiler exports an interface called Reflection).
  Previous and next walk a category alphabetically and carry on into the next category.
- The first routes (`/motivation/`, `/checks/`, `/examples/`, `/guide/`) redirect.

Search is Pagefind. The build runs it over `dist/` after Astro, so `dist/pagefind/` holds the
index and the search UI, and nothing about them is committed. The index is built from the
document itself: the article on a documentation page and the main element on the front page
carry `data-pagefind-body`, and the header, the footer, the sidebar, the docs bar, the
outline, the pager and the edit link carry `data-pagefind-ignore`. Pagefind keeps one index
per `html lang`, so a Korean page is searched in Korean. The magnifier in the header opens a
dialog that loads the index on its first open, and Pagefind's UI is dressed in the site's
tokens through the CSS variables its stylesheet reads.

The header is the one every library site has: the name on the left; Guide, API and Examples;
then search, a language menu, a dark-mode switch and GitHub as icons. The footer is a site map in three
columns (Documentation, Project, Languages), then the licence, the copyright and the commit the
page was built from. Headings are single nouns or short noun phrases: Motivation, Verification, Quick
start.

## Versions

The header carries the repository's version as a menu (v0.0.1: Releases, Changelog, the pinned
commit), the way VitePress sites do. The site documents one version, the one vendored at the
pinned commit, and every number on it is measured there. When 0.1.0 ships and a later version
diverges, older documentation moves under a path prefix (`/v0.1/guide/…`, the convention
PixiJS uses with `/8.x/`), the unprefixed path stays the latest, and the version menu lists the
versions. Vue's separate host per major (v2.vuejs.org) needs a domain per version and is not the
plan.

## Reference pages

`/api/…` is the API reference, one page per public export of the compiler, generated at build
time from the source at the pinned commit (`src/lib/api.ts`) and rendered by
`src/components/pages/ApiReferencePage.astro`. Nothing on these pages is hand-written; a
wrong sentence is fixed upstream in the compiler's JSDoc and arrives at the next pin.

A page follows MDN's reference page, section by section, and leaves out a section with
nothing to show:

| MDN | Here | Where it comes from |
| --- | --- | --- |
| Breadcrumb | Reference › category › name | the category map in `src/lib/api.ts` |
| Title | the export's name in code, `name()` for a callable | the export |
| First paragraph | one plain sentence | the first sentence of the JSDoc |
| Syntax | the signatures, one per overload; a declaration block for an interface, type or class | the declaration |
| Parameters | name, type, optional, description | the signature and `@param` |
| Return value | type and description | the signature and `@returns` |
| Exceptions | the error class or code and when it is thrown | `@throws` and the diagnostics registry |
| Description | the rest of the JSDoc as markdown, `{@link X}` as links to other pages | the JSDoc |
| Examples | an h3 and a code block each | `@example` |
| Browser compatibility | Targets: WGSL, GLSL ES 3.00, CPU oracle, each Supported, Emulated, Stub, Not supported or Does not apply, with the spelling the target emits | the intrinsics registry and the oracle's stub list |
| Instance properties, Instance methods, Constructor | the members of an interface or class with their JSDoc | the declaration |
| See also | other reference pages | `{@link}` targets and `@see` |
| Specifications | In the guide: the guide sections that mention the name | `src/lib/authoring.ts` |
| Source | file, line and commit on GitHub | the declaration |

Under the summary every page prints the line a reader imports the export with, built from the
barrel and the release name (`import { emitModule } from 'typeshade'`), and a type is imported
as a type. A parameter, a return value and a property show their type as a link to the page of
every name in it that has one.

The sidebar's fourth group, Reference, opens with the reference's own index and then lists the
category index pages; on a page of one
category, that category's members follow it one level in, so the sidebar never carries every
export at once, and the page a reader is on is scrolled into view inside the sidebar's own
scroller. The guide links into the reference the way MDN links a function's first mention: the
first inline code on a guide page that is exactly a public export's name becomes a link to
that export's page (`src/lib/remark-api-links.mjs`, over the guide's markdown only). A
reference page records its kind for the search index, so a result reads "abs (function)". On a
Korean page the chrome is Korean and the body English, as on the guide; the note above the
body says so. The contract between the generator and the page is `src/lib/api-types.ts`, and
the words around it are `docs.api` in every dictionary, with a name and a sentence for every
category the extractor defines.

## Languages

Each language lives under a path prefix (`/ko/…`), the convention MDN, MS Learn, the Astro docs
and VitePress sites use; English, the source, has none. The header's language menu (globe
icon, the current language, the others in a list) switches to the same page in the other
language, and every page declares its alternates with `hreflang`. A host per language
(ko.vuejs.org) needs DNS per language and is not the plan.

- English is the source text, in `src/i18n/en.ts`. Every other language is a translation of
  it: `src/i18n/ko.ts` is typed against the English object, so a string missing in one
  language fails the type check.
- English lives at `/`, other languages under their code (`/ko/`). Route files in
  `src/pages` and `src/pages/ko` are one line each; the page itself is a component in
  `src/components/pages` that takes a locale.
- Inline links in copy are written `[text](key)`, inline code in backticks; `Rich.astro`
  renders them. `key` is a record in `src/lib/links.ts` or a page name, which the locale
  prefixes.
- Numbers are interpolated from `facts` in every language. Captions, accessible names, table
  headers and code-frame labels are in the dictionary too.
- Every page links its other languages in the header and carries `hreflang` alternates.
  `/llms.txt` and the social card are English only. GitHub Pages serves one 404 page, in
  English; a missing path under `/ko/` is sent on to `/ko/404/`, a Korean page with Korean
  chrome. Both are noindex and out of the sitemap.
- Korean text is set in IBM Plex Sans KR, the Korean companion to Plex Sans, at 400 and 600,
  subset to the 2,350 KS X 1001 syllables plus every character the copy uses (about 110 KB a
  weight, loaded on Korean pages only). `bun run build:fonts` regenerates the subset and its
  sidecar; the build fails if the copy uses a character the subset lacks. Line height 1.8,
  `word-break: keep-all`, headings without negative tracking. Adding a language: add `src/i18n/<code>.ts`, the code to `locales`
  in `src/i18n/index.ts` and `astro.config.mjs`, and a `src/pages/<code>/` directory with
  the four one-line route files.

## Things the build checks

- `scripts/check-style.mjs`: the voice rules above, over `src/`, `scripts/` and the two Markdown files.
- `src/lib/examples.ts`: every number, and that the pinned compiler still matches the copy.
- `src/pages/llms.txt.ts`: every numeral in `/llms.txt` exists in `facts`.
- `scripts/artifacts.mjs`: og.png, the icons and the stills match their committed hashes.
- `scripts/check-api.ts` (`bun run check:api`): the reference data read from the compiler, before it
  reaches a page. A missing description, a slug two exports share, an export with no category, or a
  text that names a consumer fails; a `{@link}` target the barrel does not export is a warning.
- `scripts/check-seo.mjs` and `scripts/openseo-audit.mts`, after the build: the metadata every page carries, and OpenSEO's audit over the built site (README, Checks).
