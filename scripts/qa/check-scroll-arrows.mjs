import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const regions = await page.evaluate(() => [...document.querySelectorAll('.scroll-region, pre[role="region"]')].map(el => ({
  label: el.getAttribute('aria-label'), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, tabindex: el.getAttribute('tabindex'),
})))
console.log('regions at 390px:', JSON.stringify(regions, null, 1))

for (const sel of ['.scroll-region', 'pre[role="region"]']) {
  const count = await page.locator(sel).count()
  for (let i = 0; i < count; i++) {
    const el = page.locator(sel).nth(i)
    const label = await el.getAttribute('aria-label')
    await el.evaluate(e => e.scrollLeft = 0)
    await el.focus()
    const before = await el.evaluate(e => e.scrollLeft)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    const after = await el.evaluate(e => e.scrollLeft)
    console.log(`${sel}[${i}] "${label}": scrollLeft ${before} -> ${after} (${after > before ? 'SCROLLED OK' : 'NO CHANGE'})`)
  }
}
await browser.close()
