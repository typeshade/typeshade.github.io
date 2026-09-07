// Verification-only probe for the ctaGhostBorder G4 finding: capture the REAL composited
// hero (foreground visible) over ~22s and save the frame whose ghost-button-box max luminance
// is highest, plus a tight crop around the button, so the finding can be read visually
// (tile-crop-review) instead of trusted from numbers alone.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'
import { mkdirSync, writeFileSync } from 'node:fs'

const outDir = process.argv[2]
const port = process.argv[3] ?? '4417'
mkdirSync(outDir, { recursive: true })

const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const relLum = (r, g, b) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForFunction(() => document.querySelector('.hero-canvas canvas')?.dataset.backend === 'webgpu')
const rect = await page.evaluate(() => document.querySelector('.hero .btn-ghost').getBoundingClientRect().toJSON())

let best = { max: -1, i: -1 }
const t0 = Date.now()
let i = 0
while (Date.now() - t0 < 22000) {
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 660 } })
  const png = PNG.sync.read(buf)
  let max = 0
  for (let y = Math.floor(rect.y); y < Math.ceil(rect.y + rect.height); y++) {
    for (let x = Math.floor(rect.x); x < Math.ceil(rect.x + rect.width); x++) {
      const idx = (png.width * y + x) << 2
      const l = relLum(png.data[idx], png.data[idx + 1], png.data[idx + 2])
      if (l > max) max = l
    }
  }
  writeFileSync(`${outDir}/frame-${String(i).padStart(3, '0')}.png`, buf)
  if (max > best.max) best = { max, i }
  console.log(i, 'maxL', max.toFixed(4), 't', Date.now() - t0)
  i++
}
console.log('BEST', JSON.stringify(best), 'rect', JSON.stringify(rect))
writeFileSync(`${outDir}/meta.json`, JSON.stringify({ best, rect }, null, 2))
await browser.close()
