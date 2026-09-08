// public/stills/<example>.webp: one rendered frame per example the page mounts, captured from
// the built page in a headless browser, then re-encoded to WebP (quality 82) with sharp. The
// page shows these under each canvas, so a browser with no GPU API, a crawler or a social
// preview still sees the shader.
//
// Run: bun run capture:stills  (builds with STILLS_REBASELINE=1 first, then runs this)
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { launchChromium } from './playwright.mjs'
import { STILLS, writeHashed } from './artifacts.mjs'
import { serveDist } from './serve-dist.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
if (!existsSync(path.join(dist, 'index.html'))) {
  throw new Error(`[stills] ${dist}/index.html is missing; run the build first.`)
}

const server = await serveDist(dist, Number(process.env.STILLS_PORT ?? 4472))
const browser = await launchChromium()
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    // One frame at a fixed clock, so the capture is repeatable.
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  let current = ''
  for (const { id, example, page: route, forceWebGl2, backend: expected } of STILLS) {
    if (route !== current) {
      await page.goto(`${server.url}${route}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForFunction(
        () => [...document.querySelectorAll('canvas')].every((c) => (c as { __shader?: unknown }).__shader != null),
        undefined,
        { timeout: 30_000 },
      )
      // Hide the previous stills so the screenshot is the canvas alone.
      await page.addStyleTag({ content: '.figure-frame > img, .figure-split { visibility: hidden }' })
      current = route
    }
    const forced = forceWebGl2 ? '[data-force-webgl2]' : ':not([data-force-webgl2])'
    const frame = page.locator(`[data-shader-canvas][data-example="${example}"]${forced}`).first()
    const backend = await frame.locator('canvas').getAttribute('data-backend')
    if (backend === 'none') throw new Error(`[stills] '${id}' did not draw on any backend`)
    if (expected && backend !== expected) {
      throw new Error(`[stills] '${id}' was drawn on ${backend}; its caption says ${expected}`)
    }
    const png = (await frame.screenshot({ type: 'png' })) as Buffer
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    const webp = await sharp(png).webp({ quality: 82 }).toBuffer()
    const digest = writeHashed(root, `stills/${id}.webp`, webp)
    console.log(`public/stills/${id}.webp  ${width} x ${height}  ${webp.length} B  ${backend}  sha256 ${digest.slice(0, 16)}`)
  }
} finally {
  await browser.close()
  server.close()
}

rmSync(path.join(dist, 'og'), { recursive: true, force: true })
