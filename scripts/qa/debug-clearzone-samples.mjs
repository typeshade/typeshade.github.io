import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { PNG } from '/home/user/X-GIS/node_modules/.bun/pngjs@7.0.0/node_modules/pngjs/lib/png.js'
import { writeFileSync } from 'node:fs'

const port = process.argv[2] ?? '4401'
const TOTAL_MS = Number(process.argv[3] ?? 40000)

const srgbToLin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const relLum = (r, g, b) => 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)

function maxLuminanceInRect(png, rect) {
  const x0 = Math.max(0, Math.floor(rect.x)), y0 = Math.max(0, Math.floor(rect.y))
  const x1 = Math.min(png.width, Math.ceil(rect.x + rect.width)), y1 = Math.min(png.height, Math.ceil(rect.y + rect.height))
  let max = 0, at = null
  for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
    const idx = (png.width * py + px) << 2
    const l = relLum(png.data[idx], png.data[idx+1], png.data[idx+2])
    if (l > max) { max = l; at = [px,py,png.data[idx],png.data[idx+1],png.data[idx+2]] }
  }
  return { max, at }
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/?forcegl2=1`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForFunction(() => document.querySelector('.hero-canvas canvas')?.dataset.backend !== 'none', { timeout: 10000 })
await page.evaluate(() => window.scrollTo(0, 0))
const rects = await page.evaluate(() => {
  const hero = document.querySelector('.hero').getBoundingClientRect()
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;left:var(--scrim-p2);top:0;width:1px;height:1px;visibility:hidden'
  document.body.appendChild(probe)
  const x = probe.getBoundingClientRect().x
  probe.remove()
  return { hero: {x:hero.x,y:hero.y,width:hero.width,height:hero.height}, scrimP2: x }
})
const cz = { x: rects.scrimP2, y: rects.hero.y, width: rects.hero.x + rects.hero.width - rects.scrimP2, height: rects.hero.height }
console.error('clearzone rect', cz)

const t0 = Date.now()
let i = 0
const lows = []
while (Date.now() - t0 < TOTAL_MS) {
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: Math.ceil(rects.hero.y + rects.hero.height) } })
  const png = PNG.sync.read(buf)
  const m = maxLuminanceInRect(png, cz)
  const t = Date.now() - t0
  console.error(i, t, 'max=', m.max.toFixed(4), 'at', m.at)
  if (m.max <= 0.05) {
    lows.push(i)
    writeFileSync(`/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/low-frame-${i}.png`, buf)
  }
  i++
}
console.error('low frames:', lows)
await browser.close()
