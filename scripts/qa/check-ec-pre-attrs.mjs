import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const info = await page.evaluate(() => {
    return [...document.querySelectorAll('pre[aria-label]')].map(p => ({
      ariaLabel: p.getAttribute('aria-label'),
      role: p.getAttribute('role'),
      tabindex: p.getAttribute('tabindex'),
      scrollWidth: p.scrollWidth, clientWidth: p.clientWidth,
      overflows: p.scrollWidth > p.clientWidth + 1,
    }))
  })
  console.log(`@ ${width}px:`, JSON.stringify(info, null, 1))
  await page.close()
}
await browser.close()
