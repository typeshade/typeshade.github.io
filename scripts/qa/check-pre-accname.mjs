import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
const client = await page.context().newCDPSession(page)
await client.send('Accessibility.enable')
const { nodes } = await client.send('Accessibility.getFullAXTree')
const pres = nodes.filter(n => n.role?.value === 'generic' || n.role?.value === 'GenericContainer')
// find nodes whose backendDOMNodeId corresponds to <pre aria-label=...>
// simpler: search for role value and name across ALL nodes, look for anything referencing 'Authored fragment'
for (const n of nodes) {
  if (n.name?.value?.includes('Authored fragment') || n.name?.value?.includes('Typed-error fixture')) {
    console.log('FOUND name carrier -> role:', n.role?.value, 'name:', n.name?.value, 'nodeId', n.nodeId, 'backendDOMNodeId', n.backendDOMNodeId)
  }
}
// Also directly resolve the <pre> element's role/name via DOM query + describeNode + AX partial tree
await browser.close()
