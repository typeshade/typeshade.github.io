import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
const info = await page.evaluate(() => {
  // find the ladder region -- all <a> with class containing 'font-mono text-code' whose text matches spec.ts / oracle.ts
  const all = [...document.querySelectorAll('a')]
  const ladderLinks = all.filter(a => /oracle\.ts|compile-gate\.spec\.ts/.test(a.textContent) && a.className.includes('font-mono'))
  const goldensLink = all.find(a => a.textContent.trim() === 'goldens diff byte for byte' && a.closest('p')?.className.includes('micro-code'))
  const rects = ladderLinks.map(a => ({ text: a.textContent.trim(), rect: a.getBoundingClientRect() }))
  const gRect = goldensLink?.getBoundingClientRect()
  return { rects: rects.map(r => ({ text: r.text, top: r.rect.top, bottom: r.rect.bottom, left: r.rect.left, right: r.rect.right, h: r.rect.height })), goldens: gRect ? { top: gRect.top, bottom: gRect.bottom, h: gRect.height } : null }
})
console.log(JSON.stringify(info, null, 1))
// vertical gaps between consecutive ladder rung links
for (let i = 1; i < info.rects.length; i++) {
  const gap = info.rects[i].top - info.rects[i-1].bottom
  console.log(`gap between rung ${i} and ${i+1}: ${gap.toFixed(1)}px`)
}
await browser.close()
