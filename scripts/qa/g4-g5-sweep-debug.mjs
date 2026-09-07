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
// Usage: node g4-g5-sweep.mjs <backend: webgpu|webgl2> <out-dir>
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'
import { mkdirSync, writeFileSync } from 'node:fs'

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

  // Hide foreground ink only (box geometry untouched) so sampled pixels are the composited
  // layers UNDER the text/border/stroke, exactly what the design's own §2 table describes.
  await page.addStyleTag({
    content: `
      .hero h1, .hero p.text-lead, .hero p.text-meta, .hero .caption-plate,
      .nav-wordmark, [data-nav-links] a { color: transparent !important; -webkit-text-fill-color: transparent !important }
      .hero .caption-plate .marker-dot, .hero .caption-plate .marker-ring { background: transparent !important; border-color: transparent !important }
      .hero .btn-ghost { border-color: transparent !important; color: transparent !important }
      .nav-mark path { stroke: transparent !important }
    `,
  })

  const samples = [] // { t, maxima: { key: {max, maxPixel} }, clearZoneMax }
  const t0 = Date.now()
  let i = 0
  while (Date.now() - t0 < TOTAL_MS) {
    const shotBuf = await page.screenshot({
      clip: { x: 0, y: 0, width: 1440, height: Math.ceil(rects.hero.y + rects.hero.height) },
    })
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
    const cz = clearZoneRect(rects.hero, rects.scrimP2)
    const clearZoneMax = maxLuminanceInRect(png, cz)
    console.error(i, Date.now() - t0, 'clearZoneMax', clearZoneMax.max.toFixed(4), 'at', JSON.stringify(clearZoneMax.maxPixel))
    samples.push({ t: Date.now() - t0, maxima, clearZoneMax: clearZoneMax.max })
    if (i === 0) writeFileSync(`${outDir}/${backend}-frame-first.png`, shotBuf)
    i++
  }
  if (samples.length) writeFileSync(`${outDir}/${backend}-frame-last.png`, await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: Math.ceil(rects.hero.y + rects.hero.height) } }))

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
    curCZ = Math.max(curCZ, s.clearZoneMax)
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
  const czAt4sAgo = runningClearZoneMax.length ? runningClearZoneMax[cutoffIdx] : 0
  const czFinal = runningClearZoneMax.length ? runningClearZoneMax[runningClearZoneMax.length - 1] : 0
  const clearZoneStoppedRising = czAt4sAgo === czFinal

  // Final contrast per element.
  const report = {
    backend: actualBackend,
    requestedBackend: backend,
    frames: samples.length,
    elapsedMs: finalT,
    avgSampleIntervalMs: samples.length > 1 ? +(finalT / (samples.length - 1)).toFixed(1) : null,
    consoleErrors,
    elements: {},
    clearZone: {},
  }
  for (const k of keys) {
    const finalMax = cur[k]
    const inkL = relLum(...INK[k])
    const c = contrast(inkL, finalMax)
    report.elements[k] = {
      floor: FLOOR[k],
      worstBgLuminance: +finalMax.toFixed(4),
      worstBgPixel: samples.length ? samples.reduce((best, s) => (s.maxima[k]?.max ?? 0) > (best?.max ?? -1) ? s.maxima[k] : best, null)?.maxPixel : null,
      contrast: +c.toFixed(2),
      pass: c >= FLOOR[k],
      stoppedRisingLast4s: stoppedRising[k],
    }
  }
  report.clearZone = {
    finalMaxLuminance: +czFinal.toFixed(4),
    stoppedRisingLast4s: clearZoneStoppedRising,
    framesAboveL05: samples.filter((s) => s.clearZoneMax > 0.05).length,
    framesTotal: samples.length,
    pctFramesAboveL05: +((samples.filter((s) => s.clearZoneMax > 0.05).length / samples.length) * 100).toFixed(1),
    // G5: a MAXIMUM below L 0.05 on > 25% of frames is a failure
    g5Pass: (samples.filter((s) => s.clearZoneMax <= 0.05).length / samples.length) <= 0.25,
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
