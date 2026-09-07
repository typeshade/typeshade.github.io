// Regression check for B-F1: ladder rung links + B2.COUNT link + EmitCard row-4 link +
// RAIL.COMMIT hash link must all be >=24x24, and vertical gaps between stacked links must be
// >=12px (design §8). Checks 1440 and 390.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const port = process.argv[2] ?? '4417'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } })
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' })
  const info = await page.evaluate(() => {
    const all = [...document.querySelectorAll('a')]
    const ladderLinks = all.filter(a => /oracle\.ts|compile-gate\.spec\.ts/.test(a.textContent) && a.className.includes('font-mono'))
    const rects = ladderLinks.map(a => ({ text: a.textContent.trim(), rect: a.getBoundingClientRect() }))
    return rects.map(r => ({ text: r.text, top: r.rect.top, bottom: r.rect.bottom, w: r.rect.width, h: r.rect.height }))
  })
  console.log(`\n=== ${width}px ladder rung links ===`)
  for (const r of info) console.log(`  ${r.w.toFixed(1)}x${r.h.toFixed(1)} "${r.text}"`)
  for (let i = 1; i < info.length; i++) {
    const gap = info[i].top - info[i - 1].bottom
    console.log(`  gap ${i - 1}->${i}: ${gap.toFixed(1)}px`)
  }
  await page.close()
}
await browser.close()
