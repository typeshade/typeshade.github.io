import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

async function testRegion(selector, index, label) {
  const el = page.locator(selector).nth(index)
  await el.evaluate(e => { e.scrollLeft = 0 })
  await el.focus()
  await page.waitForTimeout(100)
  const focusedOk = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
  const before = await el.evaluate(e => e.scrollLeft)
  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(30) }
  const after = await el.evaluate(e => e.scrollLeft)
  console.log(`${label}: focusedElementLabel="${focusedOk}" scrollLeft ${before} -> ${after}`, after > before ? 'OK' : 'NO-CHANGE')
}

await testRegion('.scroll-region', 0, 'Reflected std140 layout')
await testRegion('.scroll-region', 1, 'Submodule command')
await testRegion('pre[role="region"]', 0, 'Authored fragment')
await testRegion('pre[role="region"]', 1, 'Typed-error fixture')
await browser.close()
