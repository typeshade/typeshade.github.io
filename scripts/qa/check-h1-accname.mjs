import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })

const textContent = await page.evaluate(() => document.querySelector('h1').textContent)
console.log('DOM textContent:', JSON.stringify(textContent))
const innerText = await page.evaluate(() => document.querySelector('h1').innerText)
console.log('DOM innerText:', JSON.stringify(innerText))
const outerHTML = await page.evaluate(() => document.querySelector('h1').outerHTML)
console.log('outerHTML:', outerHTML)

// Try CDP Accessibility domain directly
const client = await page.context().newCDPSession(page)
await client.send('Accessibility.enable')
const h1 = await page.$('h1')
const backendNodeId = await (async () => {
  const node = await client.send('DOM.describeNode', { objectId: await (await h1.evaluateHandle(el => el)).asElement()._objectId }).catch(() => null)
  return node
})()
try {
  const { nodes } = await client.send('Accessibility.getFullAXTree')
  const headingNodes = nodes.filter(n => n.role && n.role.value === 'heading')
  console.log('CDP heading nodes:', JSON.stringify(headingNodes.map(n => ({ name: n.name, role: n.role, properties: n.properties })), null, 1))
} catch (e) {
  console.log('CDP AX tree failed:', e.message)
}
await browser.close()
