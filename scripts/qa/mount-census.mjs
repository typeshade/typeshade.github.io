// Mount census (IA R-10) and per-mount canvas states (deck §6) across four arms:
// webgpu (default), webgl2 (forced via ?forcegl2=1 on the whole page — note: only
// affects mounts that do not already set forceWebGl2 themselves), reduced motion,
// and 'none' (both backends stubbed out before the runtime script runs).
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})

async function census(opts = {}) {
  const { forceGl2Url = false, reducedMotion = false, stubNone = false } = opts
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  const consoleMsgs = []
  page.on('console', (m) => { if (m.type() === 'error') consoleMsgs.push(m.text()) })
  page.on('pageerror', (e) => consoleMsgs.push('pageerror: ' + e.message))
  if (stubNone) {
    await page.addInitScript(() => {
      // Kill WebGPU entirely.
      Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true })
      // Kill WebGL2 context creation.
      const orig = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === 'webgl2') return null
        return orig.call(this, type, ...rest)
      }
    })
  }
  const url = base + (forceGl2Url ? '?forcegl2=1' : '')
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const data = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')]
    return canvases.map((c) => {
      const figure = c.closest('figure,[data-shader-scope]')
      const captionEl = figure?.querySelector('[data-shader-caption]')
      const headerEl = figure?.querySelector('[data-shader-header]')
      return {
        example: c.closest('[data-shader-canvas]')?.dataset.example ?? c.dataset.example ?? null,
        backend: c.dataset.backend,
        frames: c.__shader?.frames ?? null,
        ariaLabel: c.getAttribute('aria-label'),
        caption: captionEl?.textContent?.trim() ?? null,
        header: headerEl?.textContent?.trim() ?? null,
        role: c.getAttribute('role'),
        focusable: c.tabIndex >= 0 && c.getAttribute('tabindex') !== null,
      }
    })
  })
  const scriptCount = await page.evaluate(() => document.querySelectorAll('script[data-shader-payload]').length)
  await ctx.close()
  return { data, scriptCount, consoleMsgs }
}

console.log('=== ARM 1: default (webgpu expected) ===')
const a1 = await census({})
console.log(JSON.stringify(a1, null, 1))

console.log('\n=== ARM 2: forced webgl2 via ?forcegl2=1 ===')
const a2 = await census({ forceGl2Url: true })
console.log(JSON.stringify(a2, null, 1))

console.log('\n=== ARM 3: reduced motion ===')
const a3 = await census({ reducedMotion: true })
console.log(JSON.stringify(a3, null, 1))

console.log('\n=== ARM 4: none (both backends stubbed) ===')
const a4 = await census({ stubNone: true })
console.log(JSON.stringify(a4, null, 1))

await browser.close()
