// Dense, evenly-timed sampling of the clear zone at a fixed interval, to rule out aliasing.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'

const backend = process.argv[2] ?? 'webgl2'
const port = process.argv[3] ?? '4401'
const DURATION_MS = Number(process.argv[4] ?? 20000)
const INTERVAL_MS = Number(process.argv[5] ?? 300)

const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const relLum = (r, g, b) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/${backend === 'webgl2' ? '?forcegl2=1' : ''}`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForFunction(() => document.querySelector('.hero-canvas canvas')?.dataset.backend !== 'none', { timeout: 10000 })
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

const t0 = Date.now()
const results = []
let nextAt = 0
while (Date.now() - t0 < DURATION_MS) {
  const now = Date.now() - t0
  if (now < nextAt) { await page.waitForTimeout(Math.min(20, nextAt - now)); continue }
  const buf = await page.screenshot({ clip: rect })
  const png = PNG.sync.read(buf)
  let max = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const l = relLum(png.data[i], png.data[i+1], png.data[i+2])
    if (l > max) max = l
  }
  results.push({ t: Date.now() - t0, max: +max.toFixed(4) })
  nextAt += INTERVAL_MS
}
await browser.close()
console.log(JSON.stringify(results))
const below = results.filter(r => r.max <= 0.05)
console.error('total', results.length, 'below0.05', below.length, 'pct-below', (below.length/results.length*100).toFixed(1))
console.error('below samples:', JSON.stringify(below))
