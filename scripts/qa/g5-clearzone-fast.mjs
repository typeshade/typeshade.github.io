// Fast, dense G5 sampler: screenshots ONLY the clear-zone rect (not the whole hero), so many
// more samples fit in the time budget. Same luminance/threshold logic as g4-g5-sweep.mjs.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'

const backend = process.argv[2] ?? 'webgpu'
const port = process.argv[3] ?? '4401'
const TOTAL_MS = Number(process.argv[4] ?? 60000)

const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const relLum = (r, g, b) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)

async function run() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
  })
  const url = `http://127.0.0.1:${port}/${backend === 'webgl2' ? '?forcegl2=1' : ''}`
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => {
    const c = document.querySelector('.hero-canvas canvas')
    return c && c.dataset.backend && c.dataset.backend !== 'none'
  }, { timeout: 10000 })
  const actualBackend = await page.evaluate(() => document.querySelector('.hero-canvas canvas').dataset.backend)
  await page.evaluate(() => window.scrollTo(0, 0))

  const rect = await page.evaluate(() => {
    const hero = document.querySelector('.hero').getBoundingClientRect()
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;left:var(--scrim-p2);top:0;width:1px;height:1px;visibility:hidden'
    document.body.appendChild(probe)
    const x = probe.getBoundingClientRect().x
    probe.remove()
    return { x, y: hero.y, width: hero.x + hero.width - x, height: hero.height }
  })
  console.error('clear zone rect:', JSON.stringify(rect), 'backend:', actualBackend)

  const samples = []
  const t0 = Date.now()
  while (Date.now() - t0 < TOTAL_MS) {
    const buf = await page.screenshot({ clip: rect })
    const png = PNG.sync.read(buf)
    let max = 0
    for (let i = 0; i < png.data.length; i += 4) {
      const l = relLum(png.data[i], png.data[i + 1], png.data[i + 2])
      if (l > max) max = l
    }
    samples.push({ t: Date.now() - t0, max })
  }
  await browser.close()

  const above = samples.filter((s) => s.max > 0.05).length
  const pct = (above / samples.length) * 100
  console.log(JSON.stringify({
    backend: actualBackend, frames: samples.length, elapsedMs: samples[samples.length - 1]?.t,
    framesAboveL05: above, framesTotal: samples.length, pctFramesAboveL05: +pct.toFixed(1),
    g5Pass: (samples.length - above) / samples.length <= 0.25,
    minMax: Math.min(...samples.map(s=>s.max)).toFixed(4),
    maxMax: Math.max(...samples.map(s=>s.max)).toFixed(4),
    belowFrames: samples.filter(s=>s.max<=0.05).map(s=>({t:s.t, max:+s.max.toFixed(4)})),
  }, null, 2))
}
run().catch((e) => { console.error(e); process.exit(1) })
