import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
const info = await page.evaluate(() => {
  const main = document.querySelector('main')
  const nav = document.querySelector('.nav')
  const header = document.querySelector('header')
  const cs = getComputedStyle(main)
  return {
    scrollY: window.scrollY,
    mainTop: main.getBoundingClientRect().top,
    mainScrollMargin: cs.scrollMarginTop,
    navBottom: nav.getBoundingClientRect().bottom,
    navPosition: getComputedStyle(nav).position,
    headerTag: header?.tagName,
    headerHTML_start: header?.outerHTML.slice(0, 200),
    mainId: main.id,
    mainTabindex: main.getAttribute('tabindex'),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
