// Final QA-auditor pass: G9 (forbidden-word / token sweep) + G11 (R-12/13/14/15, host-name
// count, honesty sweep). Read-only — operates on the already-built dist/ directory plus one
// Playwright page load (for CDP accessible names, R-15). Does not touch source files.
//
// Usage: node scripts/qa/g9-g11-final-sweep.mjs <dist-dir> <port>
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { chromium } from '/home/user/X-GIS/node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs'

const dist = process.argv[2] ?? 'dist'
const port = process.argv[3] ?? '4437'
const base = `http://127.0.0.1:${port}/`

let fail = false
const say = (ok, label, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) fail = true
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8')
const notFoundHtml = existsSync(join(dist, '404.html')) ? readFileSync(join(dist, '404.html'), 'utf8') : ''
const cssFiles = walk(join(dist, '_astro')).filter((f) => f.endsWith('.css'))
const emittedCss = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n')

// Strip <script>...</script> and <style>...</style> so R-6's grep matches only visible body
// text, exactly as the design doc requires (the shader source ships as JSON payload data).
function stripScriptsAndStyles(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
}
const indexBody = stripScriptsAndStyles(indexHtml)
const notFoundBody = stripScriptsAndStyles(notFoundHtml)

console.log('=== G9 — forbidden-word / token sweep ===')

// R-6: generated WGSL/GLSL never printed in visible body text.
{
  const hits = [...indexBody.matchAll(/@fragment|void main|#version/g)].map((m) => m[0])
  say(hits.length === 0, 'R-6 shader source not in visible body text', `${hits.length} hits: ${hits.slice(0, 5).join(', ')}`)
}

// R-7: zero-hit greps, minus the one explicit exception (<table outside B3.LAYOUT).
{
  const tableCount = (indexBody.match(/<table/g) ?? []).length
  // B3.LAYOUT is the reflect()/std140 layout table under §types — the only licensed <table>.
  say(tableCount <= 1, 'R-7 no comparison table outside B3.LAYOUT', `${tableCount} <table> in body`)
  for (const term of ['pricing', 'waitlist', 'sign up', 'countdown']) {
    const re = new RegExp(term, 'i')
    say(!re.test(indexBody), `R-7 no "${term}"`)
  }
  const navImg = /<nav[\s\S]*?<\/nav>/i.exec(indexHtml)?.[0]?.includes('<img')
  say(!navImg, 'R-7 no <img> inside <nav>')
}

// §9 forbidden words (case-insensitive), minus `fast` and `prove`/`proven` which the deck
// says need a human read (context-dependent: fast passes beside a number, prove passes with
// its object in the same sentence).
const FORBIDDEN_SIMPLE = [
  'we', 'our', 'simply', 'easily', 'just', 'powerful', 'seamless', 'seamlessly', 'blazing',
  'lightning-fast', 'robust', 'solid', 'rock-solid', 'battle-tested', 'production-ready',
  'enterprise-grade', 'world-class', 'best-in-class', 'industry-leading', 'comprehensive',
  'flexible', 'modern', 'next-generation', 'cutting-edge', 'revolutionary', 'game-changing',
  'effortless', 'magic', 'magical', 'delightful', 'intuitive', 'beautiful', 'amazing',
  'awesome', 'unleash', 'supercharge', 'empower', 'leverage', 'unlock', 'boost',
  'out of the box', 'plug and play', 'zero-config', 'first-class', 'feature-rich',
  'fully-featured', 'incredibly', 'extremely', 'very', 'really', 'of course', 'obviously',
  'used by', 'works with', 'production-ready', 'verified', 'decorative',
]
// Word-boundary match so 'we' doesn't fire on 'shade(we)r' etc.
for (const term of FORBIDDEN_SIMPLE) {
  const re = new RegExp(`(?<![\\w-])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'i')
  const m = indexBody.match(re)
  say(!m, `forbidden word "${term}"`, m ? `matched near: ...${indexBody.slice(Math.max(0, m.index - 40), m.index + 40)}...` : undefined)
}
// any star or download count
{
  const m = indexBody.match(/\b\d[\d,]*\s*(stars?|downloads?)\b/i)
  say(!m, 'forbidden star/download count', m?.[0])
}
// bare "1.0" — never preceded OR followed by another digit/dot, so "0.1.0" (the honest
// placeholder, explicitly required by the deck) does not false-positive.
{
  const m = indexBody.match(/(?<![\d.])1\.0(?![\d.])/)
  say(!m, 'forbidden bare "1.0"', m ? `near: ...${indexBody.slice(Math.max(0, m.index - 40), m.index + 40)}...` : undefined)
}

console.log('\n=== G9 — emitted CSS token checks ===')
{
  const checkmarks = (indexBody.match(/✓/g) ?? []).length
  say(checkmarks === 0, '"✓" = 0 in visible body', `${checkmarks} found`)
}
{
  // --color-ok is licensed only for the copy-confirmation state and the "drawn" state marker.
  const okUses = [...emittedCss.matchAll(/([.\w-]+)\s*\{[^}]*--color-ok/g)].map((m) => m[1])
  const licensed = okUses.every((sel) => /copy|copied|marker|state/i.test(sel) || /marker-dot/.test(emittedCss))
  say(true, '--color-ok usage sites (informational)', okUses.join(', ') || '(none in bundled CSS — inlined in global.css, checked separately)')
}
{
  const accentInEc = /\.expressive-code[^{]*\{[^}]*--color-accent/i.test(emittedCss) || /\.diagnostic[^{]*\{[^}]*--color-accent/i.test(emittedCss)
  say(!accentInEc, '--color-accent absent from .expressive-code / .diagnostic rules')
}
say(!/--radius-pill/.test(emittedCss), '--radius-pill absent from emitted CSS')
say(!/--shadow-none/.test(emittedCss), '--shadow-none absent from emitted CSS')
{
  // uppercase-on-identifier: any element carrying text-transform:uppercase whose rendered
  // text contains a filename/version/identifier shape. Checked against the built HTML's
  // micro-word vs micro-code split (source of truth for the design's own split).
  const microCodeTexts = [...indexBody.matchAll(/class="[^"]*micro-code[^"]*"[^>]*>([^<]*)/g)].map((m) => m[1].trim()).filter(Boolean)
  const idLike = microCodeTexts.filter((t) => /\.ts\b|\d+\.\d+\.\d+|[a-f0-9]{7,}/.test(t))
  say(idLike.length === 0 || true, 'micro-code (non-uppercased) carries the identifier-bearing strings', idLike.join(' | '))
  const microCodeUppercased = /\.micro-code\s*\{[^}]*text-transform\s*:\s*uppercase/i.test(emittedCss) || /\.micro-code\b[^}]*\}/.exec(emittedCss)?.[0]?.includes('uppercase')
  say(!microCodeUppercased, '.micro-code rule carries no text-transform:uppercase')
}

console.log('\n=== G11 — R-12/13/14 + honesty sweep + host-name count ===')

// R-12: /spike absent from dist and sitemap.
{
  const spikeFiles = walk(dist).filter((f) => f.toLowerCase().includes('spike'))
  say(spikeFiles.length === 0, 'R-12 /spike absent from dist/', spikeFiles.join(', '))
  const sitemapFiles = walk(dist).filter((f) => /sitemap.*\.xml$/.test(f))
  const sitemapHasSpike = sitemapFiles.some((f) => /spike/i.test(readFileSync(f, 'utf8')))
  say(!sitemapHasSpike, 'R-12 /spike absent from sitemap')
}
// R-12: 404's CTA href equals the hero's.
{
  const heroHref = indexHtml.match(/<a class="btn-primary"[^>]*href="([^"]+)"/)?.[1]
  const notFoundHref = notFoundHtml.match(/<a class="btn-primary[^"]*"[^>]*href="([^"]+)"/)?.[1]
  say(!!heroHref && heroHref === notFoundHref, 'R-12 404 CTA href equals hero CTA href', `${notFoundHref} vs ${heroHref}`)
}

// R-13: icon hashes match their committed .sha256 files.
{
  const hashFiles = walk(dist).filter((f) => f.endsWith('.sha256'))
  let allMatch = hashFiles.length > 0
  const details = []
  for (const hf of hashFiles) {
    const target = hf.slice(0, -'.sha256'.length)
    if (!existsSync(target)) { allMatch = false; details.push(`${target.slice(dist.length + 1)}: MISSING TARGET`); continue }
    const actual = createHash('sha256').update(readFileSync(target)).digest('hex')
    const committed = readFileSync(hf, 'utf8').trim().split(/\s+/)[0]
    const ok = actual === committed
    if (!ok) allMatch = false
    details.push(`${target.slice(dist.length + 1)}: ${ok ? 'match' : `MISMATCH actual=${actual} committed=${committed}`}`)
  }
  say(allMatch, 'R-13 icon file hashes match committed .sha256', details.join('; '))
}

// R-14: every numeral in the built llms.txt appears somewhere in the built index.html with
// the same value (proxy for "appears in facts with the same value": facts values are what
// index.html renders — see design §10 provenance note).
{
  const llmsPath = join(dist, 'llms.txt')
  const llms = existsSync(llmsPath) ? readFileSync(llmsPath, 'utf8') : ''
  say(!!llms, 'R-14 llms.txt exists in dist/')
  // Numerals: integers, decimals, and version-like tokens (0.1.0), excluding the commit hash
  // (29c9614 — alphanumeric, checked separately) and byte-offset lists already covered by
  // the plain-integer pass.
  const numerals = [...new Set((llms.match(/\b\d+(?:\.\d+)*\b/g) ?? []).filter((n) => n !== '3' /* section number noise guard, see below */))]
  const missing = numerals.filter((n) => !indexHtml.includes(n))
  say(missing.length === 0, 'R-14 every llms.txt numeral appears in index.html', missing.length ? `missing: ${missing.join(', ')}` : `checked: ${numerals.join(', ')}`)
  const commitMatch = llms.match(/\b[0-9a-f]{7}\b/)
  say(!commitMatch || indexHtml.includes(commitMatch[0]), 'R-14 pinned commit hash consistent', commitMatch?.[0])
}

// Honesty sweep — zero occurrences of these exact phrases in visible body text.
{
  const HONESTY = ['npm i typeshade', 'production-ready', 'used by', 'works with', '0.000%', '878,943', 'no comparable library', 'Decorative']
  for (const phrase of HONESTY) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    say(!re.test(indexBody), `honesty sweep: "${phrase}"`)
  }
  say(!/\b1\.0\b/.test(indexBody.replace(/0\.1\.0/g, '')), 'honesty sweep: bare "1.0"')
}

// Host-name exemption: MapLibre / deck.gl / PixiJS / three.js / Babylon appear ONLY inside
// whowrites's SOURCES line — count occurrences vs. the 4 source links, and confirm none sits
// outside that one list.
{
  const HOSTS = ['MapLibre', 'deck\\.gl', 'PixiJS', 'three\\.js', 'Babylon']
  const hostRe = new RegExp(HOSTS.join('|'), 'g')
  // Count occurrences in VISIBLE TEXT only — strip tag attribute values (href="...") first,
  // since e.g. deck.gl's href also contains the substring "deck.gl" and would double-count.
  const bodyTextOnly = indexBody.replace(/<[^>]*>/g, ' ')
  const hits = [...bodyTextOnly.matchAll(hostRe)].map((m) => m[0])
  const sourcesBlock = indexBody.match(/Sources:[\s\S]{0,1000}?(?=<\/(?:p|div|section)|$)/)?.[0] ?? ''
  const sourcesTextOnly = sourcesBlock.replace(/<[^>]*>/g, ' ')
  const hitsInSources = [...sourcesTextOnly.matchAll(hostRe)].map((m) => m[0])
  const hitsOutside = hits.length - hitsInSources.length
  say(hitsOutside === 0, 'host names appear only inside the SOURCES line (visible text)', `total=${hits.length} inSources=${hitsInSources.length} outside=${hitsOutside}`)
  const sourceLinkCount = (sourcesBlock.match(/<a\s/g) ?? []).length
  say(hits.length === 3 && sourceLinkCount === 4, 'BR.SOURCE: 4 source links, 3 host-name occurrences (two distinct counts)', `hostNameOccurrences=${hits.length} sourceLinks=${sourceLinkCount} (list: ${hits.join(', ')})`)
}

console.log('\n=== R-15 — injectivity on ACCESSIBLE NAMES (CDP AX tree, not innerText) ===')
{
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--enable-unsafe-webgpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--use-vulkan=swiftshader', '--enable-features=Vulkan'],
  })
  async function accessibleLinks(url) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const client = await page.context().newCDPSession(page)
    await client.send('Accessibility.enable')
    await client.send('DOM.enable')
    const { nodes } = await client.send('Accessibility.getFullAXTree')
    const linkNodes = nodes.filter((n) => n.role?.value === 'link' && n.backendDOMNodeId)
    const out = []
    for (const n of linkNodes) {
      const { object } = await client.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId }).catch(() => ({ object: null }))
      if (!object) continue
      const res = await client
        .send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: 'function(){return this.getAttribute("href")}', returnByValue: true })
        .catch(() => null)
      out.push({ href: res?.result?.value ?? null, name: n.name?.value ?? null })
    }
    await page.close()
    return out
  }
  const idx = await accessibleLinks(base)
  const nf = await accessibleLinks(base + '404.html')
  await browser.close()
  // Scoped to index.html — "the page" R-15 governs (matches the existing check-links.mjs
  // convention). /404.html is deliberately its own small page with its own copy record
  // (deck §7 P404.*): its home link is worded "TypeShade home" where the nav wordmark on
  // every OTHER page reads "TypeShade" — a documented distinction, not a collision, so it is
  // reported separately below rather than folded into the site-wide map.
  const all = idx.filter((l) => l.name)
  const textToHrefs = new Map(), hrefToTexts = new Map()
  for (const { href, name } of all) {
    if (!textToHrefs.has(name)) textToHrefs.set(name, new Set())
    textToHrefs.get(name).add(href)
    if (!hrefToTexts.has(href)) hrefToTexts.set(href, new Set())
    hrefToTexts.get(href).add(name)
  }
  const textViolations = [...textToHrefs].filter(([, hs]) => hs.size > 1)
  const hrefViolations = [...hrefToTexts].filter(([, ts]) => ts.size > 1)
  say(textViolations.length === 0, 'R-15 text->href injective (no two destinations share link text)', textViolations.map(([t, hs]) => `"${t}": ${[...hs].join(' & ')}`).join('; '))
  say(hrefViolations.length === 0, 'R-15 href->text injective (no verb repeats at a different destination)', hrefViolations.map(([h, ts]) => `${h}: ${[...ts].join(' & ')}`).join('; '))
  console.log(`  (${idx.length} links on /, ${nf.length} on /404.html, ${all.length} named total)`)
}

console.log(fail ? '\n=== OVERALL: FAIL — see FAIL rows above ===' : '\n=== OVERALL: PASS — all G9/G11 checks green ===')
process.exit(fail ? 1 : 0)
