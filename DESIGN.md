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
- Body 16px / 1.6. Lead 18 to 20px. h2 28 to 32px. h1 36 to 56px. Line length at most 62ch.
- No uppercase labels, no tracked "eyebrow" lines above headings, no single-word labels <!-- ok -->
  under blocks, no "a · b · c" metadata strings. <!-- ok -->

## Colour

- Light by default; dark follows `prefers-color-scheme`. Both palettes live in
  `src/styles/global.css` and nowhere else.
- One accent (green) for links and the byte ruler, one red for diagnostics. No gradients, no
  glows, no coloured card borders.

## Layout

- One content column, 1080px maximum, left-aligned. Sections are 56 to 80px apart and
  separated by a 1px rule.
- The one thing that should stand out is a rendered shader. Everything else is quiet.
- Every canvas has a still image underneath it, captured at build time
  (`bun run capture:stills`), so the page never shows an empty frame.
- Boxes (`.panel`, `.figure-frame`) have a 1px border and a 6px radius. No shadows.

## Structure of the front page

1. Hero: headline, three sentences, two buttons, the live metaballs shader.
2. One paragraph of measured facts with links to the files that back them.
3. Why: the two-shader problem, with the survey figures and three hosts' migration guides.
4. What you write: the authored fragment beside its rendered output.
5. Agreement: the same shader on WebGPU and WebGL2, and the four checks that run in CI.
6. Types and precision: the TypeScript diagnostic, the reflected layout, the f64 example.
7. Adopt: licence, dependencies, the submodule command, the buttons again.

## Things the build checks

- `scripts/check-style.mjs`: the voice rules above, over `src/`, `scripts/` and the two Markdown files.
- `src/lib/examples.ts`: every number, and that the pinned compiler still matches the copy.
- `src/pages/llms.txt.ts`: every numeral in `/llms.txt` exists in `facts`.
- `scripts/artifacts.mjs`: og.png, the icons and the stills match their committed hashes.
