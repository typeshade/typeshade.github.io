// G7 — console/page-error/HTTP>=400 on all FOUR backend arms (spike 03-spike-hero.md §Arm
// 1-4), plus NFR-9's rAF-registration equalities (exactly 1 after settle, normal; 0 under
// prefers-reduced-motion).
//
// Arms 1 (webgpu) and 2 (webgl2/?forcegl2=1) are already covered by qa-audit.mjs at three
// viewports with 0 console/0 failed — this script covers the two NOT covered there: arm 3
// (prefers-reduced-motion, both physical backends reachable) and arm 4 (no GPU API at all,
// via the same launch flags the spike used), plus the rAF counts.
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const port = process.argv[2] ?? '4417'
const base = `http://127.0.0.1:${port}/`
const report = {}

async function armConsoleCheck(name, launchArgs, contextOpts = {}) {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: launchArgs,
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...contextOpts })
  const consoleErrors = []
  const failed = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(2000)
  const backendCensus = await page.evaluate(() => [...document.querySelectorAll('[data-shader-canvas] canvas')].map((c) => ({ backend: c.dataset.backend, frames: c.__shader?.frames ?? null })))
  const gpuInNavigator = await page.evaluate(() => 'gpu' in navigator)
  await browser.close()
  report[name] = { consoleErrors, failed, backendCensus, gpuInNavigator }
}

const BASE_ARGS = ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan']

// Arm 3 — prefers-reduced-motion: reduce, normal GPU args (webgpu reachable, spike's own arm 3).
await armConsoleCheck('arm3-reduced-motion', BASE_ARGS, { reducedMotion: 'reduce' })

// Arm 4 — no GPU API at all (spike's own recipe): navigator.gpu object still exists (no
// adapter), webgl2 context returns null.
await armConsoleCheck('arm4-no-gpu', ['--disable-gpu', '--disable-software-rasterizer', '--disable-webgl', '--disable-webgl2'])

// ── NFR-9: rAF registrations — exactly 1 active loop after settle (normal), 0 under
// prefers-reduced-motion. Measured by comparing calls to the REAL rAF (nativeRAF, used as a
// tick reference) against calls the PAGE makes to window.requestAnimationFrame after an
// override is installed before navigation.
async function measureRafLoops(reducedMotion) {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: BASE_ARGS,
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
  await page.addInitScript(() => {
    window.__rafCalls = 0
    window.__nativeFrames = 0
    const native = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb) => { window.__rafCalls++; return native(cb) }
    const tickRef = () => { window.__nativeFrames++; native(tickRef) }
    native(tickRef)
  })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(2000) // let mount + backend audition settle
  const before = await page.evaluate(() => ({ calls: window.__rafCalls, frames: window.__nativeFrames }))
  await page.waitForTimeout(2000)
  const after = await page.evaluate(() => ({ calls: window.__rafCalls, frames: window.__nativeFrames }))
  await browser.close()
  const deltaCalls = after.calls - before.calls
  const deltaFrames = after.frames - before.frames
  const loops = deltaFrames > 0 ? deltaCalls / deltaFrames : 0
  return { deltaCalls, deltaFrames, loopsEstimate: +loops.toFixed(2) }
}
report.rafNormal = await measureRafLoops(false)
report.rafReducedMotion = await measureRafLoops(true)

console.log(JSON.stringify(report, null, 2))
