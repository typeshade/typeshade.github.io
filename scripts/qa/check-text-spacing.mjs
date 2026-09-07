// WCAG 1.4.12 Text Spacing -- inject the standard bookmarklet CSS and look for clipping/overlap.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const width = Number(process.argv[3] ?? 1440)
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(300)

await page.addStyleTag({ content: `
*:not(caption) {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-bottom: 2em !important; }
` })
await page.waitForTimeout(300)

const result = await page.evaluate(() => {
  const W = document.documentElement.clientWidth
  const overflow = []
  const clipped = []
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (r.right > W + 1 && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll' && !el.closest('pre, code, .scroll-region, [class*="overflow-x"]')) {
      overflow.push(`${el.tagName}.${String(el.className).slice(0,50)} right=${r.right.toFixed(0)}`)
    }
    // detect clipped text: overflow:hidden with scrollHeight > clientHeight on a text-bearing leaf-ish element
    if ((cs.overflow === 'hidden' || cs.overflowY === 'hidden') && el.scrollHeight > el.clientHeight + 2 && el.textContent.trim()) {
      clipped.push(`${el.tagName}.${String(el.className).slice(0,50)} scrollH=${el.scrollHeight} clientH=${el.clientHeight} text="${el.textContent.trim().slice(0,40)}"`)
    }
  }
  return {
    scrollWidth: document.scrollingElement.scrollWidth, clientWidth: document.scrollingElement.clientWidth,
    overflow: [...new Set(overflow)].slice(0, 20),
    clipped: [...new Set(clipped)].slice(0, 20),
  }
})
console.log(`=== Text spacing @ ${width}px ===`)
console.log(JSON.stringify(result, null, 1))
await page.screenshot({ path: `/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/text-spacing-${width}-full.png`, fullPage: true })
await browser.close()
