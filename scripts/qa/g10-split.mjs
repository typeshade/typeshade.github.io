// G10 (design §10) — §precision's boundary, asserted against the MEASUREMENT and never
// against a round number: sample the rendered `B4.CANVAS` column-luminance profile at the
// shipped 3:2 crop, and assert that the banded → smooth discontinuity lands at the page's own
// `--b4-split` ± 2 %, and that the distinct-level counts either side differ by >= 8x.
// A run that cannot find the discontinuity FAILS, rather than defaulting to a position.
//
// Both backends, because the split is a claim about the emitted shader and not about one API.
//
// Usage: node scripts/qa/g10-split.mjs [port]
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'

const port = process.argv[2] ?? '4433'
const base = `http://127.0.0.1:${port}/`
const TOLERANCE = 0.02 // ± 2 % of the canvas width
const LEVEL_RATIO = 8 // distinct column-luminance levels, smooth side over banded side

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})

/** Mean luminance per pixel column — M-8's own instrument, at the crop that ships. */
function profile(png) {
  const out = new Array(png.width).fill(0)
  for (let x = 0; x < png.width; x++) {
    let sum = 0
    for (let y = 0; y < png.height; y++) {
      const i = (y * png.width + x) * 4
      sum += 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]
    }
    out[x] = sum / png.height
  }
  return out
}

/** The banded side quantises into flat runs; the smooth side changes every column. The
 *  boundary is the end of the LAST run of >= 4 identical columns. */
function discontinuity(prof) {
  let start = 0
  let last = null
  for (let x = 1; x <= prof.length; x++) {
    if (x === prof.length || Math.abs(prof[x] - prof[x - 1]) > 1e-9) {
      if (x - start >= 4) last = x
      start = x
    }
  }
  return last
}

const distinct = (a) => new Set(a.map((v) => Math.round(v * 10) / 10)).size

const results = []
for (const arm of ['webgpu', 'webgl2']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(arm === 'webgl2' ? `${base}?forcegl2=1` : base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page
    .waitForFunction(() => {
      const c = document.querySelector('#precision canvas')
      return c && c.dataset.backend && c.dataset.backend !== 'none'
    }, undefined, { timeout: 30_000 })
    .catch(() => {})
  const declared = await page.evaluate(() => {
    const fig = document.querySelector('.canvas-figure[data-split]')
    if (!fig) return null
    const canvas = fig.querySelector('canvas')
    const cr = canvas.getBoundingClientRect()
    return {
      split: parseFloat(getComputedStyle(fig).getPropertyValue('--b4-split')),
      backend: canvas.dataset.backend,
      // where the two crop marks actually sit, as a fraction of the canvas box
      marks: [...fig.querySelectorAll('.crop-mark')].map(
        (m) => (m.getBoundingClientRect().left - cr.left) / cr.width,
      ),
      labels: [
        fig.querySelector('.split-cell')?.textContent.trim(),
        fig.querySelector('[data-shader-header]')?.textContent.trim(),
      ],
    }
  })
  if (!declared) {
    console.error('[G10] no split figure on the page — §precision is shipping the fallback legend')
    process.exit(1)
  }
  const buf = await page.locator('#precision canvas').screenshot()
  const png = PNG.sync.read(buf)
  const prof = profile(png)
  const b = discontinuity(prof)
  if (b === null || b <= 0 || b >= png.width) {
    console.error(`[G10] ${arm}: no discontinuity found in a ${png.width} px profile`)
    process.exit(1)
  }
  const measured = b / png.width
  const left = distinct(prof.slice(0, b))
  const right = distinct(prof.slice(b))
  const ratio = right / left
  const okPos = Math.abs(measured - declared.split) <= TOLERANCE
  const okLevels = ratio >= LEVEL_RATIO
  const okMarks = declared.marks.every((m) => Math.abs(m - declared.split) <= 0.001)
  const okWords =
    declared.labels[0]?.includes('banded') === true && declared.labels[1]?.includes('smooth') === true
  results.push({ arm, backend: declared.backend, w: png.width, h: png.height, boundaryPx: b,
    measured: +(measured * 100).toFixed(3), declared: +(declared.split * 100).toFixed(3),
    left, right, ratio: +ratio.toFixed(1), okPos, okLevels, okMarks, okWords })
  await page.close()
}
await browser.close()

for (const r of results) {
  console.log(
    `[G10] ${r.arm.padEnd(7)} backend ${r.backend} · ${r.w}x${r.h} · discontinuity x=${r.boundaryPx} ` +
      `= ${r.measured} % vs --b4-split ${r.declared} % · distinct L=${r.left} R=${r.right} (${r.ratio}x) ` +
      `· rule at ±0.1 % ${r.okMarks} · words ${r.okWords}`,
  )
}
const bad = results.filter((r) => !(r.okPos && r.okLevels && r.okMarks && r.okWords))
if (bad.length) {
  console.error(`[G10] FAIL on ${bad.map((r) => r.arm).join(', ')}`)
  process.exit(1)
}
console.log('[G10] PASS — both backends, position within ±2 % and levels over 8x')
