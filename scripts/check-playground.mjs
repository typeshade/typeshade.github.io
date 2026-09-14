// The Playground, opened in a browser against the built site. A build that emits a page whose
// script throws on its first line is still a green build, which is how the Playground shipped
// two empty panes: the editor never mounted and nothing said so. This opens dist/ on loopback,
// loads the page the way a reader does, and checks the four things that were wrong.
//
//   1. the page's own script runs: no uncaught error reaches `pageerror`
//   2. Monaco mounts: `.monaco-editor` appears
//   3. Monaco's own TypeScript validation is off, and no marker it owns is on the sample
//   4. the compiler ran in the browser: the WGSL pane holds text, syntax-coloured, and the
//      GLSL tabs hold the two GLSL ES 3.00 stages
//   5. the reflection pane names the sample's entry points, and running them on the CPU
//      oracle fills in what each one returns
//   6. the arguments are a form: the vertex entry run at another index returns another corner
//   7. an entry declaring a struct parameter is called with the struct, not with its fields
//   8. the CPU canvas rasterises the module: a triangle, one fragment call per pixel
//   9. the emit options reach the panes: the level, minify, parens and the GLSL precision
//  10. dark mode reaches the editor: its background is dark
//  11. the example picker replaces the source
//  12. a source the compiler has no rule for reports a diagnostic that carries a position,
//      and the panes go empty
//  13. an unclosed call reports a parse error and the panes stay empty
//  14. the compute example reports the language service's one known false positive
//  15. `vec` offers vec4 in the completion list
//  16. the URL fragment carries the source and the options into a second tab carries the edited source into a second tab
//
// Hover over a name a user declared is the one thing the language service at the current pin
// has no answer for: it returns nothing for `vs` and `fs`. That check arrives with the
// service swap.
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
// The page debounces a render at 350ms and the URL at 600ms, so a change is read after both.
const AFTER_EDIT = 1_100

const sourceOf = (page) => page.evaluate(() => window.monaco.editor.getModels()[0].getValue())

/** Put a source in the editor and wait for the render and the URL it debounces. */
async function typeSource(page, source) {
  await page.evaluate((value) => window.monaco.editor.getModels()[0].setValue(value), source)
  await page.waitForTimeout(AFTER_EDIT)
}

/** Read the WGSL pane with its tab open. */
async function wgslPane(page) {
  await page.click('[data-target="wgsl"]')
  await page.waitForTimeout(150)
  return (await page.innerText('[data-output]')).trim()
}

/** Set one control on the options bar and wait for the render it triggers. */
async function setOption(page, selector, value) {
  if (value === true || value === false) await page.setChecked(selector, value)
  else await page.selectOption(selector, value)
  await page.waitForTimeout(500)
}

/** How dark a CSS colour is, on the 0 to 255 scale the channels use. */
const brightness = (colour) => {
  const [r, g, b] = (colour.match(/\d+(\.\d+)?/g) ?? ['255', '255', '255']).map(Number)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Every expression here depends on a runtime input, so the optimizer cannot fold it away and
// `parens: 'minimal'` has parentheses left to drop. The default sample folds to constants.
const UNFOLDABLE = `"use typeshade";

class VsOut {
  @builtin("position") pos: vec4;
  @location(0) uv: vec2;
}

class Color {
  @location(0) color: vec4;
}

@fragment
export function fs(v: VsOut): Color {
  const a = v.uv.x * 2. + v.uv.y * 3. - 1.;
  const b = a * a + a * 2.;
  return { color: vec4(b, a - b * 3., a * b + 1., 1.) };
}
`

/** A page that reports what the CDN did, and fetches through Node when asked to. The shared
 *  link check opens a second one, which is why the setup is a helper. */
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
      const output = (await page.innerText('[data-output]')).trim()
      if (output.length === 0) problems.push('the WGSL pane is empty')
      else if (!/@vertex|@fragment|fn\s/.test(output)) problems.push(`the WGSL pane holds no WGSL:\n    ${output.slice(0, 200)}`)

      // And it is syntax-coloured. One colour throughout means the tokenizer did nothing.
      const colours = await page.evaluate(() => {
        const pane = document.querySelector('[data-output]')
        return [...new Set([...pane.querySelectorAll('span')].map((s) => getComputedStyle(s).color))].length
      })
      if (colours < 2) problems.push(`the WGSL pane is not syntax-coloured: ${colours} colour(s) across its spans`)

      // And it still copies as shader source. Monaco's colorize writes spaces as &nbsp;, and a
      // reader pasting U+00A0 into a shader file gets something no compiler accepts.
      const nbsp = (output.match(/\u00a0/g) ?? []).length
      if (nbsp > 0) problems.push(`the WGSL pane holds ${nbsp} non-breaking space(s), so copying it out gives source no compiler takes`)

      // The reflection pane: what reflect() recovered, and what the entry points return when
      // the CPU oracle runs them. The sample declares a vertex and a fragment entry point.
      const reflection = (await page.innerText('[data-reflection]')).trim()
      for (const wanted of ['@vertex', '@fragment', 'vec4<f32>', '@builtin(vertex_index)', '@location(0)']) {
        if (!reflection.includes(wanted)) problems.push(`the reflection pane is missing ${wanted}:\n    ${reflection.slice(0, 240)}`)
      }

      await page.click('[data-run-cpu]')
      await page.waitForTimeout(500)
      const evaluated = (await page.innerText('[data-reflection]')).trim()
      // The sample's two entry points return a clip position and a red fragment.
      for (const wanted of ['[-0.8, -0.8, 0, 1]', '[1, 0, 0, 1]']) {
        if (!evaluated.includes(wanted)) problems.push(`the CPU oracle did not return ${wanted}:\n    ${evaluated.slice(0, 240)}`)
      }

      // The arguments are editable, so the vertex entry can be seen at a corner other than
      // its first. At `vertex_index` 0 the sample returns [-0.8, -0.8, 0, 1]; at 1 it returns
      // the second corner. Before this the oracle ran every entry at the zero of its type.
      await page.fill('[data-arg="vs/i"]', '1')
      await page.click('[data-run-cpu]')
      await page.waitForTimeout(500)
      const atOne = (await page.innerText('[data-reflection]')).trim()
      if (!atOne.includes('[0.8, -0.8, 0, 1]')) {
        problems.push(`running the vertex entry at vertex_index 1 did not return the second corner:\n    ${atOne.slice(0, 240)}`)
      }
      await page.fill('[data-arg="vs/i"]', '0')
      await page.click('[data-run-cpu]')
      await page.waitForTimeout(400)

      // ── the struct parameter, and the canvas ────────────────────────────────────────────
      // hello-vsout's `fs(v: VsOut)` declares a single struct parameter that reflection
      // reports as two fields. Handing the two over leaves the struct undefined and every
      // component computed from it comes back NaN, which is what this shipped as.
      await page.selectOption('[data-example]', 'hello-vsout')
      await page.waitForTimeout(AFTER_EDIT)
      await page.fill('[data-arg="fs/uv"]', '0.3, 0.7')
      await page.click('[data-run-cpu]')
      await page.waitForTimeout(500)
      const structRun = (await page.innerText('[data-reflection]')).trim()
      if (!structRun.includes('[0.3, 0.7, 0.2, 1]')) {
        problems.push(`an entry declaring a struct parameter was not called with the struct:\n    ${structRun.slice(0, 300)}`)
      }

      // And the canvas: the vertex entry for three corners, then one fragment call per pixel
      // the triangle covers, with every varying interpolated from what the vertex entry
      // returned. A triangle covers some of the canvas and not all of it.
      await page.click('[data-draw-cpu]')
      await page.waitForTimeout(1_500)
      const drawn = await page.evaluate(() => {
        const node = document.querySelector('[data-canvas]')
        const data = node.getContext('2d').getImageData(0, 0, node.width, node.height).data
        let opaque = 0
        const colours = new Set()
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) { opaque += 1; colours.add(`${data[i]},${data[i + 1]},${data[i + 2]}`) }
        }
        return { opaque, colours: colours.size, total: node.width * node.height }
      })
      if (drawn.opaque === 0) problems.push('the CPU canvas drew nothing')
      else if (drawn.opaque >= drawn.total) problems.push(`the CPU canvas covered every pixel, so it drew no triangle: ${drawn.opaque}/${drawn.total}`)
      // This example's fragment entry paints its varyings, so every covered pixel differs.
      else if (drawn.colours < drawn.opaque / 2) {
        problems.push(`the CPU canvas is not interpolating: ${drawn.colours} colour(s) across ${drawn.opaque} pixels`)
      }
      console.log(`  canvas: ${drawn.opaque} of ${drawn.total} px, ${drawn.colours} colours`)
      await page.selectOption('[data-example]', 'hello')
      await page.waitForTimeout(AFTER_EDIT)

      // The GLSL tabs carry the other two files the compiler emits from the same module.
      for (const [tab, wanted] of [['glslVertex', 'void main'], ['glslFragment', 'void main']]) {
        await page.click(`[data-target="${tab}"]`)
        await page.waitForTimeout(250)
        const glsl = (await page.innerText('[data-output]')).trim()
        const glslNbsp = (glsl.match(/\u00a0/g) ?? []).length
        if (glslNbsp > 0) problems.push(`the ${tab} tab holds ${glslNbsp} non-breaking space(s)`)
        if (!glsl.startsWith('#version 300 es')) problems.push(`the ${tab} tab does not open with #version 300 es:\n    ${glsl.slice(0, 160)}`)
        if (!glsl.includes(wanted)) problems.push(`the ${tab} tab holds no ${wanted}:\n    ${glsl.slice(0, 160)}`)
      }
      await page.click('[data-target="wgsl"]')
      await page.waitForTimeout(250)

      // ── the emit options ────────────────────────────────────────────────────────────────
      const atO2 = await wgslPane(page)
      const shownSize = (await page.innerText('[data-size]')).trim()
      if (!/^[0-9]+ B$/.test(shownSize)) problems.push(`the output pane shows no byte count: "${shownSize}"`)
      else if (Math.abs(Number(shownSize.replace(' B', '')) - atO2.length) > 2) {
        // The label counts the emitted string; the pane reads back trimmed of its last newline.
        problems.push(`the byte count says ${shownSize} for a pane holding ${atO2.length} characters`)
      }

      await setOption(page, '[data-opt-level]', 'O0')
      const atO0 = await wgslPane(page)
      if (atO0 === atO2) problems.push('the optimization level changed nothing in the WGSL pane')
      if (!(await page.isVisible('[data-level-note]'))) problems.push('at O0 the note about the level standing alone is hidden')
      await setOption(page, '[data-opt-level]', 'O2')
      if (await page.isVisible('[data-level-note]')) problems.push('at O2 the note about the level is still shown')

      await setOption(page, '[data-opt-minify]', true)
      const minified = await wgslPane(page)
      if (minified.length >= atO2.length) problems.push(`minify did not shrink the WGSL: ${atO2.length} to ${minified.length} characters`)
      await setOption(page, '[data-opt-minify]', false)

      await setOption(page, '[data-opt-precision]', 'mediump')
      await page.click('[data-target="glslVertex"]')
      await page.waitForTimeout(250)
      const mediump = (await page.innerText('[data-output]')).trim()
      if (!mediump.includes('precision mediump float')) {
        problems.push(`mediump did not reach the GLSL precision line:\n    ${mediump.slice(0, 160)}`)
      }
      await setOption(page, '[data-opt-precision]', 'highp')

      // `parens` needs a source the optimizer cannot fold flat.
      await typeSource(page, UNFOLDABLE)
      const parensFull = await wgslPane(page)
      if (!/fn\s/.test(parensFull)) {
        // Without this the next comparison reads as the option failing when the source is
        // what failed to compile.
        problems.push(`the parentheses source did not compile, so the option could not be checked:\n    ${parensFull.slice(0, 200)}`)
      }
      await setOption(page, '[data-opt-parens]', 'minimal')
      const parensMinimal = await wgslPane(page)
      if (parensMinimal.length >= parensFull.length) {
        problems.push(`minimal parentheses dropped none: ${parensFull.length} to ${parensMinimal.length} characters`)
      }
      await setOption(page, '[data-opt-parens]', 'full')

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
      await page.selectOption('[data-example]', 'hello')
      await page.waitForTimeout(AFTER_EDIT)
      const sample = await sourceOf(page)

      // ── a rule the compiler does not have yet: a vector times a scalar ──────────────────
      await typeSource(page, sample.replace('vec4(1., 0., 0., 1.) }', 'vec4(1., 0., 0., 1.) * 2. }'))
      const rows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (rows.length === 0) problems.push('a vector times a scalar reported no diagnostic')
      else if (!/^\d+:\d+\s/.test(rows[0])) problems.push(`a diagnostic row carries no position: ${rows[0]}`)
      const emptied = await wgslPane(page)
      if (/@vertex|@fragment|fn\s/.test(emptied)) problems.push(`a source that does not compile still filled the WGSL pane:\n    ${emptied.slice(0, 160)}`)

      // ── an unclosed call ────────────────────────────────────────────────────────────────
      // The compiler reports this as a parse error now (TS8030) and emits nothing for the
      // file, where it used to report a return-type mismatch and emit WGSL anyway.
      await typeSource(page, sample.replace('return { color: vec4(1., 0., 0., 1.) }', 'return vec4(3.14'))
      const parseRows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (parseRows.length === 0) problems.push('an unclosed call reported no diagnostic')
      const afterParse = await wgslPane(page)
      if (/@vertex|@fragment|fn\s/.test(afterParse)) {
        problems.push(`an unclosed call still filled the WGSL pane:\n    ${afterParse.slice(0, 160)}`)
      }

      // ── the compute example ─────────────────────────────────────────────────────────────
      // The language service reports TS2542 on this example's `output[idx] = sum`: the
      // ambient `array<T>` index signature is read-only, while a `declare let` storage
      // binding is writable in TypeShade. `compile()` accepts the file, the compiler's own
      // corpus ships it, and the other five examples are clean, so this is the service's
      // ambient declaration and not the source. It is pinned here so the Playground is not
      // quietly working around it; when the ambient type gains a writable form this check
      // becomes "the reflection names @compute and the GLSL tabs say it has none".
      await page.selectOption('[data-example]', 'compute-reduction-twin')
      await page.waitForTimeout(AFTER_EDIT)
      const computeRows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (computeRows.length !== 1 || !computeRows[0].includes('only permits reading')) {
        problems.push(
          `the compute example no longer reports the known TS2542 false positive, so this check wants updating:\n    ${computeRows.join(' / ').slice(0, 240)}`,
        )
      }
      await page.selectOption('[data-example]', 'hello')
      await page.waitForTimeout(AFTER_EDIT)

      // ── completion ──────────────────────────────────────────────────────────────────────
      await typeSource(page, sample)
      await page.evaluate(() => {
        const editor = window.monaco.editor.getEditors()[0]
        const at = editor.getModel().getLinesContent().findIndex((line) => line.includes('return { color:'))
        editor.setPosition({ lineNumber: at + 1, column: 1 })
        editor.focus()
      })
      await page.keyboard.type('vec')
      try {
        await page.waitForSelector('.suggest-widget.visible', { timeout: 2_000 })
      } catch {
        // quickSuggestions has its own timing, so the list is asked for outright.
        await page.keyboard.press('Control+Space')
        await page.waitForSelector('.suggest-widget.visible', { timeout: 4_000 }).catch(() => {})
      }
      const suggestions = await page.evaluate(() => document.querySelector('.suggest-widget')?.innerText ?? '')
      if (!suggestions.includes('vec4')) problems.push(`after "vec" the completion list does not offer vec4:\n    ${suggestions.slice(0, 200).replace(/\n/g, ' / ')}`)
      await page.keyboard.press('Escape')

      // ── the source in the URL ───────────────────────────────────────────────────────────
      const edited = sample.replace('vec4(1., 0., 0., 1.)', 'vec4(0.25, 0.5, 0.75, 1.)')
      await typeSource(page, edited)
      await setOption(page, '[data-opt-level]', 'O0')
      await setOption(page, '[data-opt-minify]', true)
      const shared = page.url()
      if (!shared.includes('#code=')) {
        problems.push(`editing the source did not put it in the URL: ${shared}`)
      } else {
        const second = await openPage(browser)
        try {
          await second.page.goto(shared, { waitUntil: 'load' })
          await second.page.waitForSelector('.monaco-editor', { timeout: EDITOR_TIMEOUT })
          const restored = await sourceOf(second.page)
          if (restored.trim() !== edited.trim()) problems.push(`the shared link opened a different source:\n    ${restored.slice(0, 160)}`)
          // And the bar it was shared under, so the link shows what the sender saw.
          const reopened = await second.page.evaluate(() => ({
            level: document.querySelector('[data-opt-level]')?.value,
            minify: document.querySelector('[data-opt-minify]')?.checked,
          }))
          if (reopened.level !== 'O0' || reopened.minify !== true) {
            problems.push(`the shared link lost the emit options: level ${reopened.level}, minify ${reopened.minify}`)
          }
          pageErrors.push(...second.pageErrors)
        } finally {
          await second.page.close()
        }
      }
      console.log(`  emit options: O2 ${atO2.length} B, O0 ${atO0.length} B, minified ${minified.length} B, parens ${parensFull.length} to ${parensMinimal.length} B`)
      console.log(`  link: ${shared.length} characters`)
      await setOption(page, '[data-opt-level]', 'O2')
      await setOption(page, '[data-opt-minify]', false)

      const status = (await page.textContent('[data-status]'))?.trim() ?? ''
      const diagnostics = (await page.textContent('[data-diagnostics]'))?.trim() ?? ''
      console.log(`  status: ${status}`)
      console.log(`  diagnostics: ${diagnostics}`)
      console.log(`  WGSL: ${output.split('\n').length} lines, ${output.length} characters, ${colours} colours`)
      console.log(`  reflection: ${(reflection.match(/@(?:vertex|fragment|compute)/g) ?? []).length} entry point(s), evaluated on the CPU`)
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
