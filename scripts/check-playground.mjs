// The Playground, opened in a browser against the built site. A build that emits a page whose
// script throws on its first line is still a green build, which is how the Playground shipped
// two empty panes: the editor never mounted and nothing said so. This opens dist/ on loopback,
// loads the page the way a reader does, and checks what the list below names.
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
//   8. the CPU canvas rasterises the module: a triangle, one fragment call per pixel, drawn
//      by a pool of workers that says how many of them there were
//   9. the emit options reach the panes: the level, minify and its number mode, parens,
//      obfuscate, the GLSL precision, and the f64 emulation flavour in both the WGSL and
//      the reflection
//  10. dark mode reaches the editor: its background is dark
//  11. the example picker replaces the source
//  12. raising the resolution changes the grid the fragment entry runs over and leaves the
//      box it is drawn in the size it was
//  13. changing the resolution under a running draw retires it: the result reported is the
//      new grid's, and the old draw's never lands
//  14. the source and the result columns are one height, the tab strip is at the top of the
//      result column, and the canvas is on the first screen beside the code
//  15. a vector times a scalar compiles: nothing is reported and the broadcast reaches the WGSL
//  16. a vector times a string still draws TypeScript's own arithmetic diagnostic
//  17. an unclosed call reports a diagnostic that carries a position, and the panes stay empty
//  18. the compute example is clean, and the store into its writable array reaches the WGSL
//  19. hover over the entry point's parameter answers with its TypeShade type
//  20. hover over a local bound to a numeric literal answers f32, the type the compiler gave
//      it, and not the `number` TypeScript infers for it
//  21. `vec` offers vec4 in the completion list
//  22. the URL fragment carries the edited source and the options into a second tab
//  23. go to definition from a struct's use lands on its declaration
//  24. find references on the struct lists its declaration and its uses
//  25. the outline names the entry points
//  26. signature help inside a call names the function
//  27. rename on the struct rewrites every occurrence and nothing else
//  28. the colouring is the compiler's: a decorator and a GPU type draw with classes of
//      their own, not the identifier's
//  29. the compiler is in the language worker: a worker script was fetched and the page's
//      own module is a fraction of what it was
//  30. a file with no @vertex entry is compiled behind the fullscreen triangle: the page
//      says so, the WGSL and the reflection carry that entry, and the canvas is covered
//  31. the reader's own lines survive the prelude: a mistake on line 9 is reported on line
//      9, the markers land there, and hover answers about that line
//  32. a file that declares its own vertex half, and one with no directive at all, are both
//      left exactly as they were
//  33. every example in the picker is selected in turn and the Result tab's canvas is
//      photographed: how many paint more than one colour, and how many get a backend at
//      all, against the floors below, with the reason printed for each one that does not
//  34. an example on the page is editable: a keystroke reaches the emitted text and the
//      frame, which is the claim nothing tested before
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
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChromium } from './playwright.mjs'
import { serveDist } from './serve-dist.mjs'

// A WebGPU canvas is not readable through getImageData, so the frame is measured the way a
// reader sees it: the element is photographed and the pixels are counted here.
const sharp = createRequire(import.meta.url)('sharp')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const CDN = 'cdn.jsdelivr.net'
const ROUTES = ['/playground/', '/ko/playground/']

// How many of the examples in the picker the Result tab has to paint, and how many of them a
// backend has to run at all. Measured, never typed: on 2026-09-22, at the commit that added
// this, 34 of the 51 put more than one colour on the canvas and 35 of them got a backend,
// against 10 that drew before the tab ran on the GPU. The rest are refused by name, and the
// list under the count says which and why.
//
// These are floors and the build defends them. A change that lowers one is a change that
// stopped an example drawing: find out which, from the list this prints, and fix that. Do
// not lower the number to get a green build, and do not skip an example to reach it.
const PAINTED_FLOOR = 34
const RAN_FLOOR = 35
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

/** Open one tab of the result column. The column is one tab strip over one panel, so every
 *  read below opens the tab that holds what it is reading. */
async function openTab(page, name, wait = 150) {
  await page.click(`[data-target="${name}"]`)
  await page.waitForTimeout(wait)
}

/** Read the WGSL pane with its tab open. */
async function wgslPane(page) {
  await openTab(page, 'wgsl')
  return (await page.innerText('[data-output]')).trim()
}

/** The colours inside the Result tab's canvas, from a photograph of the element. The middle
 *  of it, so the frame's own rounded corners are not counted as pixels the shader drew. One
 *  colour is a canvas nothing painted, or one a shader filled flat; two or more is a
 *  picture. The status note is not evidence: a note reading "36864 px in 249 ms" over a
 *  fully transparent canvas is how five of these examples read before this. */
async function canvasColours(page) {
  const shot = await page.locator('[data-gpu-canvas]').screenshot()
  const meta = await sharp(shot).metadata()
  const pad = Math.round(Math.min(meta.width, meta.height) * 0.08)
  const { data } = await sharp(shot)
    .extract({ left: pad, top: pad, width: meta.width - 2 * pad, height: meta.height - 2 * pad })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true })
  const colours = new Set()
  let opaque = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) opaque += 1
    colours.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`)
  }
  return { colours: colours.size, opaque }
}

/** Wait for the Result tab to settle on this module: a backend that is drawing has put a
 *  frame up, and a module the runtime refuses has said so. Waiting on the page's own state
 *  instead of a fixed sleep, so a slow machine reads the same as a fast one. */
async function settleResult(page) {
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('[data-gpu-canvas]')
      if (!canvas) return false
      const backend = canvas.dataset.backend
      if (backend && backend !== 'none') return (canvas.__shader?.frames ?? 0) > 0
      // No backend: the note has to be a sentence about this module and not the resting one.
      const note = document.querySelector('[data-gpu-note]')?.textContent ?? ''
      return note.length > 0 && document.querySelector('[data-status]')?.dataset.pending !== '1'
    },
    null,
    { timeout: 20_000 },
  )
}

/** Read the reflection panel with its tab open. */
async function reflectionPane(page, wait = 150) {
  await openTab(page, 'reflection', wait)
  return (await page.innerText('[data-reflection]')).trim()
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

// A float the f32 mode can shorten: 0.30000001192092896 is the f64 printout of the f32
// nearest 0.3, so `.3` loads the same bits and the lossless mode has to keep every digit.
const LONG_LITERAL = `"use typeshade";

class Clip {
  @builtin("position") pos: vec4;
}

class Color {
  @location(0) color: vec4;
}

@vertex
export function vs(@builtin("vertex_index") i: u32): Clip {
  const k = 0.30000001192092896;
  const x = i === 1 ? k : -k;
  return { pos: vec4(x, k, 0., 1.) };
}

@fragment
export function fs(): Color {
  return { color: vec4(0.30000001192092896, 0., 0., 1.) };
}
`

// A fragment program and nothing else: no vertex entry, so the page compiles it behind the
// fullscreen triangle and the reader gets a picture without writing a vertex half. The
// mistake below is on its line 9, which is where the diagnostics have to land.
const FRAGMENT_ONLY = `"use typeshade"

class Color {
  @location(0) color: vec4
}

@fragment
export function fs(@location(0) uv: vec2): Color {
  const stripe = fract(uv.x * 8.);
  return { color: vec4(stripe, uv.y, 1. - stripe, 1.) };
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
      // And its providers are off too, not only its validation: the page's providers answer
      // for the editor alone, so a hover or a completion list holds one answer and not the
      // page's beside Monaco's own. The mode configuration is what says so.
      const mode = await page.evaluate(() => window.monaco?.languages.typescript.typescriptDefaults.modeConfiguration ?? null)
      if (!mode) problems.push('the TypeScript mode configuration is unreachable')
      else {
        const still = ['hovers', 'completionItems', 'definitions', 'references', 'documentSymbols', 'rename', 'signatureHelp', 'diagnostics'].filter((k) => mode[k] !== false)
        if (still.length > 0) problems.push(`Monaco's own TypeScript providers are still on: ${still.join(', ')}`)
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
      await openTab(page, 'wgsl')
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
      const reflection = await reflectionPane(page)
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

      // And the canvas, which is the Result tab of the one strip over the result column.
      // Every read below is of that panel, so it stays open to the end of the shape check.
      // The tab draws with the GPU by default and the oracle's rasteriser is the other
      // engine, so the block that measures the rasteriser selects it first.
      await openTab(page, 'result')
      await page.selectOption('[data-engine]', 'cpu')
      await page.waitForTimeout(400)
      // The canvas: the vertex entry for three corners, then one fragment call per pixel
      // the triangle covers, with every varying interpolated from what the vertex entry
      // returned. A triangle covers some of the canvas and not all of it. The canvas follows
      // the source, so choosing the example is what drew it; a draw deletes the count when it
      // starts and writes it when it ends, so a count present means this draw is done.
      await page.waitForFunction(() => document.querySelector('[data-canvas-note]').dataset.px !== undefined, null, { timeout: 15_000 })
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
      // The note names how many workers drew it. The pool is sized from the cores the
      // browser admits to, so the number is whatever this runner has, and 1 means the
      // main-thread fallback ran instead.
      // The note's words are translated, so what is read here are the numbers it carries as
      // data. 1 worker means the main-thread fallback drew it instead of the pool.
      const canvasNote = await page.evaluate(() => {
        const node = document.querySelector('[data-canvas-note]')
        return { text: node.textContent.trim(), px: Number(node.dataset.px), workers: Number(node.dataset.workers) }
      })
      if (!Number.isFinite(canvasNote.workers) || canvasNote.workers < 1) {
        problems.push(`the CPU canvas did not report what drew it: "${canvasNote.text}"`)
      } else if (canvasNote.px !== drawn.opaque) {
        problems.push(`the canvas says it covered ${canvasNote.px} px and ${drawn.opaque} are painted`)
      }
      if (drawn.opaque === 0) problems.push('the CPU canvas drew nothing')
      else if (drawn.opaque >= drawn.total) problems.push(`the CPU canvas covered every pixel, so it drew no triangle: ${drawn.opaque}/${drawn.total}`)
      // This example's fragment entry paints its varyings, so every covered pixel differs.
      else if (drawn.colours < drawn.opaque / 2) {
        problems.push(`the CPU canvas is not interpolating: ${drawn.colours} colour(s) across ${drawn.opaque} pixels`)
      }
      console.log(`  canvas: ${drawn.opaque} of ${drawn.total} px, ${drawn.colours} colours, ${canvasNote.workers} worker(s)`)

      // ── the grid moves, the box stays ────────────────────────────────────────────────────
      // Raising the resolution buys pixels and not room. The canvas element's width and
      // height are its backing store; the size it is shown at comes from the stylesheet, so
      // the pane does not resize under a reader who is changing the control.
      const canvasSize = () =>
        page.evaluate(() => {
          const node = document.querySelector('[data-canvas]')
          return { box: Math.round(node.getBoundingClientRect().width), grid: node.width }
        })
      const smallGrid = await canvasSize()
      await page.selectOption('[data-resolution]', '768')
      await page.waitForTimeout(250)
      const bigGrid = await canvasSize()
      if (bigGrid.grid !== 768) problems.push(`choosing 768 left the canvas grid at ${bigGrid.grid}`)
      if (smallGrid.grid === bigGrid.grid) problems.push('the resolution picker did not change the grid')
      if (smallGrid.box !== bigGrid.box) {
        problems.push(
          `the canvas box moved with the resolution: ${smallGrid.box}px at ${smallGrid.grid}, ${bigGrid.box}px at ${bigGrid.grid}`,
        )
      }
      if (bigGrid.box === 0) problems.push('the canvas is not being shown at any size')
      console.log(`  resolution: grid ${smallGrid.grid} to ${bigGrid.grid}, box held at ${bigGrid.box} px`)

      // ── a draw retired by the control that started it ────────────────────────────────────
      // A draw is planned against one grid, and at the larger sizes it runs for seconds, so
      // changing the resolution while one is running is a normal thing to do and not an edge
      // case. The tiles in flight carry the old grid's coordinates; if they are not dropped
      // they scatter the old picture over the new canvas, and if the draw never settles the
      // button never comes back. This starts one, moves the control under it, and checks that
      // the page lands somewhere a reader can act from.
      // Choosing a size starts a draw at it. 1536 is 36 tiles and most of a second, so the
      // switch to 192 lands while it is well under way; the 192 draw then runs and reports.
      await page.selectOption('[data-resolution]', '1536')
      await page.waitForTimeout(150)
      await page.selectOption('[data-resolution]', '192')
      await page.waitForFunction(() => document.querySelector('[data-canvas-note]').dataset.px !== undefined, null, { timeout: 15_000 })
      // The 192 count is in. Now the wait that finds the bug: long enough for the 1536 draw
      // to have finished if it was never retired, in which case its settle overwrites the
      // count with its own 753992 and its tiles land on a canvas a quarter of their size.
      // Retired, it stays quiet, and the count is the 192 draw's and nothing else's.
      await page.waitForTimeout(3_000)
      const retired = await page.evaluate(() => {
        const node = document.querySelector('[data-canvas]')
        const note = document.querySelector('[data-canvas-note]')
        return { grid: node.width, reported: Number(note.dataset.px), button: document.querySelector('[data-draw-cpu]').disabled ? 'disabled' : 'enabled' }
      })
      if (retired.grid !== 192) problems.push(`after retiring a draw the grid is ${retired.grid} and not the 192 that was chosen`)
      if (retired.reported !== drawn.opaque) {
        problems.push(`after switching from 1536 to 192 the count is ${retired.reported}, not the ${drawn.opaque} a 192 draw covers: the retired draw reported over it`)
      }
      if (retired.button !== 'enabled') problems.push('the draw button is not available after a retired draw')
      console.log(`  retired mid-draw: grid ${retired.grid}, reported ${retired.reported} px, button ${retired.button}`)
      await page.selectOption('[data-engine]', 'gpu')
      await page.waitForTimeout(AFTER_EDIT)

      // ── the shape of the page ────────────────────────────────────────────────────────────
      // The source and the result are the two things a reader looks between, so the columns
      // that hold them end on the same line, and the canvas is beside the code on the first
      // screen and not under the reflection two screens down. Measured in document space, so
      // it does not matter what the clicks above scrolled to.
      const shape = await page.evaluate(() => {
        const box = (selector) => {
          const rect = document.querySelector(selector).getBoundingClientRect()
          return { top: Math.round(rect.top + window.scrollY), bottom: Math.round(rect.bottom + window.scrollY), height: Math.round(rect.height) }
        }
        return { source: box('.source-pane'), result: box('.result-column'), canvas: box('[data-gpu-canvas]'), editor: box('[data-editor]'), tabs: box('.result-head'), viewport: window.innerHeight }
      })
      if (Math.abs(shape.source.height - shape.result.height) > 1) {
        problems.push(`the source column is ${shape.source.height}px tall and the result column ${shape.result.height}px`)
      }
      if (shape.canvas.bottom > shape.viewport) {
        problems.push(`the canvas ends at ${shape.canvas.bottom}px, below the first ${shape.viewport}px screen`)
      }
      // Beside the code, which is the whole point of the two columns: the canvas starts in
      // the top half of the editor, so it is next to the source and not under it. The tab
      // strip and the controls the Result tab owns sit over it, and those take a second row
      // where the column is too narrow for both, so the slack is the editor's own height
      // and not a fixed number of pixels.
      if (shape.canvas.top > shape.editor.top + shape.editor.height / 2) {
        problems.push(`the canvas starts at ${shape.canvas.top}px, past the middle of the ${shape.editor.height}px editor at ${shape.editor.top}px: it is not beside the code`)
      }
      if (shape.tabs.top > shape.source.top + 1) {
        problems.push(`the tab strip starts at ${shape.tabs.top}px, below the top of the source column at ${shape.source.top}px: it is not at the top of the result column`)
      }
      console.log(`  shape: columns ${shape.source.height} and ${shape.result.height} px, canvas ends at ${shape.canvas.bottom} of ${shape.viewport}, tab strip at ${shape.tabs.top}`)

      // One strip, five tabs, one panel shown. The three texts and the reflection are
      // painted while hidden, so switching to one shows what the last compile put there.
      const strip = await page.evaluate(() => {
        const tabs = [...document.querySelectorAll('[role="tab"][data-target]')]
        const panels = [...document.querySelectorAll('.result-panels > [role="tabpanel"]')]
        return {
          names: tabs.map((t) => t.dataset.target),
          selected: tabs.filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.dataset.target),
          shown: panels.filter((p) => p.offsetParent !== null || p.getClientRects().length > 0).length,
        }
      })
      const wantedTabs = ['result', 'wgsl', 'glslVertex', 'glslFragment', 'reflection']
      if (strip.names.join(',') !== wantedTabs.join(',')) problems.push(`the result column's tabs are ${strip.names.join(', ')}, not ${wantedTabs.join(', ')}`)
      if (strip.selected.join(',') !== 'result') problems.push(`the Result tab is not the one selected: ${strip.selected.join(', ') || 'none'}`)
      if (strip.shown !== 1) problems.push(`${strip.shown} of the result column's panels are shown at once`)
      console.log(`  tabs: ${strip.names.join(', ')}, showing ${strip.selected.join(', ')}`)

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

      // `parens` needs a source the optimizer cannot fold flat. This one declares its own
      // `VsOut` and no vertex entry, so it is also what proves the prelude stays out of a
      // file that would get a duplicate from it.
      await typeSource(page, UNFOLDABLE)
      if (await page.isVisible('[data-prelude-note]')) {
        problems.push('a file declaring its own VsOut was compiled behind the prelude, which declares one too')
      }
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

      // The number mode minify runs under, which is a control only while minify is on.
      if (await page.isVisible('[data-numbers-field]')) problems.push('the number literal mode is shown with minify off')
      await typeSource(page, LONG_LITERAL)
      const plainLiteral = await wgslPane(page)
      await setOption(page, '[data-opt-minify]', true)
      if (!(await page.isVisible('[data-numbers-field]'))) problems.push('with minify on the number literal mode is still hidden')
      const canonical = await wgslPane(page)
      await setOption(page, '[data-opt-numbers]', 'f32')
      const asF32 = await wgslPane(page)
      await setOption(page, '[data-opt-numbers]', 'false')
      const asEmitted = await wgslPane(page)
      if (!canonical.includes('.30000001192092896')) problems.push(`the lossless number mode dropped a significand digit:\n    ${canonical.slice(0, 200)}`)
      if (asF32.includes('.30000001192092896')) problems.push(`the f32 number mode left the literal spelled in full:\n    ${asF32.slice(0, 200)}`)
      if (asF32.length >= canonical.length) problems.push(`the f32 number mode saved nothing: ${canonical.length} to ${asF32.length} characters`)
      if (asEmitted.length <= canonical.length) problems.push(`leaving the literals alone spelled them shorter than the lossless mode: ${asEmitted.length} to ${canonical.length} characters`)
      console.log(`  number literals: plain ${plainLiteral.length} B, true ${canonical.length} B, f32 ${asF32.length} B, false ${asEmitted.length} B`)
      await setOption(page, '[data-opt-numbers]', 'true')
      await setOption(page, '[data-opt-minify]', false)

      // obfuscate(), the compiler's production preset: renamed identifiers over a compacted
      // text. It is a plugin array, so it reaches the same `plugins` field minify does.
      const named = await wgslPane(page)
      await setOption(page, '[data-opt-obfuscate]', true)
      const obfuscated = await wgslPane(page)
      if (obfuscated.includes('Clip')) problems.push(`obfuscate left the struct's authored name in the WGSL:\n    ${obfuscated.slice(0, 200)}`)
      if (obfuscated.length >= named.length) problems.push(`obfuscate did not shrink the WGSL: ${named.length} to ${obfuscated.length} characters`)
      console.log(`  obfuscate: ${named.length} B to ${obfuscated.length} B`)
      await setOption(page, '[data-opt-obfuscate]', false)

      // fp64Flavor, which goes to reflect() as well as to the emit. An f64 module lowered
      // with the float primitives binds an `_fp64` guard texture the integer ones never
      // read, so the flavour decides what a host has to bind and the reflection has to say
      // so. This is the one option whose effect is visible in two panels at once.
      await page.selectOption('[data-example]', 'fp64-lane-stripes')
      await page.waitForTimeout(AFTER_EDIT)
      const floatWgsl = await wgslPane(page)
      const floatReflection = await reflectionPane(page, 300)
      await setOption(page, '[data-opt-fp64]', 'integer')
      const integerWgsl = await wgslPane(page)
      const integerReflection = await reflectionPane(page, 300)
      if (floatWgsl === integerWgsl) problems.push('the f64 emulation flavour changed nothing in the WGSL of an f64 module')
      if (!floatReflection.includes('_fp64')) problems.push(`the float flavour's reflection does not report the _fp64 guard:\n    ${floatReflection.slice(0, 300)}`)
      if (integerReflection.includes('_fp64')) problems.push(`the integer flavour's reflection still reports the _fp64 guard, which its helpers never read:\n    ${integerReflection.slice(0, 300)}`)
      console.log(`  f64 flavour: WGSL ${floatWgsl.length} B float, ${integerWgsl.length} B integer; guard in the reflection ${floatReflection.includes('_fp64')} and ${integerReflection.includes('_fp64')}`)
      await setOption(page, '[data-opt-fp64]', 'float')
      await page.selectOption('[data-example]', 'hello')
      await page.waitForTimeout(AFTER_EDIT)

      // ── the fullscreen vertex half ──────────────────────────────────────────────────────
      // A file with no @vertex entry is compiled behind the fullscreen triangle, the way
      // <LiveShader> compiles one, so a reader can write a fragment program alone and see
      // it cover the canvas. The compiler then answers about a text the editor does not
      // hold, and every line the page prints has to be the reader's own.
      // The example the options above left in the editor declares its own vertex half, so
      // it is what the last two steps of this block put back.
      const moduleShaped = await sourceOf(page)
      await typeSource(page, FRAGMENT_ONLY)
      if (!(await page.isVisible('[data-prelude-note]'))) problems.push('a file with no vertex entry does not say it was compiled behind the fullscreen triangle')
      const preludeStatus = await page.textContent('[data-status]')
      const preludeDiagnostics = (await page.innerText('[data-diagnostics]')).trim()
      const preludeWgsl = await wgslPane(page)
      if (!/fn fullscreen/.test(preludeWgsl)) problems.push(`the fullscreen vertex half did not reach the WGSL:\n    ${preludeWgsl.slice(0, 200)}`)
      const preludeReflection = await reflectionPane(page, 300)
      if (!preludeReflection.includes('fullscreen')) problems.push(`the reflection does not name the fullscreen entry:\n    ${preludeReflection.slice(0, 200)}`)
      await openTab(page, 'result')
      await settleResult(page)
      await page.waitForTimeout(600)
      const preludeDrawn = await canvasColours(page)
      const preludeBackend = await page.evaluate(() => document.querySelector('[data-gpu-canvas]')?.dataset.backend)
      if (preludeBackend === 'none') problems.push('the fullscreen triangle reached no backend')
      if (preludeDrawn.colours < 2) problems.push(`the fullscreen triangle drew ${preludeDrawn.colours} colour(s), and it stripes the frame`)
      console.log(`  fullscreen half: ${preludeStatus}, WGSL ${preludeWgsl.length} B, canvas on ${preludeBackend} in ${preludeDrawn.colours} colours`)
      if (!/No diagnostics|진단 없음/.test(preludeDiagnostics)) problems.push(`the fragment program did not compile clean:\n    ${preludeDiagnostics.slice(0, 200)}`)

      // The prelude moves the reader's own lines down inside the compiled text, so every
      // line the page prints has to be moved back. The mistake is on the reader's line 9.
      await typeSource(page, FRAGMENT_ONLY.replace('fract(uv.x * 8.)', 'fract(uv.x * "eight")'))
      const shiftedRows = (await page.innerText('[data-diagnostics]')).trim().split('\n')
      const shiftedMarkers = await page.evaluate(() => (window.monaco?.editor.getModelMarkers({}) ?? []).map((m) => m.startLineNumber))
      if (!shiftedRows.some((row) => row.startsWith('9:'))) problems.push(`the mistake on line 9 was not reported there:\n    ${shiftedRows.join('\n    ')}`)
      if (shiftedMarkers.length === 0 || !shiftedMarkers.includes(9)) problems.push(`the editor drew markers on lines ${shiftedMarkers.join(', ') || 'nothing'}, and the mistake is on line 9`)
      if (shiftedMarkers.some((line) => line > FRAGMENT_ONLY.split('\n').length)) {
        problems.push(`a marker landed on line ${Math.max(...shiftedMarkers)}, past the ${FRAGMENT_ONLY.split('\n').length} lines the editor holds`)
      }
      console.log(`  shifted lines: diagnostics ${shiftedRows.map((r) => r.split(' ')[0]).join(', ')}, markers ${shiftedMarkers.join(', ')}`)

      // And hover answers about the reader's own line, which is the same shift the other way.
      await typeSource(page, FRAGMENT_ONLY)
      const preludeHover = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        const lines = editor.getModel().getLinesContent()
        const at = lines.findIndex((line) => line.includes('const stripe'))
        editor.revealLineInCenter(at + 1)
        editor.setPosition({ lineNumber: at + 1, column: lines[at].indexOf('stripe') + 2 })
        editor.focus()
        editor.trigger('check', 'editor.action.showHover', null)
        await new Promise((done) => setTimeout(done, 900))
        return { line: at + 1, text: (document.querySelector('.monaco-hover')?.innerText ?? '').replace(/\s+/g, ' ').trim() }
      })
      if (!preludeHover.text.includes('f32')) problems.push(`hover on the reader's own line ${preludeHover.line} answered "${preludeHover.text}", and the local is an f32`)
      console.log(`  hover past the prelude: line ${preludeHover.line} is ${preludeHover.text.slice(0, 40)}`)
      await page.keyboard.press('Escape')

      // A file that declares its own vertex half is compiled as written.
      await typeSource(page, moduleShaped)
      if (await page.isVisible('[data-prelude-note]')) problems.push('a file with its own vertex entry says it was compiled behind the fullscreen triangle')
      if (/fn fullscreen/.test(await wgslPane(page))) problems.push('a file with its own vertex entry was compiled behind the fullscreen triangle anyway')
      // And one with no directive still gets the page's own sentence about the directive,
      // which supplying a directive for the reader would hide.
      await typeSource(page, 'class Color {\n  @location(0) color: vec4\n}\n')
      const noDirective = (await page.innerText('[data-diagnostics]')).trim()
      if (!/use typeshade/.test(noDirective)) problems.push(`a file with no directive was not told so:\n    ${noDirective.slice(0, 160)}`)
      await typeSource(page, moduleShaped)
      await openTab(page, 'result')

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

      // ── a vector times a scalar ─────────────────────────────────────────────────────────
      // typeshade/typeshade#19 broadcasts a vector against a scalar, so `vec4(…) * 2.` is a
      // rule the compiler has. It reported an error here until this pin, which is half of
      // what the Playground was reported broken for, so what is checked is the whole way
      // through: the language service says nothing, and the scalar reaches the emitted
      // multiply instead of the edit being dropped on the floor.
      await typeSource(page, sample.replace('vec4(1., 0., 0., 1.) }', 'vec4(1., 0., 0., 1.) * 2. }'))
      const rows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (rows.length > 0) problems.push(`a vector times a scalar reported ${rows.length} diagnostic(s):\n    ${rows.join('\n    ')}`)
      const broadcast = await wgslPane(page)
      if (!/@vertex|@fragment|fn\s/.test(broadcast)) {
        problems.push(`a vector times a scalar left the WGSL pane without WGSL:\n    ${broadcast.slice(0, 200)}`)
      } else if (!/vec4<f32>\(1\.0, 0\.0, 0\.0, 1\.0\) \* 2\.0/.test(broadcast)) {
        problems.push(`the broadcast did not reach the emitted WGSL:\n    ${broadcast.slice(-200)}`)
      }

      // ── a vector times a string ─────────────────────────────────────────────────────────
      // The filter typeshade/typeshade#39 added drops TS2362, TS2363, TS2365 and TS2322 where
      // a vector or a matrix is an operand, because TypeScript's arithmetic rules are not the
      // compiler's there. This says how far the filter reaches: the right-hand side is a
      // string, which neither language has a rule for, so TypeScript's own arithmetic
      // diagnostic has to survive the filter and reach the reader. Without a case like this
      // one, a later pin that widened the filter would leave the page silent on a real error
      // and still pass here, since every other source this file refuses fails to parse.
      await typeSource(page, sample.replace('vec4(1., 0., 0., 1.) }', 'vec4(1., 0., 0., 1.) * "x" }'))
      const refused = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (!refused.some((row) => row.includes('arithmetic operation'))) {
        problems.push(
          `a vector times a string drew no arithmetic diagnostic, so the filter on vector arithmetic is swallowing real errors:\n    ${refused.join('\n    ') || '(no diagnostics at all)'}`,
        )
      }
      const refusedPane = await wgslPane(page)
      if (/@vertex|@fragment|fn\s/.test(refusedPane)) {
        problems.push(`a vector times a string still filled the WGSL pane:\n    ${refusedPane.slice(0, 160)}`)
      }

      // ── an unclosed call ────────────────────────────────────────────────────────────────
      // The compiler reports this as a parse error now (TS8030) and emits nothing for the
      // file, where it used to report a return-type mismatch and emit WGSL anyway. It is the
      // one source here that does not parse, and it carries what the vector check used to
      // hold before a vector times a scalar started compiling: a row a reader can click,
      // which is a row that carries a position.
      await typeSource(page, sample.replace('return { color: vec4(1., 0., 0., 1.) }', 'return vec4(3.14'))
      const parseRows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (parseRows.length === 0) problems.push('an unclosed call reported no diagnostic')
      else if (!/^\d+:\d+\s/.test(parseRows[0])) problems.push(`a diagnostic row carries no position: ${parseRows[0]}`)
      const afterParse = await wgslPane(page)
      if (/@vertex|@fragment|fn\s/.test(afterParse)) {
        problems.push(`an unclosed call still filled the WGSL pane:\n    ${afterParse.slice(0, 160)}`)
      }

      // ── the compute example ─────────────────────────────────────────────────────────────
      // The language service used to report TS2542 on this example's `output[idx] = sum`,
      // because the ambient `array<T>` index signature was read-only while a `declare let`
      // storage binding is writable in TypeShade. typeshade/typeshade#39 drops the readonly,
      // so the example is clean, which is the other half of what the Playground was reported
      // broken for. The store is followed all the way into the WGSL so a service that goes
      // quiet by dropping the assignment would still fail here. GLSL ES 3.00 has no compute
      // stage, so its tabs say the module has none instead of holding a shader.
      await page.selectOption('[data-example]', 'compute-reduction-twin')
      await page.waitForTimeout(AFTER_EDIT)
      const computeRows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
      if (computeRows.length > 0) {
        problems.push(`the compute example reported ${computeRows.length} diagnostic(s):\n    ${computeRows.join('\n    ')}`)
      }
      const computeWgsl = await wgslPane(page)
      for (const wanted of ['@compute @workgroup_size(64)', 'fn reduce_windows', 'output[idx] = sum;']) {
        if (!computeWgsl.includes(wanted)) {
          problems.push(`the compute example's WGSL is missing ${wanted}:\n    ${computeWgsl.slice(0, 300)}`)
        }
      }
      const computeReflection = await reflectionPane(page)
      if (!computeReflection.includes('@compute')) {
        problems.push(`the reflection pane does not name the compute entry point:\n    ${computeReflection.slice(0, 240)}`)
      }
      // The sentence is translated, so it is read back out of the copy the component wrote
      // into the page and the tab has to hold that and nothing else. Asking instead whether
      // the tab held no shader passed on the WGSL tab too, so the check could not tell which
      // tab it had read: clicking the wrong one still passed.
      const noGlsl = await page.evaluate(() => JSON.parse(document.querySelector('[data-playground]').dataset.copy).noGlsl)
      for (const tab of ['glslVertex', 'glslFragment']) {
        await page.click(`[data-target="${tab}"]`)
        await page.waitForTimeout(250)
        const glsl = (await page.innerText('[data-output]')).trim()
        if (glsl !== noGlsl) problems.push(`the ${tab} tab does not say a compute module has no GLSL stage:\n    ${glsl.slice(0, 160)}`)
      }
      await page.click('[data-target="wgsl"]')
      await page.waitForTimeout(250)
      await page.selectOption('[data-example]', 'hello')
      await page.waitForTimeout(AFTER_EDIT)

      // ── hover ───────────────────────────────────────────────────────────────────────────
      // The service had no answer for a name the source declares when the Playground shipped,
      // so this check waited for it. What it is asked about is the entry point's parameter,
      // where its answer is its own: the shim the page hands Monaco declares `u32` as
      // `number`, so Monaco's own TypeScript hover says `(parameter) i: number` and the
      // compiler's says `(parameter) i: u32`. Asking about `vs` proved less, since both spell
      // its signature `vs(i: u32): Clip` and either one satisfied the check.
      // Monaco's hover provider is off, and the page's is the one answering, so the widget
      // holds one answer: the compiler's, alone. Both halves are read here, the compiler's
      // line present and Monaco's `number` absent, and the rows counted, since a stacked
      // widget is the bug this replaced.
      await typeSource(page, sample)
      const hovered = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        const model = editor.getModel()
        const at = model.getLinesContent().findIndex((line) => line.includes('export function vs('))
        if (at < 0) return null
        const declared = model.getLineContent(at + 1).indexOf('i: u32')
        if (declared < 0) return null
        // On the name itself, where a reader's pointer is; one column past it is the `:`, and
        // typeshade/typeshade#56 records that a position past a name's end falls back to
        // TypeScript's quick info, which is not what this asks about.
        editor.setPosition({ lineNumber: at + 1, column: declared + 1 })
        editor.focus()
        await editor.getAction('editor.action.showHover')?.run()
        return true
      })
      if (hovered === null) problems.push('the sample no longer declares vs(i: u32), so hover had nothing to ask about')
      else {
        await page.waitForSelector('.monaco-hover', { timeout: 4_000 }).catch(() => {})
        const quickInfo = await page.evaluate(() => document.querySelector('.monaco-hover')?.innerText.replace(/\s+/g, ' ').trim() ?? '')
        const hoverRows = await page.evaluate(() => document.querySelectorAll('.monaco-hover .hover-row').length)
        if (!quickInfo.includes('i: u32')) {
          problems.push(`hovering the parameter did not answer with its TypeShade type:\n    ${quickInfo.slice(0, 200)}`)
        }
        if (quickInfo.includes('i: number')) {
          problems.push(`hovering the parameter stacks Monaco's own TypeScript answer beside the compiler's:\n    ${quickInfo.slice(0, 200)}`)
        }
        if (hoverRows !== 1) problems.push(`the hover widget holds ${hoverRows} answer(s) for the parameter, not one`)
        await page.keyboard.press('Escape')
      }

      // ── hover over a local ──────────────────────────────────────────────────────────────
      // The other half of what the Playground was reported for: `let x = 1.` hovered as plain
      // `number`. The ambient GPU scalars brand `number` optionally, so TypeScript infers
      // `number` for a local bound to a numeric literal where the front end lowered an `f32`,
      // and the editor showed the inference. typeshade/typeshade#51 answers every name the
      // document declares off the compiler's own symbol table instead, so the local now hovers
      // as `let k: f32`. The check above asks about a parameter, which carries a written
      // annotation TypeScript could read on its own. A literal-bound local carries none, so
      // `f32` here can only have come from the compiler.
      // Monaco's provider is off, so the widget holds the compiler's line and nothing else:
      // the `number` it used to stack beside it is asserted absent, and the rows counted.
      const withLocal = sample
        .replace('let x = -0.8', 'let k = 1.\n  let x = -0.8')
        .replace('vec4(x, y, 0., 1.)', 'vec4(x, y, 0., k)')
      if (!withLocal.includes('let k = 1.') || !withLocal.includes('vec4(x, y, 0., k)')) {
        problems.push('the sample no longer has the vertex entry this check adds a local to, so hover had no local to ask about')
      } else {
        await typeSource(page, withLocal)
        // The type comes off the front end's own run, so a source it refused would fall back
        // to TypeScript and hover `number` for a reason that is not the service's fault.
        const localRows = await page.$$eval('[data-diagnostics] li button', (list) => list.map((row) => row.innerText.trim()))
        if (localRows.length > 0) {
          problems.push(`declaring a local reported ${localRows.length} diagnostic(s):\n    ${localRows.join('\n    ')}`)
        }
        const hoveredLocal = await page.evaluate(async () => {
          const editor = window.monaco.editor.getEditors()[0]
          const model = editor.getModel()
          const at = model.getLinesContent().findIndex((line) => line.includes('let k = 1.'))
          if (at < 0) return null
          const declared = model.getLineContent(at + 1).indexOf('k = 1.')
          if (declared < 0) return null
          // On the name itself, where a reader's pointer is. One column further is the space
          // after it, and the compiler answers a position that lands on whitespace from
          // TypeScript's quick info, which is the `number` this check exists to refuse. The
          // parameter above survives that column only because the next character there is `:`.
          editor.setPosition({ lineNumber: at + 1, column: declared + 1 })
          editor.focus()
          await editor.getAction('editor.action.showHover')?.run()
          return true
        })
        if (hoveredLocal === null) problems.push('the editor is not holding the local this check declared')
        else {
          await page.waitForSelector('.monaco-hover', { timeout: 4_000 }).catch(() => {})
          const localInfo = await page.evaluate(() => document.querySelector('.monaco-hover')?.innerText.replace(/\s+/g, ' ').trim() ?? '')
          const localRowsShown = await page.evaluate(() => document.querySelectorAll('.monaco-hover .hover-row').length)
          if (!localInfo.includes('k: f32')) {
            problems.push(`hovering a local bound to a numeric literal did not answer with f32:\n    ${localInfo.slice(0, 200)}`)
          }
          if (localInfo.includes('k: number')) {
            problems.push(`hovering the local stacks Monaco's own \`number\` beside the compiler's f32:\n    ${localInfo.slice(0, 200)}`)
          }
          if (localRowsShown !== 1) problems.push(`the hover widget holds ${localRowsShown} answer(s) for the local, not one`)
          await page.keyboard.press('Escape')
        }
        await typeSource(page, sample)
      }

      // ── completion ──────────────────────────────────────────────────────────────────────
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

      // ── definition ──────────────────────────────────────────────────────────────────────
      // The struct a function returns is declared above it. Going to its definition from the
      // return type has to land on the declaration, and the answer is the service's alone:
      // Monaco's own definition provider is off.
      await typeSource(page, sample)
      const jumped = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        const lines = editor.getModel().getLinesContent()
        const declaredAt = lines.findIndex((line) => /^class (\w+)/.test(line))
        if (declaredAt < 0) return null
        const name = lines[declaredAt].match(/^class (\w+)/)[1]
        const usedAt = lines.findIndex((line, index) => index !== declaredAt && line.includes(`): ${name}`))
        if (usedAt < 0) return null
        editor.setPosition({ lineNumber: usedAt + 1, column: lines[usedAt].indexOf(`): ${name}`) + '): '.length + 2 })
        editor.focus()
        // Go to definition is registered as a command and not an editor action in this
        // Monaco, so `getAction` does not see it; `trigger` dispatches it through the
        // command service, which does.
        editor.trigger('check', 'editor.action.revealDefinition', null)
        await new Promise((done) => setTimeout(done, 1_000))
        return { name, declaredAt: declaredAt + 1, usedAt: usedAt + 1, landed: editor.getPosition().lineNumber }
      })
      if (!jumped) problems.push('the sample has no struct a function returns, so definition had nothing to ask about')
      else if (jumped.landed !== jumped.declaredAt) {
        problems.push(`go to definition on ${jumped.name} at line ${jumped.usedAt} landed on line ${jumped.landed}, not its declaration at line ${jumped.declaredAt}`)
      }
      console.log(`  definition: ${jumped?.name} from line ${jumped?.usedAt} to line ${jumped?.landed}`)

      // ── references ──────────────────────────────────────────────────────────────────────
      // Every place the struct is named, asked from its declaration. Monaco peeks when there
      // is more than one, and the rows in the peek are the service's locations.
      const referenced = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        const lines = editor.getModel().getLinesContent()
        const declaredAt = lines.findIndex((line) => /^class (\w+)/.test(line))
        if (declaredAt < 0) return null
        editor.setPosition({ lineNumber: declaredAt + 1, column: 'class '.length + 2 })
        editor.focus()
        // The peek command, dispatched the same way, so the widget is what opens.
        editor.trigger('check', 'editor.action.referenceSearch.trigger', null)
        await new Promise((done) => setTimeout(done, 1_200))
        return {
          widget: Boolean(document.querySelector('.reference-zone-widget')),
          rows: document.querySelectorAll('.reference-zone-widget .monaco-list-row').length,
        }
      })
      if (!referenced) problems.push('the sample declares no struct, so references had nothing to ask about')
      else if (!referenced.widget || referenced.rows < 2) {
        problems.push(`references on the struct showed ${referenced.rows} row(s) in ${referenced.widget ? 'the peek widget' : 'no widget'}; its declaration and a use were expected`)
      }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      console.log(`  references: ${referenced?.rows} row(s) in the peek`)

      // ── outline ─────────────────────────────────────────────────────────────────────────
      const outline = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        editor.focus()
        const action = editor.getAction('editor.action.quickOutline')
        if (!action) return null
        await action.run()
        await new Promise((done) => setTimeout(done, 800))
        return [...document.querySelectorAll('.quick-input-widget .monaco-list-row')].map((row) => row.innerText.replace(/\s+/g, ' ').trim())
      })
      if (!outline) problems.push('Monaco has no quick outline action')
      else {
        const missing = ['vs', 'fs'].filter((name) => !outline.some((row) => new RegExp(`\\b${name}\\b`).test(row)))
        if (outline.length === 0 || missing.length > 0) problems.push(`the outline is missing ${missing.join(', ') || 'everything'}:\n    ${outline.join('\n    ')}`)
      }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      console.log(`  outline: ${outline?.length} row(s)`)

      // ── signature help ──────────────────────────────────────────────────────────────────
      const hinted = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        const lines = editor.getModel().getLinesContent()
        const at = lines.findIndex((line) => line.includes('vec4('))
        if (at < 0) return null
        // Monaco anchors this widget to the line, and places none for a line out of view, so
        // the line is revealed first: the subject here is the answer, not the scroll position.
        editor.revealLineInCenter(at + 1)
        editor.setPosition({ lineNumber: at + 1, column: lines[at].indexOf('vec4(') + 'vec4('.length + 1 })
        editor.focus()
        const action = editor.getAction('editor.action.triggerParameterHints')
        if (!action) return { noAction: true }
        await action.run()
        await new Promise((done) => setTimeout(done, 800))
        return { text: document.querySelector('.parameter-hints-widget')?.innerText.replace(/\s+/g, ' ').trim() ?? '' }
      })
      if (!hinted) problems.push('the sample calls no vec4, so signature help had nothing to ask about')
      else if (hinted.noAction) problems.push('Monaco has no parameter hints action')
      else if (!hinted.text.includes('vec4')) problems.push(`signature help inside vec4( did not name vec4:\n    ${hinted.text.slice(0, 200)}`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      console.log(`  signature help: ${(hinted?.text ?? '').slice(0, 60)}`)

      // ── rename ──────────────────────────────────────────────────────────────────────────
      // Every occurrence of the struct's name and nothing else: the count of the new name
      // afterwards is the count of the old one before, and the old one is gone.
      const renamed = await page.evaluate(async () => {
        const editor = window.monaco.editor.getEditors()[0]
        const model = editor.getModel()
        const lines = model.getLinesContent()
        const declaredAt = lines.findIndex((line) => /^class (\w+)/.test(line))
        if (declaredAt < 0) return null
        const name = lines[declaredAt].match(/^class (\w+)/)[1]
        const before = (model.getValue().match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length
        editor.setPosition({ lineNumber: declaredAt + 1, column: 'class '.length + 2 })
        editor.focus()
        const action = editor.getAction('editor.action.rename')
        if (!action) return { noAction: true }
        void action.run()
        await new Promise((done) => setTimeout(done, 1_000))
        return { name, before, box: Boolean(document.querySelector('.rename-box input')) }
      })
      if (!renamed) problems.push('the sample declares no struct, so rename had nothing to ask about')
      else if (renamed.noAction) problems.push('Monaco has no rename action')
      else if (!renamed.box) problems.push(`rename on ${renamed.name} opened no rename box`)
      else {
        await page.keyboard.press('Control+A')
        await page.keyboard.type('Renamed')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1_000)
        const after = await page.evaluate((name) => {
          const text = window.monaco.editor.getModels()[0].getValue()
          return { old: (text.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length, fresh: (text.match(/\bRenamed\b/g) ?? []).length }
        }, renamed.name)
        if (after.old !== 0 || after.fresh !== renamed.before) {
          problems.push(`renaming ${renamed.name} (${renamed.before} occurrence(s)) left ${after.old} of the old name and wrote ${after.fresh} of the new`)
        }
        console.log(`  rename: ${renamed.name} to Renamed, ${after.fresh} of ${renamed.before} occurrence(s)`)
      }
      await typeSource(page, sample)

      // ── semantic tokens ─────────────────────────────────────────────────────────────────
      // The colouring is the compiler's classification, drawn over Monaco's tokenizer. Its
      // tokenizer alone gives `@vertex` an annotation's class and `u32` an identifier's, the
      // same as the parameter `i`; the compiler's tokens give the decorator and the GPU type
      // classes of their own, so each has to differ from a plain identifier's.
      const coloured = await page.evaluate(async () => {
        await new Promise((done) => setTimeout(done, 1_200))
        const spans = [...document.querySelectorAll('.monaco-editor .view-line > span > span')]
        const classOf = (text) => spans.find((span) => span.textContent.trim() === text)?.className ?? ''
        return { decorator: classOf('@vertex') || classOf('vertex'), gpuType: classOf('u32'), parameter: classOf('i') }
      })
      if (!coloured.decorator) problems.push('the rendered lines hold no span for the @vertex decorator')
      if (!coloured.gpuType) problems.push('the rendered lines hold no span for the u32 type')
      if (!coloured.parameter) problems.push('the rendered lines hold no span for the parameter i')
      if (coloured.gpuType && coloured.parameter && coloured.gpuType === coloured.parameter) {
        problems.push(`the GPU type u32 draws with the parameter's class (${coloured.parameter}): the semantic tokens are not reaching the editor`)
      }
      if (coloured.decorator && coloured.parameter && coloured.decorator === coloured.parameter) {
        problems.push(`the decorator draws with the parameter's class (${coloured.parameter})`)
      }
      console.log(`  semantic tokens: decorator ${coloured.decorator}, u32 ${coloured.gpuType}, parameter ${coloured.parameter}`)

      // ── the compiler is in the worker ───────────────────────────────────────────────────
      // The resource timeline says what the page loaded: a language worker script, and a page
      // module a fraction of the size it was when it carried the compiler.
      const loaded = await page.evaluate(() => {
        const scripts = performance.getEntriesByType('resource').filter((entry) => /\.js(\?|$)/.test(entry.name))
        const worker = scripts.find((entry) => /playground-language-worker/.test(entry.name))
        const main = scripts.find((entry) => /Playground\.astro_astro_type_script/.test(entry.name))
        const kb = (entry) => (entry ? Math.round(entry.decodedBodySize / 1024) : null)
        return { worker: kb(worker), main: kb(main) }
      })
      if (loaded.worker === null) problems.push('no language worker script was fetched: the service is not running in a worker')
      if (loaded.main === null) problems.push('the page module is not in the resource timeline')
      else if (loaded.main > 1024) problems.push(`the page module is ${loaded.main} KB: the compiler is still in it`)
      console.log(`  chunks: page module ${loaded.main} KB, language worker ${loaded.worker} KB, raw`)

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

      // ── every example in the picker, drawn ────────────────────────────────────────────
      // "The examples run in the Playground" was a claim nobody could check without driving
      // a browser by hand, which is how it went two hours without a straight answer. This
      // is that answer, as a number the build defends. The corpus is one list and the same
      // list in both languages, so it is walked once, on the source locale; the Korean
      // route runs every other step.
      if (route === ROUTES[0]) {
        await openTab(page, 'result')
        const ids = await page.evaluate(() => [...document.querySelectorAll('[data-example] option')].map((o) => o.value))
        if (ids.length === 0) problems.push('the example picker offers nothing to draw')
        const drawn = []
        for (const id of ids) {
          await page.selectOption('[data-example]', id)
          try {
            await settleResult(page)
          } catch {
            problems.push(`'${id}' never settled: the Result tab neither drew a frame nor said why not`)
          }
          const seen = await canvasColours(page)
          const state = await page.evaluate(() => ({
            backend: document.querySelector('[data-gpu-canvas]')?.dataset.backend ?? 'none',
            note: (document.querySelector('[data-gpu-note]')?.textContent ?? '').trim(),
            status: (document.querySelector('[data-status]')?.textContent ?? '').trim(),
          }))
          drawn.push({ id, ...state, ...seen })
        }
        const ran = drawn.filter((row) => row.backend !== 'none')
        const painted = drawn.filter((row) => row.colours > 1)
        console.log(`  examples: ${painted.length} of ${drawn.length} paint more than one colour, ${ran.length} of ${drawn.length} get a backend`)
        // Grouped by what the page says about them, so a count that moves names what moved.
        const byReason = new Map()
        for (const row of drawn.filter((r) => r.colours <= 1)) {
          const reason = row.backend === 'none' ? row.note : `${row.note} (a backend ran it and it came out one flat colour)`
          byReason.set(reason, [...(byReason.get(reason) ?? []), row.id])
        }
        for (const [reason, names] of byReason) console.log(`    ${names.join(', ')}\n      ${reason}`)
        if (painted.length < PAINTED_FLOOR) {
          problems.push(`${painted.length} of ${drawn.length} examples paint the canvas, and ${PAINTED_FLOOR} did when this check was written. Do not lower the floor: find the example that stopped drawing in the list above`)
        }
        if (ran.length < RAN_FLOOR) {
          problems.push(`${ran.length} of ${drawn.length} examples get a backend, and ${RAN_FLOOR} did when this check was written. Do not lower the floor: find the example that stopped running in the list above`)
        }

        // And the thing the maintainer actually asked for: that an example on the page is
        // editable. A build that compiles is not evidence; a keystroke that reaches the
        // emitted text and the frame is. `plasma-twin` is a fullscreen pass whose look
        // follows its own arithmetic, so an edit to it has to move both.
        await page.selectOption('[data-example]', 'plasma-twin')
        await settleResult(page)
        await page.waitForTimeout(AFTER_EDIT)
        const beforeFrame = await canvasColours(page)
        const beforeWgsl = await wgslPane(page)
        await openTab(page, 'result')
        const edited = await page.evaluate(() => {
          const model = window.monaco.editor.getModels()[0]
          // One number in the pass: the wave count the three sines run at, which is an edit
          // a reader could make by eye and see in the picture.
          const next = model.getValue().replaceAll('* 10. +', '* 3. +')
          const changed = next !== model.getValue()
          model.setValue(next)
          return changed
        })
        if (!edited) problems.push('the edit the check types found nothing to replace in plasma-twin, so it proved nothing')
        await page.waitForTimeout(AFTER_EDIT)
        await settleResult(page)
        const afterWgsl = await wgslPane(page)
        await openTab(page, 'result')
        await page.waitForTimeout(600)
        const afterFrame = await canvasColours(page)
        if (afterWgsl === beforeWgsl) problems.push('typing into the editor did not change the emitted WGSL')
        if (afterFrame.colours === beforeFrame.colours && afterFrame.opaque === beforeFrame.opaque) {
          problems.push(`typing into the editor did not repaint the canvas: ${beforeFrame.colours} colours before and after`)
        }
        console.log(`  an edit reaches the output: WGSL ${beforeWgsl.length} B to ${afterWgsl.length} B, canvas ${beforeFrame.colours} colours to ${afterFrame.colours}`)
        await page.selectOption('[data-example]', 'hello')
        await page.waitForTimeout(AFTER_EDIT)
      }
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
