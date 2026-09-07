import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { readFileSync } from 'node:fs'
const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const axeSrc = readFileSync('/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/axe/package/axe.min.js', 'utf8')
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.addScriptTag({ content: axeSrc })
const results = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] } }))
for (const inc of results.incomplete) {
  console.log(`\n[${inc.impact}] ${inc.id}: ${inc.help}`)
  for (const n of inc.nodes) {
    console.log('  target:', JSON.stringify(n.target))
    console.log('  html:', n.html.slice(0, 150))
    console.log('  reason:', n.any.map(a=>a.message).concat(n.all.map(a=>a.message)).join(' | ').slice(0,250))
  }
}
await browser.close()
