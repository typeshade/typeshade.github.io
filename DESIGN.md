# How typeshade.dev is written and designed

One page. Anyone editing the site, including an agent, reads this first. `bun run check:style`
enforces the parts that can be checked mechanically and runs at the start of every build.

## Voice

- Say what the tool does. Lead with the reader's problem, then the mechanism, then the proof.
- Short sentences. One idea per sentence. Plain verbs: "emits", "runs", "checks".
- Numbers come from the build (`src/lib/examples.ts`). A number that is not measured is not on the page.
- Do not praise the page or the tool. Words like "honest", "measured" and "proven" go. <!-- ok -->
- Do not write "X, not Y", "X, never Y", or "rather than". State X. <!-- ok -->
- No em dashes. Use a comma, a colon or a new sentence.
- No all-caps emphasis in prose or comments.
- No lists of three for rhythm. Use the number of items there are.
- Headings are sentences in sentence case, and they say something specific.
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

## Structure of the front page

The page reads as documentation: a title, a paragraph, a figure, then sections of prose,
code and figures in one column.

1. Header: the mark, the name, and the four links the footer repeats.
2. `h1`, then body text: three sentences on what TypeShade is and where the release stands.
3. The live metaballs shader, captioned by the backend that drew the frame.
4. Quick start: the submodule command, the authored fragment, and the WGSL and GLSL it emits.
5. Why this exists: the two-shader problem, the survey figures, three hosts' migration guides.
6. What it does: a list of capabilities, then the typed diagnostic with its reflected layout
   and the emulated-double example.
7. How it is checked: the CPU oracle, the compile gate, the golden files, and the same pass
   drawn through each API as one side-by-side figure, each half over a still that backend drew.
8. Examples, then Status.

## Things the build checks

- `scripts/check-style.mjs`: the voice rules above, over `src/`, `scripts/` and the two Markdown files.
- `src/lib/examples.ts`: every number, and that the pinned compiler still matches the copy.
- `src/pages/llms.txt.ts`: every numeral in `/llms.txt` exists in `facts`.
- `scripts/artifacts.mjs`: og.png, the icons and the stills match their committed hashes.
