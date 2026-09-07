// G7 — manual keyboard walk (design §10 G7 / §8's numbered focus-order list), at 1440 and 390.
// Tabs through the whole page recording each stop's tag, accessible name and tabIndex, then
// checks the structural invariants: first stop is the skip link, no positive tabindex anywhere,
// no canvas ever receives focus, and the stop COUNT is in the neighbourhood §8 states (47 at
// desktop; 390 differs only in DOM order of §write's three panes per design §7).
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'

const port = process.argv[2] ?? '4417'
const outDir = process.argv[3] ?? '.'
const base = `http://127.0.0.1:${port}/`

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})

async function walk(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(500)
  const stops = []
  let firstKey = null
  // R-15 deliberately gives two DIFFERENT stops (B1.EMIT row 4, B2.COUNT) the identical
  // (href, text) pair, so a same-text stop is NOT evidence of having looped back to the top —
  // only returning to the very FIRST stop's own identity (the skip link) is.
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || el.tagName
      return {
        tag: el.tagName.toLowerCase(),
        class: (el.className || '').toString().slice(0, 30),
        name,
        href: el.getAttribute('href'),
        tabIndex: el.tabIndex,
        role: el.getAttribute('role'),
        id: el.id || null,
      }
    })
    if (!info) break
    const key = `${info.tag}#${info.id}.${info.class}:${info.name}:${info.href}`
    if (firstKey === null) firstKey = key
    else if (key === firstKey && stops.length > 5) break // genuinely back at the skip link
    stops.push(info)
  }
  await page.close()
  return stops
}

const desktop = await walk(1440, 900)
const mobile = await walk(390, 844)
await browser.close()

function analyze(stops) {
  const positiveTabindex = stops.filter((s) => s.tabIndex > 0)
  const canvasFocused = stops.filter((s) => s.tag === 'canvas')
  const firstIsSkip = stops[0]?.class.includes('skip') || stops[0]?.name?.toLowerCase().includes('skip')
  const regions = stops.filter((s) => s.role === 'region')
  return {
    count: stops.length,
    firstIsSkip,
    positiveTabindexCount: positiveTabindex.length,
    canvasFocusedCount: canvasFocused.length,
    regionStopCount: regions.length,
    stops,
  }
}

const report = { desktop: analyze(desktop), mobile: analyze(mobile) }
writeFileSync(`${outDir}/keyboard-walk.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify({
  desktop: { count: report.desktop.count, firstIsSkip: report.desktop.firstIsSkip, positiveTabindexCount: report.desktop.positiveTabindexCount, canvasFocusedCount: report.desktop.canvasFocusedCount, regionStopCount: report.desktop.regionStopCount },
  mobile: { count: report.mobile.count, firstIsSkip: report.mobile.firstIsSkip, positiveTabindexCount: report.mobile.positiveTabindexCount, canvasFocusedCount: report.mobile.canvasFocusedCount, regionStopCount: report.mobile.regionStopCount },
}, null, 2))
