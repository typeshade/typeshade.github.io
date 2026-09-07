import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const el = page.locator('.scroll-region').nth(1) // Submodule command
await el.evaluate(e => e.scrollLeft = 0)
await el.focus()
const activeCheck = await page.evaluate((expected) => {
  return { activeTag: document.activeElement.tagName, activeLabel: document.activeElement.getAttribute('aria-label'), matches: document.activeElement === expected }
}, await el.elementHandle())
console.log('after .focus():', JSON.stringify(activeCheck))

// try dispatching a raw keydown event directly and see if scrollLeft moves
await page.keyboard.down('ArrowRight')
await page.keyboard.up('ArrowRight')
await page.waitForTimeout(50)
console.log('scrollLeft after keydown/up ArrowRight:', await el.evaluate(e => e.scrollLeft))

// try pressing End key (jumps scroll to max in many UAs for a focused scroll container)
await page.keyboard.press('End')
await page.waitForTimeout(50)
console.log('scrollLeft after End:', await el.evaluate(e => e.scrollLeft))

// manual scrollLeft set works?
await el.evaluate(e => e.scrollLeft = 100)
console.log('scrollLeft after manual set to 100:', await el.evaluate(e => e.scrollLeft))

await browser.close()
