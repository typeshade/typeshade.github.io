import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
const info = await page.evaluate(() => {
  const probe = document.createElement('div')
  document.body.appendChild(probe)
  const results = {}
  for (const kw of ['Canvas','CanvasText','GrayText','LinkText','ButtonFace','ButtonText','ButtonBorder','Highlight']) {
    probe.style.color = kw
    results[kw] = getComputedStyle(probe).color
  }
  probe.remove()
  return results
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
