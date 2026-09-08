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
- One accent, TypeScript's blue (#3178c6), for links and the mark; one red for diagnostics.
  The one gradient on the site runs across the front page's headline, from that blue on
  "Typed" to a violet on "shaders": the language on one side, the GPU on the other. No glows, no coloured card borders.
- Tailwind is kept only for its `@theme` tokens and preflight. No utility classes appear in
  the markup.

## Layout

- A full-width header bar (56px, one rule under it) and a full-width footer on a soft ground
  frame every page. Under 48rem the header's links, the language menu and the dark-mode switch
  sit in a panel behind a menu button.
- The front page is centred on a 960px measure: the headline in two lines, one sentence, three
  links, the live shader, three short points. Quick start and Status follow in the document
  column. The layout follows vuejs.org's front page.
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

- `/`: the headline, one sentence, three links (Get started, Why TypeShade, Examples), the live
  metaballs shader, three points (One source, Checked, Typed), Quick start (the submodule
  command, the authored fragment, the WGSL it emits), Status.
- `/guide/…`: the documentation, on the layout every documentation site uses (VitePress,
  Docusaurus): a sidebar on the left with three groups, the document in the middle, and on a
  wide screen an outline of the page on the right. Under 64rem the sidebar is a bar under the
  header that names the current page. Previous and next links close each page.
  - Introduction: `/guide/introduction/` (why one source; the hosts' migration guides; the
    survey figures; what TypeShade does not do) and `/guide/quick-start/` (the submodule
    command, the authored fragment, the WGSL it emits, the release state).
  - Authoring: `/guide/authoring/`, the compiler's AUTHORING.md rendered from the vendored
    checkout at the pinned commit (an Astro content collection over `vendor/shader-dsl`). The
    package name is shown as its release name. No page sends a reader to GitHub for something
    the site can show.
  - Reference: `/guide/checks/` (the oracle, the compile gate, the golden files, the same pass
    on both backends, the typed diagnostic) and `/guide/examples/`.
- The first routes (`/motivation/`, `/checks/`, `/examples/`, `/guide/`) redirect.

The header is the one every library site has: the name on the left; Guide and Examples; then
a language menu, a dark-mode switch and GitHub as icons. The footer is a site map in three
columns (Documentation, Project, Languages), then the licence, the copyright and the commit the
page was built from. Headings are single nouns or short noun phrases: Motivation, Checks, Quick
start.

## Languages

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
  `/llms.txt`, `/404` and the social card are English only.
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
- `scripts/check-seo.mjs` and `scripts/openseo-audit.mts`, after the build: the metadata every page carries, and OpenSEO's audit over the built site (README, Checks).
