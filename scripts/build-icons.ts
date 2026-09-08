// Every icon the site ships, rasterised from public/favicon.svg. Run after any change to
// the mark: bun run build:icons
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './playwright.mjs'
import { writeHashed } from './artifacts.mjs'
import { MARK } from '../src/lib/mark.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')

// src/lib/mark.ts must describe the SVG on disk; the header and the social card draw from it.
const attr = (name: string): string => {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(source)
  if (!m) throw new Error(`[icons] public/favicon.svg declares no ${name}`)
  return m[1]!
}
const mismatch: string[] = []
if (attr('viewBox') !== MARK.viewBox) mismatch.push(`viewBox ${attr('viewBox')} != ${MARK.viewBox}`)
if (attr('d') !== MARK.d) mismatch.push(`d ${attr('d')} != ${MARK.d}`)
if (Number(attr('stroke-width')) !== MARK.strokeWidth) mismatch.push(`stroke-width ${attr('stroke-width')} != ${MARK.strokeWidth}`)
if (mismatch.length > 0) {
  throw new Error(`[icons] src/lib/mark.ts no longer describes public/favicon.svg: ${mismatch.join('; ')}`)
}

// mask-icon.svg is the path alone; a filled rect makes Safari render the mask as a square.
const maskIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK.viewBox}"><path d="${MARK.d}" fill="none" stroke="#000" stroke-width="${MARK.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`

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
  return (await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })) as Buffer
}

const ico32 = await raster(32, true)
const apple180 = await raster(180, false)
await browser.close()

/** A one-image ICO whose single entry is a PNG. */
function icoOf(png: Buffer): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(32, 6)
  header.writeUInt8(32, 7)
  header.writeUInt8(0, 8)
  header.writeUInt8(0, 9)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, png])
}

const written = [
  ['mask-icon.svg', Buffer.from(maskIcon, 'utf8')],
  ['favicon.ico', icoOf(ico32)],
  ['apple-touch-icon.png', apple180],
] as const
for (const [file, bytes] of written) {
  const digest = writeHashed(root, file, bytes)
  console.log(`public/${file}  ${bytes.length} B  sha256 ${digest.slice(0, 16)}`)
}
