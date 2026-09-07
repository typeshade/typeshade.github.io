import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const width = Number(process.argv[3] ?? 1440)
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// --- Target sizes: every interactive element (a, button, summary) ---
const sizes = await page.evaluate(() => {
  const els = [...document.querySelectorAll('a[href], button, summary, [tabindex]:not([tabindex="-1"])')]
  return els.map((el) => {
    const r = el.getBoundingClientRect()
    // account for padding-expanding pseudo-hitboxes isn't measurable via getBoundingClientRect
    // alone if using a ::before/::after enlarge trick -- report raw box; component-level
    // padding should already be reflected in the box itself for non-absolutely-positioned children.
    const name = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 40)
    const isInlineSentenceLink = el.closest('p')?.textContent.length > (el.textContent.length + 20) && el.tagName === 'A'
    return { tag: el.tagName, name, w: +r.width.toFixed(1), h: +r.height.toFixed(1), inline: isInlineSentenceLink }
  })
})
console.log(`=== Target sizes @ ${width}px (${sizes.length} elements) ===`)
const small = sizes.filter((s) => (s.w < 24 || s.h < 24) && !s.inline)
for (const s of small) console.log('SMALL:', JSON.stringify(s))
console.log(`${small.length} below 24x24 (excluding presumed inline-sentence links)`)
const inlineOnes = sizes.filter((s) => s.inline)
console.log('Inline-sentence-link candidates:', JSON.stringify(inlineOnes))

// --- Focus visibility: tab through first 20 stops, check outline/box-shadow changes ---
console.log('\n=== Focus visibility sample ===')
await page.keyboard.press('Tab')
for (let i = 0; i < 15; i++) {
  const info = await page.evaluate(() => {
    const el = document.activeElement
    const cs = getComputedStyle(el)
    return {
      tag: el.tagName, id: el.id, name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
      outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
      boxShadow: cs.boxShadow,
    }
  })
  console.log(i, JSON.stringify(info))
  await page.keyboard.press('Tab')
}
await browser.close()
