import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
page.on('console', m => console.log('CONSOLE:', m.type(), m.text()))
page.on('pageerror', e => console.log('PAGEERROR:', e.message))
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const debug1 = await page.evaluate(() => {
  const rows = document.querySelectorAll('[data-install]')
  const btn = document.querySelector('[data-copy]')
  return { rowCount: rows.length, btnFound: !!btn, btnText: btn?.textContent, btnDataCopy: btn?.getAttribute('data-copy') }
})
console.log('pre-click debug:', JSON.stringify(debug1))

const clicked = await page.evaluate(async () => {
  const btn = document.querySelector('[data-copy]')
  btn.click()
  await new Promise(r => setTimeout(r, 300))
  return { textAfter: btn.textContent, dataState: btn.dataset.state, statusText: document.querySelector('[data-copy-status]')?.textContent }
})
console.log('post in-page-click debug:', JSON.stringify(clicked))

const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(e => 'ERR:'+e.message)
console.log('clipboard:', JSON.stringify(clip))
await browser.close()
