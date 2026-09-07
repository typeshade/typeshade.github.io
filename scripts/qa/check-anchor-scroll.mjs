// WCAG 2.4.11: after jumping to an anchor target, the heading must clear the sticky nav.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const width = Number(process.argv[3] ?? 1440)
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })

const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id))
console.log('ids with scroll-margin candidates:', ids)

for (const id of ids) {
  await page.goto(base + '#' + id, { waitUntil: 'networkidle' })
  await page.waitForTimeout(150)
  const info = await page.evaluate((id) => {
    const nav = document.querySelector('.nav')
    const navRect = nav?.getBoundingClientRect()
    const target = document.getElementById(id)
    const tRect = target?.getBoundingClientRect()
    return { navBottom: navRect?.bottom, targetTop: tRect?.top, targetTag: target?.tagName }
  }, id)
  const clear = info.targetTop >= info.navBottom - 0.5
  console.log(`#${id}: targetTop=${info.targetTop?.toFixed(1)} navBottom=${info.navBottom?.toFixed(1)} tag=${info.targetTag} -> ${clear ? 'OK' : 'HIDDEN-UNDER-NAV'}`)
}
await browser.close()
