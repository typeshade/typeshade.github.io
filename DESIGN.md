---
name: TypeShade
description: A shader language you write in TypeScript, documented in Ant Design v5's language as plain CSS tokens.
colors:
  primary: "#1677ff"
  primary-hover: "#4096ff"
  primary-active: "#0958d9"
  primary-bg: "#e6f4ff"
  primary-border: "#91caff"
  primary-text-hover: "#69b1ff"
  ground: "#f5f5f5"
  container: "#ffffff"
  elevated: "#ffffff"
  surface-1: "#fafafa"
  surface-2: "#f0f0f0"
  surface-3: "#e6e6e6"
  line-1: "#f0f0f0"
  line-2: "#d9d9d9"
  text-1: "rgb(0 0 0 / 0.88)"
  text-2: "rgb(0 0 0 / 0.65)"
  text-3: "rgb(0 0 0 / 0.45)"
  text-4: "rgb(0 0 0 / 0.25)"
  diagnostic: "#ff4d4f"
  selection: "#bae0ff"
  dark-ground: "#000000"
  dark-container: "#141414"
  dark-elevated: "#1f1f1f"
  dark-surface-2: "#262626"
  dark-line-1: "#303030"
  dark-line-2: "#424242"
  dark-primary: "#1668dc"
  dark-primary-hover: "#3c89e8"
  dark-primary-active: "#1554ad"
  dark-primary-bg: "#111a2c"
  dark-accent: "#3c89e8"
  dark-diagnostic: "#e87d7f"
  dark-text-1: "rgb(255 255 255 / 0.85)"
typography:
  display:
    fontFamily: "'IBM Plex Sans Variable', 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h1:
    fontSize: "2.375rem"
    fontWeight: 600
    lineHeight: 1.21
    letterSpacing: "-0.02em"
  h2:
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  h3:
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3333
  h4:
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  h5:
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  prose:
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5714
  meta:
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6667
  code:
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  control: "6px"
  card: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  base: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
  front: "64px"
  footer: "96px"
components:
  button:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-1}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "4px 15px"
    height: "32px"
  button-hover:
    textColor: "{colors.primary-hover}"
  button-active:
    textColor: "{colors.primary-active}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "4px 15px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
  button-lg:
    typography: "{typography.h5}"
    rounded: "{rounded.card}"
    padding: "7px 15px"
    height: "40px"
  card:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.text-1}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-cover:
    backgroundColor: "{colors.surface-2}"
    rounded: "0"
  menu-item:
    textColor: "{colors.text-2}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "40px"
  menu-item-active:
    backgroundColor: "{colors.primary-bg}"
    textColor: "{colors.primary}"
  tag:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-2}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "0 7px"
  search-pill:
    backgroundColor: "rgb(0 0 0 / 0.02)"
    textColor: "{colors.text-3}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  showcase-card:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.card}"
    height: "56px"
  code-frame:
    backgroundColor: "{colors.ground}"
    typography: "{typography.code}"
    rounded: "{rounded.card}"
    padding: "0.75rem 1rem"
---

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

## The system

Ant Design v5's language, written as plain CSS custom properties in `src/styles/global.css`.
There is no React and no antd package: the tokens at the top of that file are the whole
system, and every component style in the site is built from them. Ant supplies the palette,
the neutral scale, the radii, the elevation, the control heights and the button, card, list,
menu, anchor and table shapes. IBM Plex supplies the letterforms, because it is self-hosted
and has a matching Korean cut.

## Type

- Text: IBM Plex Sans (variable), self-hosted, latin subset. Korean: IBM Plex Sans KR 400 and 600.
- Code and identifiers: IBM Plex Mono 400 and 500.
- The frontmatter carries the ramp. Interface text is 14px at 1.5714, which is the site's body
  default; prose in a document column is 16px at 1.5; code is 13px at 1.6; the small label a
  menu group, a footer legal line or a tag carries is 12px at 1.6667. Headings run 38, 30, 24,
  20 and 16px, each at weight 600. The front page's own headline is the one size outside the
  ramp: it scales from 32px to 48px and lands at 52px past 90rem.
- Weight is 400 or 600. 500 appears in code (the mono face's second weight) and in the
  phone panel's links. Korean pushes a 500 label to 600, because Plex Sans KR ships two weights.
- Negative tracking sits on the largest sizes alone: -0.02em on the front headline and h1,
  -0.01em on h2. Korean relaxes both and keeps a 1.8 line height with `word-break: keep-all`.
- The document column holds about 72 characters of prose (740px). A front page section's
  heading is capped at 24ch and its paragraph at 62ch; the hero's lede is capped at 52ch.
- No uppercase labels, no tracked "eyebrow" lines above headings, no single-word labels <!-- ok -->
  under blocks, no "a · b · c" metadata strings. <!-- ok -->

**The Two Families Rule.** Plex Sans carries interface and prose; Plex Mono carries code,
identifiers, diagnostics, the version tag, the layout table and a uniform's own field name.
A word that names something the compiler reads is set in the mono face wherever it appears.

## Colour

- Light by default; dark follows `prefers-color-scheme`, or the switch in the header, which
  is remembered in `localStorage`. Both palettes live in `src/styles/global.css` and nowhere
  else; the code themes follow through `ec.config.mjs`, which resolves its own light and dark
  surfaces to the same values because Expressive Code parses them and cannot parse a `var()`.
- One accent, Ant's blue. It fills the page's primary button, marks the current item in the
  sidebar and the outline, underlines the active tab on the showcase card, colours a link, a
  focus ring and a slider, and nothing else. A red carries diagnostics and the "not supported"
  badge. There are no colour gradients, no glows and no coloured card borders; the colour on a
  page comes from the shaders.
- Text is four alphas over the container: 0.88 for body and headings, 0.65 for secondary
  prose, every caption and every note, 0.45 for a chevron, a list marker, a placeholder and a
  disabled affordance, 0.25 for a heading's permalink at rest. A sentence never sits at 0.45:
  it reads 3.2:1 on white, under the 4.5:1 body text needs.
- Lines are two greys: the hairline `#f0f0f0` that separates a card from its cover, a row from
  the next row and the header from the page, and the heavier `#d9d9d9` that draws a control's
  own border.
- The page field is the layout ground `#f5f5f5` (`--color-layout`), set on `html` and `body`.
  Every container on that field is the container white `#ffffff` (`--color-ground`): the
  header, the showcase card, the gallery and examples tiles, the code frames, the docs column
  with its sidebar and outline, the Playground's region, the footer above its `#f0f0f0` top
  rule, the search dialog and the dropdowns. Dark inverts the pair the way Ant's dark
  algorithm does: the field is `#000000` and the container `#141414`.
- Surfaces are three greys over the container: `#fafafa` under a table head, a code frame's
  tab bar, the docs bar on a phone and a tag; `#f0f0f0` behind a canvas before it draws;
  `#e6e6e6` above that.
- Hover and press are fills, not colour changes: 0.02, 0.04 and 0.06 black over the container.
- Dark is Ant's dark algorithm: `#141414` ground, `#1f1f1f` elevated, `#303030` and `#424242`
  lines, primary `#1668dc`. The link and rail blue is lifted one step to `#3c89e8`, because
  Ant's dark primary does not clear 4.5:1 on the `#141414` ground; the solid fill keeps
  `#1668dc`. The same tokens are written twice, under `[data-theme='dark']` and under the
  media query, since plain CSS cannot share a block between the two selectors.
- Tailwind is kept only for its `@theme` tokens and preflight. No utility classes appear in
  the markup.

**The Single Blue Rule.** The page has one blue and one red. A new state finds its colour in
the primary's own wash (`#e6f4ff`), border (`#91caff`) or text hover (`#69b1ff`) before it
introduces a hue.

## Depth

The site is flat until something is a card. A card at rest is a 1px `#f0f0f0` border on the
container's white, with no shadow. Three shadows exist, all Ant's:

- **Elevation** (`0 6px 16px 0 rgb(0 0 0 / 0.08), 0 3px 6px -4px rgb(0 0 0 / 0.12), 0 9px 28px 8px rgb(0 0 0 / 0.05)`):
  the showcase card on the front page, a hovered tile, the dropdown panels, the search dialog
  and the skip link. On hover the border goes transparent as the shadow arrives, so the tile
  gains depth without gaining weight.
- **Secondary** (`0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.02), 0 2px 4px 0 rgb(0 0 0 / 0.02)`):
  a hovered pager card in the documentation.
- **Control** (`0 2px 0 rgb(0 0 0 / 0.02)`, and `0 2px 0 rgb(5 145 255 / 0.1)` on the primary
  face): the resting shadow Ant's own buttons carry. Dark raises both to `0 2px 0 rgb(0 0 0 / 0.15)`.

The focus ring is a 4px wash of the primary (`0 0 0 4px rgb(5 145 255 / 0.1)`) plus a 2px
outline in the accent, so a keyboard reader still sees a ring on a ground the wash disappears
into. Motion is Ant's single curve, 0.2s `cubic-bezier(0.645, 0.045, 0.355, 1)`, on colour,
border, background and shadow. The shaders move; the chrome does not. Under
`prefers-reduced-motion: reduce` every transition drops to 1ms.

**The Resting Flat Rule.** A surface earns its shadow from state or from being the one thing
the page is about. The showcase card is elevated at rest because it is the page's subject; a
tile, a pager and a table row are flat until the pointer is on them.

## Shapes

Three radii. 4px on a tag, a swatch, a small button and a marked search hit. 6px on a control:
a button, a menu row, a dropdown item, the search pill, a colour input. 8px on a card, a code
frame, a dropdown panel, the search dialog and the large button. A canvas inside a card loses
its own radius and keeps a bottom hairline instead, so the cover meets the card's corners. No
element is fully round except the two-axis pad's dot.

## Layout

- A full-width header bar (64px, one `#f0f0f0` rule under it) and a full-width footer on
  `#fafafa` frame every page. Under 48rem the header's links, the version menu, the language
  menu and the dark-mode switch sit in a full-screen panel behind a menu button; the magnifier
  stays outside it, one tap away.
- Three measures. The container is 1200px with 16px gutters, 24px from 40rem: the header, the
  footer, the front page and the documentation grid share it. A document column is 740px. The
  wide measure, 960px, is for a docs figure that needs more than the column.
- The front page is a sequence of sections in the container, separated by space with no rule
  between them: 64px, 80px from 40rem. Its hero is a two-column grid from 64rem, 5fr text and
  7fr stage, 48px apart; under that the columns stack with the text first.
- The documentation grid is one column under 64rem, `240px / 1fr` from 64rem with a 48px gap,
  and `240px / 1fr / 220px` from 80rem, where the outline joins on the right. A page with no
  headings keeps the two-column form. Under 64rem the sidebar is a bar under the header that
  names the current page, with the page's own headings folded under it.
- Sections inside a document are 48px apart, 56px from 40rem. The footer starts 96px below the
  content.
- Breakpoints are 40rem, 48rem, 64rem and 80rem, with two one-off queries: 90rem for the
  headline's last step, and 45rem where a table stops being a table and becomes a stack of
  rows.
- The one thing that should stand out is a rendered shader. Everything else is quiet.
- Every canvas has a still image underneath it, captured at build time
  (`bun run capture:stills`), so the page never shows an empty frame.
- A table sits in the document column, scrolls inside itself, and stacks into labelled rows
  below 45rem. The layout table keeps its natural width and a caption above it.

**The Container Rule.** A full-width page is laid out in the 1200px container with the
gutters; a page of prose is laid out in the 740px column. A third measure needs a reason.

## Components

- **Buttons.** Ant's two faces. The default is a 32px box with a `#d9d9d9` border on the
  ground; hover and press move the text and the border to the primary's hover and active
  blues, and the background stays. The primary face fills with the blue and keeps white text
  through both states. The page's own action uses the large size: 40px, 16px text, 8px radius.
  An arrow glyph inside a button slides 2px on hover. There are no ghost, dashed or text
  variants.
- **Cards.** A 1px `#f0f0f0` border, 8px radius, the elevated white inside, and 16px of
  padding in the body. A card whose subject is a picture gives the picture the full top edge
  as a cover on `#f0f0f0`, with a hairline under it, and puts its name and sentence below.
  Hovering a linked card drops the border and raises the elevation shadow; the cover's image
  scales 1.03 over 400ms where the pointer is fine.
- **Menu.** The documentation sidebar is an Ant Menu: a 40px row, 6px radius, secondary text,
  the 0.04 fill on hover, and the current page in the primary at weight 600 over its wash. A
  group title is a 12px secondary label. A child sits at 32px of inset, and a child that names
  an export is set in the mono face.
- **Anchor.** The page outline is an Ant Anchor: a 2px `#f0f0f0` rail down the left, and a
  primary segment beside the heading in view.
- **Table.** Ant's lines: no vertical rules, a `#fafafa` head at weight 600, 12px by 16px
  cells, a `#f0f0f0` rule under every row, tabular figures, and the whole table scrollable
  inside the column.
- **Tag.** A 12px chip with a 4px radius, a `#d9d9d9` border and the `#fafafa` fill: the
  version in the header, an optional parameter, a target's support state, the one example that
  emits a single target. The target state that reads "not supported" swaps the border and text
  to the red.
- **Code frames.** Expressive Code in the same shape as a card: 8px radius, a 1px `#f0f0f0`
  border, a `#fafafa` tab bar, white code at 13px, no shadow. The copy button is the one piece
  of chrome the plugin draws itself, and it carries the page's language.
- **Figure.** `.figure-frame` is a 1px `#f0f0f0` box with an 8px radius on `#f0f0f0`, holding
  the still and the canvas over it at the same size. Its caption is 14px secondary text under
  the frame. Two frames of the same pass sit side by side from 40rem, at 3:1 where the subject
  is a flat gradient, so the pair costs a band and not half a screen.
- **Alert.** `.alert.alert-info`: a 1px `#91caff` rule over the primary's `#e6f4ff` wash, 8px
  radius, 12px by 16px of padding, and Ant's 16px info-circle in the primary at the left. It
  carries the pre-release note on the front page and on Quick start. Dark uses the same two
  tokens, `#15325b` and `#111a2c`.
- **Tabs.** `.front-tabs-head` is an Ant Tabs head: a 40px row of buttons 16px apart over a
  `#f0f0f0` rule, the active one in the primary at weight 600 with a 2px primary underline,
  the rest in secondary text. Every panel stays in the page, so the search index and a reader
  with no script get all of them stacked; the head appears and the inactive panel folds away
  once the script has run. Left and Right walk the head.
- **Empty.** A tile whose example has nothing the page can draw shows Ant's Empty instead of a
  bare grey frame: a 40px outlined mark at one 1.5px stroke in tertiary text, and one 12px
  secondary sentence under it saying why there is no picture.
- **Dropdowns.** The version menu, the language menu and the mobile panel are `details`
  elements. An open panel is an 8px card with 4px of padding, the elevation shadow, and 6px
  rows; the current choice is the primary over its wash at weight 600.
- **The showcase card.** The front page's live editor, `<LiveShader variant="hero">`: an 8px
  card with the elevation shadow, a 56px head bar carrying the file name as an active tab (a
  2px inset accent underline) with Edit and Reset as 24px buttons on the right, then a body
  split into the code pane on the left and the canvas on the right from 48rem, the controls
  under both panes behind a hairline with the reserved-field note as that group's last row,
  and the caption as the one 12px secondary line at the foot. Under 48rem the panes stack with
  the canvas first and the code pane fixed at 260px. The code pane is a window over the block:
  its content is taken out of flow so the picture sets the row's height and keeps its aspect,
  and the pane scrolls inside behind a 32px fade at its foot, since the pane's height rarely
  lands on a whole line and a cut glyph reads as a defect.

## Structure of the site

The front page answers "what is it" in about 350 words, the length of comparable library
front pages (htmx, esbuild, wgpu, TypeGPU are 250 to 350). Everything that explains how or
why lives on its own page.

- `/`: a two-column hero, the headline and a one-sentence lede on the left over two large
  buttons (Open the Playground, filled; Quick start, the default face), and on the right the
  showcase card, where `first.shade.ts` sits beside the picture it draws and the reader edits
  it in place. Then one section per idea, each a heading, a sentence and its evidence: one
  file and two targets, with `hello.shade.ts` beside the WGSL and the GLSL ES 3.00 it emits;
  nine of the repository's examples running as tiles, each a card with the canvas as its cover
  and the example's name under it; what carries over from TypeScript, as a list whose left
  column is the TypeScript in a code chip and whose right column is what it becomes; the
  gradient pass drawn by each backend as two cards; and the install command with the two
  buttons again.
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
- `/examples/…`: the gallery, one tile per registry example, grouped by category, each tile a
  link to the source at the pinned commit with its build-time still as the cover.
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
- `variant` picks the shape. The default, `figure`, is the column a guide page shows: code,
  then canvas, then controls. `variant="hero"` is the front page's showcase card, one elevated
  card with the file name as an active tab in a 56px head bar, the code pane and the canvas
  side by side from 48rem, and the controls under both.
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

A still is captured for every drawable example in the registry, not for the live blocks alone.
`STILL_EXAMPLES` in `scripts/artifacts.mjs` lists them, `src/pages/capture-stills.astro` is a
build-only route that draws all of them at the tile aspect, `scripts/capture-stills.ts`
photographs it, and `astro.config.mjs` removes the route from `dist/`, so it is never served.
Each file lands in `public/stills/<id>.webp` beside a committed sha256, and the build asserts
the hashes. The gallery shows those stills as tile covers and the front page runs nine of the
same examples live over theirs.

The build refuses a sample whose emitted GLSL reads the uniform block and declares none. The
compiler dropped that declaration for a module built by the TypeScript front end until the pin
this is written against, and the failure was silent: the shader did not link, the canvas stayed
empty, and the page told the reader their browser has no WebGL2. `check-live` opens a page with
`?forcegl2=1` so the fallback is exercised on every run.

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

A page carries as many live examples as it has ideas to show. The Book of Shaders, the
reference for this block, runs about one editor per 390 words of its own prose. A page where
two examples teach the same thing should have one.

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
