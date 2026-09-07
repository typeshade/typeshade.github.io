# TypeShade website — design brief (v2, from scratch) — 2026-09-07

## Why v2

v1 explained the product: three code panes, a comparison table, a paragraph on what WGSL and
GLSL are. The owner's verdict: a landing page is advertising, not documentation. Advertising
does not explain; it makes the visitor want the thing and then shows proof. The hero most of all.

## Product truths (facts, measured on the pinned mirror commit 29c9614)

- Name: **TypeShade**. Tagline of record: _typed shaders in TypeScript, compiled to WGSL and GLSL ES 3.00_.
- Positioning sentence: _the engine-agnostic shader compiler for TypeScript — one typed source
  emits WGSL and GLSL ES 3.00 that are proven to agree._
- Proofs, each already true on this tree: a CPU f64 oracle (no comparable library has one);
  every emitted variant compiles on Tint (WebGPU) and on WebGL2 in CI; emit goldens are
  byte-stable; emulated fp64 with unchanged syntax (the deep-zoom demos); zero runtime
  dependencies; `reflect()` recovers std140 / std430 layouts so nothing is hand-derived.
- Build-time numbers: 36 examples (each emitting both targets), 13 fp64 examples, 135 test files,
  0 runtime dependencies.
- In production inside the X-GIS globe engine as npm `@xgis/shader-dsl`. npm `typeshade` is
  reserved at 0.0.0; `0.1.0` is not released → the honest primary CTA is GitHub / Get started
  (AUTHORING.md), not `npm i typeshade`.
- Against incumbents, one line each: three.js TSL is tied to three; TypeGPU's WebGL2 backend is
  experimental; WESL is complementary; hand-written twin shaders are the tax.
- Links: mirror https://github.com/typeshade/typeshade · guide
  https://github.com/typeshade/typeshade/blob/main/AUTHORING.md · docs
  https://x-gis.github.io/X-GIS/shader-dsl/ · source https://github.com/X-GIS/X-GIS/tree/main/shader-dsl
  · npm https://www.npmjs.com/package/typeshade · license MIT.

## Audience

1. TypeScript developers building WebGL2 / WebGPU visuals (engines, maps, creative coding,
   data-viz) who write shaders or avoid them.
2. Engine and library maintainers (three / Pixi / MapLibre custom layers) paying the
   WGSL + GLSL twin-shader tax.
3. Evaluators who scan for credibility: used-by, tests, license, activity.

## The rule: advertise, do not explain

- **Hero:** a headline of at most 6 words that states a desire or an outcome; one subline of at
  most 14 words; one primary CTA and one secondary. No paragraph. Code is never the hero's main
  object. The main object is the product doing its thing: a real shader compiled by TypeShade,
  rendering live in the visitor's browser (WebGPU, else WebGL2).
- **Below the fold:** show, then name. One claim (≤ 8 words) + one proof (a live thing, a
  number, a 3–8 line snippet) per section; body ≤ 25 words. No definitions of WGSL / GLSL /
  std140. Jargon appears only as a label next to a proof.
- **Voice:** confident, concrete, short. No adjective without a number behind it. No "we", no
  "simply / easily / just / powerful".
- **Code**, where it appears, is ≤ 8 lines and is the hook (what you write). Outputs are an
  indicator ("→ WGSL · GLSL ES 3.00", a compile badge), never full listings.

## Design direction

Benchmark: Linear, Vercel, Stripe, Framer, Raycast, Bun, Vite, Tailwind, Motion, Rive,
Spline, Unicorn Studio. Dark near-black ground, one accent, generous whitespace, a strict type
scale, restrained purposeful motion. The live shader is the colour of the page. Mobile-first;
zero horizontal overflow; `prefers-reduced-motion` respected.

## Tech constraints

- This project: Astro 6 + Tailwind 4 (+ astro-expressive-code, optional), Inter + Geist Mono
  self-hosted, static output, GitHub Pages deploy workflow already present. `bun run build`
  stays green.
- The compiler is consumed through the pinned git submodule `vendor/shader-dsl` (read-only
  mirror). Every shader on the page is EMITTED AT BUILD TIME from it — see `src/lib/examples.ts`
  for the import pattern (`../../vendor/shader-dsl/src/index.ts`, `.../examples/index.ts`).
  Never paste hand-written WGSL / GLSL. Uniform layouts come from `reflect()`, never by hand.
- No new runtime dependency for the live hero: a small dependency-free WebGPU / WebGL2 runner.
  DPR cap, pause when offscreen, `prefers-reduced-motion` → one still frame, static fallback if
  neither API is available.
- English only in the repo. `/home/user/X-GIS` is a read-only reference (its `site/src/lib/
  shader-playground.ts` and `site/src/components/LiveShader.astro` already run these examples
  live). Do not `git commit` — the orchestrator commits.
- Verification tooling in this container: Playwright via
  `import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'`,
  executable `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`,
  software-GPU args for BOTH WebGPU and WebGL2:
  `--enable-unsafe-webgpu --enable-unsafe-swiftshader --use-angle=swiftshader --use-vulkan=swiftshader --enable-features=Vulkan`.
  WebGPU needs a secure context: serve `dist/` on `http://127.0.0.1:<port>` (loopback counts as
  secure) with `python3 -m http.server <port> --directory dist` and assert `'gpu' in navigator`.
  Screenshots: per-section PNGs at most ~1064 px wide, read at full resolution; `shots/` is
  git-ignored.

## Process and deliverables

1. Research + messaging → `docs/design/01-research.md`, `docs/design/02-messaging.md`
2. Technical spike, live hero runtime → `src/lib/shader-runtime.ts`,
   `src/components/ShaderCanvas.astro`, `docs/design/03-spike-hero.md`
3. IA + wireframe + design system → `docs/design/04-ia-wireframe.md`, `docs/design/05-design-system.md`
4. Build → `src/**`
5. QA → `docs/design/06-qa.md` → fixes → sign-off (the orchestrator reads every section
   screenshot at full resolution)

## Success criteria

- In 3 seconds a first-time visitor feels what to want; in 10 seconds they know what it is
  (typed TypeScript → shaders on both GPU APIs) — from the hero visual and ≤ 20 words.
- The hero renders a live TypeShade-compiled shader on WebGPU and on WebGL2, verified
  headlessly on both.
- Zero horizontal overflow at 390 / 768 / 1440; no console errors; canvas and images carry
  accessible names; body-text contrast ≥ 4.5:1.
- `bun run build` green; every number and snippet on the page is computed at build time.
