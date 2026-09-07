import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
// Tab to reveal + focus the skip link (should be the first focusable element).
await page.keyboard.press('Tab')
const active1 = await page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent?.trim(), href: document.activeElement.getAttribute('href') }))
console.log('First Tab stop:', active1)
await page.keyboard.press('Enter')
await page.waitForTimeout(200)
const after = await page.evaluate(() => {
  const main = document.querySelector('main')
  const nav = document.querySelector('.nav')
  const h1 = document.querySelector('h1')
  return {
    scrollY: window.scrollY,
    activeTag: document.activeElement.tagName,
    activeId: document.activeElement.id,
    navBottom: nav.getBoundingClientRect().bottom,
    h1Top: h1.getBoundingClientRect().top,
    h1Bottom: h1.getBoundingClientRect().bottom,
    mainTop: main.getBoundingClientRect().top,
  }
})
console.log('After Enter on skip link:', after)
console.log('h1 visible below nav?', after.h1Bottom > after.navBottom ? 'at least partially' : 'FULLY HIDDEN', '| h1Top >= navBottom (fully clear)?', after.h1Top >= after.navBottom)
await browser.close()
