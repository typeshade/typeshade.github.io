// The Playground, opened in a browser against the built site. A build that emits a page whose
// script throws on its first line is still a green build, which is how the Playground shipped
// two empty panes: the editor never mounted and nothing said so. This opens dist/ on loopback,
// loads the page the way a reader does, and checks the four things that were wrong.
//
//   1. the page's own script runs: no uncaught error reaches `pageerror`
//   2. Monaco mounts: `.monaco-editor` appears
//   3. Monaco's own TypeScript validation is off, and no marker it owns is on the sample
//   4. the compiler ran in the browser: the WGSL pane holds text
//
// Monaco comes from jsdelivr, the way the page loads it for a reader, so a runner with no
// route to that host cannot check 2, 3 or 4. That case is reported on its own, with the
// requests that failed, so a CDN outage reads differently from a page that is broken. Exit
// codes: 1 for a broken page, 2 for the CDN. Two environment variables answer the second one:
//
//   PLAYGROUND_MONACO_VIA_NODE=1  Node fetches the exact URLs the page asks the CDN for and
//                                 hands them back, for a sandbox whose browser has no route
//                                 out while Node has one. A wrong URL still fails, since it
//                                 is the page's own request that is fetched, a worker's own
//                                 importScripts included.
//   PLAYGROUND_CDN_OPTIONAL=1     a CDN that neither can reach passes with a warning.
//
// Run: bun run check:playground (after a build, which writes dist/)
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './playwright.mjs'
import { serveDist } from './serve-dist.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const CDN = 'cdn.jsdelivr.net'
const ROUTES = ['/playground/', '/ko/playground/']
const EDITOR_TIMEOUT = Number(process.env.PLAYGROUND_TIMEOUT ?? 45_000)
const VIA_NODE = process.env.PLAYGROUND_MONACO_VIA_NODE === '1'
// How long Monaco's TypeScript worker gets to report after the editor mounts.
const SETTLE = Number(process.env.PLAYGROUND_SETTLE ?? 3_000)

if (!existsSync(dist)) {
  console.error('[playground] dist/ does not exist. Run `bun run build` first.')
  process.exit(1)
}

/** One route's outcome: what went wrong, and whether the CDN is why. */
async function checkRoute(browser, origin, route) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  const cdnFailures = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    if (request.url().includes(CDN)) cdnFailures.push(`${request.url()} (${request.failure()?.errorText ?? 'failed'})`)
  })
  page.on('response', (response) => {
    if (response.url().includes(CDN) && response.status() >= 400) cdnFailures.push(`${response.url()} (HTTP ${response.status()})`)
  })

  if (VIA_NODE) {
    await page.route(`**://${CDN}/**`, async (route) => {
      const url = route.request().url()
      try {
        const response = await fetch(url)
        if (!response.ok) {
          cdnFailures.push(`${url} (HTTP ${response.status}, fetched by Node)`)
          return route.fulfill({ status: response.status, body: '' })
        }
        return route.fulfill({
          status: 200,
          headers: { 'content-type': response.headers.get('content-type') ?? 'text/javascript' },
          body: Buffer.from(await response.arrayBuffer()),
        })
      } catch (error) {
        cdnFailures.push(`${url} (${error instanceof Error ? error.message : String(error)}, fetched by Node)`)
        return route.abort()
      }
    })
  }

  const problems = []
  let cdnOnly = false
  try {
    await page.goto(`${origin}${route}`, { waitUntil: 'load' })

    let mounted = true
    try {
      await page.waitForSelector('.monaco-editor', { timeout: EDITOR_TIMEOUT })
    } catch {
      mounted = false
      problems.push('the editor did not mount: no .monaco-editor appeared')
    }

    if (mounted) {
      // Monaco's own TypeScript drew seven diagnostics on this sample that the TypeShade
      // compiler does not report. Reading the setting says so without waiting on Monaco's
      // worker, which answers on its own schedule and is down whenever the CDN is proxied.
      const validation = await page.evaluate(() => window.monaco?.languages.typescript.typescriptDefaults.getDiagnosticsOptions() ?? null)
      if (!validation) problems.push('the TypeScript defaults are unreachable, so its validation could not be read')
      else if (!validation.noSemanticValidation || !validation.noSyntaxValidation) {
        problems.push(`Monaco is checking the source itself: noSemanticValidation=${validation.noSemanticValidation}, noSyntaxValidation=${validation.noSyntaxValidation}`)
      }

      // And nothing it owns reached the model. Its worker reports late, so this settles first.
      await page.waitForTimeout(SETTLE)
      const markers = await page.evaluate(() =>
        (window.monaco?.editor.getModelMarkers({}) ?? []).map((m) => `${m.owner} ${m.startLineNumber}:${m.startColumn} ${m.code ?? ''} ${m.message}`),
      )
      if (markers.length > 0) problems.push(`the editor drew ${markers.length} marker(s) on the sample:\n    ${markers.join('\n    ')}`)

      // The compiler is bundled into the page, so this is the half that needs no network.
      const output = (await page.textContent('[data-output]'))?.trim() ?? ''
      if (output.length === 0) problems.push('the WGSL pane is empty')
      else if (!/@vertex|@fragment|fn\s/.test(output)) problems.push(`the WGSL pane holds no WGSL:\n    ${output.slice(0, 200)}`)

      const status = (await page.textContent('[data-status]'))?.trim() ?? ''
      const diagnostics = (await page.textContent('[data-diagnostics]'))?.trim() ?? ''
      console.log(`  status: ${status}`)
      console.log(`  diagnostics: ${diagnostics}`)
      console.log(`  WGSL: ${output.split('\n').length} lines, ${output.length} characters`)
    }

    const realErrors = pageErrors
    if (realErrors.length > 0) problems.push(`the page threw ${realErrors.length} uncaught error(s):\n    ${realErrors.join('\n    ')}`)

    // A failure that is only the CDN leaves the page's own script clean.
    cdnOnly = problems.length > 0 && realErrors.length === 0 && cdnFailures.length > 0 && !mounted
  } finally {
    await page.close()
  }
  return { route, problems, cdnFailures, cdnOnly }
}

const server = await serveDist(dist, Number(process.env.PLAYGROUND_PORT ?? 4473))
const browser = await launchChromium()
const results = []
try {
  for (const route of ROUTES) {
    console.log(`[playground] ${route}`)
    results.push(await checkRoute(browser, server.url, route))
  }
} finally {
  await browser.close()
  server.close()
}

const broken = results.filter((r) => r.problems.length > 0)
if (broken.length === 0) {
  console.log(`[playground] ${results.length} route(s) load, compile and mount the editor`)
  process.exit(0)
}

for (const result of broken) {
  console.error(`\n[playground] ${result.route}`)
  for (const problem of result.problems) console.error(`  - ${problem}`)
  if (result.cdnFailures.length > 0) console.error(`  requests to ${CDN} that failed:\n    ${result.cdnFailures.join('\n    ')}`)
}

if (broken.every((r) => r.cdnOnly)) {
  const message = `[playground] Monaco did not load from ${CDN}, so the editor could not be checked. The page's own script threw nothing.`
  if (process.env.PLAYGROUND_CDN_OPTIONAL === '1') {
    console.warn(`${message} PLAYGROUND_CDN_OPTIONAL is set, so this passes.`)
    process.exit(0)
  }
  const lever = VIA_NODE
    ? 'Set PLAYGROUND_CDN_OPTIONAL=1 to let a runner with no route to it pass.'
    : 'Set PLAYGROUND_MONACO_VIA_NODE=1 to fetch it with Node instead, or PLAYGROUND_CDN_OPTIONAL=1 to pass without it.'
  console.error(`${message} ${lever}`)
  process.exit(2)
}
process.exit(1)
