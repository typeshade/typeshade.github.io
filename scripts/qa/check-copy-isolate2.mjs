import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// same as failing test but using [data-copy] selector instead
const copyBtn = page.locator('[data-copy]').first()
await copyBtn.scrollIntoViewIfNeeded()
console.log('before:', JSON.stringify(await copyBtn.textContent()))
await copyBtn.click()
console.log('immediate:', JSON.stringify(await copyBtn.textContent()))
await page.waitForTimeout(200)
console.log('after 200ms:', JSON.stringify(await copyBtn.textContent()))
await browser.close()
