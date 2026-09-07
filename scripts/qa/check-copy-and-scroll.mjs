import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
await page.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// --- Copy button ---
const copyBtn = page.locator('button:has-text("Copy")').first()
await copyBtn.scrollIntoViewIfNeeded()
const beforeText = await copyBtn.textContent()
await copyBtn.click()
await page.waitForTimeout(200)
const afterText = await copyBtn.textContent()
const liveRegionText = await page.evaluate(() => document.querySelector('[role="status"][aria-live="polite"]')?.textContent ?? document.querySelector('[aria-live="polite"]')?.textContent ?? null)
let clipboardText = null
try { clipboardText = await page.evaluate(() => navigator.clipboard.readText()) } catch (e) { clipboardText = 'ERROR: ' + e.message }
console.log('Copy button before:', JSON.stringify(beforeText.trim()), 'after click:', JSON.stringify(afterText.trim()))
console.log('aria-live region text:', JSON.stringify(liveRegionText))
console.log('clipboard content:', JSON.stringify(clipboardText))
await page.waitForTimeout(1800)
const revertedText = await copyBtn.textContent()
console.log('after 1.8s (should revert to Copy):', JSON.stringify(revertedText.trim()))

// --- Scroll region: install command's own horizontal-scroll box ---
const scrollRegion = await page.evaluate(() => {
  const el = document.querySelector('[role="region"][tabindex="0"]') // the install command box, or code frames
  return el ? { tag: el.tagName, cls: el.className, role: el.getAttribute('role'), tabindex: el.getAttribute('tabindex'), ariaLabel: el.getAttribute('aria-label') } : null
})
console.log('a scroll region found:', JSON.stringify(scrollRegion))

// find the install command's scrollable box specifically and test arrow-key scroll
const installScroller = page.locator('[data-shader-scope], .install-command, [class*="install"]').first()
const allScrollRegions = await page.evaluate(() => [...document.querySelectorAll('[role="region"]')].map(e => ({ cls: e.className, tabindex: e.getAttribute('tabindex'), ariaLabel: e.getAttribute('aria-label'), scrollWidth: e.scrollWidth, clientWidth: e.clientWidth })))
console.log('all role=region elements:', JSON.stringify(allScrollRegions, null, 1))

await browser.close()
