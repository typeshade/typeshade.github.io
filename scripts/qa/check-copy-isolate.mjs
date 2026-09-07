import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const copyBtn = page.locator('button:has-text("Copy")').first()
console.log('count matching button:has-text(Copy):', await page.locator('button:has-text("Copy")').count())
await copyBtn.scrollIntoViewIfNeeded()
const beforeText = await copyBtn.textContent()
console.log('before:', JSON.stringify(beforeText))
await copyBtn.click()
console.log('clicked. immediate text:', JSON.stringify(await copyBtn.textContent()))
await page.waitForTimeout(200)
const afterText = await copyBtn.textContent()
console.log('after 200ms:', JSON.stringify(afterText))
// also grab via a stable handle
const handle = await copyBtn.elementHandle()
console.log('via elementHandle:', await handle.evaluate(el => ({text: el.textContent, state: el.dataset.state})))
await browser.close()
