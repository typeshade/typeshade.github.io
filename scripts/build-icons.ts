// Every icon the site ships, rasterised from ONE source — design §9.
//
// `public/favicon.svg` is that source. The icon set previously had a deliverable list and no
// method, which is exactly how a set drifts from the mark it claims to be. This script:
//
//   1. asserts `src/lib/mark.ts` still describes the SVG on disk — the two inline copies of the
//      mark (the nav wordmark, the /og/ card) read that record, so this is what stops a
//      hand-edited path from being drawn on the page but not in the tab;
//   2. emits `mask-icon.svg` — the path ONLY, with the `rect` deleted, because a filled rect
//      makes Safari render the mask as a solid square;
//   3. rasterises `favicon.ico` (32 x 32, PNG-in-ICO) and `apple-touch-icon.png` (180 x 180,
//      same geometry with NO corner radius: iOS masks it);
//   4. writes each output's `.sha256`, which `bun run build` then asserts.
//
// Run it after any change to the mark: `bun run build:icons`.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './playwright.mjs'
import { writeHashed } from './artifacts.mjs'
import { MARK } from '../src/lib/mark.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')

// ── 1. the source and the record must agree ─────────────────────────────────
const attr = (name: string): string => {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(source)
  if (!m) throw new Error(`[icons] public/favicon.svg declares no ${name}`)
  return m[1]!
}
const mismatch: string[] = []
if (attr('viewBox') !== MARK.viewBox) mismatch.push(`viewBox ${attr('viewBox')} != ${MARK.viewBox}`)
if (attr('d') !== MARK.d) mismatch.push(`d ${attr('d')} != ${MARK.d}`)
if (Number(attr('stroke-width')) !== MARK.strokeWidth) {
  mismatch.push(`stroke-width ${attr('stroke-width')} != ${MARK.strokeWidth}`)
}
if (mismatch.length > 0) {
  throw new Error(
    `[icons] src/lib/mark.ts no longer describes public/favicon.svg: ${mismatch.join('; ')}. ` +
      `The SVG is the one source; update the record to match it (the nav and the /og/ card draw ` +
      `the mark from that record).`,
  )
}

// ── 2. mask-icon.svg — the path, with the ground rect removed ───────────────
const maskIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK.viewBox}"><path d="${MARK.d}" fill="none" stroke="#000" stroke-width="${MARK.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`

// ── 3. the two rasters ──────────────────────────────────────────────────────
/** The source SVG at `size` px, optionally with its corner radius dropped. */
const markup = (size: number, rounded: boolean): string => {
  const svg = rounded ? source : source.replace(/\srx="\d+(?:\.\d+)?"/, '')
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
}

const browser = await launchChromium()
const context = await browser.newContext({ deviceScaleFactor: 1 })
const page = await context.newPage()

async function raster(size: number, rounded: boolean): Promise<Buffer> {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(markup(size, rounded))
  return (await page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  })) as Buffer
}

const ico32 = await raster(32, true)
const apple180 = await raster(180, false)
await browser.close()

/** A one-image ICO whose single entry IS a PNG — the format every browser since IE11 and
 *  Windows Vista reads, and the only one that needs no palette encoder here. */
function icoOf(png: Buffer): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // one image
  header.writeUInt8(32, 6) // width
  header.writeUInt8(32, 7) // height
  header.writeUInt8(0, 8) // palette: none
  header.writeUInt8(0, 9) // reserved
  header.writeUInt16LE(1, 10) // colour planes
  header.writeUInt16LE(32, 12) // bits per pixel
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, png])
}

// ── 4. write, hash, report ──────────────────────────────────────────────────
const written = [
  ['mask-icon.svg', Buffer.from(maskIcon, 'utf8')],
  ['favicon.ico', icoOf(ico32)],
  ['apple-touch-icon.png', apple180],
] as const
for (const [file, bytes] of written) {
  const digest = writeHashed(root, file, bytes)
  console.log(`public/${file}  ${bytes.length} B  sha256 ${digest.slice(0, 16)}…`)
}
