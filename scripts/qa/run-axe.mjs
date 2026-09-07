import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
import { readFileSync } from 'node:fs'

const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const axeSrc = readFileSync('/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/axe/package/axe.min.js', 'utf8')

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.addScriptTag({ content: axeSrc })
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
  })
  console.log(`\n=== axe @ ${width}px ===`)
  console.log('violations:', results.violations.length)
  for (const v of results.violations) {
    console.log(`- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
    for (const n of v.nodes.slice(0, 5)) console.log('    target:', JSON.stringify(n.target), 'summary:', n.failureSummary?.replace(/\n/g,' ').slice(0,200))
  }
  console.log('passes:', results.passes.length, 'incomplete:', results.incomplete.length)
  for (const inc of results.incomplete) console.log(`  incomplete: [${inc.impact}] ${inc.id} (${inc.nodes.length} nodes)`)
  await page.close()
}
await browser.close()
