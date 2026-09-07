// Every off-site destination the built site names, resolved — copy-deck §11's "every CTA
// destination is a resolved URL, verified 200 at build", which had no instrument until now.
//
// Scope is the BUILT output, not `src/lib/links.ts`: a destination reaches a reader only if it
// reached `dist/`, and `llms.txt` publishes its own copies of the same URLs (R-14).
//
// Verdicts, and why they are not all the same kind:
//   ok      2xx, or a redirect chain ending in one (fetch follows by default)
//   BROKEN  404 / 410 — the URL is gone. This is the failure this script exists to catch, and
//           the only one that exits non-zero.
//   warn    403 / 429 / a transport error. A CI runner is rate-limited by hosts that are fine
//           for a reader, and a sandboxed agent's egress proxy answers 403 for repositories
//           that demonstrably exist, so this class cannot distinguish a dead URL from a
//           blocked one and must not fail a build on its own.
// A run in which EVERY link warned learned nothing and says so (exit 2): a blind instrument
// reporting zero failures is not a pass.
//
// Usage: node scripts/qa/check-http-links.mjs [dist-dir]
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = process.argv[2] ?? 'dist'
const TIMEOUT_MS = 15000
const CONCURRENCY = 4
// The sandboxed-session signature, so a proxy refusal is never reported as a site defect.
const PROXY_MARKERS = ['access is not enabled for this session', 'agentproxy']

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const files = walk(dist).filter((f) => f.endsWith('.html') || f.endsWith('.txt') || f.endsWith('.xml'))
const found = new Map() // url -> Set(file)
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const urls = [
    ...[...text.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
    ...[...text.matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]), // markdown links in llms.txt
    ...[...text.matchAll(/^\s*(https?:\/\/\S+)$/gm)].map((m) => m[1]), // bare URLs on their own line
  ]
  for (const raw of urls) {
    const url = raw.replace(/[.,;]$/, '')
    // The site's own origin is served by Pages from this very build; nothing to resolve.
    if (url.startsWith('https://typeshade.dev')) continue
    if (!found.has(url)) found.set(url, new Set())
    found.get(url).add(file.slice(dist.length + 1))
  }
}

const urls = [...found.keys()].sort()
console.log(`${urls.length} unique off-site URLs in ${dist}/`)

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ac.signal,
        headers: { 'user-agent': 'typeshade.dev link check (+https://typeshade.dev)' },
      })
      clearTimeout(timer)
      if (method === 'HEAD' && (res.status === 405 || res.status === 501)) continue // retry as GET
      let body = ''
      if (res.status === 403) body = await res.text().catch(() => '')
      const proxied = PROXY_MARKERS.some((m) => body.toLowerCase().includes(m))
      if (res.ok) return { verdict: 'ok', status: res.status }
      if (res.status === 404 || res.status === 410) return { verdict: 'BROKEN', status: res.status }
      return { verdict: 'warn', status: res.status, note: proxied ? 'egress proxy refusal, not the host' : '' }
    } catch (e) {
      clearTimeout(timer)
      if (method === 'GET') return { verdict: 'warn', status: 0, note: String(e.message ?? e).slice(0, 80) }
    }
  }
  return { verdict: 'warn', status: 0, note: 'no response' }
}

// One host answers a non-browser with a bot challenge rather than the page: npmjs.com serves
// Cloudflare's "Just a moment..." at 403 for `/package/<name>` (verified: 403 with a browser
// UA too, body `<title>Just a moment...`). Its REGISTRY is a machine interface and answers the
// same question — does this package name resolve — so a warn there is corroborated rather than
// shrugged at, and only an unresolvable name is left as a warn.
async function corroborate(url, res) {
  const m = /^https:\/\/www\.npmjs\.com\/package\/([^/?#]+)/.exec(url)
  if (!m || res.verdict !== 'warn') return res
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(`https://registry.npmjs.org/${m[1]}`, { signal: ac.signal })
    clearTimeout(timer)
    if (r.ok) return { verdict: 'ok', status: res.status, note: 'npmjs.com bot challenge; registry.npmjs.org 200' }
    if (r.status === 404) return { verdict: 'BROKEN', status: 404, note: 'registry.npmjs.org has no such package' }
  } catch {
    clearTimeout(timer)
  }
  return res
}

const results = []
let cursor = 0
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++]
      results.push({ url, ...(await corroborate(url, await probe(url))), where: [...found.get(url)].join(' ') })
    }
  }),
)
results.sort((a, b) => a.url.localeCompare(b.url))

const broken = results.filter((r) => r.verdict === 'BROKEN')
const warned = results.filter((r) => r.verdict === 'warn')
for (const r of results) {
  console.log(`  ${r.verdict.padEnd(6)} ${String(r.status).padStart(3)}  ${r.url}${r.note ? `  (${r.note})` : ''}  [${r.where}]`)
}
console.log(`\nok ${results.length - broken.length - warned.length} · warn ${warned.length} · BROKEN ${broken.length}`)
if (broken.length) {
  console.log('FAIL — a destination on the page does not resolve')
  process.exit(1)
}
if (warned.length === results.length && results.length > 0) {
  console.log('INCONCLUSIVE — nothing could be resolved from this network; NEEDS-LOCAL-RUN')
  process.exit(2)
}
console.log('PASS')
