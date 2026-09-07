import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.addStyleTag({ content: `
*:not(caption) { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }
` })
await page.waitForTimeout(300)
await page.locator('#rail').screenshot({ path: '/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/ts-rail.png' })
await page.locator('#types').screenshot({ path: '/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/ts-types.png' })
await page.locator('footer').screenshot({ path: '/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/ts-footer.png' })
await browser.close()
