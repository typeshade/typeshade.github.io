import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })

const links = await page.evaluate(() => {
  return [...document.querySelectorAll('a[href]')].map((a) => {
    // accessible name approx: aria-label else textContent trimmed & collapsed, excluding aria-hidden children
    let name = a.getAttribute('aria-label')
    if (!name) {
      const clone = a.cloneNode(true)
      clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
      name = clone.textContent.replace(/\s+/g, ' ').trim()
    }
    return { href: a.getAttribute('href'), name }
  })
})

console.log('Total <a> count:', links.length)
console.log(JSON.stringify(links, null, 1))

// injective maps: text->href and href->text
const textToHrefs = new Map()
const hrefToTexts = new Map()
for (const { href, name } of links) {
  if (!textToHrefs.has(name)) textToHrefs.set(name, new Set())
  textToHrefs.get(name).add(href)
  if (!hrefToTexts.has(href)) hrefToTexts.set(href, new Set())
  hrefToTexts.get(href).add(name)
}
console.log('\n--- text -> multiple hrefs (violation if >1) ---')
for (const [t, hs] of textToHrefs) if (hs.size > 1) console.log(JSON.stringify(t), [...hs])
console.log('\n--- href -> multiple texts (violation if >1) ---')
for (const [h, ts] of hrefToTexts) if (ts.size > 1) console.log(h, [...ts])

await browser.close()
