// public/og.png — a REAL captured hero frame, not a drawing (IA R-13, design §9).
//
// A drawn card on a page whose pitch is "this is real" would be its one dishonest pixel, so
// the OG image is a photograph of `/og/`: the same `metaballs` mount, the same scrims and the
// same headline the hero composites, at 1200 x 630.
//
// DETERMINISM is what makes it shippable. The context is `reducedMotion: 'reduce'`, which is
// the path `mountShader` reads itself — one frame at a PINNED clock (t = 3 s), no rAF, no
// observers. Before the shutter this script ASSERTS the things a silent degradation would
// otherwise re-baseline behind the hash: that WebGPU is present and is what drew the frame,
// that exactly one frame was drawn, that the three composition tokens resolved to §9's
// numbers, that Inter is the face that rendered, and that INV-1 holds on the card.
//
// Run:  bun run capture:og   (which builds with OG_REBASELINE=1 first, then calls this)
import { createReadStream, existsSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './playwright.mjs'
import { writeHashed } from './artifacts.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.OG_PORT ?? 4471)

if (!existsSync(path.join(dist, 'og/index.html'))) {
  throw new Error(`[og] ${dist}/og/index.html is missing — run \`astro build\` before capturing.`)
}

// ── a static server for dist/, on loopback: a secure context, so navigator.gpu exists ──
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
  let file = path.join(dist, decodeURIComponent(url.pathname))
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))

const browser = await launchChromium()
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    // The pinned-clock path. `mountShader` reads this media query itself and draws once.
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const url = `http://127.0.0.1:${port}/og/`

  // Two loads on purpose. `font-display: optional` will serve the metric-matched fallback
  // FOREVER if the face is not there before first paint; the second load has it in cache, and
  // the assertion below refuses to shoot if it still is not the face that rendered.
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(
    () => (document.querySelector('canvas') as { __shader?: unknown } | null)?.__shader != null,
    undefined,
    { timeout: 20_000 },
  )

  const report = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement & {
      __shader?: { backend: string; frames: number }
    }
    // A custom property is NOT resolved by getComputedStyle — `--pad-x` reads back as its own
    // calc() expression. Resolve each through a probe that USES it, which is the same
    // resolution path the scrims and the placement take.
    const px = (value: string): number => {
      const probe = document.createElement('div')
      probe.style.cssText = `position:absolute;visibility:hidden;inline-size:${value}`
      document.body.append(probe)
      const w = probe.getBoundingClientRect().width
      probe.remove()
      return w
    }
    const card = document.querySelector('[data-og-card]') as HTMLElement
    const box = card.getBoundingClientRect()
    const h1 = document.querySelector('.og-h1') as HTMLElement
    const spans = [...h1.querySelectorAll('span')].map((s) => s.getBoundingClientRect())
    const rightEdge = (sel: string): number =>
      [...document.querySelectorAll(sel)].reduce(
        (m, el) => Math.max(m, el.getBoundingClientRect().right),
        0,
      )
    return {
      hasGpu: 'gpu' in navigator,
      backend: canvas.dataset.backend,
      frames: canvas.__shader?.frames ?? -1,
      padX: px('var(--pad-x)'),
      heroCol: px('var(--hero-col)'),
      p0: px('var(--scrim-p0)'),
      h1Left: spans[0]?.left ?? 0,
      h1Size: getComputedStyle(h1).fontSize,
      subSize: getComputedStyle(document.querySelector('.og-sub')!).fontSize,
      subLeading: getComputedStyle(document.querySelector('.og-sub')!).lineHeight,
      card: { width: box.width, height: box.height },
      h1Line1: spans[0]?.width ?? 0,
      h1Top: spans[0]?.top ?? 0,
      h1Bottom: spans[spans.length - 1]?.bottom ?? 0,
      textRight: rightEdge('.og-wordmark, .og-h1 span, .og-sub span, .og-domain'),
      inter: document.fonts.check('600 64px "Inter Variable"'),
    }
  })

  // §9's composition, asserted rather than assumed. `--pad-x` is DERIVED from --content, so
  // 96 px is the proof that the three-token override took and nothing else moved with it.
  const bound = 96 + 560 // --pad-x + --hero-col: INV-1's right-edge bound on this card
  const fail = (m: string): never => {
    throw new Error(`[og] ${m}\n  report ${JSON.stringify(report)}`)
  }
  if (!report.hasGpu) fail('navigator.gpu is absent — the flags did not take')
  if (report.backend !== 'webgpu') fail(`data-backend is "${report.backend}", not "webgpu"`)
  if (report.frames !== 1) fail(`${report.frames} frames drawn, not 1 — the clock is not pinned`)
  if (report.card.width !== 1200 || report.card.height !== 630) fail('the card is not 1200 x 630')
  if (report.padX !== 96) fail(`--pad-x resolves to ${report.padX}, not 96`)
  if (report.heroCol !== 560) fail(`--hero-col resolves to ${report.heroCol}, not 560`)
  if (report.p0 !== 680) fail(`--scrim-p0 resolves to ${report.p0}, not 680 (56.7 % of 1200)`)
  if (report.h1Left !== 96) fail(`the h1 starts at ${report.h1Left}, not at --pad-x`)
  if (report.h1Size !== '64px') fail(`the h1 is ${report.h1Size}, not 64px (--text-h1-og)`)
  if (!report.inter) fail('Inter did not render — font-display: optional served the fallback')
  if (report.textRight > bound + 0.5) fail(`INV-1: right edge ${report.textRight} > ${bound}`)

  const png = (await page.screenshot({
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })) as Buffer

  // The PNG's own header, not the request: a clipped screenshot that silently scaled would
  // otherwise ship at the wrong size behind a green hash.
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  if (width !== 1200 || height !== 630) fail(`the PNG is ${width} x ${height}, not 1200 x 630`)
  if (png.length > 300 * 1024) fail(`${png.length} B exceeds §9's 300 KB cap`)

  const digest = writeHashed(root, 'og.png', png)
  console.log(
    `public/og.png  ${width} x ${height}  ${png.length} B  sha256 ${digest.slice(0, 16)}…`,
  )
  console.log(
    `  backend ${report.backend} · frames ${report.frames} · --pad-x ${report.padX} · ` +
      `--scrim-p0 ${report.p0} · h1 ${report.h1Size} · line 1 ${report.h1Line1.toFixed(1)} px · ` +
      `y ${report.h1Top.toFixed(1)}-${report.h1Bottom.toFixed(1)} · subline ${report.subSize}/` +
      `${report.subLeading} · text right ${report.textRight.toFixed(1)} <= ${bound}`,
  )
} finally {
  await browser.close()
  server.close()
}

// §10: `/og/` is a build-time instrument, not a page. It leaves the build with the capture.
rmSync(path.join(dist, 'og'), { recursive: true, force: true })
console.log('dist/og/ removed')
