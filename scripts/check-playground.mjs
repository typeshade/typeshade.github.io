// The Playground, opened in a browser against the built site. A build that emits a page whose
// script throws on its first line is still a green build, which is how the Playground shipped
// two empty panes: the editor never mounted and nothing said so. This opens dist/ on loopback,
// loads the page the way a reader does, and drives it.
//
//   1. the page's own script runs: no uncaught error reaches `pageerror`
//   2. Monaco mounts: `.monaco-editor` appears
//   3. Monaco's own TypeScript validation is off, and no marker it owns is on the sample
//   4. the compiler ran in the browser: the WGSL pane holds text, syntax-coloured
//   5. the GLSL vertex tab and the Reflection tab hold what belongs in them
//   6. the Run tab produces the value the sample's vertex entry returns
//   7. dark mode reaches the editor: its background is dark
//   8. the example picker replaces the source
//   9. a source with an unclosed call reports a diagnostic and leaves the panes empty
//  10. a source the compiler has no rule for reports a diagnostic of its own
//  11. `vec` offers vec4 in the completion list
//  12. the URL fragment carries the edited source into a second tab
//
// Hover over a name a user declared is the one thing here that the language service at the
// current pin has no answer for: it returns nothing for `vs` and `fs`, and the intrinsics it
// does answer for are already covered. That check arrives with the service swap.
//
// Monaco comes from jsdelivr, the way the page loads it for a reader, so a runner with no
// route to that host cannot check anything past 1. That case is reported on its own, with the
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
// The page debounces a render at 350ms and the URL at 600ms, so a change is read after both.
const AFTER_EDIT = 1_100

if (!existsSync(dist)) {
  console.error('[playground] dist/ does not exist. Run `bun run build` first.')
  process.exit(1)
}

/** A page that reports what the CDN did, and fetches through Node when asked to. */
async function openPage(browser) {
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
  return { page, pageErrors, cdnFailures }
}

const sourceOf = (page) => page.evaluate(() => window.monaco.editor.getModels()[0].getValue())

/** Put a source in the editor and wait for the render and the URL it debounces. */
async function typeSource(page, source) {
  await page.evaluate((value) => window.monaco.editor.getModels()[0].setValue(value), source)
  await page.waitForTimeout(AFTER_EDIT)
}

/** Open a tab and read the text of its body, which is empty while the pane has nothing. */
async function readTab(page, id) {
  await page.click(`[data-tab="${id}"]`)
  await page.waitForTimeout(120)
  return {
    body: (await page.innerText(`[data-body="${id}"]`)).trim(),
    empty: (await page.innerText(`[data-empty="${id}"]`)).trim(),
  }
}

/** The diagnostics a reader can see: one row per diagnostic, each a button that moves the
 *  cursor. The clean state is a single row with no button in it. */
const readDiagnostics = (page) =>
  page.$$eval('[data-diagnostics] li button', (rows) => rows.map((row) => row.innerText.trim()))

/** How dark a CSS colour is, on the 0 to 255 scale the channels use. */
const brightness = (colour) => {
  const [r, g, b] = (colour.match(/\d+(\.\d+)?/g) ?? ['255', '255', '255']).map(Number)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

async function checkRoute(browser, origin, route) {
  const { page, pageErrors, cdnFailures } = await openPage(browser)
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
      // ── the sample, as the page opens with it ───────────────────────────────────────────
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
      // innerText is what the reader sees: the pane is coloured markup whose line breaks are
      // <br>, which textContent would run together into one line.
      const wgsl = (await page.innerText('[data-output]')).trim()
      if (wgsl.length === 0) problems.push('the WGSL pane is empty')
      else if (!/@vertex|@fragment|fn\s/.test(wgsl)) problems.push(`the WGSL pane holds no WGSL:\n    ${wgsl.slice(0, 200)}`)

      // And it is syntax-coloured. One colour throughout means the tokenizer did nothing.
      const colours = await page.evaluate(() => {
        const pane = document.querySelector('[data-output]')
        return [...new Set([...pane.querySelectorAll('span')].map((s) => getComputedStyle(s).color))].length
      })
      if (colours < 2) problems.push(`the WGSL pane is not syntax-coloured: ${colours} colour(s) across its spans`)

      // ── the tabs beside it ──────────────────────────────────────────────────────────────
      const vertex = await readTab(page, 'glsl-vertex')
      if (!/#version|void main/.test(vertex.body)) problems.push(`the GLSL vertex tab holds no GLSL:\n    ${(vertex.body || vertex.empty).slice(0, 200)}`)

      const reflection = await readTab(page, 'reflection')
      // Both of the sample's entry points, with the attribute that placed each side.
      for (const wanted of ['vs', 'fs', '@vertex', '@fragment', '@builtin(position)', '@location(0)']) {
        if (!reflection.body.includes(wanted)) problems.push(`the Reflection tab does not name ${wanted}:\n    ${(reflection.body || reflection.empty).slice(0, 300)}`)
      }

      // The CPU oracle: the sample's vertex entry returns the first corner at vertex_index 0.
      await page.click('[data-tab="run"]')
      await page.waitForTimeout(120)
      await page.click('[data-run-entry]')
      await page.waitForTimeout(200)
      const ran = (await page.innerText('[data-body="run"]')).trim()
      if (!/pos:\s*\[/.test(ran)) problems.push(`running the entry point on the CPU produced no value:\n    ${ran.slice(0, 200)}`)

      // ── dark mode reaches inside the editor ─────────────────────────────────────────────
      await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
      await page.waitForTimeout(400)
      const editorBackground = await page.evaluate(() => {
        const node = document.querySelector('.monaco-editor .monaco-editor-background') ?? document.querySelector('.monaco-editor')
        return node ? getComputedStyle(node).backgroundColor : ''
      })
      if (brightness(editorBackground) > 90) problems.push(`in dark mode the editor background is ${editorBackground}`)
      await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
      await page.waitForTimeout(200)

      // ── the example picker ──────────────────────────────────────────────────────────────
      await page.selectOption('[data-example]', 'hello-vsout')
      await page.waitForTimeout(AFTER_EDIT)
      const picked = await sourceOf(page)
      if (!picked.includes('VsOut')) problems.push(`choosing hello-vsout left the editor holding something else:\n    ${picked.slice(0, 160)}`)

      // ── a source that does not compile ──────────────────────────────────────────────────
      await page.selectOption('[data-example]', 'hello')
      await page.waitForTimeout(AFTER_EDIT)
      const sample = await sourceOf(page)

      const unclosed = sample.replace('return { color: vec4(1., 0., 0., 1.) }', 'return vec4(3.14')
      await typeSource(page, unclosed)
      const onUnclosed = await readDiagnostics(page)
      if (onUnclosed.length === 0) problems.push('an unclosed call reported no diagnostic')
      const emptied = await readTab(page, 'wgsl')
      if (emptied.body.length > 0) problems.push(`an unclosed call still filled the WGSL pane:\n    ${emptied.body.slice(0, 200)}`)
      if (emptied.empty.length === 0) problems.push('the WGSL pane went empty with no sentence saying why')

      // A rule the compiler does not have yet: a vector times a scalar. It reports it, and
      // the Playground shows the report instead of working around it.
      const scaled = sample.replace('vec4(1., 0., 0., 1.) }', 'vec4(1., 0., 0., 1.) * 2. }')
      await typeSource(page, scaled)
      const onScaled = await readDiagnostics(page)
      if (onScaled.length === 0) problems.push('a vector times a scalar reported no diagnostic')
      else if (!/^\d+:\d+\s/.test(onScaled[0])) problems.push(`a diagnostic row carries no position: ${onScaled[0]}`)

      // ── completion ──────────────────────────────────────────────────────────────────────
      await typeSource(page, sample)
      await page.evaluate(() => {
        const editor = window.monaco.editor.getEditors()[0]
        const at = editor.getModel().getLinesContent().findIndex((line) => line.includes('return { color:'))
        editor.setPosition({ lineNumber: at + 1, column: 1 })
        editor.focus()
      })
      await page.keyboard.type('vec')
      let suggestions = ''
      try {
        await page.waitForSelector('.suggest-widget.visible', { timeout: 2_000 })
      } catch {
        // quickSuggestions has its own timing, so the list is asked for outright.
        await page.keyboard.press('Control+Space')
        await page.waitForSelector('.suggest-widget.visible', { timeout: 4_000 }).catch(() => {})
      }
      suggestions = await page.evaluate(() => document.querySelector('.suggest-widget')?.innerText ?? '')
      if (!suggestions.includes('vec4')) problems.push(`after "vec" the completion list does not offer vec4:\n    ${suggestions.slice(0, 200).replace(/\n/g, ' / ')}`)
      await page.keyboard.press('Escape')

      // ── the source in the URL ───────────────────────────────────────────────────────────
      const edited = sample.replace('vec4(1., 0., 0., 1.)', 'vec4(0.25, 0.5, 0.75, 1.)')
      await typeSource(page, edited)
      const shared = page.url()
      if (!shared.includes('#code=')) {
        problems.push(`editing the source did not put it in the URL: ${shared}`)
      } else {
        const second = await openPage(browser)
        try {
          await second.page.goto(shared, { waitUntil: 'load' })
          await second.page.waitForSelector('.monaco-editor', { timeout: EDITOR_TIMEOUT })
          const restored = await sourceOf(second.page)
          if (restored.trim() !== edited.trim()) {
            problems.push(`the shared link opened a different source:\n    ${restored.slice(0, 160)}`)
          }
          pageErrors.push(...second.pageErrors)
        } finally {
          await second.page.close()
        }
      }

      console.log(`  WGSL: ${wgsl.split('\n').length} lines, ${wgsl.length} characters, ${colours} colours`)
      console.log(`  GLSL vertex: ${vertex.body.split('\n').length} lines`)
      console.log(`  reflection: ${reflection.body.split('\n').length} lines; CPU oracle: ${ran.split('\n').filter(Boolean).slice(0, 2).join(' ')}`)
      console.log(`  diagnostics: ${onUnclosed.length} on an unclosed call, ${onScaled.length} on a vector times a scalar`)
      console.log(`  link: ${shared.length} characters`)
    }

    if (pageErrors.length > 0) problems.push(`the page threw ${pageErrors.length} uncaught error(s):\n    ${pageErrors.join('\n    ')}`)

    // A failure that is only the CDN leaves the page's own script clean.
    cdnOnly = problems.length > 0 && pageErrors.length === 0 && cdnFailures.length > 0 && !mounted
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
  console.log(`[playground] ${results.length} route(s) compile, reflect, run and share what is in the editor`)
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
