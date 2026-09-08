# Messaging and copy — TypeShade — 2026-09-07

> **Superseded for page copy by `07-copy-deck.md` (2026-09-07).** The oracle-uniqueness line that appeared three times in this document was refuted (`wgsl_reflect` ships a WGSL CPU executor — `docs/plans/2026-09-07-typeshade-agent-era-strategy.md` §2) and is struck below; the copy deck §1 row 5 records the deletion from the page.

> **Decoupled 2026-09-07 (owner decision).** TypeShade removes its relationship with its one production consumer from **every public surface** — the MapLibre ↔ deck.gl shape, where a library never advertises or links the project that ships it. Every "in production inside …" claim, every consumer-scoped package name and every link into that consumer's repository is struck below and rewritten to what the mirror can show on its own: its own examples, its own CI, its own gate. Three places are deliberately left as **measurement history**, marked in place: the 5-second hero mock (§4), objection 9's original answer, and the v1→rewrite table's row 4. The copy of record is `07-copy-deck.md` §1 M2, §9 and §11.

Built from the product truths in `docs/design/00-brief.md` only. Nothing here names a feature, a
number or a user that is not in that file. Page structure follows the pattern library in
`docs/design/01-research.md` Part D, cited by pattern id (**P1**–**P10**).

**Facts this copy may use** — one typed TypeScript source emitting WGSL and GLSL ES 3.00 · CPU f64
oracle · every WGSL emit compiled by Tint and every renderable example linked by WebGL2 in the mirror's own CI, on every push
(2026-09-07) · byte-stable emit goldens · emulated fp64 with unchanged syntax · `reflect()`
recovering std140 / std430 layouts · 0 runtime dependencies · 36 examples · 13 fp64 examples · 135
test files · MIT · `0.1.0` unreleased, npm `typeshade` reserved at `0.0.0`. **Struck 2026-09-07:**
"in production inside the … globe engine as `@xgis/shader-dsl`" — no consumer is a usable fact
for this copy any more.
Every number renders from `src/lib/examples.ts` at build time — never typed into the page (**P6**).

---

## 1. Positioning (Moore)

> **For** TypeScript developers and engine maintainers **who** must put the same shader on WebGPU
> and WebGL2, **TypeShade is** an engine-agnostic shader compiler for TypeScript **that** turns one
> typed source into WGSL and GLSL ES 3.00. **Unlike** three.js TSL, which is tied to its renderer,
> and TypeGPU, whose WebGL2 backend is experimental, **TypeShade** proves the two outputs agree —
> a CPU f64 oracle over the same source, and every emitted variant compiled by Tint and by WebGL2
> in CI.

Moore's statement is an **internal alignment artifact**. It is never printed on the page; every
public line below is derived from it and shortened.

**Honesty audit — each slot traced to a brief fact**

| Slot            | Filled with                                                                         | Traces to                                      |
| --------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| Target          | TypeScript devs building WebGL2/WebGPU visuals; engine and library maintainers      | Brief, _Audience_ 1 and 2                      |
| Need            | The same shader on both APIs                                                        | Brief, "hand-written twin shaders are the tax" |
| Category        | Engine-agnostic shader compiler for TypeScript                                      | Brief, _Positioning sentence_                  |
| Key benefit     | One typed source → WGSL + GLSL ES 3.00                                              | Brief, _Tagline of record_                     |
| Alternative     | three.js TSL (tied to three); TypeGPU (WebGL2 backend experimental)                 | Brief, _Against incumbents_                    |
| Differentiation | CPU f64 oracle; Tint + WebGL2 compile gates in CI                                   | Brief, _Proofs_                                |
| **Not claimed** | A renderer, a runtime, adapters, a playground, **any customer at all** (2026-09-07) | Not in the brief → forbidden                   |

---

## 2. Message architecture

**Brand promise** (one line; the source every headline is cut from, never printed verbatim)

> Write the shader once; both GPU APIs get one, and their agreement is checked rather than assumed.

| Pillar                                    | Statement (≤ 8 words)               | Proof points                                                                                                                                                                                                                   | Feature evidence                                                                                                                                     |
| ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P-1 · Write it once** _(the job)_       | One source, both GPU APIs           | 36 examples, each emitting both targets; the hero shader on this page is one of them, emitted at build time from the pinned mirror; emit goldens are byte-stable                                                               | One module → `emitModule()` for WGSL, `emitGlslModule()` for GLSL ES 3.00 — the call pair `src/lib/examples.ts` already uses                         |
| **P-2 · Proven to agree** _(the trust)_   | Agreement is measured, not promised | CPU f64 oracle over the same typed source both emitters read (uniqueness claim struck 2026-09-07 — see the note at the top); every emitted variant compiled by Tint (WebGPU) and by WebGL2 in CI; 135 test files               | The oracle executes the same source on the CPU in f64; the CI gates compile each emitted variant with the real compilers; goldens diff byte for byte |
| **P-3 · Fits what you have** _(the risk)_ | No engine. No dependencies.         | 0 runtime dependencies; MIT; nothing to ship beside the emitted shader text (2026-09-07, replacing the production-consumer proof); `reflect()` recovers std140 / std430; emulated fp64 with unchanged syntax, 13 fp64 examples | `reflect()` returns the layout, so no offset is hand-derived; the fp64 deep-zoom examples read like their f32 counterparts                           |

### The "so what" ladder

Each pillar walked feature → benefit → outcome → emotion. **The page speaks from the right-hand
end; the left-hand end is the footnote.** That inversion is the whole "advertise, do not explain"
rule stated as a method — the rejected v1 published the _feature_ column.

|             | P-1 Write it once                                                        | P-2 Proven to agree                                                             | P-3 Fits what you have                                                                              |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Feature** | One typed module emits WGSL and GLSL ES 3.00                             | CPU f64 oracle · Tint gate · WebGL2 gate · byte-stable goldens · 135 test files | 0 runtime dependencies · MIT · `reflect()` for std140/std430 · emulated fp64                        |
| **Benefit** | One file to edit instead of two                                          | Divergence surfaces in CI, not in a bug report                                  | Nothing enters the bundle; no offset by hand; precision does not force a rewrite                    |
| **Outcome** | Adding WebGPU stops being a second shader codebase to staff and maintain | You can ship a backend you cannot test on every machine you support             | It drops into the renderer you already have — the output is shader text, not a runtime (2026-09-07) |
| **Emotion** | **Relief** — the dread of the second copy is gone                        | **Confidence** — you can trust code you did not read                            | **Safety** — a reversible decision                                                                  |
| **Used at** | Hero (**P1**)                                                            | Section 3 (**P5**, **P6**)                                                      | Section 6 (**P3**)                                                                                  |

---

## 3. Objection handling

Answered in page order, so a visitor scrolling top to bottom meets each objection at the moment it
forms. Nothing is answered twice and nothing is answered with a table (**P10**).

| #   | Objection (visitor's words)                                 | Response                                                                                                                                                                                                                                                                                                              | Answered at                                                  |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | "What even is this in five seconds?"                        | Headline + the live shader beside it: a real TypeShade-compiled shader is running in front of you                                                                                                                                                                                                                     | Hero (**P1**, **P2**)                                        |
| 2   | "Is this real, or a weekend project?"                       | Compiled by Tint and by WebGL2 every build; 36 examples; 135 test files; 0 dependencies; the pinned commit is printed                                                                                                                                                                                                 | Section 1, proof strip (**P5**)                              |
| 3   | "How much do I have to write?"                              | The complete source of the shader running above, in eight lines                                                                                                                                                                                                                                                       | Section 2 (**P4**)                                           |
| 4   | "Generated shaders drift. Why trust output I didn't write?" | Agreement is measured: a CPU f64 oracle over the same source, both outputs compiled by the real compilers, goldens byte-stable                                                                                                                                                                                        | Section 3                                                    |
| 5   | "I'd have to learn a new language."                         | It is TypeScript. A wrong field is a type error while you type                                                                                                                                                                                                                                                        | Section 4                                                    |
| 6   | "std140 offsets are where this falls over."                 | `reflect()` returns the layout; no offset is hand-derived                                                                                                                                                                                                                                                             | Section 4, second proof                                      |
| 7   | "f32 precision will kill my deep zoom."                     | Emulated fp64, same syntax as f32; 13 fp64 examples                                                                                                                                                                                                                                                                   | Section 5                                                    |
| 8   | "Is it welded to three.js? What does it drag in?"           | 0 runtime dependencies, MIT; the host is yours to pick                                                                                                                                                                                                                                                                | Section 6                                                    |
| 9   | "0.1.0 is unreleased — is anyone actually using it?"        | ~~It runs in production inside the … globe engine as `@xgis/shader-dsl`, today~~ **(superseded 2026-09-07 — the answer named a consumer).** Now: the compiler is checked by its own CI on every push, and there is nothing to ship beside the emitted text — the reader evaluates the artifact, not its customer list | Hero status line, restated in section 6                      |
| 10  | "So how do I install it?"                                   | npm `typeshade` is reserved for 0.1.0; start from the mirror and the authoring guide                                                                                                                                                                                                                                  | Hero status line; footer link labelled with its actual state |
| 11  | "Why not TypeGPU / TSL / WESL?"                             | One honest line each, in the docs — **not on the landing page**                                                                                                                                                                                                                                                       | Docs. Deliberately absent here (**P10**)                     |

Objections 9 and 10 are the honesty pair. Neither is hidden, neither leads, and both are converted
into proof rather than apology: "unreleased" is answered by a named production consumer.

---

## 4. Hero

Eight candidates. Headline ≤ 6 words, no `compiler` / `DSL` / `emits`. Subline ≤ 14 words, may name
the mechanism (**P1**). **Formula** = the structure the line runs. Scores 1–5: **C**larity ·
**D**esire · **X** distinctiveness · **H**onesty.

| #   | Headline (words)                       | Subline (words)                                                                    | Formula                                          | C   | D   | X   | H   | Σ      |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ | --- | --- | --- | --- | ------ |
| 1   | **Write the shader once.** (4)         | Typed TypeScript in; WGSL and GLSL ES 3.00 out, proven to agree. (12)              | **BAB** — After stated, Before implied by "once" | 5   | 5   | 3   | 5   | **18** |
| 2   | One shader. Two GPU APIs. (5)          | Author in TypeScript; WebGPU and WebGL2 each get one that agrees. (12)             | **FAB** — feature→advantage, compressed          | 5   | 3   | 3   | 5   | 16     |
| 3   | Stop writing shaders twice. (4)        | One typed source, checked against WGSL and GLSL ES 3.00 in CI. (12)                | **PAS** — Problem named, Solution implied        | 4   | 5   | 4   | 5   | **18** |
| 4   | Never port a shader again. (5)         | One typed source covers WebGPU and WebGL2, proven to agree. (10)                   | **PAS**, absolute                                | 4   | 5   | 4   | 3   | 16     |
| 5   | The twin-shader tax ends. (4)          | One typed TypeScript source; WGSL and GLSL ES 3.00 both come out. (13)             | **PAS**, agitation-forward                       | 2   | 4   | 5   | 4   | 15     |
| 6   | Ship WebGPU. Keep WebGL2. (4)          | One typed TypeScript source; a CPU oracle proves both outputs agree. (11)          | **BAB** — Before = the either/or, After = both   | 5   | 5   | 5   | 4   | **19** |
| 7   | Typed shaders, proven on both. (5)     | TypeScript in; WGSL and GLSL ES 3.00 out, compiled in CI. (11)                     | **FAB** + category-claim                         | 3   | 3   | 4   | 5   | 15     |
| 8   | Two backends, one source of truth. (6) | Typed TypeScript becomes WGSL and GLSL ES 3.00, checked against a CPU oracle. (13) | **FAB** / 4 U's _Useful_                         | 4   | 4   | 3   | 5   | 16     |

Score notes. #4 loses honesty on "Never" — an absolute the brief cannot back. #5 loses clarity
because "twin-shader tax" is the owner's phrase, not the visitor's. #6 tops the table but presumes
a migration the visitor may not be in, and "Ship WebGPU" can be read as TypeShade supplying a
renderer, which it does not. #7's "on both" has no antecedent inside a five-word line.

### Recommended

> # Write the shader once.
>
> Typed TypeScript in; WGSL and GLSL ES 3.00 out, proven to agree.
>
> **`Get started`** (primary → `AUTHORING.md`) · `GitHub` (secondary → mirror)
>
> _under the CTAs:_ 0.1.0 is not published yet. Running in production today inside the X-GIS globe engine.
> _(**as tested**. The line that ships since 2026-09-07 is `0.1.0 is not published yet. The read-only mirror is the package.` — the panel score above was measured on the string as written, so it is kept verbatim rather than back-dated.)_
> _nav chip (**P9**):_ `pre-release`
> _caption under the live canvas:_ the shader above, running on **WebGPU** _(substituted at runtime: WebGPU / WebGL2 / still frame)_

**4 U's check** — _Useful_: yes, it names the job. _Ultra-specific_: carried by the subline's
`WGSL` / `GLSL ES 3.00`, not the headline. _Unique_: moderate; the subline's "proven to agree"
supplies it. _Urgent_: absent, deliberately — urgency on a pre-release compiler would be dishonest.

**Defence (5 lines).**
It is the visitor's own sentence in four words, and it is a desire rather than a mechanic — the live
canvas beside it already answers "what", so the headline does not have to (**P1**, **P2**).
It is inclusive where #6 is not: it lands whether the reader has shipped WebGL2 or has never written
a shader, covering audience 1 and audience 2 with one line.
The subline carries the whole 10-second payload — typed TypeScript, both target languages, and the
differentiator: agreement checked over the same typed source, not asserted.
BAB beats the PAS candidates here because the page has no room to agitate: agitation needs a
paragraph, and the brief allows twenty words.
Honesty is intact and correctly placed — the pre-release line sits under the CTAs, after the claim,
where the reference pages put version state, never above the headline as v1 had it (**P9**).

---

## 5. CTA copy and funnel stage

Button copy is **imperative** throughout, never first-person ("Start my…"). All 24 reference pages
use the imperative; first-person button copy is a signup-funnel device and there is no signup here.
Every tertiary CTA uses a **different verb pointing at a different destination** (**P8**).

| Tier | Copy                         | Destination                             | AARRR stage                      | Placement       | Why this wording                                                                                                                                                        |
| ---- | ---------------------------- | --------------------------------------- | -------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1°   | `Get started`                | `AUTHORING.md`                          | **Activation**                   | Hero, section 6 | The lowest-friction route to a first working shader. `npm i typeshade` would be the conventional primary and would not work — it is therefore never printed as a CTA    |
| 2°   | `GitHub`                     | Mirror                                  | **Consideration**                | Hero, footer    | Audience 3 scans tests, licence and activity before reading a word of copy                                                                                              |
| 3°   | `See the examples`           | Docs examples                           | Consideration                    | Section 2       | Names its destination; not "learn more"                                                                                                                                 |
| 3°   | `Read the CI workflow`       | the mirror's `.github/workflows/ci.yml` | Consideration                    | Section 3       | Lets a sceptic verify the differentiator instead of believing it. _(Was `Read the CI gates` → a consumer's `test.yml`; re-pointed 2026-09-07, same verb, same slot.)_   |
| 3°   | `Open the deep-zoom example` | fp64 example                            | Awareness → Consideration        | Section 5       | The one artifact nothing comparable has; worth its own verb                                                                                                             |
| 3°   | `llms.txt`                   | `/llms.txt`                             | **Acquisition**, agent-native    | Footer          | Agents are a discovery channel, not an afterthought                                                                                                                     |
| —    | _(none)_                     | —                                       | **Revenue, Retention, Referral** | —               | Nothing is for sale, `0.1.0` is unpublished, and there is no account. A `Pricing` or `Sign up` CTA would be dishonest, so those funnel stages are deliberately unserved |

---

## 6. Section-by-section copy

Six sections and a footer. Rhythm: **solution → credibility → hook → proof → capability ×2 → close**
— the reference median of 6–7 blocks (**P7**), credibility at fold + 1 (**P3**), one claim each.

### Hero — _solution_

- **Purpose** — make the visitor want it in three seconds; a real TypeShade-compiled shader is the object.
- **Claim** — Write the shader once.
- **Proof shown** — the live shader filling the hero; caption naming the backend it is on.
- **Body** — Typed TypeScript in; WGSL and GLSL ES 3.00 out, proven to agree.
- **Micro-label** — `pre-release` · **Patterns** — P1, P2, P9

### 1 · Proof strip — _credibility_

- **Purpose** — borrow trust before making a single argument, as every reference page does at fold + 1.
- **Claim** — Checked by real compilers, every build.
- **Proof shown** — five build-time chips: `WGSL → Tint` · `GLSL ES 3.00 → WebGL2` · `36 examples, both targets` · `135 test files` · `0 runtime dependencies`, with the pinned commit beneath.
- **Body** — Every shader on this page was emitted at build time by the compiler pinned at that commit. None is hand-written. _(20 words)_
- **Micro-label** — `build time` · **Patterns** — P3, P5, P6 · **Answers objection 2**

### 2 · What you write — _hook_

- **Purpose** — show the whole cost of authoring in one glance, with its result already visible above.
- **Claim** — Eight lines. Both shader languages.
- **Proof shown** — the authored fragment function, ≤ 8 lines, from `hero.authored`; beside it the indicator `→ WGSL · GLSL ES 3.00`. **No output listings.**
- **Body** — That is the whole source for the shader running above. Both targets come out of it, byte for byte the same every build. _(23 words)_
- **Micro-label** — `you write` · **CTA** `See the examples` · **Patterns** — P2, P4 · **Answers objection 3**

### 3 · Proven to agree — _proof_

- **Purpose** — turn "generated shaders drift" into a checked fact; the claim that is checked rather than asserted.
- **Claim** — Agreement is measured, not promised.
- **Proof shown** — a three-rung ladder, one badge per rung: the same source run on a **CPU f64 oracle** → every emitted variant compiled by **Tint** → every emitted variant compiled by **WebGL2**; `135 test files` beneath.
- **Body** — The same source runs on a CPU in f64. Both emitted shaders are compiled by the real compilers, every commit. _(20 words)_
- **Micro-label** — `CPU f64 oracle · Tint · WebGL2` · **CTA** `Read the CI workflow` _(re-worded 2026-09-07)_ · **Pillar P-2** · **Answers objection 4**

### 4 · The editor catches it — _capability_

- **Purpose** — move shader failure from a black frame at runtime to a squiggle while typing, and delete hand-derived layout arithmetic.
- **Claim** — Wrong field, red squiggle, not black frame.
- **Proof shown** — a typed error on a wrong field, and `reflect()` returning the layout beside the struct that produced it.
- **Body** — A wrong field is a type error while you type. Uniform layouts come from `reflect()`, so no offset is hand-derived. _(20 words)_
- **Micro-label** — `std140 · std430` · **Patterns** — P2 · **Answers objections 5 and 6**

### 5 · Deep zoom — _capability_

- **Purpose** — show the one capability nothing comparable has, as a picture rather than a sentence.
- **Claim** — Zoom past what f32 holds.
- **Proof shown** — a live fp64 deep-zoom example running; `13 fp64 examples` as the badge.
- **Body** — The GPU has no f64. The emulation does, and the source reads exactly like the f32 version. _(17 words)_
- **Micro-label** — `emulated fp64` · **CTA** `Open the deep-zoom example` · **Answers objection 7**

### 6 · Where it runs — _close_

- **Purpose** — answer "is it welded to an engine, and what am I actually adopting" honestly, then close on the real CTA. _("is anyone using it" was the second half until 2026-09-07; it is not a question this page answers with a name any more.)_
- **Claim** — No engine. No dependencies.
- **Proof shown** — `0 runtime dependencies` · `MIT` · the pinned commit; the CTA pair repeated. _(three chips since 2026-09-07 — the package-name chip carried a consumer's npm scope.)_
- **Body** — Nothing here is a runtime: the output is shader text. 0.1.0 is not published yet — start from the mirror and the guide. _(22 words; first sentence rewritten 2026-09-07)_
- **Micro-label** — `MIT` · **Pillar P-3** · **Answers objections 8, 9, 10**

### Footer

- **Purpose** — the four destinations an evaluator wants, each labelled with its actual state.
- **Columns** — **Start**: `Get started`, `Docs` · **Source**: `GitHub`, `29c9614` · **Package**: `npm typeshade — reserved for 0.1.0` · **Agents**: `llms.txt` _(the deck §7 wordings; the `X-GIS source` row is deleted 2026-09-07 and `Docs` now resolves to the mirror's own README.)_
- **Body** — TypeShade · MIT · compiled from the mirror pinned at _(commit)_.

**Deliberately absent, and why** — no comparison table (**P10**); no output listings (**P4** —
Tailwind never prints generated CSS); no customer-logo band (there is exactly one production
consumer and section 6 names it); no definitions of WGSL, GLSL ES 3.00 or std140; no urgency device,
countdown or waitlist.

---

## 7. Brand voice

**NN/g four dimensions.** Position on each axis, with the reason. Three of four sit at the sober end
for one reason: **the product's single differentiator is proof, and a voice that oversells is
evidence against the claim.** Tailwind can be funny because nobody doubts that a class applies a
margin; TypeShade cannot, because the whole pitch is "trust this".

| Dimension                          | Position                                                                    | Do                                                                       | Don't                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Funny ←→ **Serious**               | **4 / 5 serious.** One dry line per page, never a joke that must be decoded | "The GPU has no f64. The emulation does."                                | "Keep stacking filters until your designer asks you to please, please stop." — Tailwind's register, wrong for a verification claim |
| Formal ←→ **Casual**               | **3 / 5, casual-neutral.** Contractions fine; corporate register not        | "That is the whole source for the shader running above."                 | "TypeShade offers a comprehensive suite of tooling designed to…"                                                                   |
| **Respectful** ←→ Irreverent       | **4.5 / 5 respectful.** The reader is being asked to trust generated code   | "Both emitted shaders are compiled by the real compilers, every commit." | "Stop hand-writing shaders like it's 2019."                                                                                        |
| Enthusiastic ←→ **Matter-of-fact** | **4.5 / 5 matter-of-fact.** The core of the brand                           | "36 examples, each emitting both targets."                               | "Incredibly fast, beautifully typed shaders!"                                                                                      |

**Rules**

1. Every adjective carries a number or a proper name — or it is deleted.
2. Never "we" or "our". The page speaks about the compiler, not about its authors.
3. Present tense, active, declarative. State what is; never what will be.
4. One idea per sentence, ≤ 20 words. No sentence has three clauses.
5. Jargon appears only as a **label attached to a proof**, never as the subject of a sentence the reader must decode.
6. Numbers render at build time and carry their unit and their source. A number with no source is deleted (**P6**).
7. Nothing is claimed that a reader cannot check from a linked page.
8. Pre-release status is stated **once**, after the first claim, never above the headline (**P9**).
9. If a competitor is named, one honest line and no scorecard (**P10**).
10. No exclamation marks, no rhetorical questions, no em-dash pile-ups.

**Forbidden words**

_From the brief_ — we · our · simply · easily · just · powerful.

_Added_ — seamless(ly) · blazing / blazingly · lightning-fast · fast (without a number) · robust ·
solid · rock-solid · battle-tested · production-ready (unless a named production consumer stands
beside it) · enterprise-grade · world-class · best-in-class · industry-leading · comprehensive ·
flexible · modern · next-generation · cutting-edge · revolutionary · game-changing · effortless ·
magic / magical · delightful · intuitive · beautiful · amazing · awesome · unleash · supercharge ·
empower · leverage · unlock · boost · out of the box · plug and play · zero-config · first-class ·
feature-rich · fully-featured · incredibly · extremely · very · really · of course · obviously.

**Before → after**

| #   | v1 (rejected)                                                                                                                                                                                          | Rewritten                                                                                                                                                                                                                                                                                                 | Move                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | "One source — Author a shader once in TypeScript. The compiler emits WGSL for WebGPU and GLSL ES 3.00 for WebGL2."                                                                                     | **One source. Both targets.** WGSL and GLSL ES 3.00, out of the eight lines above.                                                                                                                                                                                                                        | Feature → outcome; claim ≤ 8 words (**P5**)                                                                                          |
| 2   | "Typed — Types are checked while you write. A wrong field or return is an editor error, not a runtime shader error."                                                                                   | **The editor catches it, not the GPU.** A wrong field is a squiggle, not a black frame.                                                                                                                                                                                                                   | Mechanism → felt consequence                                                                                                         |
| 3   | "Verified — The same shader runs on a CPU oracle, and both outputs are compiled by real shader compilers in CI."                                                                                       | **Agreement is measured, not promised.** One source, run in f64 on a CPU. Both outputs, compiled by Tint and by WebGL2.                                                                                                                                                                                   | Names the real compilers; sentence ≤ 20 words                                                                                        |
| 4   | "The compiler is in production inside the X-GIS globe engine as @xgis/shader-dsl. The typeshade npm package is reserved until the 0.1.0 release. Until then, add the read-only mirror as a submodule." | **Running in a globe engine today.** 0.1.0 is not published yet — start from the mirror. _(`@xgis/shader-dsl` as the chip beside it)_ **— both columns superseded 2026-09-07; neither the rewrite nor its chip may name a consumer. What ships: `Nothing here is a runtime: the output is shader text.`** | Apology → proof; 33 words → 15. The 2026-09-07 edit does not restore the apology: it answers the same objection without the consumer |
| 5   | "Where it fits" + the four-column table (TypeShade / three.js TSL / TypeGPU × host / targets / note)                                                                                                   | **No engine to adopt.** A plain module, 0 runtime dependencies. The host is yours to pick.                                                                                                                                                                                                                | Table deleted (**P10**); comparison moves to the docs                                                                                |

Note on #5: the strategy doc's fuller line ("the same module drives a raw WebGPU app, a Pixi host, a
MapLibre custom layer") is **not** used — those adapters are planned, not shipped, and the brief
forbids inventing a feature. `0 runtime dependencies` is the claim that is true today.

---

## 8. Copy accessibility

**Reading level** — body copy at US grade 8 or below (Flesch–Kincaid). Sentences ≤ 20 words, one
main clause. Proper nouns (`WGSL`, `GLSL ES 3.00`, `std140`, `Tint`, `f64`) are exempt from the
grade target but may never be the subject a sentence turns on; they ride as labels on a proof.
Expand nothing the reader can safely ignore: someone who does not know `std140` still understands
"no offset is hand-derived".

**Link text**

- Link text names its destination as a noun: `Get started`, `GitHub`, `scripts/compile-gate.ts`. Never `here`, `read more`, `click here`, `learn more`, or a bare URL in body copy. _(The examples were `Authoring guide`, `GitHub mirror`, `X-GIS source` — the first two were re-worded by deck §7's one-destination-one-wording pass, the third deleted 2026-09-07.)_
- One destination, one wording, everywhere on the page.
- Two different destinations never share link text — an evaluator tabbing the page hears the link list alone.
- The npm link is labelled with its actual state: `npm typeshade — reserved for 0.1.0`.
- Links leaving the site carry a visible marker and name the host where the words do not.
- A link inside a sentence wraps the whole noun phrase, not one word inside it.

**The canvas accessible name**

- `role="img"` plus an `aria-label` naming what is drawn and where it runs, backend substituted at runtime: `Live gradient shader compiled by TypeShade, running on WebGPU` (or `…on WebGL2`).
- Under `prefers-reduced-motion` the canvas renders one still frame and the label becomes `Still frame of a gradient shader compiled by TypeShade, rendered on WebGPU`.
- The static fallback image (neither API available) carries the same sentence as its `alt`.
- The visible caption beneath the canvas repeats the backend in text — the fact is never carried by colour, motion or the image alone.
- The label is generated from the same build-time example record as the shader, so it cannot drift from what is drawn.

**Structure** — one `h1` (the hero headline), `h2` per section, no skipped levels. Every proof chip
is real text, never an image of text. Every number carries its unit and its label adjacent, so the
proof strip reads correctly when linearised by a screen reader.
