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

- Text: IBM Plex Sans (variable), self-hosted, latin subset.
- Code and identifiers: IBM Plex Mono 400 and 500.
- Body 16px / 1.65. h3 18px, h2 24px, h1 32 to 36px. The column holds about 72
  characters of prose.
- No uppercase labels, no tracked "eyebrow" lines above headings, no single-word labels <!-- ok -->
  under blocks, no "a · b · c" metadata strings. <!-- ok -->

## Colour

- Light by default; dark follows `prefers-color-scheme`. Both palettes live in
  `src/styles/global.css` and nowhere else.
- One accent (green) for links, one red for diagnostics. No gradients, no
  glows, no coloured card borders.
- Tailwind is kept only for its `@theme` tokens and preflight. No utility classes appear in
  the markup.

## Layout

- One content column, 740px, left-aligned, with code blocks and figures at the same width.
  Sections are 48 to 56px apart. The only rule on the page sits above the footer.
- The one thing that should stand out is a rendered shader. Everything else is quiet.
- Every canvas has a still image underneath it, captured at build time
  (`bun run capture:stills`), so the page never shows an empty frame.
- The figure frame (`.figure-frame`) has a 1px border and a 6px radius. No shadows. A table
  sits at its natural width with a caption above it.

## Structure of the site

The front page answers "what is it" in about 350 words, the length of comparable library
front pages (htmx, esbuild, wgpu, TypeGPU are 250 to 350). Everything that explains how or
why lives on its own page.

- `/`: the name, two sentences, one line of measured numbers, the live metaballs shader, Quick
  start (the submodule command, the authored fragment, the WGSL it emits), a seven-line list of
  what it does, links to the pages below, Status.
- `/motivation`: the two-shader problem, the hosts' migration guides, the survey figures, what
  TypeShade does about it and what it does not do.
- `/checks`: the CPU oracle, the compile gate, the golden files, the same pass drawn on
  WebGPU and on WebGL2 as one side-by-side figure, and the typed diagnostic with its reflected
  layout.
- `/examples`: the examples, the print commands, the GLSL emit of the gradient pass, and the
  emulated-double demo.

The header links to the three pages, the guide and GitHub; the footer repeats them and adds
llms.txt. Headings are single nouns or short noun phrases: Motivation, Checks, Quick start.

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
- Korean text uses the system's Korean face beside Plex for Latin, a 1.75 line height and
  `word-break: keep-all`. Adding a language: add `src/i18n/<code>.ts`, the code to `locales`
  in `src/i18n/index.ts` and `astro.config.mjs`, and a `src/pages/<code>/` directory with
  the four one-line route files.

## Things the build checks

- `scripts/check-style.mjs`: the voice rules above, over `src/`, `scripts/` and the two Markdown files.
- `src/lib/examples.ts`: every number, and that the pinned compiler still matches the copy.
- `src/pages/llms.txt.ts`: every numeral in `/llms.txt` exists in `facts`.
- `scripts/artifacts.mjs`: og.png, the icons and the stills match their committed hashes.
