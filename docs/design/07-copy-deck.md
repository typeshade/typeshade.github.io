# TypeShade — final copy deck — 2026-09-07 (rev 2)

**Status:** FINAL. The UI/UX and build phases implement this verbatim; where it disagrees with `MSG`, this wins and says why.
**Corpus, with the abbreviations used below:** `BR` = `00-brief.md` · `RES` = `01-research.md` Part D (**P1–P10**) · `MSG` = `02-messaging.md` · `03-spike-hero.md` · `03b-spike-typed-error.md` · `IA` = `04-ia-wireframe.md` · `SP` = `docs/plans/2026-09-07-typeshade-strategic-plan.md` · `PS` = `…/2026-09-07-shader-dsl-standalone-product-strategy.md` · `GTM` = `…/2026-09-07-typeshade-go-to-market.md`.
**Provenance correction (rev 1 was wrong).** Rev 1 stated `IA` absent; it exists (50 KB, `docs/design/04-ia-wireframe.md`) and is **authoritative for section order, slot ids and requirements** — §10 maps every slot to its copy of record. `2026-09-07-typeshade-ecosystem-embedding.md` now exists (rev-2 note corrected 2026-09-07) and its §4 ranking (PixiJS → MapLibre → deck.gl/luma) is authoritative for hosts pending owner decision **D13** (`SP` §13); no host name is printed on the page either way. The `STP §5.1` citations in rev 1 resolved to nothing: the self-recognition lines, their placement and the seven-block count are **`GTM` §1.3**, and every §5-`whowrites` citation now points there.

**Honesty envelope (`SP` §14), absolute.** No "production-ready" / "1.0" · no `npm i typeshade` as a CTA · no "used by \<host\>" · no star or download number about TypeShade · no adapter, matrix, playground or release presented as existing · no "replaces TypeGPU / TSL" · no MSL/HLSL/SPIR-V as a feature.

---

## 1. Decision record — D1, and the corrections that survived measurement

**Final call on D1: (c) — hybrid.** Ship candidate (b)'s stance, section order, honesty envelope and Moore statement; put a job-shaped headline above it, typed + proven leading the subline, dual-target demoted to the subline's evidence clause. `SP` §13 D1 is adopted structurally, not rhetorically. **P1** settles which slot carries the durable half (headline to desire, subhead to mechanism); `MSG` §4 already priced it (proof-led h1 scores 15, job-led 18) and both 5-second panels reproduced it. "Write the shader once." **states no number and names no target** — a claim about authoring events, not backends, which is the demotion D1 asks for. The reversal is cheap and pre-written (§11, five-stranger test).

| # | Change vs `MSG` / rev 1 | Why |
| --- | --- | --- |
| 1 | Moore statement: need = trusting shader code nobody read line by line; dual-target → differentiation slot | `SP` §13 D1, executed structurally |
| 2 | Pillar precedence: **P-2 proven to agree** leads, **P-1 write it once** becomes its first proof (ids unchanged) | same |
| 3 | Subline → `Typed TypeScript, proven to agree: WGSL and GLSL ES 3.00 from one source.` | typed + proven arrive before the target list |
| 4 | New block **`whowrites`**, between `write` and `agree` | `GTM` §1.3 — the beachhead's reason to buy, after D1 removed it from the hero. **8 h2 blocks, not `IA` §4.2's 7**; `GTM` §1.3 sizes it at 7 before the footer, inside the **P7** median |
| 5 | "no comparable library ships one" **struck from the page** | uncheckable from a linked page (voice rule 7); a comparison claim on a page that refuses comparison (**P10**) |
| 6 | Proof row 1 becomes **35 of 36**; row 2 is scoped to X-GIS's own variants | **M1, M2** below |
| 7 | `write` keeps `IA` D-1's measured numeral (`Ten lines.`) and says what the slice **is**; rev 1's canvas in `write` is dropped for `IA`'s `agree` **pair** | **M3**, `IA` D-1/D-2/D-3 |
| 8 | Six new build-time facts (`IA` R-2) + a seventh; the verb ladder is restored to `IA` §4.2's seven verbs; every CTA carries an exact URL | **M4**, **P8** |
| 9 | Spike pixel table, `878,943` bytes and the `reflect()` caller count stay **off the page** | uncommitted or unroutable at build time (**P6**) |

**Measured 2026-09-07 on the pinned mirror `29c9614`.** Each is a page decision, not a nitpick.

- **M1 · Not all 36 examples emit both targets — 35 do.** Running `emitModule` + `emitGlslModule` over the whole registry: `compute-reduction` throws `UnsupportedFeatureError: backend 'glsl-es300' cannot emit this module — missing capabilities: storageBuffer, compute`, and its own header says so (`examples/compute-reduction.ts:8-10`). The page prints **`35 of 36`** from a build-time loop (`facts.dualTargetExamples`) that asserts the count, so the headline proof number cannot go false or stale.
- **M2 · The two compile gates cover X-GIS's variants, not the mirror's 36.** `_wgsl-compile-gate.spec.ts` enumerates the globe engine's own surfaces (polygon, line ±pick, line-composite, point, raster, icon, text, heatmap, overdraw, baked artifacts); `_glsl-compile-gate.spec.ts` compiles a representative vertex + fragment module plus the committed goldens and baked artifacts. **The mirror ships no CI at all** — no workflow file in its root. Every gate chip, rung and CTA links to X-GIS and says *X-GIS's variants*, or the claim fails voice rule 7.
- **M3 · `hero.authored` is a 10-line slice of a 98-line file, and it is the fragment stage only.** `between(source,'const fsGradient = fn(','\n)')` returns the `fn(...)` call; `gradient-pass.ts` is 98 lines and the gradient cannot render without `U`, `VsOut`, `vs_full` and the `module({…})` assembly. So the body says **fragment stage**, never "the whole source".
- **M4 · Three printed labels had no build-time route.** `facts` exposes only `examples`, `fp64Examples`, `testFiles`, `srcLocRounded`, `pinnedCommit`, `packageName` — `0 runtime dependencies`, `MIT` and the `pre-release` chip were hand facts. Worse, the mirror's `package.json` has **no `dependencies`, `peerDependencies` or `devDependencies` field at all**, so "measured 0/0/0" described fields that do not exist. Fixed by `IA` R-2 plus one: `facts.runtimeDeps` (0, **derived from the absence of all three fields** — `IA` C3), `facts.license`, `facts.published`, `facts.mirrorUrl`, `hero.authoredLines`, `hero.emit`, and **`facts.dualTargetExamples`**.
- **M5 · 135 and 146 are the same tree under two globs.** `find …/src` → 135; `find <package root>` → 146. The 11 extra sit in `examples/` and are exactly the suites this page cites. Widening `facts.testFiles` to the package root prints **146** and agrees with `SP` §15 — but `BR` is the fact authority this deck cites for everything else, so the widening is **owner decision (3)**, §11.
- **M6 · The typed diagnostic is 168 characters and is not truncated.** Rev 1 printed an elided form and cited 161, which its own build rule forbids. The page prints `typedError().diagnostic.message` **verbatim** (`truncated: false`, cap 300).

---

## 2. Positioning and message architecture

**Moore statement — FINAL. Internal alignment artifact; never printed.**

> **For** TypeScript developers and engine maintainers **who** have to trust shader code nobody read line by line — increasingly because an agent wrote it — **TypeShade is** an engine-agnostic shader compiler for TypeScript **that** type-checks the source in the editor and checks the output by machine. **Unlike** three.js TSL, which is tied to its renderer, and TypeGPU, whose WebGL2 backend is experimental, **TypeShade** emits WGSL and GLSL ES 3.00 from one source and proves the two agree: a CPU f64 oracle over that same source, and every shader variant X-GIS emits compiled by Tint and by WebGL2 in CI.

Versus `MSG` §1: **Need** moves from "the same shader on both APIs" to trust in unread shader code; **Key benefit** moves from dual-target to typed authoring + machine-checked output;
**Differentiation** now carries dual-target beside the oracle and the gates. Not claimed, therefore forbidden: a renderer, a runtime, adapters, a matrix, a playground, a release, any consumer but X-GIS.

**Brand promise** (internal; every headline is cut from it, never printed verbatim) — *The source is type-checked in the editor, the output is checked by machine, and one source covers both GPU APIs.*

| Rank | Pillar (id unchanged) | Statement (≤ 8 words) | Proof points (routes in §11) |
| --- | --- | --- | --- |
| **1** | **P-2 · Proven to agree** *(trust)* | Agreement is measured, not promised | CPU f64 oracle · Tint compiles every variant X-GIS emits · WebGL2 likewise · goldens diff byte for byte · `146` test files |
| **2** | **P-1 · Write it once** *(the job)* | One source, both GPU APIs | `35 of 36` examples emit both targets · **four canvases, three examples**, every one emitted at build time from the same registry |
| **3** | **P-3 · Fits what you have** *(risk)* | No engine. No dependencies. | `0` runtime deps · MIT · `@xgis/shader-dsl` in production inside X-GIS · `reflect()` layout · `13` fp64 examples |

**So-what ladder — the page speaks from the right-hand end.** P-2: oracle + two real compilers → divergence surfaces in CI, not in a bug report → **confidence**. P-1: one module, two emits → one file to edit instead of two → **relief**. P-3: 0 deps, MIT, plain text out → it drops into the renderer you already have → **safety**.

---

## 3. Nav, hero, and the status device

| Slot | Copy | Note |
| --- | --- | --- |
| `SKIP` | `Skip to content` → `#main` | First tab stop, `IA` I-10 |
| `NAV.WORDMARK` | `TypeShade` → `/` | |
| `NAV.CHIP` | `pre-release` | A `<span>`, state not a control; gated on `facts.published === false` (**P9**) |
| `NAV.LINKS` | `Docs` · `GitHub` | **Two links at every width.** `IA` §5 already folds `Guide` away at 390; keeping it at 1440 would give the anchored guide a **second wording** beside `Get started`, which **P8** and `MSG` §8 forbid |
| **Headline** (`h1`) | **Write the shader once.** | 4 words (cap 6). No `compiler` / `DSL` / `emits`. States no number, names no target |
| **Subline** | **Typed TypeScript, proven to agree: WGSL and GLSL ES 3.00 from one source.** | 13 words (cap 14). A colon, not an em dash — it announces the antecedent "agree" needs, at no word cost (voice rule 10) |
| **Primary CTA** | `Get started` → `https://github.com/typeshade/typeshade/blob/main/AUTHORING.md#1-the-authoring-surface` | Anchored past the 32-line preamble of a 1,608-line file; heading verified present |
| **Secondary CTA** | `GitHub` → `https://github.com/typeshade/typeshade` | Audience 3 scans before reading a word |
| **Status line** (under the CTAs) | **0.1.0 is not published yet. Running in production today inside the X-GIS globe engine.** | The **P9** disclosure, stated once, after the claim, never above the headline |

**Formula — BAB.** *Before* is unstated and supplied by the reader; *After* is the headline; *Bridge* is the subline, which names the mechanism the headline withholds (**P1**).
**4 U's:** *Useful* — names the job. *Ultra-specific* — the subline's `WGSL` / `GLSL ES 3.00`, never the headline. *Unique* — "proven to agree". *Urgent* — deliberately absent; urgency on an unpublished 0.1.0 would be the one dishonest word on the page.

**The P9 device, and why "stated once" is not breached by four occurrences.** The chip + the status line **are** the disclosure and appear once each. `adopt`'s body and the footer's npm label are
**state labels on a destination**, required by `MSG` §8 ("the npm link is labelled with its actual state") and by `IA`'s journey stage 4 (a status a visitor discovers on npm *after* the page implied otherwise is the one terminal −2). Recorded so each fires deliberately: `NAV.CHIP` = state · `HERO.STATUS` = disclosure · `B5.BODY` = the ask's precondition · `FOOTER.PACKAGE` = link-text honesty.

---

## 4. Rail — six two-line chips (`IA` R-4 shape: value on line 1, methodology on line 2)

**h2** — Checked by real compilers, every build.
**Body** — Every shader on this page was emitted at build time by the compiler pinned at that commit. None is hand-written. *(20 words)*

| # | Line 1 — value | Line 2 — methodology (never a tooltip, never omitted) | Build-time source |
| --- | --- | --- | --- |
| 1 | **35 of 36 examples** | emit WGSL and GLSL ES 3.00 from one source | `facts.dualTargetExamples` / `facts.examples`, from a loop over the registry (**M1**) |
| 2 | **146 test files** | in the pinned mirror | `facts.testFiles`, widened to the package root (**M5**) |
| 3 | **0 runtime dependencies** | no `dependencies` field in the mirror's package.json | `facts.runtimeDeps` (**M4**), `package.json` linked |
| 4 | **WGSL → Tint** | every shader variant X-GIS emits, in CI | `_wgsl-compile-gate.spec.ts`, linked (**M2**) |
| 5 | **GLSL ES 3.00 → WebGL2** | every shader variant X-GIS emits, in CI | `_glsl-compile-gate.spec.ts`, linked (**M2**) |
| 6 | **MIT** | the mirror's licence field | `facts.license` (**M4**) |

`RAIL.COMMIT` — **Every shader on this page was emitted at build time from `29c9614`.** The hash is the link → `https://github.com/typeshade/typeshade/tree/29c9614`; link text is the hash itself.
**Deleted:** "…*no comparable library ships one*." The oracle survives as rung 1 of `agree`. The comparative clause moves to the launch post and the docs comparison, reviewed on the monthly train.

---

## 5. Section-by-section — final copy, in page order

Eight `h2` blocks before the footer's own. If QA finds the scroll long on mobile, **`whowrites` is the block that folds** into the adapter READMEs, the examples index, the launch-post variants and the line-A outbound email (`GTM` §1.3). Nothing else may be cut. Every number's route is in §11's claim table; every slot id is mapped in §10.

### `write` · What you write — *hook* (`IA` beat 1)
- **h2** — **Ten lines. Both shader languages.** The numeral is a slot (`hero.authoredLines`), asserted equal to the rendered word (`IA` R-3, D-1). Rev 1's numberless "One function." is **declined**: a build assertion cannot go false, and a hedge reads as a hedge.
- **Body** — That is the fragment stage of the gradient pass. Both GPU APIs run it further down this page. *(18 words)* — "further down", not "next", because `whowrites` sits between (**M3**, `IA` D-2).
- **Proof element** — `B1.CODE`: `hero.authored` verbatim, 10 lines, `overflow-x`, no copy button (`IA` I-11 — it does not run standalone). Beside it `B1.EMIT`, four measured lines, output **measured never listed** (**P4**): `→ WGSL · one module, 29 lines` · `→ GLSL ES 3.00 · two stages, 34 lines` · `byte-identical to the last build` · `2.9 KB inlined here`.
- **Micro-label** `authored · gradient-pass.ts` · **CTA** `See the examples` → `https://github.com/typeshade/typeshade/tree/29c9614/examples` · **Patterns** P2, P4 · **Objection 3**
- **Build rule** — snippet, indicator and `agree`'s pair read one registry entry, so the code shown cannot drift from the code running. `hero.emit` supplies all four indicator values; none is typed.

### `whowrites` · Who writes it twice — *self-recognition* (new, `GTM` §1.3)
- **h2** — You have written this twice.
- **Body A** *(if `BR`'s fact list is amended — owner decision (1))* — 64% of over 400 shader developers adapt shaders across platforms, APIs or tools. About 10% call it one of their largest engineering costs. *(23 words)*
- **Body B** *(fallback, amendment declined)* — The same effect, authored a second time in another language, then kept in step by hand. *(16 words)*
- **Proof element** — three reader-sentences in a scan row (**P5**, not a table — **P10**), bowling-alley order, each ≤ 14 words: *"Your custom layer's GLSL has an expiry date on the host's roadmap."* · *"Your extension injects GLSL, so it stays WebGL-only until someone rewrites it."* · *"One effect, two programs: the API asks for both, or it will not run."*
- **`SOURCES` line — renders under Body A and Body B alike**, so the block is checkable in either state (voice rule 7; these are third-party claims and rev 1 shipped Body B with no source and no CTA): `Sources:` `MapLibre graphics-modernization roadmap` → `https://maplibre.org/roadmap/maplibre-gl-js/graphics-modernization/` · `deck.gl WebGPU guide` → `https://deck.gl/docs/developer-guide/webgpu` · `PixiJS v8 migration guide` → `https://pixijs.com/8.x/guides/migrations/v8`. Under **Body A** only, the figures additionally carry `Khronos Shader Ecosystem Survey 2026, >400 respondents, fielded 2026-06-16 → 07-10` → `https://www.khronos.org/blog/shader-ecosystem-survey-results-2026`.
- **Micro-label** `measured` (Body A) / none (Body B) · **no CTA** — see the verb-ladder note below · **Objection** — the beachhead's compelling reason to buy, which D1 removed from the hero.
- **The host-name exemption, stated so QA can bound it.** `SP` §14 bans a host name *beside a benefit*, because that reads as an integration claim. A **citation under a claim is attribution, not integration** — and voice rule 7 makes it mandatory. So host names are permitted **only** inside this `SOURCES` line (visible text and `href`), nowhere else; §11's sweep asserts the count. No logo, no host name in body copy, no table — the reader self-identifies by their own description of their pain.
- **Trip-wire:** if scroll depth dies before this block, promote **one** line into the hero area as an eyebrow; never into the headline.

### `agree` · Proven to agree — *proof* · **pillar P-2** (`IA` beat 2)
- **h2** — Agreement is measured, not promised.
- **Body** — The same source runs on a CPU in f64. Both emitted shaders are compiled by the real compilers, every commit. *(20 words)*
- **Proof element, part 1 — the pair** (`B2.CANVAS.GPU` / `B2.CANVAS.GL`, rev 1 dropped it and shipped badges alone): that same `gradient` source mounted **twice**, left headed `WGSL → Tint → WebGPU`, right headed `GLSL ES 3.00 → WebGL2` via the `forceWebGl2` prop (`IA` R-8). Both draw one frame and stop (`still`, `IA` R-9) — `gradient` declares no `time` control, so no shared clock exists to get wrong. Captions in §6.
- **`B2.NOTE`** — One source · two compilers · two GPU APIs · the ten lines above.
- **Proof element, part 2 — the ladder**, one rung per link, because a rung nobody can open is not evidence: **① CPU f64 oracle** → `https://github.com/typeshade/typeshade/blob/29c9614/src/core/oracle.ts` · **② WGSL → Tint** → `https://github.com/X-GIS/X-GIS/blob/main/playground/e2e/_wgsl-compile-gate.spec.ts` · **③ GLSL ES 3.00 → WebGL2** → `https://github.com/X-GIS/X-GIS/blob/main/playground/e2e/_glsl-compile-gate.spec.ts`. Beneath: `146 test files` and `emit goldens` → `https://github.com/typeshade/typeshade/blob/29c9614/examples/emit-goldens.test.ts`.
- **`B2.DETAILS`** — `<summary>` reads **How this was measured** (a noun phrase, native `<details>`, real DOM text). Body, static until `agreement.json` exists (`IA` D-4): *The oracle executes the authored module on a CPU in double precision, from the same source the emitters read. The two compile gates run in the X-GIS globe engine's CI: one creates a shader module for every variant that engine emits, the other links each one on a real WebGL2 context. The goldens diff every emit byte for byte against a committed file. No pixel comparison between the two backends is committed yet, so none is printed here.*
- **Micro-label** `CPU f64 oracle · Tint · WebGL2` · **CTA** `Read the CI gates` → `https://github.com/X-GIS/X-GIS/blob/main/.github/workflows/test.yml` — the one file that wires **both** gates into CI; the directory `…/tree/main/playground/e2e` is **forbidden as a destination** (454 entries) · **Objection 4**
- **Deliberately absent** — the spike's cross-backend pixel table (`03-spike-hero` §5 limit 2, `IA` D-4): a spike measurement, not a committed gate. Commit a cross-backend parity gate first — it then becomes **rung ④** here, and it is the highest-value copy unlock on the project.

### `types` · The editor catches it — *capability* (`IA` beat 3)
- **h2** — Wrong field, red squiggle, not black frame.
- **Body** — A wrong field is a type error while you type. Uniform layouts come from `reflect()`, so no offset is hand-derived. *(20 words)*
- **Proof element** — `B3.EDITOR`: the real diagnostic, produced at build time by the `typescript` compiler over the printed snippet, rendered as **text** under the frame, never an image and never elided (**M6**): `TS2339 · line 7:47 — Property 'colour' does not exist on type '{ readonly time: ReadonlyNode<"f32">; readonly top: ReadonlyNode<"vec4<f32>">; readonly bottom: ReadonlyNode<"vec4<f32>">; }'.` — 168 chars, `truncated: false`. Beside it `B3.LAYOUT`, `reflect()`'s four columns (`field · type · offset · size`) captioned `reflect() · std140 · 48 bytes`: `time f32 @0 (4)` · `top vec4<f32> @16 (16)` · `bottom vec4<f32> @32 (16)`.
- **`B3` caption** — **No number in this table was typed.**
- **Micro-label** `std140 · std430` · **CTA** `Check the layout API` → `https://github.com/typeshade/typeshade/blob/29c9614/src/core/reflect.ts` · **Objections 5 and 6**
- **Build rules** — every value from `typedError()`, including `diagnostic.truncated`: **render the flag, never a silently shortened message.** At 390 the message **wraps**, never truncates — it *is* the proof. **Never collapse the offset column: the 12 padding bytes after `time` are the argument** — a hand-derived table would put `top` at 4. This frame is the site's own `typed-error-shader.ts` fixture, not `write`'s `gradient-pass.ts` (`IA` C4); title the two frames distinctly so a reader cannot read them as one file.

### `precision` · Deep zoom — *capability* (`IA` beat 4)
- **h2** — Zoom past what f32 holds.
- **Body** — WGSL and GLSL ES 3.00 have no f64. The emulation does, and the source reads exactly like the f32 version. *(20 words)* — **not** "The GPU has no f64": desktop GPUs do expose it, and `BR` records the language fact, not the hardware one. An overstatement is expensive on a page whose only differentiator is precision of claim.
- **Proof element** — `B4.CANVAS`: live `fp64-deep-zoom`, one frame then stop (`still`, `IA` R-9), verified on both backends (spike arms 1–2). Half-labels are **HTML, never in the shader**: left `f32`, right `emulated f64`. `B4.BADGE` `13 fp64 examples` (`facts.fp64Examples`). The picture is the claim.
- **Micro-label** `emulated fp64` · **CTA** `Open the deep-zoom example` → `https://github.com/typeshade/typeshade/blob/29c9614/examples/fp64-deep-zoom.ts` · **Objection 7**
- **Caption note** — it declares no `time` control, so its frame is a pure function of its sliders (frame-delta 0 by construction, spike §4); the caption must not imply motion.

### `adopt` · Where it runs — *close* · **pillar P-3** (`IA` beat 5)
- **h2** — No engine. No dependencies.
- **Body** — In production today inside the X-GIS globe engine. 0.1.0 is not published yet — start from the mirror and the guide. *(21 words)*
- **`B5.CHIPS`** — `0 runtime dependencies` (with `https://github.com/typeshade/typeshade/blob/29c9614/package.json` linked) · `@xgis/shader-dsl` · `MIT` · `pinned 29c9614`.
- **`B5.INSTALL`** — the one command that is true today, copyable, the page's only paste-and-run text: `git submodule add https://github.com/typeshade/typeshade vendor/shader-dsl`. Button label `Copy` → **`Copied`** for 1.6 s, announced `aria-live="polite"`; on failure (insecure context, denied permission) the label becomes **`Press ⌘C`** and the text is programmatically selected. Copies the **full** string, never the visual truncation. Generated from `facts.mirrorUrl` + a docs-owner-ratified target path (`IA` R-11): **unratified → drop the copy chip and keep the prose.**
- **CTAs** `Get started` and `GitHub` — same URLs and same wordings as the hero (`MSG` §8) — plus **`B5.WATCH`** `Watch releases for 0.1.0` → `https://github.com/typeshade/typeshade/releases` (`IA` D-5 default = ship). It is the page's only Retention instrument, and it holds no account, no list and no visitor data: no email, no waitlist, no urgency device. · **Objections 8, 9, 10**
- **Rationale, kept unapologetically** — one production consumer is named because there is exactly one; a logo band would be three empty cells and an evaluator counts them. "Unreleased" is answered with a named production consumer, never with an apology.
- **Deleted / forbidden here** — `878,943 emitted bytes` (measured on the X-GIS tree; this site builds from the pinned mirror, so it has no build-time route — **P6**; it belongs in the launch post with its command and date). This block must not drift toward "works with your host": that is the forward-compatibility contract, which belongs to an adapter that does not exist (`SP` §2.5, §6.2, all ⛔).

---

## 6. Canvas captions and accessible names — **four mounts, one animating** (`IA` §4.4, R-10)

Rev 1 specified these for the hero alone. Every mount now carries its own set, generated from **its own** build-time example record and substituted at runtime from `data-backend` in the **same tick from the same value** (`IA` I-1), `min-width` pinned so substitution causes zero layout shift. The build-time string must be backend-neutral (correct if the script never runs); the backend is carried in **text**, never by colour, motion or image alone. Every canvas is `role="img"`, `pointer-events: none`, not focusable, with no slider, toggle or play control anywhere near it (`IA` I-6, G3).

| Mount | `webgpu` | `webgl2` | reduced motion (`frames === 1`) | `none` |
| --- | --- | --- | --- | --- |
| `HERO.CANVAS` `metaballs` *(animates)* | `running live on WebGPU` | `running live on WebGL2` | `still frame — motion reduced by your system setting` | `neither WebGPU nor WebGL2 here — the shaders on this page were still emitted at build time` |
| `B2.CANVAS.GPU` `gradient` *(still)* | `WGSL → Tint → WebGPU · drawn here` | **`WGSL → Tint · checked in CI. This browser has no WebGPU, so GLSL ES 3.00 drew this frame.`** | same as its backend row (it is already one frame) | the `none` sentence above |
| `B2.CANVAS.GL` `gradient` *(still, `forceWebGl2`)* | — (never requested) | `GLSL ES 3.00 → WebGL2 · drawn here` | same as its backend row | the `none` sentence above |
| `B4.CANVAS` `fp64-deep-zoom` *(still)* | `emulated f64, drawn once on WebGPU` | `emulated f64, drawn once on WebGL2` | same as its backend row | the `none` sentence above |

**`aria-label` pattern**, one per mount, backend substituted from the same value as the caption: *"Live {title} shader, written in TypeScript and compiled by TypeShade to {WGSL | GLSL ES 3.00}, running on {WebGPU | WebGL2} in this browser."* → `Still frame of a {title} shader…` under reduced motion → and on `none`, the **`none` caption sentence itself** is the `alt` / label. The word **"Decorative" is forbidden here**: the element carries `role="img"` and a visible caption, and rev 1's version apologised about the visitor's hardware where `IA` §6 turns the degraded path into a claim about the compiler. **The `B2.CANVAS.GPU` fallback row is load-bearing:** without it a browser with no WebGPU renders two WebGL2 frames under a header claiming Tint drew one — the page's own verification claim, told wrong, on the block that exists to prove it.

---

## 7. Nav destinations, footer, and `/404.html`

**Footer body** — TypeShade · MIT · compiled from the mirror pinned at `{commit}`.

| Column | Label | Destination |
| --- | --- | --- |
| Start | `Get started` | `https://github.com/typeshade/typeshade/blob/main/AUTHORING.md#1-the-authoring-surface` |
| Start | `Docs` | `https://x-gis.github.io/X-GIS/shader-dsl/` |
| Source | `GitHub` | `https://github.com/typeshade/typeshade` |
| Source | `X-GIS source` | `https://github.com/X-GIS/X-GIS/tree/main/shader-dsl` |
| Package | `npm typeshade — reserved for 0.1.0` | `https://www.npmjs.com/package/typeshade` |
| Agents | `llms.txt` | `/llms.txt` |

**One destination, one wording — resolved, not asserted.** The anchored guide is `Get started` in the hero, `adopt` and the footer; the mirror is `GitHub` in the nav, the hero, `adopt` and the footer. Rev 1's `Guide` and `GitHub mirror` are **deleted** — each was a second wording for a destination that already had one. **The honest npm line, verbatim:** **`npm typeshade — reserved for 0.1.0`**. A label, never a CTA, never an install command, appearing exactly here. `npm i typeshade` is forbidden everywhere on the site (`SP` §14: a `0.0.0` placeholder whose downloads API returns no record).

**Verb ladder (P8) — `IA` §4.2's seven verbs, restored.** `Get` (hero, `adopt`, footer) · `GitHub` (nav, hero, `adopt`, footer) · `See` (`write`) · `Read` (`agree`) · `Check` (`types`) · `Open` (`precision`) · `Watch` (`adopt`), plus `llms.txt`. Rev 1 spent `Read` twice (`Read the survey`, `Read the CI gates`) and deleted the ratified `Check the layout API` for an invented `Check the pinned commit`; both are reverted. `whowrites` therefore carries **no CTA** — every verb is spoken for, and its `SOURCES` line is a citation, not a call to action. Its reader-sentence row already does the block's work. If a CTA is later wanted there, an **eighth** verb must be minted; no existing one may be reused. (Rev 1's "the ladder has six slots" counted neither the hero pair nor the footer.)

**`/404.html`** (`IA` §4.1, new, ~15 lines) — one line of copy, the primary CTA, and a link home. Copy: **That page is not here. The compiler is.** · `Get started` (same URL, same wording) · `TypeShade home` → `/`. Ships with `/spike` deleted (`IA` R-12) — `/spike` is live and in the sitemap, so every crawler hits it the moment it goes.

---

## 8. Meta and social

| Slot | Copy | Length (cap) |
| --- | --- | --- |
| `<title>` | `TypeShade — typed shaders in TypeScript, to WGSL and GLSL` | 57 (60) |
| `meta description` | `Write the shader once. Typed TypeScript, proven to agree: WGSL and GLSL ES 3.00 from one source, checked by a CPU f64 oracle and by real compilers.` | 147 (155) |
| `og:title` | `TypeShade — write the shader once` | 33 (60) |
| `og:description` | `One typed TypeScript source becomes WGSL and GLSL ES 3.00. A CPU f64 oracle runs the same source, and Tint and WebGL2 compile every variant X-GIS emits.` | 152 (200) |
| `og:image` alt | `TypeShade — a shader written in TypeScript, compiled to WGSL and GLSL ES 3.00.` | 78 (125) |

`<title>` carries **TypeScript**, the word the category rests on, and the tagline of record (`IA` NFR-8): an unknown product's title is its only search-stage asset (`IA` journey stage 2), and rev 1's 48-character line spent none of its 12 spare characters on it. The four OG/meta caps are new — rev 1 bounded only `<title>` and the description, so an over-length OG could not fail QA.

**`llms.txt` summary paragraph** (agents are an acquisition channel, `SP` §13 D4 — though `llms.txt` adoption is 10.13% of 300,000 domains with no provider confirming production use, so this is cheap insurance, not a strategy). Its section list and link table generate from the same `facts` / CTA records the page renders from (`IA` §4.1), or it becomes the stalest text in the repo.

> TypeShade is an engine-agnostic shader compiler for TypeScript. You author a typed node graph in TypeScript; one intermediate representation emits WGSL for WebGPU and GLSL ES 3.00 for WebGL2, plus a CPU f64 oracle that executes the same source in double precision so the two outputs can be checked rather than assumed. A wrong field is a TypeScript error at author time; `reflect()` recovers std140 and std430 layouts so no byte offset is hand-derived; emulated fp64 keeps the same syntax as f32. It has zero runtime dependencies, is MIT licensed, and runs in production inside the X-GIS globe engine as `@xgis/shader-dsl`. Version 0.1.0 is not published yet and the npm name `typeshade` is reserved, so start from the read-only mirror and the authoring guide.

---

## 9. Voice and forbidden words

Carried whole from `MSG` §7 — four NN/g axes (4/5 serious · 3/5 casual-neutral · 4.5/5 respectful · 4.5/5 matter-of-fact) and rules 1–10. Three restated because the panel found them load-bearing:
**rule 6**, a number with no build-time source is deleted (**P6**), enforced by §11's claim table; **rule 7**, nothing is claimed that a reader cannot check from a linked page — this struck "no comparable library ships one", made **M2**'s link destinations mandatory, and forced `whowrites`'s `SOURCES` line; **rule 9**, a competitor gets one honest line, in the docs, never here (**P10**).

**Forbidden words** — from `BR`: `we` · `our` · `simply` · `easily` · `just` · `powerful`. Carried in full from `MSG` §7: seamless(ly) · blazing · lightning-fast · fast (without a number) · robust · solid · rock-solid · battle-tested · production-ready · enterprise-grade · world-class · best-in-class · industry-leading · comprehensive · flexible · modern · next-generation · cutting-edge · revolutionary · game-changing · effortless · magic(al) · delightful · intuitive · beautiful · amazing · awesome · unleash · supercharge · empower · leverage · unlock · boost · out of the box · plug and play · zero-config · first-class · feature-rich · fully-featured · incredibly · extremely · very · really · of course · obviously.

**Added by this panel** — `prove` **without an object** (the h1 no longer carries it; `agree`'s h2 supplies "agreement" as the object, because the documented risk is that "prove" reads as formal verification, which TypeShade does not do) · `used by` + any host name · `works with` + any host name · `1.0` · `production-ready` even beside X-GIS · `verified` as a bare adjective · any star or download number · **`Decorative`** as a canvas label (§6).

---

## 10. Wireframe slot map — every `IA` slot to its copy of record

| `IA` slot | Copy of record | Here |
| --- | --- | --- |
| `NAV.CHIP` · `NAV.LINKS` · skip-link | `pre-release` · `Docs` · `GitHub` · `Skip to content` | §3 — `Guide` **declined**, it double-worded the guide destination (**P8**) |
| `HERO.*` (H1, SUB, CTA, STATUS, CAPTION) | headline / subline / `Get started` + `GitHub` / status line / four captions | §3, §6 |
| `RAIL.CHIP` ×6 · `RAIL.COMMIT` | six two-line chips; commit sentence with the hash as link text | §4 — chip 1 and chips 4–5 corrected (**M1**, **M2**) |
| `B1.H2` · `B1.BODY` · `B1.CODE` · `B1.EMIT` · `B1.CTA` | `Ten lines. Both shader languages.` / fragment-stage body / 10 lines verbatim / four measured indicator lines / `See the examples` | §5 `write` |
| **(new)** `whowrites` | h2 + Body A/B + three reader-sentences + `SOURCES` | §5 — an 8th `h2`, per `GTM` §1.3; `IA` §4.2 predates it |
| `B2.H2` · `B2.BODY` · `B2.CANVAS.GPU` / `.GL` · `B2.NOTE` · `B2.LADDER` · `B2.DETAILS` · `B2.CTA` | h2 / body / the pair + captions / one-source note / 3 linked rungs / `How this was measured` + its text / `Read the CI gates` | §5 `agree`, §6 — rev 1 shipped **none** of the canvas pair, note or disclosure |
| `B3.H2` · `B3.BODY` · `B3.EDITOR` · `B3.LAYOUT` · caption · `B3.MICROLABEL` · `B3.CTA` | h2 / body / the 168-char diagnostic verbatim / 3 rows at 0·16·32 / *No number in this table was typed.* / `std140 · std430` / `Check the layout API` | §5 `types` |
| `B4.CANVAS` · `B4.H2` · `B4.BODY` · half-labels · `B4.BADGE` · `B4.CTA` | still `fp64-deep-zoom` / h2 / f64 body / `f32` + `emulated f64` / `13 fp64 examples` / `Open the deep-zoom example` | §5 `precision`, §6 |
| `B5.H2` · `B5.BODY` · `B5.CHIPS` · `B5.INSTALL` · `B5.CTA` · `B5.WATCH` | h2 / body / four chips / submodule line + `Copy`/`Copied`/`Press ⌘C` / `Get started` + `GitHub` / `Watch releases for 0.1.0` | §5 `adopt` |
| `FOOTER.*` incl. `FOOTER.PACKAGE` | four columns; npm labelled with its state | §7 |
| `/404.html` | *That page is not here. The compiler is.* + `Get started` + `TypeShade home` | §7 |
| `/llms.txt` · `og.png` alt | summary paragraph, generated link table · alt string | §8 |

**Ratified amendments (2026-09-07, from the UI/UX review's UX-08).** The deck is the copy of record, so a string that ships differently from §5 is recorded HERE rather than left as a build detail.

| Slot | Deck §5 | What ships | Why |
| --- | --- | --- | --- |
| `B1.EMIT` row 3 | `2.9 KB inlined here` | **`2.1 KB inlined here`** | Wording unchanged; the numeral is `hero.emit.payloadBytes` measured at build time, which is what the deck's own build rule requires. The page had reworded it to "inlined on this page" — **restored**. |
| `B1.EMIT` row 4 | `byte-identical to the last build` | **`goldens diff byte for byte`, linked** to `examples/emit-goldens.test.ts` | The site keeps no golden of its own, so it cannot check byte-identity **on this build** and stating it flat would be the one claim it cannot verify (R-4). The claim is therefore made by the suite that does check it, named and linked. Design §5 independently fixes this row as that `(href, text)` pair — the third member of the destination's R-15 triple with `B2.COUNT` and `RAIL.CHIP` 2 — and §8's focus order counts it as stop 16. |
| `B3.LAYOUT` (below the table) | *no slot* | **removed** | `12 bytes of padding after time: the argument` was on the page with no deck slot. Design §5's wording of that idea is a BUILD RULE about the offset column, not page copy; the claim is carried where the deck puts it — the offset column, which never collapses, and the byte ruler's twelve hatched cells. |
| `B4` half-labels | `f32` · `emulated f64` | **`f32 · banded`** · **`f64 (emulated) · smooth`** | The registry's own `splitLabels` stems (`f32`, `f64 (emulated)`) plus the word each half argues with, per design §5's split bezel; §8's 1.4.1 row rests on `banded`/`smooth` being present **in words**, so the split survives a suppressed image. |

**Declined, with reason:** `B1.H2`'s numberless variant (a build assertion beats a hedge — `IA` D-1); a canvas in `write` (the pair belongs to `agree`, `IA` D-3); a CTA in `whowrites` (the seven-verb ladder is full — §7); pixel deltas anywhere (`IA` D-4). **Open in `IA`, not settled here:** D-6 poster frame · D-7 new tab vs same tab · D-8 payload dedupe — none changes a word of copy.

---

## 11. Copy QA checklist

Every row is pass/fail, not judgement.
**Counts** — h1 ≤ 6 words (is 4) · subline ≤ 14 (is 13) · every h2 ≤ 8 words, **with one stated exception: the rail's `Checked by real compilers, every build — in X-GIS CI.` is 9**, because `IA` conflict X4 corrected §4's shorter draft (`Checked by real compilers, every build.`) to stop it implying THIS build ran those gates — the honesty fix costs one word and outranks the cap · every body ≤ 25 words with each sentence ≤ 20 and one main clause · `whowrites`'s Body A is 23 words, Body B 16, and its three reader-sentences ≤ 14 each · code ≤ 10 lines in `write` (owner decision (2)) and ≤ 8 elsewhere · `<title>` ≤ 60 · `meta description` ≤ 155 · `og:title` ≤ 60 · `og:description` ≤ 200 · `og:image` alt ≤ 125 · body copy at US grade 8 or below, proper nouns exempt.

**Forbidden-word sweep** — grep the built HTML for every term in §9, case-insensitive, including this panel's additions. `fast` and `prove` need a human read, not a grep: `fast` passes only beside a number, `prove` / `proven` only with its object in the same sentence.

**Claim → source table.** Every number and named artifact on the page appears here with a build-time route. A claim with no row is deleted before build.

| Claim on the page | Value at `29c9614` | Route |
| --- | --- | --- |
| examples · **both emits from one source** · fp64 examples | 36 · **35** · 13 | `facts.examples` · **`facts.dualTargetExamples`**, a loop over the registry that asserts the count (**M1**) · `facts.fp64Examples` |
| test files | **146** | `facts.testFiles`, widened to the package root — **owner decision (3)** |
| runtime deps · licence · package · release state | 0 · MIT · `@xgis/shader-dsl` · unpublished | **`facts.runtimeDeps`** (absence of all three dep fields) · **`facts.license`** · `facts.packageName` · **`facts.published`** (**M4**) |
| pinned commit · mirror URL | `29c9614` · `github.com/typeshade/typeshade` | `facts.pinnedCommit` · **`facts.mirrorUrl`** |
| authored snippet · its line count | 10 lines | `hero.authored` · **`hero.authoredLines`**, asserted equal to the rendered numeral (`IA` R-3) |
| emit indicator — 29 / 34 lines, byte-identical, 2.9 KB | 29 · 18+16 · 2.9 KB | **`hero.emit`** = `{ wgslLines, glslVertexLines, glslFragmentLines, payloadBytes }`; byte-stability from `examples/emit-goldens.test.ts` + `__emit-goldens__/` |
| the typed diagnostic | `TS2339 · 7:47`, **168 chars**, `truncated: false` | `typedError().diagnostic`, printed verbatim (**M6**) |
| the std140 layout | 48 bytes; 0 / 16 / 32 | `typedError().layout` — the fixture block, not the registry one (`IA` C4) |
| oracle · Tint gate · WebGL2 gate · goldens · package.json · reflect() | — | mirror `src/core/oracle.ts` (re-exported at `src/index.ts:45`), `examples/emit-goldens.test.ts`, `package.json`, `src/core/reflect.ts`; X-GIS `_wgsl-compile-gate.spec.ts`, `_glsl-compile-gate.spec.ts`, `.github/workflows/test.yml` — all linked, all exact URLs in §5 |
| Khronos 64% / ~10% | conditional on owner decision (1) | **`facts.survey` = { figure, n, fieldStart, fieldEnd, url }**, a dated record rendered beside the figures — the page's own rule 6 gets no carve-out for one block |

**Honesty sweep** — the built HTML contains **zero** occurrences of: `npm i typeshade` · `production-ready` · `1.0` · `used by` · `works with` · any star or download count · `0.000%` or any spike pixel figure · `878,943` · `no comparable library` · `Decorative`. **Host names** (`MapLibre`, `deck.gl`, `PixiJS`, `three.js`, `Babylon`) appear **only** inside `whowrites`'s `SOURCES` line — QA asserts the occurrence count equals the number of source links and that none sits in body copy or beside a benefit (§5). X-GIS is the one permitted named consumer.

**Structure and links** — one `h1`, `h2` per section, no skipped levels · every proof chip is real text, not an image · **every CTA destination is a resolved URL, verified 200 at build** (`bun run qa:links` — `scripts/qa/check-http-links.mjs`, a step of `deploy.yml`; 404/410 fails, a 403/429/timeout only warns, and a run where every link warned exits INCONCLUSIVE rather than passing) · no two destinations share link text and no verb repeats at a different destination (§7) · no `here` / `read more` / `click here` / `learn more` / bare URL in body copy · the npm link reads `npm typeshade — reserved for 0.1.0` · `Get started` points at the **same anchored URL** in the hero, `adopt` and the footer · every number carries its unit and label adjacent, so the strip linearises.

**Canvas states** — for **each of the four mounts** capture all applicable states (`webgpu`, `webgl2`, reduced motion, `none`) and confirm caption and `aria-label` name the state actually rendered. A caption reading "running on WebGPU" on the `none` path is a QA failure, not a cosmetic one; so is `B2.CANVAS.GPU` claiming Tint on a WebGL2 fallback (§6).

**The five-stranger test — run before build, not after.** Unmoderated, five strangers, one question: *"What does this product do?"* Two documented misreads to watch. If **2 of 5** answer that TypeShade proves their shaders *correct* in the theorem sense, the "prove" family is over-reaching and `agree`'s h2 must carry the object harder. If **2 of 5** read the headline as a promise that their source survives a host's upgrade untouched, it is leaking the forward-compatibility contract, and the pre-agreed swap is candidate (b)'s line — already scored, already honest: **`Typed shaders you can prove.`** / *TypeScript in; WGSL and GLSL ES 3.00 out, checked by a CPU f64 oracle.* No third line is invented under deadline.

**Standing edit triggers, recorded here so each fires deliberately and once**

| Trigger (an observable, not a date) | Edit |
| --- | --- |
| `SP` §8 **S2 signpost** — the first top-5 web engine shipping WebGPU-only defaults | Retire the dual-target clause from the subline. One clause of one line; the h1 does not move |
| `SP` §13 **D7** — the playground lands | Primary CTA label becomes `Open the playground`; destination changes; wording stays identical in the hero, `adopt` and the footer |
| A cross-backend parity gate is committed to CI (`IA` D-4) | The spike's measurement becomes **rung ④** of `agree`'s ladder and may be printed |
| A 36th example gains a GLSL path, or a 37th lands | `facts.dualTargetExamples` moves the rail chip on its own — no copy edit, which is the point of **M1** |
| TypeGPU or anyone else ships an oracle | Retire the comparative oracle line from the launch post and the docs comparison (monthly release train) |
| `BR`'s fact list is amended for Khronos | `whowrites` switches from **Body B** to **Body A**; `facts.survey` starts rendering |
| The agent-era strategy's decision 1 resolves to **(b) checker over an admitted WGSL subset** (`docs/plans/2026-09-07-typeshade-agent-era-strategy.md` §6, verdict due Q2) | Re-run the D1 panel: the headline moves from an authoring job to the checking job ("an agent wrote it; TypeShade checked it"), `write` gains a `.wgsl` input arm, and the proof ladder gains the rendered-truth rung once the frame differ is committed. Until the verdict, nothing on the page changes |

**Three owner decisions needed before build.** (1) Amend `BR`'s fact list to admit the Khronos 2026 figures (64% / ~10%) — facts about the **market**, never about TypeShade's audience, which is what keeps them clear of `SP` §14's ban; without it `whowrites` ships Body B and loses its proof element. (2) Raise the code-block cap to 10 lines for `write` only: the slice is the `fn(...)` call boundary-to-boundary and trimming to 8 ends on a dangling `},` — note this is **no longer** justified by "this block is the whole source", which **M3** disproved. (3) Widen `facts.testFiles` to the package root, printing **146** instead of `BR`'s 135 (**M5**) — `BR` is the fact authority this deck cites for everything else, so the widening needs the same amendment path as (1). Everything else here is decided.
