// Regression check for B-F5: raw HTML has no whitespace between the two block-span lines, but
// the browser's actual accessible name / innerText should insert the line break as a word
// boundary regardless.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4417/', { waitUntil: 'networkidle' })
const r = await page.evaluate(() => {
  const h1 = document.querySelector('h1')
  return { textContent: h1.textContent, innerText: h1.innerText }
})
console.log('textContent:', JSON.stringify(r.textContent))
console.log('innerText  :', JSON.stringify(r.innerText))
const cdp = await page.context().newCDPSession(page)
const { root } = await cdp.send('Accessibility.getFullAXTree')
const h1Node = root.find((n) => n.role?.value === 'heading')
console.log('AX heading name:', h1Node ? JSON.stringify(h1Node.name?.value) : '(not found via role=heading scan)')
await browser.close()
