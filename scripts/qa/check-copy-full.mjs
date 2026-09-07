import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const btn = page.locator('[data-copy]')
await btn.scrollIntoViewIfNeeded()
await btn.click()
await page.waitForTimeout(200)
console.log('after 200ms:', JSON.stringify(await btn.evaluate(el => ({text: el.textContent, state: el.dataset.state}))))
const status = await page.evaluate(() => document.querySelector('[data-copy-status]')?.textContent)
console.log('status text:', JSON.stringify(status))
const clip = await page.evaluate(() => navigator.clipboard.readText())
console.log('clipboard (exact):', JSON.stringify(clip))
await page.waitForTimeout(1700)
console.log('after 1900ms total (should revert):', JSON.stringify(await btn.evaluate(el => ({text: el.textContent, state: el.dataset.state}))))
const statusAfter = await page.evaluate(() => document.querySelector('[data-copy-status]')?.textContent)
console.log('status text after revert:', JSON.stringify(statusAfter))
await browser.close()
