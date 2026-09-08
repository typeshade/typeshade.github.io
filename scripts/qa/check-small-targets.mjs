import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })

const info = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a')].filter((a) =>
    ['goldens diff byte for byte', 'src/core/oracle.ts', 'scripts/compile-gate.ts'].includes(a.textContent.trim())
  )
  return links.map((a) => {
    const r = a.getBoundingClientRect()
    const cs = getComputedStyle(a)
    const parent = a.parentElement
    const pr = parent.getBoundingClientRect()
    const pcs = getComputedStyle(parent)
    // nearest siblings' vertical gap
    const before = a.getBoundingClientRect()
    return {
      text: a.textContent.trim(),
      className: a.className,
      rect: { w: r.width, h: r.height, top: r.top, left: r.left },
      padding: cs.padding, display: cs.display, lineHeight: cs.lineHeight,
      parentTag: parent.tagName, parentClass: parent.className,
      parentRect: { w: pr.width, h: pr.height },
      parentPadding: pcs.padding, parentDisplay: pcs.display,
    }
  })
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
