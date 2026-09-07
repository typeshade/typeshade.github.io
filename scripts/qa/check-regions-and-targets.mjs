// Two design-§8 assertions that only a browser can make, in one pass:
//
//   (1) THE FOUR SCROLL REGIONS, at every width. §5 says exactly four exist and §8's numbered
//       focus order is "identical at 1440 and at 390", so each must carry tabindex="0",
//       role="region" and an aria-label AT EVERY WIDTH — not only where its content happens to
//       overflow. A `<pre>` that has lost `role` is a `generic`, where ARIA 1.2 prohibits the
//       name it would still be carrying (axe `aria-prohibited-attr`).
//   (2) TARGET SIZE, per §8's own list: chip routes, ladder links, BR.SOURCE links, footer
//       links and anchor markers >= 24 x 24. The one inline exception §8 licenses is the
//       `reflect()` link inside §types' body sentence.
//
// Usage: node check-regions-and-targets.mjs <port>
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const port = process.argv[2] ?? '4433'
const base = `http://127.0.0.1:${port}/`
const INLINE_EXCEPTION = ['reflect()'] // §8: links inside a running sentence, this one only

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})

const report = {}
for (const width of [1440, 768, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  // EC's ResizeObserver runs on requestIdleCallback after a 250 ms debounce; wait past it, so
  // "the attributes are still there" is a claim about the settled page, not about frame one.
  await page.waitForTimeout(1500)

  const regions = await page.$$eval('[role="region"], pre[tabindex], .scroll-region', (els) =>
    els.map((el) => ({
      tag: el.tagName.toLowerCase(),
      label: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      tabindex: el.getAttribute('tabindex'),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflows: el.scrollWidth > el.clientWidth,
    })),
  )
  const orphanNames = await page.$$eval('[aria-label]:not([role])', (els) =>
    els
      .filter((el) => {
        const tag = el.tagName.toLowerCase()
        // Elements whose implicit role permits a name are fine; `pre`/`div`/`span` are generic.
        return ['pre', 'div', 'span', 'p', 'li'].includes(tag)
      })
      .map((el) => ({ tag: el.tagName.toLowerCase(), label: el.getAttribute('aria-label') })),
  )
  const links = await page.$$eval('a[href]', (els) =>
    els.map((a) => {
      const r = a.getBoundingClientRect()
      const clone = a.cloneNode(true)
      clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove())
      return {
        name: clone.textContent.replace(/\s+/g, ' ').trim() || a.getAttribute('aria-label'),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        cls: (a.className || '').toString(),
      }
    }),
  )
  report[width] = {
    regions,
    orphanNames,
    small: links.filter((l) => (l.h < 24 || l.w < 24) && !INLINE_EXCEPTION.includes(l.name)),
    inlineExceptions: links.filter((l) => INLINE_EXCEPTION.includes(l.name)),
    linkCount: links.length,
  }
  await page.close()
}
await browser.close()

let fail = false
for (const [width, r] of Object.entries(report)) {
  const named = r.regions.filter((x) => x.role === 'region' && x.tabindex === '0' && x.label)
  console.log(`\n=== ${width}px ===`)
  console.log(`regions: ${r.regions.length} found, ${named.length} carry role+tabindex+aria-label`)
  for (const x of r.regions) {
    console.log(`  ${x.tag} role=${x.role} tabindex=${x.tabindex} overflows=${x.overflows} (${x.scrollWidth}/${x.clientWidth}) label=${JSON.stringify(x.label)}`)
  }
  console.log(`aria-label on a name-prohibited element: ${r.orphanNames.length}`, JSON.stringify(r.orphanNames))
  console.log(`links: ${r.linkCount}, under 24x24 (excluding §8's inline exception): ${r.small.length}`)
  for (const s of r.small) console.log(`  SMALL ${s.w}x${s.h} "${s.name}" [${s.cls}]`)
  for (const s of r.inlineExceptions) console.log(`  inline exception (licensed): ${s.w}x${s.h} "${s.name}"`)
  if (named.length !== 4 || r.orphanNames.length || r.small.length) fail = true
}
console.log(fail ? '\nFAIL' : '\nPASS — 4 named regions at every width, 0 prohibited names, 0 undersized targets')
process.exit(fail ? 1 : 0)
