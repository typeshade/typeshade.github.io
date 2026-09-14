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
- The front page is centred on a 960px measure: the category line ("A shader language built
  around the TypeScript experience", the way react.dev sets its one line beside "React" and
  vuejs.org attaches "Progressive"), the name as the headline in the accent colour, a
  one-line subtitle, the tagline, five links, the live shader, the authored file beside the
  WGSL it emits, four concept cards, three short points. Use TypeShade is the one filled
  button (accent background, the way vuejs.org fills its own Get Started); Write in the
  Playground, Why TypeShade, Learn the language and Explore examples stay the plain surface
  button. Under 40rem the five links are a two-column grid, Use TypeShade across the top;
  from 40rem they sit on one wrapping line; the two code frames stack under 48rem. The
  layout follows vuejs.org's front page.
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

- `/`: the category line, the name, the subtitle and the tagline, five links (Use TypeShade,
  Write in the Playground, Why TypeShade, Learn the language, Explore examples), the live
  metaballs shader, the compilation flow with `hello.shade.ts` beside the WGSL it emits, four
  cards that map a TypeScript concept to its TypeShade meaning, and three points.
- `/guide/…`: the documentation, on the layout every documentation site uses (VitePress,
  Docusaurus): a sidebar on the left with six groups, the document in the middle, and on a
  wide screen an outline of the page on the right. Under 64rem the sidebar is a bar under the
  header that names the current page. Every page carries its own headings in that outline,
  and closes with a link to the file it is written in ("Edit this page", the VitePress
  convention) and with previous and next, which follow the sidebar's order.
  - Get started: `/guide/introduction/` (the language boundary, what stays familiar from
    TypeScript, what the compiler produces), `/guide/quick-start/` (the submodule command,
    the authored file, the WGSL it emits, the host code, the release state) and
    `/playground/`.
  - Language: `/guide/language/`, the language guide's overview, and one page per topic under
    it (types, functions, control flow, GPU types, resources, shader stages), written in the
    dictionaries.
  - Concepts: `/guide/typescript-and-webgpu/`, how TypeScript types, functions and modules map
    to GPU values, entry points and shader modules, and where WebGPU begins.
  - Examples: `/guide/examples/`, which opens with a table of every example in the compiler's
    registry, grouped by category, each row linking to its source file at the pinned commit
    and naming the targets it emits.
  - Reference: the API reference (`/api/…`, below), then Compiler internals, then Language
    service. Compiler internals is the compiler's AUTHORING.md, rendered from the vendored
    checkout at the pinned commit. A custom content loader (`src/content.config.ts`) cuts the
    file at its top-level headings and stores one entry per section, so it is one page per
    section: `/guide/internals/` is the overview and `/guide/internals/<section>/` the rest,
    in the file's order, which the sidebar and the pager follow; the sidebar lists the
    sections one level in only while the reader is on one of those pages. The package name
    is shown as its release name; an environment variable keeps its real name, the one the
    pinned compiler reads. No page sends a reader to GitHub for something the site can show;
    the edit link points at the section's line in AUTHORING.md. `/guide/language-service/`
    describes the compiler's editor-neutral language service: what it answers, how a host
    opens documents on it, its coordinate conventions and its one peer dependency, with a
    link to the design document at the pinned commit.
  - Project: `/guide/checks/` (the oracle, the compile gate, the golden files, the same pass
    on both backends, the typed diagnostic).
- `/api/…`: the API reference, on the same documentation layout. `/api/` lists the categories with
  the number of exports in each and one line on what each holds; `/api/<category>/` lists that
  category's exports alphabetically with the sentence each opens with; `/api/<export>/` is one
  page per public export. A category's slug and an export's slug share the space under `/api/`,
  so the build asserts that no category takes a page an export needs (the Reflection category
  is `/api/reflection-api/`, because the compiler exports an interface called Reflection).
  Previous and next walk a category alphabetically and carry on into the next category.
- The first routes (`/motivation/`, `/checks/`, `/examples/`, `/guide/`) redirect, and so does
  `/guide/authoring/…`, the internals' first address, to `/guide/internals/…`.

Search is Pagefind. The build runs it over `dist/` after Astro, so `dist/pagefind/` holds the
index and the search UI, and nothing about them is committed. The index is built from the
document itself: the article on a documentation page and the main element on the front page
carry `data-pagefind-body`, and the header, the footer, the sidebar, the docs bar, the
outline, the pager and the edit link carry `data-pagefind-ignore`. Pagefind keeps one index
per `html lang`, so a Korean page is searched in Korean. The magnifier in the header opens a
dialog that loads the index on its first open, and Pagefind's UI is dressed in the site's
tokens through the CSS variables its stylesheet reads.

The header is the one every library site has: the name on the left; Use TypeShade, Playground,
Language, API and Examples; then search, a language menu, a dark-mode switch and GitHub as icons. The footer is a site map in three
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

The sidebar's Reference group opens with the reference's own index and then lists the
category index pages; on a page of one category, that category's members follow it one level
in. Compiler internals and Language service close the group, and the internals' sections open
under their overview the same way, only on their own pages, so the sidebar never carries every
page of the reference at once, and the page a reader is on is scrolled into view inside the
sidebar's own scroller. The guide links into the reference the way MDN links a function's first mention: the
first inline code on a guide page that is exactly a public export's name becomes a link to
that export's page (`src/lib/remark-api-links.mjs`, over the guide's markdown only). A
reference page records its kind for the search index, so a result reads "abs (function)". On a
Korean page the chrome is Korean and the body English; the note above the
body says so. The contract between the generator and the page is `src/lib/api-types.ts`, and
the words around it are `docs.api` in every dictionary, with a name and a sentence for every
category the extractor defines.

## Live examples

A guide or concept page can carry a shader the reader edits. The model is
[The Book of Shaders](https://thebookofshaders.com/): working code, a canvas that renders it,
and a control for every number behind it, so the prose explains what the reader is looking at.
`<LiveShader>` (`src/components/LiveShader.astro`) is that block. The Playground stays the
place to write a whole file; a live example is one sample on one page.

Putting one on a page:

```astro
<LiveShader
  locale={locale}
  id="quick-start-stripes"
  title={q.live.title}
  code={stripes}
  caption={q.live.caption}
  file="stripes.shade.ts"
  aspect="3/1"
  controls={{
    speed: { label: q.live.speed, min: 0, max: 4, step: 0.01, value: 1 },
    tint: { label: q.live.tint, color: true, value: [0.19, 0.47, 0.78] },
  }}
/>
```

- `id` names the example. It is the id of its still (`public/stills/<id>.webp`, listed in
  `scripts/artifacts.mjs`) and of its inlined payload, so it is unique across the site.
- `title` and `caption` are copy and live in the dictionaries. The sample's code is not copy:
  it sits in the page component, the way the other code samples on a language page do, and so
  is `file`, the name over the block.
- `controls` gives one uniform field a range, a step, a default and a label. The label is
  copy and comes from the dictionary; the page prints the field's own name in code beside it.
  A prop for a field the module does not declare fails the build.
- The build compiles the sample (`src/lib/live-shader-emit.ts`) and inlines the WGSL, both
  GLSL ES 3.00 stages, the reflected layout and the controls. A sample the compiler reports
  an error on fails the build.

Three uniform field names are reserved and filled by the runtime every frame, so they get no
control. A sample declares the ones it reads and leaves out the rest, and the note under the
controls names the ones it declared:

| Field | Type | What it holds |
| --- | --- | --- |
| `time` | `f32` | seconds since the canvas started |
| `resolution` | `vec2` | the drawing buffer in device pixels |
| `mouse` | `vec2` | the pointer over the canvas, 0 to 1, origin at the bottom left, the space the `uv` parameter is in. A canvas the pointer has not touched holds (0.5, 0.5) |

Every other uniform field becomes one control, by its type:

| Field type | Control | Default range |
| --- | --- | --- |
| `f32` | slider | 0 to 1, step 0.002 |
| `i32`, `u32` | stepper, or a checkbox with `toggle: true` | 0 to 16, step 1 |
| `vec2<f32>` | two-axis pad | 0 to 1 per axis |
| `vec3<f32>`, `vec4<f32>` | one slider per component, or a colour picker with `color: true` | 0 to 1 per channel |

A field of any other type stops the build, so a page cannot ship a uniform it leaves at zero
without saying so. `bool` is one of them: WGSL forbids it in the uniform address space, so a
flag is a `u32` with `toggle: true`.

One thing the page writes for the compiler. At the pinned commit the GLSL backend works out
which bindings a stage reaches by walking the function bodies, and for a module built by the
TypeScript front end that walk finds nothing, so the emitted GLSL reads `u.time` from a `u` it
never declared and the fallback does not link. The block is written from the reflected layout
instead (`glslUniformBlock` in the contract), the build refuses a stage that reads the binding
and declares no block, and `check-live` opens a page with `?forcegl2=1` so the fallback is
exercised on every run. The front page is unaffected: its examples are built with `fn()` and
reach the binding the walk expects.

A sample is a whole file, the way a Book of Shaders page shows a whole `.frag` and an MDN
example shows something that runs: every name in front of the reader is declared in front of
the reader. The one thing a page supplies is the vertex half, which is what glslCanvas
supplies there. A sample that declares no `@vertex` entry is compiled behind a fullscreen
triangle and the `uv` it hands the fragment stage; a sample that declares both stages is
compiled as written. A diagnostic's line is moved back into the reader's own text before the
page prints it.

So a fragment sample reads the way a GLSL or WGSL author expects:

| GLSL | TypeShade |
| --- | --- |
| `uniform vec2 u_resolution;` | `class Uniforms { resolution: vec2 }` and `declare const u: uniform<Uniforms>` |
| `void main() {` | `@fragment` and `export function main(@location(0) uv: vec2): vec4 {` |
| `vec2 st = gl_FragCoord.xy / u_resolution;` | `uv` is already 0 to 1 |
| `gl_FragColor = vec4(c, 1.0);` | `return vec4(c, 1.)` |

`uv` arrives as a `@location(0)` parameter and not as the fragment position, because the two
backends disagree about that builtin: WGSL counts y down from the top and GLSL's
`gl_FragCoord` counts it up from the bottom, so a shader that read it would render upside down
on one of them. The varying is written once in the vertex half and linked by name on both.

The prelude, the reserved names, the control table and the packing rules are all in one
module, `src/lib/live-shader-contract.ts`, which imports nothing from the compiler and touches
no DOM. The Playground's live canvas reads the same module, so the two surfaces cannot
disagree about what a uniform field means.

What the page carries and when:

- The compiler is not in a page's initial JavaScript. The block ships the highlighted source
  through Expressive Code, the emitted output under a disclosure, and about 10 KB gzipped of
  script. The compiler (about a megabyte gzipped, the same chunk the Playground loads) is
  imported on the reader's first edit and shared by every example on the page.
- The editor is a transparent `<textarea>` over the block Expressive Code rendered, and an
  edited line is coloured by `src/scripts/live-shader-highlight.ts` into the same markup. A
  text field is what a phone keyboard and a Korean input method already know, and it costs a
  few kilobytes where CodeMirror 6 measured 133 KB gzipped. Monaco stays in the Playground.
- One WebGPU device serves every canvas on the page. Only a canvas in view draws, and a
  hidden tab draws nothing. Measured with three on one page: one `requestDevice`, one compiler
  chunk, and 90 frames on the canvas in view against 0 on the two out of it over the same
  second and a half.
- A compile with an error keeps the last frame that worked and says so under the canvas.
- Under `prefers-reduced-motion: reduce` there is no frame loop at all: the clock is pinned
  and the canvas draws when a control moves or the box changes size, so a reader who asked for
  less motion still sees their own change and nothing between them.
- Without WebGPU and without WebGL2 the canvas stays empty over its build-time still, and the
  note under it says which browser feature is missing.

A page carries as many live examples as it has ideas to show. The Book of Shaders runs about
one editor per 390 words; a page with one example per 1,000 words is under-using the block, and
a page where two examples teach the same thing should have one.

`scripts/check-live.mjs` (`bun run check:live`) opens a page with one in Chromium and checks
the four things: the canvas mounts or the fallback shows, no large script is fetched before
the first edit, an edit recompiles into the canvas or into diagnostics, and a moved control
reaches both the packed uniform bytes and the rendered frame.

## Languages

Each language lives under a path prefix (`/ko/…`), the convention MDN, MS Learn, the Astro docs
and VitePress sites use; English, the source, has none. The header's language menu (globe
icon, the current language, the others in a list) switches to the same page in the other
language, and every page declares its alternates with `hreflang`. A host per language
(ko.vuejs.org) needs DNS per language and is not the plan.

- Every user-facing string lives in the two dictionaries (`src/i18n/en.ts` and `src/i18n/ko.ts`)
  and a component reads it through `copyFor(locale)` from `src/i18n/index.ts`. No `locale === 'ko'`
  branches in components; no inline copy. Every locale-dependent URL is built with `localePath(locale, links.<key>.href)`;
  no string literal that starts with `/ko/`. Locale behaviour that is not copy (fonts, description
  length, the guide collection, the og locale) lives in `localeSettings` in `src/i18n/index.ts`.
  `bun run check:i18n` (in the build after check-copy) fails on a missing twin route file, Hangul outside
  src/i18n, or a locale literal outside the dictionaries.
- English lives at `/`, other languages under their code (`/ko/`). Route files in
  `src/pages` and `src/pages/ko` are one line each; the page itself is a component in
  `src/components/pages` that takes a locale. A page never imports another page.
- English is the source text in `src/i18n/en.ts`. Every other language is a translation of it:
  `src/i18n/ko.ts` is typed against the English object, so a string missing in one language fails
  the type check.
- The authoring guide is translated by hand, one file per section of AUTHORING.md under
  `content/guide/<locale>/`, from the English at the pinned commit. Each file's front matter
  records the sha256 of the English body it was translated from; when the pin moves and a
  section changes, the build stops and names the section, so a translation cannot fall behind
  its source unnoticed. `scripts/check-guide-translations.ts` holds a translation to the
  English's code blocks, code spans, numerals, links and headings, and to the Korean rules
  below. `content/guide/GLOSSARY.md` fixes the Korean for each English term. A section
  without a file is shown in English under a note that says so; the note means the
  translation is not there yet, never that a section is kept in English on purpose. Every
  section is translated. What stays English is a word or a cell: code blocks, identifiers
  and option values in code spans, a table cell that is only code, and the words the
  glossary lists under "영어로 두는 낱말" (the ones Korean developers say in English, such
  as fail closed, gather and scatter), glossed once at first use. The check refuses the
  Korean substitutes the glossary names for them. The reference's body stays English on
  every locale.
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
- `scripts/check-live.mjs` (`bun run check:live`), after the build: a live example in a real browser (Live examples).
- `scripts/check-seo.mjs` and `scripts/openseo-audit.mts`, after the build: the metadata every page carries, and OpenSEO's audit over the built site (README, Checks).
