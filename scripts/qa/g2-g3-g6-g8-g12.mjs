// G2 (fonts/CLS) + G3 (INV-1/INV-2, both font states) + G6 (overflow + 200% text zoom) +
// G8 (mount census) + G12 (5-second-test mechanical proxy) — one browser session, several
// page loads, so the heavy webgpu/webgl2 launch cost is paid once.
//
// Usage: node g2-g3-g6-g8-g12.mjs <out-dir> [port]
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'
import { mkdirSync, writeFileSync, statSync } from 'node:fs'

const outDir = process.argv[2] ?? 'g-misc-out'
const port = process.argv[3] ?? '4417'
const base = `http://127.0.0.1:${port}/`
mkdirSync(outDir, { recursive: true })

const report = {}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})

async function newPage(width, height, { blockFonts = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  if (blockFonts) await page.route('**/*.woff2', (route) => route.abort())
  return page
}

// ── G3 helper: INV-1 / INV-2 at one viewport, one font state ────────────────
async function measureInv(width, height, blockFonts) {
  const page = await newPage(width, height, { blockFonts })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForFunction(() => document.querySelector('.hero-canvas canvas')?.dataset.backend && document.querySelector('.hero-canvas canvas').dataset.backend !== 'none', { timeout: 10000 }).catch(() => {})
  const data = await page.evaluate(() => {
    // getComputedStyle().getPropertyValue('--pad-x') returns the RAW calc() source string, not
    // a resolved px number — parseFloat on it is NaN. A probe element with `left: var(...)`
    // forces layout to resolve it, exactly as scrimP0 already does below.
    const probeAt = (expr) => {
      const probe = document.createElement('div')
      probe.style.cssText = `position:absolute;left:${expr};top:0;width:1px;height:1px;visibility:hidden`
      document.body.appendChild(probe)
      const x = probe.getBoundingClientRect().x
      probe.remove()
      return x
    }
    const threshold1 = probeAt('calc(var(--pad-x) + var(--hero-col))') // INV-1
    const scrimP0 = probeAt('var(--scrim-p0)')
    const textEls = [...document.querySelectorAll('.hero [data-inv="text"]')]
    const ctaEls = [...document.querySelectorAll('.hero [data-inv="cta"]')]
    const textRights = textEls.map((el) => ({ tag: el.tagName + '.' + [...el.classList].slice(0, 2).join('.'), right: el.getBoundingClientRect().right }))
    const ctaRights = ctaEls.map((el) => ({ tag: el.tagName + '.' + [...el.classList].slice(0, 2).join('.'), right: el.getBoundingClientRect().right }))
    const h1 = document.querySelector('.hero h1')
    return {
      threshold1, scrimP0, textRights, ctaRights,
      h1Height: h1 ? h1.getBoundingClientRect().height : null,
      fontFamilyH1: h1 ? getComputedStyle(h1).fontFamily : null,
    }
  })
  await page.close()
  return data
}

report.inv = {}
for (const [label, w, h] of [['1440', 1440, 900], ['1024', 1024, 900]]) {
  for (const [fontLabel, blocked] of [['fonts-normal', false], ['fonts-blocked', true]]) {
    const key = `${label}-${fontLabel}`
    const d = await measureInv(w, h, blocked)
    const inv1Pass = d.textRights.every((r) => r.right <= d.threshold1 + 0.5)
    const inv2Pass = d.ctaRights.every((r) => r.right <= d.scrimP0 + 0.5)
    report.inv[key] = {
      threshold1: +d.threshold1.toFixed(1), scrimP0: +d.scrimP0.toFixed(1),
      textRights: d.textRights.map((r) => ({ ...r, right: +r.right.toFixed(1) })),
      ctaRights: d.ctaRights.map((r) => ({ ...r, right: +r.right.toFixed(1) })),
      inv1Pass, inv2Pass, h1Height: d.h1Height, fontFamilyH1: d.fontFamilyH1,
    }
  }
}

// ── G2: CLS across both font states + font byte totals ──────────────────────
async function measureCls(blockFonts) {
  const page = await newPage(1440, 900, { blockFonts })
  await page.addInitScript(() => {
    window.__cls = 0
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value
      }).observe({ type: 'layout-shift', buffered: true })
    } catch {}
  })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(1000)
  const cls = await page.evaluate(() => window.__cls)
  const diag = await page.evaluate(() => {
    const h1 = document.querySelector('.hero h1')
    const spans = h1 ? [...h1.querySelectorAll('span')].map((s) => s.getBoundingClientRect().toJSON()) : []
    return {
      h1Height: h1 ? h1.getBoundingClientRect().height : null,
      spanRects: spans,
      interVariableLoaded: document.fonts.check('72px "Inter Variable"'),
      interFallbackLoaded: document.fonts.check('72px "Inter Fallback"'),
      fontEntries: [...document.fonts].map((f) => ({ family: f.family, status: f.status })),
    }
  })
  await page.close()
  return { cls, ...diag }
}
const clsNormal = await measureCls(false)
const clsBlocked = await measureCls(true)
report.g2 = {
  clsNormal: clsNormal.cls, clsBlocked: clsBlocked.cls,
  h1HeightNormal: clsNormal.h1Height, h1HeightBlocked: clsBlocked.h1Height,
  h1HeightIdentical: clsNormal.h1Height === clsBlocked.h1Height,
  diagNormal: clsNormal, diagBlocked: clsBlocked,
}

// ── G6: overflow at 320/390/768/1440 + 200% text-only zoom at 1440 ──────────
report.g6 = {}
for (const w of [320, 390, 768, 1440]) {
  const page = await newPage(w, 900)
  await page.goto(base, { waitUntil: 'networkidle' })
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.scrollingElement.scrollWidth,
    clientWidth: document.scrollingElement.clientWidth,
  }))
  report.g6[`w${w}`] = { scrollWidth, clientWidth, pass: scrollWidth === clientWidth }
  await page.close()
}
{
  const page = await newPage(1440, 900)
  await page.goto(base, { waitUntil: 'networkidle' })
  const before = await page.evaluate(() => ({ scrollWidth: document.scrollingElement.scrollWidth, clientWidth: document.scrollingElement.clientWidth }))
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => ({ scrollWidth: document.scrollingElement.scrollWidth, clientWidth: document.scrollingElement.clientWidth }))
  report.g6.zoom200 = { before, after, pass: after.scrollWidth === after.clientWidth }
  await page.screenshot({ path: `${outDir}/zoom200-full.png`, fullPage: true })
  await page.close()
}

// ── G8: mount census ─────────────────────────────────────────────────────────
{
  const page = await newPage(1440, 900)
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.hero-canvas canvas')?.dataset.backend !== 'none', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(300)
  const t0 = await page.evaluate(() => [...document.querySelectorAll('[data-shader-canvas] canvas')].map((c, i) => ({ i, example: c.closest('[data-shader-canvas]')?.dataset.example, backend: c.dataset.backend, frames: c.__shader?.frames ?? null })))
  await page.waitForTimeout(2000)
  const t1 = await page.evaluate(() => [...document.querySelectorAll('[data-shader-canvas] canvas')].map((c, i) => ({ i, backend: c.dataset.backend, frames: c.__shader?.frames ?? null })))
  const distinctExamples = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-shader-canvas]')].map((el) => el.dataset.example))])
  const scriptCount = await page.evaluate(() => document.querySelectorAll('script[type="application/json"][data-shader-payload]').length)
  await page.close()
  const animating = t0.map((m, i) => ({ ...m, framesT1: t1[i].frames, animating: t1[i].frames > (m.frames ?? 0) }))
  report.g8 = {
    mountCount: t0.length,
    distinctExampleCount: distinctExamples.length,
    scriptTagCount: scriptCount,
    mounts: animating,
    animatingCount: animating.filter((m) => m.animating).length,
    stillFramesAreOne: animating.filter((m) => !m.animating).every((m) => m.frames === 1),
    forceGl2MountIsWebgl2: (() => {
      // Agree's SECOND CanvasFigure is the forceWebGl2 mount — 3rd distinct-example instance
      // of 'gradient' among the 5 DOM mounts, in document order: write(0)=gradient,
      // agree-left(1)=gradient(webgpu), agree-right(2)=gradient(forceWebGl2).
      const gradientMounts = t0.filter((m) => m.example === 'gradient')
      return gradientMounts.length === 3 ? t1[gradientMounts[2].i]?.backend === 'webgl2' : null
    })(),
  }
}

// ── G12: 5-second-test mechanical proxy ─────────────────────────────────────
{
  const page = await newPage(1440, 900)
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForFunction(() => document.querySelector('.hero-canvas canvas')?.dataset.backend !== 'none', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1500)
  const rects = await page.evaluate(() => {
    const r = (el) => el ? el.getBoundingClientRect().toJSON() : null
    const probeAt = (expr) => {
      const probe = document.createElement('div')
      probe.style.cssText = `position:absolute;left:${expr};top:0;width:1px;height:1px;visibility:hidden`
      document.body.appendChild(probe)
      const x = probe.getBoundingClientRect().x
      probe.remove()
      return x
    }
    return {
      h1: r(document.querySelector('.hero h1')),
      sub: r(document.querySelector('.hero p.text-lead')),
      cta: r(document.querySelector('.hero [data-inv="cta"]')),
      status: r(document.querySelector('.hero p.text-meta')),
      caption: r(document.querySelector('.hero .caption-plate')),
      hero: r(document.querySelector('.hero')),
      // INV-1's own text-column boundary — "canvas-only" means clear of the WHOLE column,
      // not just clear of the five named boxes (the gaps between them still sit over the
      // column and can catch scrim/glow bleed, not the shader proper).
      textColumnRight: probeAt('calc(var(--pad-x) + var(--hero-col))'),
    }
  })
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: Math.ceil(rects.hero.y + rects.hero.height) } })
  writeFileSync(`${outDir}/g12-raw.png`, buf)
  const png = PNG.sync.read(buf)

  // Box blur x3 ~ Gaussian, sigma=6 -> radius ~ sigma*3 = 18, box size ~ 2r+1 per pass with
  // 3 passes approximates a true Gaussian well (central-limit).
  function boxBlur(src, w, h, radius) {
    const tmp = new Float32Array(w * h * 3)
    const out = new Float32Array(w * h * 3)
    // horizontal
    for (let y = 0; y < h; y++) {
      let rs = 0, gs = 0, bs = 0
      for (let x = -radius; x <= radius; x++) {
        const xx = Math.min(w - 1, Math.max(0, x))
        const idx = (y * w + xx) * 3 // src is 3-channel-packed (see the copy loop below), NOT
        // the original 4-channel RGBA buffer — a *4 stride here reads out of bounds past
        // roughly 0.75h and produces `undefined` (-> NaN) for every row beyond it.
        rs += src[idx]; gs += src[idx + 1]; bs += src[idx + 2]
      }
      const n = radius * 2 + 1
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 3] = rs / n
        tmp[(y * w + x) * 3 + 1] = gs / n
        tmp[(y * w + x) * 3 + 2] = bs / n
        const xOut = Math.min(w - 1, Math.max(0, x - radius))
        const xIn = Math.min(w - 1, Math.max(0, x + radius + 1))
        const idxOut = (y * w + xOut) * 3, idxIn = (y * w + xIn) * 3
        rs += src[idxIn] - src[idxOut]
        gs += src[idxIn + 1] - src[idxOut + 1]
        bs += src[idxIn + 2] - src[idxOut + 2]
      }
    }
    // vertical
    for (let x = 0; x < w; x++) {
      let rs = 0, gs = 0, bs = 0
      for (let y = -radius; y <= radius; y++) {
        const yy = Math.min(h - 1, Math.max(0, y))
        const idx = (yy * w + x) * 3
        rs += tmp[idx]; gs += tmp[idx + 1]; bs += tmp[idx + 2]
      }
      const n = radius * 2 + 1
      for (let y = 0; y < h; y++) {
        out[(y * w + x) * 3] = rs / n
        out[(y * w + x) * 3 + 1] = gs / n
        out[(y * w + x) * 3 + 2] = bs / n
        const yOut = Math.min(h - 1, Math.max(0, y - radius))
        const yIn = Math.min(h - 1, Math.max(0, y + radius + 1))
        const idxOut = (yOut * w + x) * 3, idxIn = (yIn * w + x) * 3
        rs += tmp[idxIn] - tmp[idxOut]
        gs += tmp[idxIn + 1] - tmp[idxOut + 1]
        bs += tmp[idxIn + 2] - tmp[idxOut + 2]
      }
    }
    return out
  }
  const w = png.width, h = png.height
  let src = new Float32Array(w * h * 3)
  for (let i = 0; i < w * h; i++) { src[i * 3] = png.data[i * 4]; src[i * 3 + 1] = png.data[i * 4 + 1]; src[i * 3 + 2] = png.data[i * 4 + 2] }
  // 3 box passes of radius r approximate a Gaussian of variance 3*((2r+1)^2-1)/12; r=6 gives
  // sigma ~= 6.48, matching the design doc's sigma=6 far more closely than r=18 (sigma ~18.5,
  // ~3x too strong).
  let blurred = src
  for (let pass = 0; pass < 3; pass++) blurred = boxBlur(blurred, w, h, 6)

  const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const relLum = (r, g, b) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)

  let frameSum = 0
  for (let i = 0; i < w * h; i++) frameSum += relLum(blurred[i * 3], blurred[i * 3 + 1], blurred[i * 3 + 2])
  const frameMean = frameSum / (w * h)

  function meanLumInRect(rect) {
    const x0 = Math.max(0, Math.floor(rect.x)), y0 = Math.max(0, Math.floor(rect.y))
    const x1 = Math.min(w, Math.ceil(rect.x + rect.width)), y1 = Math.min(h, Math.ceil(rect.y + rect.height))
    let sum = 0, n = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { sum += relLum(blurred[(y * w + x) * 3], blurred[(y * w + x) * 3 + 1], blurred[(y * w + x) * 3 + 2]); n++ }
    return n ? sum / n : 0
  }

  const boxes = { h1: rects.h1, sub: rects.sub, cta: rects.cta, status: rects.status, caption: rects.caption }
  const deltas = {}
  for (const [k, rect] of Object.entries(boxes)) deltas[k] = Math.abs(meanLumInRect(rect) - frameMean)

  // brightest canvas-only 200x200 patch: slide stride-40 windows over the hero, skip windows
  // whose centre falls inside a text/CTA/caption box, keep the highest mean.
  const textBoxes = Object.values(boxes)
  const inAnyBox = (cx, cy) => textBoxes.some((b) => cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height)
  let bestPatch = { mean: -1, rect: null }
  for (let y = 0; y + 200 <= h; y += 40) {
    for (let x = 0; x + 200 <= w; x += 40) {
      const cx = x + 100, cy = y + 100
      // "canvas-only" excludes the WHOLE text column (INV-1's boundary), not just the five
      // named boxes — a gap between h1 and the CTA row still sits over the column and can
      // catch scrim/hue-glow bleed rather than the shader proper.
      if (x < rects.textColumnRight) continue
      if (inAnyBox(cx, cy)) continue
      const m = meanLumInRect({ x, y, width: 200, height: 200 })
      if (m > bestPatch.mean) bestPatch = { mean: m, rect: { x, y, width: 200, height: 200 } }
    }
  }
  deltas.canvasPatch = Math.abs(bestPatch.mean - frameMean)

  const ranking = Object.entries(deltas).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ box: k, deltaL: +v.toFixed(4) }))
  const top3 = ranking.slice(0, 3).map((r) => r.box)
  const canvasRank = ranking.findIndex((r) => r.box === 'canvasPatch')
  const pass = top3.includes('h1') && top3.includes('cta') && top3.includes('caption') && canvasRank >= 3

  report.g12 = { frameMean: +frameMean.toFixed(4), ranking, top3, canvasRank, canvasPatchRect: bestPatch.rect, pass }
  await page.close()
}

await browser.close()
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
