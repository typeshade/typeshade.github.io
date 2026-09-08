---
name: typeshade-site
description: How typeshade.dev is written, laid out, translated and checked. Load this before changing copy, layout, the Korean dictionary or the header and footer, and before reviewing a page for "does this look and read like a normal library site". Covers the voice rules, the layout conventions the site follows (vuejs.org, VitePress), meaning-first Korean with a term list, the length budget for labels, and the review procedure with the exact commands.
---

# typeshade.dev

The site is an Astro static site for a TypeScript shader compiler. Everything measurable on it
is read at build time from the compiler vendored at `vendor/shader-dsl`; the words live in
`src/i18n/en.ts` (the source) and `src/i18n/ko.ts` (typed against it). `DESIGN.md` is the
one design document; this skill is the working procedure on top of it.

## What "normal" means here

The site follows the shapes readers already know, and nothing else:

- **Front page**: vuejs.org, with react.dev's headline: the name in the accent colour, the
  category line under it (The verifiable TypeScript shader library), one sentence, three buttons (Get
  started, Why TypeShade, Examples), the live shader, three short
  points, one line on the release state. No lists of features, no long prose.
- **Header**: VitePress. Name on the left; Guide, API and Examples; then a language menu (globe
  icon, current language, list of the others), a dark-mode switch (sun or moon), GitHub as an
  icon. Under 48rem, a menu button and a panel with the same items.
- **Docs**: VitePress. Sidebar on the left in four groups (Introduction, Authoring, Project,
  Reference), the document in the middle at 740px, an outline of the page's own headings on the
  right on wide screens, an "Edit this page" link and previous and next at the bottom. Under
  64rem the sidebar is a bar under the header that names the current page. The guide lives
  under `/guide/`, one page per section of AUTHORING.md; the reference lives under `/api/`.
- **Reference**: MDN. `/api/` lists the categories, `/api/<category>/` the exports in one of
  them, `/api/<export>/` is the page for one export. A page keeps MDN's order and leaves out
  a section it has nothing for: Syntax, Parameters, Return value, Exceptions, Description,
  Examples, Targets (MDN's compatibility table), Constructor, Instance properties, Instance
  methods, In the guide, See also, Source. Nothing on those pages is written by hand: the text
  is the compiler's own JSDoc at the pinned commit, read by `src/lib/api.ts`. A wrong sentence
  is fixed upstream and arrives at the next pin, never by editing the site. What the site does
  write is the words around it, `docs.api` in every dictionary, including a name and a
  sentence for every category (`docs.api.categories`, keyed by the extractor's slug).
- **Footer**: vuejs.org. A site map in three columns, then the licence, the copyright and the
  commit the page was built from.
- **Search**: Pagefind, the way VitePress sites carry a search box. `bun run build` writes the
  index into `dist/pagefind/` after Astro, so search works on the built site and not on `astro
  dev`. The `data-pagefind-body` and `data-pagefind-ignore` attributes in `Base.astro` and
  `Docs.astro` are part of the layout: the document is indexed, the chrome is not.

If a change would give the site a shape none of those references has, it is wrong; find the
reference first. If a page can show something, it shows it; it never sends the reader to a
Markdown file on GitHub for it (the authoring guide is rendered from the vendored file).

## Voice (English)

Plain sentences by the maintainer to other developers. No em dashes, no "X, not Y"
contrasts, no "rather than", no uppercase for emphasis, no self-praise words, no headings
with a colon. Headings are single nouns or short noun phrases. Every number on the site comes
from `facts` in `src/lib/examples.ts`; a number that is not measured is not on the page.
`scripts/check-style.mjs` enforces the patterns and runs at the start of every build.

## Korean: meaning first

Translate what a sentence means to a Korean developer, in the words Korean developer
documentation uses (ko.vuejs.org, MDN 한국어, MS Learn 한국어). Never map English words one to
one. Rules:

- Keep standard technical terms as they are used in Korean developer writing: 셰이더, 유니폼,
  프래그먼트, 버텍스, 컴파일, 바인드 그룹, 레이아웃, 파이프라인, 렌더러, 리플렉션, 커밋,
  풀 리퀘스트, 서브모듈, 배정밀도 (double precision), 에뮬레이션, 골든 파일, 진단.
- Words that must not appear because they mean something else in Korean: 방언 (for
  "dialect": write 언어 or 두 언어로 된 코드), 사본 for a copy of code (write 복사본),
  뒤단 (write 그다음 단계 or name the thing, GPU 드라이버의 셰이더 컴파일러), 미평가 (describe it:
  합치지 않고 나란히 든 값 두 개), 동기 as a page title (write 왜 TypeShade인가), 검증 alone as
  a page title (write 검증 방식).
- Introduce a term of art before using it as a name: "CPU 함수로도 컴파일합니다. 이것이 기준값을
  내는 오라클입니다." then 오라클.
- Sentence endings vary (합니다, 됩니다, 냅니다, 없습니다, 있습니다); five in a row on the same
  ending is a build failure. Split a modifier of three or more clauses in front of a noun into
  two sentences. Prefer verbs to nominalisations.
- 합쇼체 throughout. No 해요체, no 반말, no exclamation marks.
- UI labels are short nouns: 가이드, 예제, 빠른 시작, 작성 가이드, 검증 방식, 소개, 참고.

## Length budget

A translated label may render no wider than about 1.35 times the English label, so a
translation cannot reflow the header, the buttons, a table or the sidebar.
`scripts/check-copy.ts` estimates widths from the fonts' advance widths and fails the build;
if it fails, shorten the Korean (왜 TypeShade인가 rather than TypeShade를 쓰는 이유), never
widen the layout.

## Procedure for any change to copy or layout

1. Edit `en.ts` first, then `ko.ts`. Add every new key to both; `bun run check:types` fails
   on a missing one.
2. `bun run build`. It runs, in order: `check-style` (voice), `check-copy` (numerals, links and
   code spans equal in both languages; label widths; the im-not-ai translation tells), the
   artifact hashes, the Korean font coverage, then Astro.
3. `bun run qa:seo`, `bun run qa:links`, `bun run qa:openseo` over `dist/`.
4. Screenshots at 390 and 1440 of every page you touched, in both languages, light and dark,
   with the menus open. Compare the same element in both languages: a Korean line count or
   width that differs from the English one by more than a line is a translation to shorten,
   never a layout to change.
5. For a Korean change of more than a few words, run the im-not-ai gates
   (`github.com/epoko77-ai/im-not-ai`, clone it): `scripts/prepare_monolith_input.py` on the
   Korean strings for the route hint, then `scripts/verify_change_rate.py` and
   `scripts/verify_gates.py` before and after. Change rate over 30% is too much for a
   polish pass.
6. Commit with the reason in the body. The PR body lists what was verified and how.

## Files

- `src/layouts/Base.astro`: head, header, footer, the dark-mode scripts.
- `src/layouts/Docs.astro`: sidebar, document, outline, pager.
- `src/components/SiteHeader.astro`, `SiteFooter.astro`.
- `src/lib/links.ts`: every destination, `navLinks`, `sidebar`.
- `src/i18n/en.ts`, `src/i18n/ko.ts`, `src/i18n/index.ts`.
- `src/lib/remark-package-name.mjs`: the guide's package name and links. An environment
  variable keeps the name the pinned compiler reads.
- `src/lib/guide.ts`, `src/content.config.ts`: AUTHORING.md cut into sections. Each section's
  title and description live in `guide.sections` in every dictionary; English derives them
  from the file, Korean writes them.
- `scripts/check-style.mjs`, `scripts/check-copy.ts`, `scripts/check-seo.mjs`,
  `scripts/openseo-audit.mts`.
