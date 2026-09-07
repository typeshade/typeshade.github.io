import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'
const base = process.argv[2] ?? 'http://127.0.0.1:4401/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
})

// --- Reflow at 320 ---
{
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => ({
    scrollWidth: document.scrollingElement.scrollWidth,
    clientWidth: document.scrollingElement.clientWidth,
  }))
  console.log('=== Reflow @ 320px ===', JSON.stringify(r), r.scrollWidth === r.clientWidth ? 'OK no horizontal overflow' : 'OVERFLOW!')
  await page.screenshot({ path: '/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/reflow-320-full.png', fullPage: true })
  await page.close()
}

// --- forced-colors: active ---
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const info = await page.evaluate(() => {
    const scrimHue = document.querySelector('.scrim-hue')
    const btn = document.querySelector('.btn-primary')
    const nav = document.querySelector('.nav')
    return {
      matchesForcedColors: matchMedia('(forced-colors: active)').matches,
      scrimHueDisplay: scrimHue ? getComputedStyle(scrimHue).display : 'MISSING',
      btnBg: btn ? getComputedStyle(btn).backgroundColor : null,
      btnBorder: btn ? getComputedStyle(btn).borderColor : null,
      navMarkStroke: (() => { const m = document.querySelector('.nav-mark path') ; return m ? getComputedStyle(m).stroke : null })(),
    }
  })
  console.log('=== forced-colors: active ===', JSON.stringify(info, null, 1))
  await page.screenshot({ path: '/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/forced-colors-hero.png' })
  const heroSection = page.locator('.hero')
  await heroSection.screenshot({ path: '/tmp/claude-0/-home-user-X-GIS/6b5302b5-8404-5df5-b326-c7a529fabf19/scratchpad/forced-colors-hero-el.png' }).catch(e=>console.log('hero shot fail', e.message))
  await page.close()
}

await browser.close()
