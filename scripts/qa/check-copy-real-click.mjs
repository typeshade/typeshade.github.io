import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const count = await page.locator('button:has-text("Copy")').count()
console.log('button:has-text("Copy") count:', count)
const dataCopyCount = await page.locator('[data-copy]').count()
console.log('[data-copy] count:', dataCopyCount)

const btn = page.locator('[data-copy]')
await btn.scrollIntoViewIfNeeded()
await btn.click()
await page.waitForTimeout(50)
const state1 = await btn.evaluate(el => ({ text: el.textContent, state: el.dataset.state }))
console.log('50ms after real click:', JSON.stringify(state1))
await page.waitForTimeout(500)
const state2 = await btn.evaluate(el => ({ text: el.textContent, state: el.dataset.state }))
console.log('500ms after real click:', JSON.stringify(state2))
await browser.close()
