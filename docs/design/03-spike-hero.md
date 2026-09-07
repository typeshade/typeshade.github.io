# Technical spike — the live shader hero (2026-09-07)

The hero's main object is the product doing its thing: a real shader, authored in TypeScript,
compiled by TypeShade at build time, rendering live in the visitor's browser. This spike built
that runtime, ran all twelve fullscreen candidates on **both** backends headlessly, and picks one.

**Shipped by this spike**

| File | Role |
| --- | --- |
| `src/lib/hero-shader.ts` | Build-time only. Emits WGSL + GLSL ES 3.00 + the `reflect()` layout for one registry example. |
| `src/lib/shader-runtime.ts` | Browser only. Zero imports from the compiler; creates a pipeline, packs uniforms, draws. |
| `src/components/ShaderCanvas.astro` | `<ShaderCanvas example="…" class="…" />` — canvas + inlined JSON payload + mount. |
| `src/pages/spike.astro` | **Throwaway** comparison bench (`/spike`), one 1440×600 canvas per candidate. Delete after the pick. |
| `src/env.d.ts` | One added line: `/// <reference types="@webgpu/types" />`. |
| `package.json` | One added **devDependency**: `@webgpu/types` (types only — zero runtime dependencies, as the brief requires). |

Nothing shader-side is hand-written and no byte offset is hand-derived: every WGSL string, every
GLSL string, and every std140 offset comes out of `emitModule` / `emitGlslModule` / `reflect()` on
the pinned mirror. `reflect()` is the product's claim, so the hero has to be built on it.

---

## 1. Candidates

Cost is judged **by structure**, not by fps — the verification container rasterises on
SwiftShader, where every number would be a measurement of the software rasteriser. "noise/px"
counts value-noise lattice evaluations per pixel (each is 4 `hash`, each `hash` one `sin`).
Line counts are the emitted GLSL ES 3.00 fragment stage.

| id | Visual character | Cost by structure | White text over it | Mobile |
| --- | --- | --- | --- | --- |
| **metaballs** | Luminous orbs merging and splitting on a near-black (#080a14) ground. Reads as the modern gradient-orb hero (Linear / Stripe / Framer). | 5-iteration loop (slider 2–6), 4 trig + 1 divide each. **No noise, no march.** 39 GLSL lines. | **Excellent** — the ground is the site's own ground and 60–70 % of a 2.4∶1 frame stays dark. | **Best.** Cheapest interesting candidate. |
| **domain-warp** | Marbled teal/rust/cream flow, `fbm(p + w·fbm(p + fbm(p)))`. The most beautiful frame in the set. | 5 unrolled `fbm` = **20 noise/px = 80 `sin`/px**. Branchless. 37 lines. | **Poor without a scrim** — high-contrast cream highlights everywhere. | Heaviest non-march option; ~4× metaballs. |
| **ocean** | Sunset seascape: perspective water plane, sun disc, glitter path. Genuinely pretty. | 4-iteration fBm loop = **4 noise/px**, + 3 `exp`, `pow`, `distance`. 44 lines. | **Poor** — a bright orange horizon band crosses the middle third. | Fine. |
| **fbm-clouds** | Pale blue sky. Washed out, low information. | Loop = `octaves` slider, default 6 → **6 noise/px** (up to 8). 38 lines. | **Poor** — the whole frame is light. | Fine. |
| **kaleidoscope** | Vivid magenta/blue mandala on pure black. Strong medallion, but a centred object in a 2.4∶1 box. | 1 `fbm` = **4 noise/px**, + `atan2`, `mod`, palette. 42 lines. | **Good** at the edges, **bad** across the medallion. | Fine. |
| **heart** | A single red heart, beating. Charming, and completely off-message for a compiler. | Closed-form sextic, 1 `fwidth`, 1 `exp`. **25 lines — the second cheapest.** | Good (mostly black). | Best-in-class cost. |
| **color-ramp** | Orange/red choropleth field with contour isolines. Cartographic, not a hero. | 2 `sin`, 4 ramp stops, 1 `fwidth`. **23 lines — the cheapest.** | **Poor** — light warm field. | Best-in-class cost. |
| **julia** | Escape-time Julia. **Distorted**: uses raw `uv·2−1`, not `screenCoords`, so at 2.4∶1 the set is stretched. Palette drifts to olive/black. | **96** iterations of z²+c with an early break; interior pixels run all 96. 31 lines. | Good (large black field), but the frame changes character every few seconds. | Medium. |
| **mandelbrot** | Rainbow escape-time spike over a large black field, breathing into the seahorse valley. Rainbow is off-brand. | **120** iterations + `log2∘log2`; the black interior pays all 120. 38 lines. | Good, but the composition is a function of wall-clock — unpredictable at any given moment. | Medium-heavy. |
| **raymarch-sphere** | A blue sphere. **Distorted the same way** — raw NDC, so at 2.4∶1 it is a visible ellipse, not a sphere. | **72** sphere-trace steps. 37 lines. | Good, but the object is nearly the same value as the background. | Medium. |
| **raymarch-boxes** | Saturated corridor of coloured boxes flying at the viewer. Busy and loud. | **90** march steps + **6** extra SDF taps for the finite-difference normal. **63 lines — the most expensive by a wide margin.** | **Poor** — high-chroma geometry everywhere. | **Worst.** |
| **fp64-deep-zoom** | Black-and-white split-screen stripes: f32 collapsing on the left, emulated f64 holding on the right. | No loop; df64 `twoSum` chains, each with a `texelFetch` fast-math guard. 61 lines. | Unusable as a background. | Cheap. | 

Two findings worth carrying forward:

- **`julia`, `mandelbrot` and `raymarch-sphere` are authored for a squarish canvas.** They build
  screen coordinates from raw `uv·2−1` instead of `_fullscreen.ts`'s `screenCoords()`, so at a
  hero's 2.4∶1 they are anisotropically stretched — the "sphere" is an ellipse. This is the exact
  bug `_fullscreen.ts:63-70` documents (the ocean's elliptical sun). It disqualifies them from a
  wide hero and is a real, citable observation about aspect-correct authoring.
- **`fp64-deep-zoom` is the only time-independent candidate** — it declares no `time` control — so
  it is the one that can be compared pixel-for-pixel across backends without pinning the clock.
  It came out **byte-identical**; see §4.

## 2. Recommendation

**Hero: `metaballs`.** It is the only candidate whose ground colour is already the page's ground,
it leaves two thirds of a wide frame dark enough for a white headline with no scrim, its motion is
a slow orbital drift rather than a strobe, and it is the cheapest thing in the set that still looks
expensive — a 5-iteration loop of trig, no noise and no ray march, so a 1.5-DPR phone is never at
risk. Structurally it is also the only one designed for interaction (ball 0 follows the pointer),
which is a free upgrade later.

**Runner-up: `domain-warp`.** The best-looking frame by a distance and the closest to the
Unicorn-Studio / Framer benchmark — but it fills the whole frame with high-contrast cream
highlights, so the headline needs a scrim, and at 20 noise evaluations per pixel it costs about
four times the hero on the machines least able to pay.

One caveat to record rather than re-discover: metaballs' cosine palette runs blue → green →
magenta. The blue/violet half sits close to the site accents (`#7dd3fc` / `#c4b5fd`); the green
does not. The palette is inside the mirror's shader and this project must not hand-edit it, so
the choice is to accept the green, or to let the page's own accent do the branding around a
mostly-blue frame.

## 3. What the runtime does — and does not do

**Does**

- Picks a backend by **auditioning** it: creates the pipeline, draws one frame, and only then
  claims the backend. WebGPU first (adapter → device → module → pipeline, with a validation error
  scope and `getCompilationInfo()` checked), else WebGL2, else `'none'`.
- Packs the uniform block straight from the `reflect()` byte offsets, per frame, in seconds.
  Handles the control kinds the mirror's fullscreen examples use: `time`, `resolution`, `mouse`,
  `const`, `slider`, `toggle`, `logmag1d` (packed as two f32 via `Math.fround`, the host half of
  the emulated-double story). Binds the compiler's auto-injected `_fp64` fast-math guard as a 1×1
  white texel on both backends.
- Caps DPR at **1.5**; sizes the drawing buffer from a `ResizeObserver`, not a per-frame layout read.
- Pauses through an `IntersectionObserver` when the canvas is off screen and on `document.hidden`,
  and resumes without a time jump (the clock only accumulates while running).
- `prefers-reduced-motion: reduce` → draws **exactly one** frame, at a pinned clock, and registers
  no observers and no `requestAnimationFrame` at all.
- Honours `?forcegl2=1` (and `opts.forceWebGl2`) to skip the WebGPU probe.
- Writes `data-backend` on the canvas and a live `window.__typeshadeHero = { backend, frames }`.
- Swallows every failure: a mid-flight driver error stops the loop and sets `data-backend="none"`,
  the canvas clears to **transparent**, and `ShaderCanvas.astro` paints a CSS gradient behind it.
  Nothing reaches the console.

Payload cost, measured on the built page: the inlined JSON for `metaballs` (WGSL module + both
GLSL ES 3.00 stages + the reflected layout + controls) is **4.3 KB** uncompressed, before gzip.
The runtime module itself is the only JS the hero adds.

**Does not**

- No pointer input. `mouse` packs `[0,0,0,0]`, and `used = 0` is exactly the flag the examples read
  to render their canonical autopilot framing — the same view thumbnails and render gates see.
- No sliders, no play/pause, no speed control, no camera. The hero is a background, not the
  `/shader-dsl` playground.
- No `pan2d` / `logmag2d` packers. `hero-shader.ts` **throws at build time** on a control kind the
  runtime cannot pack, and on any texture binding that is not `_fp64` — a hero that silently
  renders with a zeroed uniform is worth a build error.
- No resize redraw under reduced motion (one frame means one frame). A rotated phone stretches the
  still frame until reload.
- No WebGPU→WebGL2 *re-*fallback after a successful mount: a device lost later goes to the CSS
  gradient rather than re-mounting on the other backend.

## 4. Backend verification

Built, served from `dist/` by `python3 -m http.server` on `http://127.0.0.1:8765` (loopback is a
secure context, so `navigator.gpu` exists), driven with Playwright 1.60 and
`/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` plus
`--enable-unsafe-webgpu --enable-unsafe-swiftshader --use-angle=swiftshader --use-vulkan=swiftshader --enable-features=Vulkan`.
Viewport 1440×900 at `deviceScaleFactor` 1064/1440, so each 1440-CSS-px canvas captures as a
1064×443 PNG — full resolution for what was rendered, and inside the reading cap. Screenshots are
in `shots/spike/` (git-ignored).

`'gpu' in navigator` = **true** and `requestAdapter()` returned an adapter in **both** arms, so the
WebGL2 arm is a real fallback exercise and not a platform that lacks WebGPU.
**0 console errors, 0 page errors and 0 HTTP ≥ 400** across all three arms.
DPR cap, measured directly at `deviceScaleFactor: 3`: CSS box 800 px → drawing buffer 1200 px,
**ratio exactly 1.500**, in both arms.

### Arm 1 — WebGPU (no query). All 12 canvases reported `data-backend="webgpu"`.
### Arm 2 — WebGL2 (`?forcegl2=1`). All 12 canvases reported `data-backend="webgl2"`.

Per canvas: frames drawn (the runtime's own counter), distinct RGB values in the captured frame,
percentage of non-black pixels, per-channel standard deviation, and the fraction of pixels that
changed between two captures ~700 ms apart. That last column is the one that carries information:
the component paints a CSS gradient behind a transparent canvas, so "the image has ≥ 2 colours"
alone cannot distinguish a running shader from the static fallback — a frame-to-frame delta can.

| id | webgpu frames / webgl2 frames | distinct colours (gpu / gl) | non-black % (gpu / gl) | σ RGB (webgpu) | σ RGB (webgl2) | frame delta % (gpu / gl) |
| --- | --- | --- | --- | --- | --- | --- |
| ocean | 94 / 111 | 4096+ / 4096+ | 100 / 100 | 54.3, 24.1, 11.6 | 55.1, 24.9, 12.0 | 51.47 / 53.77 |
| fbm-clouds | 234 / 219 | 354 / 358 | 100 / 100 | 20.0, 14.3, 7.3 | 20.2, 14.5, 7.4 | 77.12 / 73.78 |
| domain-warp | 139 / 80 | 4096+ / 4096+ | 100 / 100 | 39.1, 41.9, 37.5 | 38.3, 40.8, 36.4 | 82.94 / 79.52 |
| kaleidoscope | 287 / 180 | 4096+ / 4096+ | 41.48 / 41.64 | 39.9, 19.7, 69.5 | 26.9, 29.0, 66.0 | 39.34 / 42.05 |
| **metaballs** | 100 / 67 | 4096+ / 4096+ | 100 / 100 | 15.6, 42.1, 62.1 | 26.4, 45.9, 64.3 | 35.54 / 29.30 |
| raymarch-boxes | 199 / 154 | 4096+ / 4096+ | 100 / 100 | 25.6, 37.0, 46.2 | 28.4, 50.1, 39.8 | 91.93 / 91.50 |
| raymarch-sphere | 97 / 65 | 2452 / 4096+ | 100 / 100 | 5.8, 7.9, 12.5 | 10.2, 14.7, 23.0 | 19.01 / 20.99 |
| julia | 292 / 163 | 2725 / 1419 | 38.73 / 41.54 | 9.0, 14.9, 3.7 | 10.8, 49.2, 106.1 | 60.44 / 62.17 |
| mandelbrot | 139 / 71 | 4096+ / 4096+ | 8.20 / 10.80 | 37.0, 52.2, 33.1 | 38.3, 53.4, 48.4 | 20.21 / 20.10 |
| fp64-deep-zoom | 288 / 157 | 255 / 255 | 96.05 / 96.05 | 73.6, 73.6, 73.6 | 73.6, 73.6, 73.6 | **0 / 0** (expected) |
| heart | 166 / 90 | 1017 / 1276 | 100 / 100 | 51.3, 3.9, 8.0 | 57.4, 4.6, 9.3 | 13.60 / 22.83 |
| color-ramp | 388 / 215 | 4096+ / 4096+ | 100 / 100 | 37.7, 70.7, 44.7 | 37.6, 70.7, 44.7 | 98.05 / 97.13 |

Reading it: every canvas on every backend is far from trivial — the weakest distinct-colour count
is 255 (fp64-deep-zoom is greyscale by construction), the weakest non-black is 8.2 %
(mandelbrot's black interior, which is the picture), and no σ is anywhere near 0. Every canvas
also *moves* except `fp64-deep-zoom`, whose 0.00 % delta is correct: it declares no `time` control,
so its frame is a pure function of its sliders. The `julia` / `kaleidoscope` σ differences between
arms are the two arms sampling different moments of a time-driven `c`, not a backend disagreement —
which is exactly what arm 3 was added to remove.

### Arm 3 — `prefers-reduced-motion: reduce`, both backends: the reduced-motion contract, and parity

Reduced motion pins the clock to a constant, so the same source compiled to WGSL (Tint → Vulkan
SwiftShader) and to GLSL ES 3.00 (ANGLE SwiftShader) becomes comparable pixel-for-pixel.

**Every one of the 12 canvases drew exactly `frames === 1` on both backends.** The contract is
verified directly, not inferred.

| id | pixels differing WGSL↔GLSL | max channel Δ | mean abs Δ (/255) |
| --- | --- | --- | --- |
| fp64-deep-zoom | **0.000 %** | **0** | **0.0000** |
| julia | 0.001 % | 2 | 0.0000 |
| raymarch-sphere | 0.002 % | 1 | 0.0000 |
| fbm-clouds | 0.005 % | 1 | 0.0000 |
| ocean | 0.006 % | 1 | 0.0000 |
| **metaballs** | **0.009 %** | **1** | **0.0000** |
| kaleidoscope | 0.012 % | 1 | 0.0000 |
| raymarch-boxes | 0.027 % | 29 | 0.0002 |
| domain-warp | 0.049 % | 1 | 0.0002 |
| heart | 0.455 % | 13 | 0.0024 |
| mandelbrot | 0.849 % | 216 | 0.0751 |
| color-ramp | 2.412 % | 125 | 0.0188 |

Eight of twelve agree to within one 8-bit level on ≤ 0.05 % of pixels — last-bit rounding, not
disagreement. `fp64-deep-zoom`, the emulated-double example, is **byte-identical**, guard texture
and df64 host packing included. The four larger residuals are all *boundary* effects and none is a
compiler divergence: `mandelbrot` and `raymarch-boxes` flip a pixel that sits exactly on an
iteration/march termination boundary (a chaotic edge amplifies one ulp into a palette phase), and
`color-ramp` and `heart` both build their edges from `fwidth()`, whose derivative quantisation is a
property of the rasteriser's 2×2 quad, not of the emitted source. Mean absolute error stays ≤ 0.075
of one 8-bit level everywhere.

### Arm 4 — no GPU at all: the static fallback

Same page, Chromium launched with `--disable-gpu --disable-software-rasterizer --disable-webgl
--disable-webgl2`. `navigator.gpu` still exists (the object is there; no adapter is) and
`getContext('webgl2')` returns `null`.

All 12 canvases → `data-backend="none"`, `frames: 0`, **0 console errors, 0 page errors**. The
canvas is left transparent and `ShaderCanvas.astro`'s CSS gradient shows through — a dark
blue→violet ambient field, not a black box (`shots/spike/fallback-none.png`). The gradient's far
stops are the same colour at alpha 0 rather than `transparent`, because `transparent` is
transparent *black* and interpolating to it in sRGB leaves a visible dark band; the first version
of this file had exactly that band.

## 5. Known limits

1. **SwiftShader is not a phone.** These arms prove compile / link / bind / draw correctness and
   image content on both APIs. They prove nothing about frame time. The cost column in §1 is
   structural, and a real-device pass belongs in the QA stage.
2. **No cross-backend parity gate exists yet.** Arm 3 is a spike measurement, not a committed test.
   If the hero ever changes, re-run it; the reduced-motion path makes it deterministic and cheap.
3. **A hero mounted while off screen still draws two frames** (the backend audition, plus one tick
   before the `IntersectionObserver`'s first callback lands). Correct, but not zero.
4. **`window.__typeshadeHero` is last-mount-wins.** Fine for a page with one hero; the `/spike`
   bench reads `canvas.__shader` per element instead.
5. **`layout: 'auto'`** on WebGPU means the bind-group layout comes from the pipeline, so a binding
   the shader declares but never reads is absent from group 0. Harmless for these modules (every
   declared binding is used); worth remembering if a hero ever declares a spare.
6. **The `/spike` route is throwaway** and is currently in the sitemap. Delete `src/pages/spike.astro`
   once the hero is chosen.

## 6. The API the page builder calls

```astro
---
import ShaderCanvas from '../components/ShaderCanvas.astro'
---
<section class="relative">
  <!-- absolute + -z-10 puts it behind the headline; the element needs a box from `class`. -->
  <ShaderCanvas example="metaballs" class="absolute inset-0 -z-10" />
  <h1 class="…">…</h1>
</section>
```

`ShaderCanvas` takes exactly two props:

| prop | type | meaning |
| --- | --- | --- |
| `example` | `string` | A mirror registry id (`examples/index.ts`). Unknown, non-renderable, or unpackable → **build error**. |
| `class` | `string?` | Classes on the wrapper. **Sizing is the caller's job** — the wrapper has no intrinsic height. |

It renders `<div class="ts-shader …" data-shader-canvas data-example="…">` containing a
`<canvas role="img" aria-label="Live …" data-backend>` and the JSON payload, paints the CSS
gradient fallback behind the canvas, and mounts every instance on the page from one module script.

For anything more direct, the two libraries are usable on their own:

```ts
// build time (Astro frontmatter only — this imports the compiler)
import { heroShader } from '../lib/hero-shader.ts'
const data = heroShader('metaballs')
//    → { id, title, blurb, wgsl, vertex, fragment, layout, controls }
//      layout: { size, block, group, binding, fields: [{ name, type, offset }],
//                vertexEntry, fragmentEntry, textures }

// browser
import { mountShader } from '../lib/shader-runtime.ts'
const m = await mountShader(canvas, data, { forceWebGl2: false })
//    → { backend: 'webgpu' | 'webgl2' | 'none', frames, stop() }
```

`mountShader` is async (the WebGPU probe is), never rejects, and never throws — a total failure is
reported as `backend: 'none'` with the canvas left transparent.
