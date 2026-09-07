import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
const info = await page.evaluate(() => {
  const chip = document.querySelector('.state-chip')
  const cs = getComputedStyle(chip)
  return {
    text: chip.textContent,
    color: cs.color, background: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth,
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
