// Rasterises public/favicon.svg. After changing the mark: bun run build:icons
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './playwright.mjs'
import { writeHashed } from './artifacts.mjs'
import { MARK } from '../src/lib/mark.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')

const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1]
if (viewBox !== MARK.viewBox) {
  throw new Error(`[icons] favicon.svg viewBox ${viewBox} != MARK.viewBox ${MARK.viewBox}`)
}

const maskIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#000"/></svg>\n`

const markup = (size: number): string =>
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${size}px;height:${size}px}</style>${source}`

const browser = await launchChromium()
const context = await browser.newContext({ deviceScaleFactor: 1 })
const page = await context.newPage()

async function raster(size: number): Promise<Buffer> {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(markup(size))
  return (await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })) as Buffer
}

const ico32 = await raster(32)
const apple180 = await raster(180)
await browser.close()

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
