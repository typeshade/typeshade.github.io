// G4 / G5 — NFR-4 contrast-over-moving-media sweep + "hero is not a black bar".
//
// Method (design 04-ia-wireframe.md §6, 05-design-system.md §10 G4/G5):
//   sample the COMPOSITED hero (canvas + scrims) every 250 ms for 20 s (80 frames) on both
//   backends; take the MAXIMUM luminance inside each element's bounding box across all
//   frames; compute WCAG contrast against that worst pixel; the running worst-case must have
//   STOPPED RISING for the final 4 s (16 frames) or the sweep is invalid and must be extended.
//
// To measure the BACKGROUND behind a glyph (not the glyph's own opaque ink), the foreground
// ink of each measured element is hidden (color/border-color/stroke -> transparent) for the
// duration of the sweep; box geometry is untouched, so the sampled rect is exactly what §2's
// own worst/white columns describe: the composited layers UNDER the text.
//
// TWO PASSES, and the order is load-bearing. G5 is measured FIRST, on an UNTOUCHED page: that
// ink-hiding `addStyleTag` perturbs SwiftShader compositing on this host, and the dips it
// produces land on exactly the quantity G5 reads. Bisected by running the same sampler with
// and without the CSS: without it, 3 runs (24/29/45 samples) saw 0 frames <= L 0.05 and a
// minimum of 0.6017; injecting the identical CSS into an otherwise-clean sampler reproduced
// the dips on demand (7 of 27 samples <= 0.05), and the unfixed script reported 72.2 / 72.4 /
// 78.6 / 92.9 % pass across four runs of the same duration against a > 75 % rung. G4's numbers
// were never affected — they track a running MAXIMUM, which a spurious dark frame cannot move
// — so only G5 moved out from under the CSS.
//
// SAMPLE FLOOR. A single worst-case reading is not a measurement on this host: one run put the
// ghost border at 2.85:1 (worst pixel rgb(73,79,96)) on BOTH backends and four immediate
// re-runs never came within 3:1 of it, against a per-frame variance of 0.004-0.007 luminance —
// a torn readback under back-to-back screenshots, not a render. So the sweep now refuses to
// report a verdict on fewer than MIN_SAMPLES frames per pass, and prints the frame index each
// worst case came from, so a lone outlier is visible as one.
//
// Usage: node g4-g5-sweep.mjs <backend: webgpu|webgl2> <out-dir> [port] [totalMs]
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'
import { mkdirSync, writeFileSync } from 'node:fs'

const shot = async (page, clip) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await page.screenshot({ clip, timeout: 120000 })
    } catch (e) {
      if (attempt >= 1) throw e
      console.error(`  screenshot retry after: ${String(e.message ?? e).split('\n')[0]}`)
    }
  }
}

const backend = process.argv[2] ?? 'webgpu'
const outDir = process.argv[3] ?? 'sweep-out'
const port = process.argv[4] ?? '4417'
mkdirSync(outDir, { recursive: true })

// Target cadence per design doc: 250ms / 80 frames over 20s. Measured on this host,
// page.screenshot() against the SwiftShader-composited hero costs ~150-550ms per call —
// slower than 250ms — so the loop below samples AS FAST AS IT CAN for TOTAL_MS of real
// elapsed time and windows "the final 4s" against actual recorded timestamps rather than a
// fixed frame-count offset. This samples MORE of the animation's period (T = 15.71s) than
// the nominal 20s/80-frame cadence, never less, so it is at least as rigorous.
const TOTAL_MS = process.argv[5] ? Number(process.argv[5]) : 20000
const STOP_RISING_WINDOW_MS = 4000
// >= 25 frames per pass before any verdict is trusted (see the header). The loop below runs
// until BOTH the time budget and this floor are met, so a slow host lengthens the sweep rather
// than shrinking the evidence.
const MIN_SAMPLES = 25
// The design's G4 row says the running worst case must have STOPPED RISING for the final 4 s
// "or the sweep is invalid and must be extended". Capture cost here swings between 0.4 s and
// 22 s per frame with host load, so a fixed budget decides convergence by luck: at 0.42 s a
// 20 s sweep is 48 frames of barely one animation period (T = 15.71 s) and half the elements
// were still creeping at the end, while at 22.7 s the same budget spanned ten minutes and all
// had converged. "Must be extended" is therefore automated rather than left to a reader: the
// loop keeps sampling until every element has stopped rising, up to this cap.
const EXTEND_CAP_MS = 240000

// sRGB relative luminance
const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const relLum = (r, g, b) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

// Known (static, design-time) foreground colours, so contrast = f(known ink, measured worst bg).
// Values from design-system.md §2 @theme block, verbatim.
const INK = {
  h1: [244, 247, 255], // --color-text-1
  sub: [195, 204, 224], // --color-text-2
  status: [195, 204, 224], // --color-text-2
  caption: [195, 204, 224], // --color-text-2 (caption-plate text)
  ctaGhostBorder: [142, 153, 176], // --color-line-3
  navWordmark: [244, 247, 255], // --color-text-1
  navMarkStroke: [244, 247, 255], // currentColor == text-1 on nav-wordmark ancestor
  navLinks: [195, 204, 224], // --color-text-2
}
const FLOOR = {
  h1: 7,
  sub: 4.5,
  status: 4.5,
  caption: 4.5,
  ctaGhostBorder: 3,
  navWordmark: 4.5,
  navMarkStroke: 3,
  navLinks: 4.5,
}

// Per-element "has the running worst stopped rising over the final window" — the same
// computation the report prints, so the loop cannot stop on a rule the report then fails.
function convergence(samples, keys) {
  const out = {}
  if (!samples.length) return { all: false, perKey: out }
  const finalT = samples[samples.length - 1].t
  if (finalT < STOP_RISING_WINDOW_MS * 2) return { all: false, perKey: out }
  let cutoffIdx = 0
  for (let n = 0; n < samples.length; n++) if (samples[n].t <= finalT - STOP_RISING_WINDOW_MS) cutoffIdx = n
  for (const k of keys) {
    let atCutoff = 0
    let final = 0
    for (let n = 0; n < samples.length; n++) {
      const v = samples[n].maxima?.[k]?.max ?? samples[n].max ?? 0
      final = Math.max(final, v)
      if (n <= cutoffIdx) atCutoff = Math.max(atCutoff, v)
    }
    out[k] = atCutoff === final
  }
  return { all: keys.every((k) => out[k]), perKey: out }
}

function maxLuminanceInRect(png, rect) {
  const { x, y, width, height } = rect
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(png.width, Math.ceil(x + width))
  const y1 = Math.min(png.height, Math.ceil(y + height))
  let max = 0
  let maxPixel = null
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (png.width * py + px) << 2
      const r = png.data[idx]
      const g = png.data[idx + 1]
      const b = png.data[idx + 2]
      const l = relLum(r, g, b)
      if (l > max) {
        max = l
        maxPixel = [r, g, b]
      }
    }
  }
  return { max, maxPixel }
}

// x >= --scrim-p2 (65.5% of hero-col-derived stop) — G5's "clear zone". Computed the same way
// global.css computes it: pad-x + hero-col*1.40, at 1440 => 120 + 588*1.4 = 943.2
function clearZoneRect(heroRect, scrimP2Css) {
  return {
    x: scrimP2Css,
    y: heroRect.y,
    width: heroRect.x + heroRect.width - scrimP2Css,
    height: heroRect.height,
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: [
      '--enable-unsafe-webgpu',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--use-vulkan=swiftshader',
      '--enable-features=Vulkan',
    ],
  })
  const url = `http://127.0.0.1:${port}/${backend === 'webgl2' ? '?forcegl2=1' : ''}`
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  // A composited-hero screenshot costs ~1-6 s on this SwiftShader host and occasionally much
  // more under load; Playwright's 30 s default killed a 25-frame pass mid-sweep. The budget is
  // raised and every capture retries once, because losing the whole measurement to one slow
  // readback is the same class of loss as trusting one fast wrong pixel.
  page.setDefaultTimeout(120000)
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => {
    const c = document.querySelector('.hero-canvas canvas')
    return c && c.dataset.backend && c.dataset.backend !== 'none'
  }, { timeout: 10000 })
  const actualBackend = await page.evaluate(() => document.querySelector('.hero-canvas canvas').dataset.backend)

  // Rects (CSS px, at the SAME scroll position throughout: scrollY forced to 0).
  await page.evaluate(() => window.scrollTo(0, 0))
  const rects = await page.evaluate(() => {
    const r = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { x: b.x, y: b.y, width: b.width, height: b.height }
    }
    const hero = document.querySelector('.hero')
    const h1 = document.querySelector('.hero h1')
    const sub = document.querySelector('.hero p.text-lead')
    const status = document.querySelector('.hero p.text-meta')
    const caption = document.querySelector('.hero .caption-plate')
    const ghost = document.querySelector('.hero .btn-ghost')
    const navWordmark = document.querySelector('.nav-wordmark')
    const navMark = document.querySelector('.nav-mark')
    const navLinks = [...document.querySelectorAll('[data-nav-links] a')]
    const navChip = document.querySelector('.nav .state-chip')
    return {
      hero: r(hero),
      h1: r(h1),
      sub: r(sub),
      status: r(status),
      caption: r(caption),
      ctaGhostBorder: r(ghost),
      navWordmark: r(navWordmark),
      navMarkStroke: r(navMark),
      navLinks: navLinks.map(r),
      navChip: r(navChip),
      padX: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad-x')),
      heroCol: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-col')),
      scrimP2: (() => {
        const probe = document.createElement('div')
        probe.style.cssText = 'position:absolute;left:var(--scrim-p2);top:0;width:1px;height:1px;visibility:hidden'
        document.body.appendChild(probe)
        const x = probe.getBoundingClientRect().x
        probe.remove()
        return x
      })(),
    }
  })

  const heroClip = { x: 0, y: 0, width: 1440, height: Math.ceil(rects.hero.y + rects.hero.height) }
  const czRect = clearZoneRect(rects.hero, rects.scrimP2)

  // ── PASS 1 — G5, on the UNTOUCHED page. No injected CSS: see the header. ──────────────
  const czSamples = []
  {
    const t0 = Date.now()
    // No convergence extension here: G5's verdict is the FRACTION of frames whose maximum
    // falls under the floor, not a converged maximum, so extending until the clear-zone max
    // stops rising would only spend the cap. The time budget and the sample floor govern.
    while (Date.now() - t0 < TOTAL_MS || czSamples.length < MIN_SAMPLES) {
      const png = PNG.sync.read(await shot(page, heroClip))
      czSamples.push({ t: Date.now() - t0, max: maxLuminanceInRect(png, czRect).max })
    }
    writeFileSync(`${outDir}/${backend}-clearzone-samples.json`, JSON.stringify(czSamples))
  }

  // ── PASS 2 — G4. Hide foreground ink only (box geometry untouched) so sampled pixels are
  // the composited layers UNDER the text/border/stroke, exactly what §2's table describes.
  await page.addStyleTag({
    content: `
      .hero h1, .hero p.text-lead, .hero p.text-meta, .hero .caption-plate,
      .nav-wordmark, [data-nav-links] a { color: transparent !important; -webkit-text-fill-color: transparent !important }
      .hero .caption-plate .marker-dot, .hero .caption-plate .marker-ring { background: transparent !important; border-color: transparent !important }
      .hero .btn-ghost { border-color: transparent !important; color: transparent !important }
      .nav-mark path { stroke: transparent !important }
    `,
  })

  // One throwaway capture before the sample clock starts. The composite captured immediately
  // after a style mutation is a TRANSITION, not a state the shipped page — which mutates
  // nothing — ever renders: measured on the split sweep, the first frame after this injection
  // held the worst case for 3 of 8 elements on WebGPU and for the ghost border on WebGL2,
  // where it read L 0.0292 against a 0.0045 second-worst. That 6x lone-outlier shape is the
  // 2.85:1 artefact's, and it can only ever make a good page look worse, never a bad one look
  // fine — so it is discarded here rather than left for a reader to recognise in the report.
  await shot(page, heroClip)

  const samples = [] // { t, maxima: { key: {max, maxPixel} } }
  const t0 = Date.now()
  let i = 0
  const elementKeys = ['h1', 'sub', 'status', 'caption', 'ctaGhostBorder', 'navWordmark', 'navMarkStroke', 'navLinks']
  while (
    Date.now() - t0 < TOTAL_MS ||
    samples.length < MIN_SAMPLES ||
    (!convergence(samples, elementKeys).all && Date.now() - t0 < EXTEND_CAP_MS)
  ) {
    const shotBuf = await shot(page, heroClip)
    const png = PNG.sync.read(shotBuf)
    const maxima = {}
    for (const key of ['h1', 'sub', 'status', 'caption', 'ctaGhostBorder', 'navWordmark', 'navLinks']) {
      if (key === 'navLinks') {
        let best = { max: 0, maxPixel: null }
        for (const rc of rects.navLinks) {
          if (!rc) continue
          const m = maxLuminanceInRect(png, rc)
          if (m.max > best.max) best = m
        }
        maxima[key] = best
      } else if (key === 'navMarkStroke') {
        // handled below
      } else {
        const rc = rects[key]
        maxima[key] = rc ? maxLuminanceInRect(png, rc) : { max: 0, maxPixel: null }
      }
    }
    maxima.navMarkStroke = rects.navMarkStroke ? maxLuminanceInRect(png, rects.navMarkStroke) : { max: 0, maxPixel: null }
    if (process.env.QA_DEBUG) console.error(i, Date.now() - t0, 'ctaGhostBorder', JSON.stringify(maxima.ctaGhostBorder))
    samples.push({ t: Date.now() - t0, maxima })
    if (i === 0) writeFileSync(`${outDir}/${backend}-frame-first.png`, shotBuf)
    i++
  }
  if (samples.length) writeFileSync(`${outDir}/${backend}-frame-last.png`, await shot(page, heroClip))

  // Restore ink (harmless, page is about to close) — not required, but leaves no surprise if
  // the same page object is reused.
  await browser.close()

  // Running worst-case per element across all samples so far, at each index.
  const keys = ['h1', 'sub', 'status', 'caption', 'ctaGhostBorder', 'navWordmark', 'navMarkStroke', 'navLinks']
  const runningWorst = {}
  for (const k of keys) runningWorst[k] = []
  const runningClearZoneMax = []
  let cur = {}
  for (const k of keys) cur[k] = 0
  let curCZ = 0
  for (const s of samples) {
    for (const k of keys) {
      cur[k] = Math.max(cur[k], s.maxima[k]?.max ?? 0)
      runningWorst[k].push(cur[k])
    }
  }
  for (const s of czSamples) {
    curCZ = Math.max(curCZ, s.max)
    runningClearZoneMax.push(curCZ)
  }

  // "stopped rising for the final 4s" — find the LAST sample whose real timestamp is <=
  // (finalTimestamp - 4000ms), compare its running-worst value to the final one; equal (no
  // further rise since that point) satisfies the gate. Real timestamps, not a frame-count
  // offset, because capture cadence is not exactly 250ms on this host (see TOTAL_MS comment).
  const finalT = samples.length ? samples[samples.length - 1].t : 0
  const cutoffT = finalT - STOP_RISING_WINDOW_MS
  let cutoffIdx = 0
  for (let n = 0; n < samples.length; n++) if (samples[n].t <= cutoffT) cutoffIdx = n
  const stoppedRising = {}
  for (const k of keys) {
    const n = runningWorst[k].length
    const at4sAgo = n ? runningWorst[k][cutoffIdx] : 0
    const final = n ? runningWorst[k][n - 1] : 0
    stoppedRising[k] = at4sAgo === final
  }
  // G5's own window, over ITS pass's timestamps — not G4's.
  const czFinalT = czSamples.length ? czSamples[czSamples.length - 1].t : 0
  const czCutoffT = czFinalT - STOP_RISING_WINDOW_MS
  let czCutoffIdx = 0
  for (let n = 0; n < czSamples.length; n++) if (czSamples[n].t <= czCutoffT) czCutoffIdx = n
  const czAt4sAgo = runningClearZoneMax.length ? runningClearZoneMax[czCutoffIdx] : 0
  const czFinal = runningClearZoneMax.length ? runningClearZoneMax[runningClearZoneMax.length - 1] : 0
  const clearZoneStoppedRising = czAt4sAgo === czFinal

  // Final contrast per element.
  const report = {
    backend: actualBackend,
    requestedBackend: backend,
    frames: samples.length,
    clearZoneFrames: czSamples.length,
    minSamples: MIN_SAMPLES,
    // A verdict on fewer frames than this is not a verdict (see the header's 2.85:1 outlier).
    enoughSamples: samples.length >= MIN_SAMPLES && czSamples.length >= MIN_SAMPLES,
    elapsedMs: finalT,
    clearZoneElapsedMs: czFinalT,
    avgSampleIntervalMs: samples.length > 1 ? +(finalT / (samples.length - 1)).toFixed(1) : null,
    consoleErrors,
    elements: {},
    clearZone: {},
  }
  for (const k of keys) {
    const finalMax = cur[k]
    const inkL = relLum(...INK[k])
    const c = contrast(inkL, finalMax)
    // Which FRAME the worst case came from, and the second-worst beside it: a worst case that
    // stands alone by an order of magnitude is the torn-readback artefact the header describes,
    // and it is only visible if the report says where it came from.
    const sorted = samples.map((s, n) => ({ n, max: s.maxima[k]?.max ?? 0 })).sort((a, b) => b.max - a.max)
    report.elements[k] = {
      floor: FLOOR[k],
      worstBgLuminance: +finalMax.toFixed(4),
      worstBgPixel: samples.length ? samples.reduce((best, s) => (s.maxima[k]?.max ?? 0) > (best?.max ?? -1) ? s.maxima[k] : best, null)?.maxPixel : null,
      worstFrameIndex: sorted.length ? sorted[0].n : null,
      secondWorstLuminance: sorted.length > 1 ? +sorted[1].max.toFixed(4) : null,
      contrast: +c.toFixed(2),
      pass: c >= FLOOR[k],
      stoppedRisingLast4s: stoppedRising[k],
    }
  }
  report.clearZone = {
    finalMaxLuminance: +czFinal.toFixed(4),
    minMaxLuminance: czSamples.length ? +Math.min(...czSamples.map((s) => s.max)).toFixed(4) : null,
    stoppedRisingLast4s: clearZoneStoppedRising,
    framesAboveL05: czSamples.filter((s) => s.max > 0.05).length,
    framesTotal: czSamples.length,
    pctFramesAboveL05: czSamples.length ? +((czSamples.filter((s) => s.max > 0.05).length / czSamples.length) * 100).toFixed(1) : null,
    // G5: a MAXIMUM below L 0.05 on > 25% of frames is a failure
    g5Pass: czSamples.length ? (czSamples.filter((s) => s.max <= 0.05).length / czSamples.length) <= 0.25 : false,
    measuredBeforeInkHiding: true,
  }
  report.navChipStaticContrast = (() => {
    // NAV.CHIP has an opaque background (--color-surface-2), so its contrast is backend
    // invariant; reported once rather than swept. text-4 #828DA4 on #10151F.
    const chipInk = relLum(130, 141, 164)
    const chipBg = relLum(16, 21, 31)
    return { contrast: +contrast(chipInk, chipBg).toFixed(2), floor: 4.5, note: 'opaque background, exempt from moving-media sweep' }
  })()
  writeFileSync(`${outDir}/${backend}-report.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

run().catch((e) => { console.error(e); process.exit(1) })
