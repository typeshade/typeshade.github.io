// The browser half of <LiveShader>. It runs the canvas, builds the controls from the
// reflection the build inlined, and hands the reader's edits to the compiler.
//
// What is in this module and what is not. The runtime (src/lib/shader-runtime.ts) and the
// contract (src/lib/live-shader-contract.ts) are here, which is a few kilobytes. The compiler
// is behind a dynamic import (./live-shader-compile.ts) that is awaited on the first edit and
// shared by every instance on the page, so a reader who only watches a page never downloads
// TypeScript.

import { mountShader, type MountedShader, type ShaderData, type StateStrings } from '../lib/shader-runtime.ts'
import { clamp, initialValues, reservedValue, type ControlProps, type LiveControl } from '../lib/live-shader-contract.ts'
import { mountEditor, type LiveEditor } from './live-shader-editor.ts'
import { highlight } from './live-shader-highlight.ts'

/** What LiveShader.astro inlined for one example. */
interface LivePayload {
  readonly id: string
  readonly source: string
  readonly data: ShaderData
  readonly controls: readonly LiveControl[]
  readonly props: ControlProps
}

/** The words for one instance, written by the page from src/i18n. Everything the page renders
 *  itself stays on the page; this is what only the script can write. */
interface LiveCopy {
  readonly editorAria: string
  readonly loading: string
  readonly keptFrame: string
  readonly noFrame: string
  readonly caption: StateStrings
  readonly aria: StateStrings
  readonly lineAt: string
  readonly component: readonly string[]
}

/** One message under the canvas. */
interface Message {
  readonly text: string
  /** The line in the reader's own text, when the compiler gave one. A message about the whole
   *  module has none, and is not labelled with a line it does not have. */
  readonly line?: number
}

/** The handle scripts/check-live.mjs reads. One per instance, parked on the root element. */
interface LiveHandle {
  readonly id: string
  compilerLoaded: boolean
  edits: number
  compiles: number
  /** Pin the shader clock, so two frames of the same program are the same image. */
  freeze(seconds: number | null): void
  values(): Record<string, number[]>
  /** The bytes the packer last wrote, as the runtime saw them. */
  uniforms(): number[]
  backend(): string
  diagnostics(): string[]
}

declare global {
  interface HTMLElement {
    __liveShader?: LiveHandle
  }
}

const DEBOUNCE = 250
/** How far a pointer may travel and still count as a tap on the code. Below this a reader is
 *  reaching for the editor; above it they are selecting text. */
const TAP_SLOP = 4
/** The clock a reader who asked for less motion sees. The canvas still redraws, so a control
 *  they move still changes the picture; what stops is the animation. The value is the one the
 *  runtime's own one-frame path uses, so a still example and a live one look alike. */
const STILL_SECONDS = 3
const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** The compiler chunk, fetched once per page however many examples are on it. */
let compilerChunk: Promise<typeof import('./live-shader-compile.ts')> | null = null
const loadCompiler = (): Promise<typeof import('./live-shader-compile.ts')> => {
  compilerChunk ??= import('./live-shader-compile.ts')
  return compilerChunk
}

const el = (tag: string, className?: string, text?: string): HTMLElement => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const channel = (v: number): string =>
  Math.max(0, Math.min(255, Math.round(v * 255)))
    .toString(16)
    .padStart(2, '0')

const toHex = (v: readonly number[]): string => `#${channel(v[0] ?? 0)}${channel(v[1] ?? 0)}${channel(v[2] ?? 0)}`

const fromHex = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
]

/** How a number reads under a control: an integer plain, a float to three places. */
const show = (control: LiveControl, v: number): string =>
  control.scalar === 'f32' ? v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : String(Math.round(v))

function setUp(root: HTMLElement): void {
  const canvas = root.querySelector('canvas')
  const host = root.querySelector<HTMLElement>('[data-live-code]')
  const pre = host?.querySelector<HTMLElement>('pre') ?? null
  const code = pre?.querySelector<HTMLElement>('code') ?? null
  const messages = root.querySelector<HTMLElement>('[data-live-diagnostics]')
  const panel = root.querySelector<HTMLElement>('[data-live-controls]')
  const rawPayload = document.getElementById(root.dataset.payload ?? '')?.textContent
  if (!canvas || !host || !pre || !code || !messages || !panel || !rawPayload) return
  const wrapper = host
  const block = pre
  const codeEl = code
  const rows = panel

  let payload: LivePayload
  let copy: LiveCopy
  try {
    payload = JSON.parse(rawPayload) as LivePayload
    copy = JSON.parse(root.dataset.copy ?? '') as LiveCopy
  } catch {
    return
  }

  let controls: readonly LiveControl[] = payload.controls
  const values: Record<string, number[]> = initialValues(controls)
  const pointer: [number, number] = [0.5, 0.5]
  // Less motion means a pinned clock and no loop: the canvas still answers a control, and
  // nothing redraws between one move and the next.
  const onDemand = prefersReducedMotion()
  let frozen: number | null = onDemand ? STILL_SECONDS : null
  let reported: string[] = []
  const handle: LiveHandle = {
    id: payload.id,
    compilerLoaded: false,
    edits: 0,
    compiles: 0,
    freeze: (seconds) => {
      frozen = seconds
    },
    values: () => JSON.parse(JSON.stringify(values)) as Record<string, number[]>,
    uniforms: () => Array.from(mounted?.uniformBytes() ?? []),
    backend: () => canvas.dataset.backend ?? 'none',
    diagnostics: () => [...reported],
  }
  root.__liveShader = handle

  // ── the canvas ────────────────────────────────────────────────────────────

  const uniformValues = (name: string, seconds: number): readonly number[] | null =>
    reservedValue(name, frozen ?? seconds, canvas.width, canvas.height, pointer) ?? values[name] ?? null

  let mounted: MountedShader | null = null

  canvas.addEventListener('pointermove', (e) => {
    const box = canvas.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return
    pointer[0] = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    // The prelude's uv has its origin at the bottom left; a pointer event counts from the top.
    pointer[1] = Math.min(1, Math.max(0, 1 - (e.clientY - box.top) / box.height))
  })

  // ── the controls ──────────────────────────────────────────────────────────

  /** The name of one component of a vector control, for its accessible name. */
  const component = (i: number): string => copy.component[i] ?? String(i)

  const write = (control: LiveControl, index: number, raw: number): void => {
    const slot = values[control.field]
    if (!slot) return
    slot[index] = clamp(control, index, raw)
    // A reader who asked for less motion gets no frame loop, so the move they just made is
    // what puts the next frame up.
    if (onDemand) mounted?.redraw()
  }

  /** One `<input type="range">` or `<input type="number">` over one component of a field. */
  function axis(control: LiveControl, i: number, label: string, paint: () => void): HTMLInputElement {
    const input = document.createElement('input')
    input.type = control.kind === 'stepper' ? 'number' : 'range'
    input.min = String(control.min[i] ?? 0)
    input.max = String(control.max[i] ?? 1)
    input.step = String(control.step[i] ?? 0.01)
    input.value = String(values[control.field]?.[i] ?? 0)
    input.dataset.index = String(i)
    input.setAttribute('aria-label', control.components > 1 ? `${label}, ${component(i)}` : label)
    input.addEventListener('input', () => {
      write(control, i, Number(input.value))
      paint()
    })
    return input
  }

  function rowFor(control: LiveControl): HTMLElement {
    const row = el('div', 'live-control')
    row.dataset.field = control.field
    const head = el('div', 'live-control-head')
    head.append(el('code', undefined, control.field))
    if (control.label) head.append(el('span', 'live-control-label', control.label))
    row.append(head)

    const label = control.label ? `${control.field}, ${control.label}` : control.field
    const inputs = el('div', 'live-control-inputs')
    // The value reads beside the handle that sets it, which also keeps the name and the
    // label on one line in the column beside it.
    const readout = el('output', 'live-control-value')
    const paint = (): void => {
      const v = values[control.field] ?? []
      readout.textContent = v.map((n) => show(control, n)).join(', ')
    }

    if (control.kind === 'checkbox') {
      const box = document.createElement('input')
      box.type = 'checkbox'
      box.checked = (values[control.field]?.[0] ?? 0) !== 0
      box.setAttribute('aria-label', label)
      box.addEventListener('change', () => {
        write(control, 0, box.checked ? 1 : 0)
        paint()
      })
      inputs.append(box)
    } else if (control.kind === 'color') {
      const picker = document.createElement('input')
      picker.type = 'color'
      picker.value = toHex(values[control.field] ?? [])
      picker.setAttribute('aria-label', label)
      picker.addEventListener('input', () => {
        fromHex(picker.value).forEach((n, i) => write(control, i, n))
        paint()
      })
      inputs.append(picker)
    } else if (control.kind === 'pad') {
      // The pad is for a pointer. A keyboard and a screen reader get the two sliders beside
      // it, which write the same two numbers, so the pad itself is left out of the tree.
      const pad = el('div', 'live-pad')
      pad.setAttribute('aria-hidden', 'true')
      const dot = el('span', 'live-pad-dot')
      pad.append(dot)
      const sliders = [axis(control, 0, label, paintAll), axis(control, 1, label, paintAll)]
      const place = (): void => {
        const v = values[control.field] ?? [0, 0]
        const span = (i: number): number => Math.max(1e-6, (control.max[i] ?? 1) - (control.min[i] ?? 0))
        dot.style.left = `${(((v[0] ?? 0) - (control.min[0] ?? 0)) / span(0)) * 100}%`
        // The pad's y axis runs up, the way the shader's does.
        dot.style.top = `${(1 - ((v[1] ?? 0) - (control.min[1] ?? 0)) / span(1)) * 100}%`
        sliders.forEach((s, i) => {
          s.value = String(values[control.field]?.[i] ?? 0)
        })
      }
      function paintAll(): void {
        paint()
        place()
      }
      const move = (e: PointerEvent): void => {
        const box = pad.getBoundingClientRect()
        const fx = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
        const fy = 1 - Math.min(1, Math.max(0, (e.clientY - box.top) / box.height))
        write(control, 0, (control.min[0] ?? 0) + fx * ((control.max[0] ?? 1) - (control.min[0] ?? 0)))
        write(control, 1, (control.min[1] ?? 0) + fy * ((control.max[1] ?? 1) - (control.min[1] ?? 0)))
        paintAll()
      }
      pad.addEventListener('pointerdown', (e) => {
        pad.setPointerCapture(e.pointerId)
        move(e)
      })
      pad.addEventListener('pointermove', (e) => {
        if (pad.hasPointerCapture(e.pointerId)) move(e)
      })
      inputs.append(pad)
      const stack = el('div', 'live-pad-axes')
      stack.append(...sliders)
      inputs.append(stack, readout)
      row.append(inputs)
      paintAll()
      return row
    } else {
      // A float is a slider and an integer a stepper; a vector of either is one per component.
      for (let i = 0; i < control.components; i++) inputs.append(axis(control, i, label, paint))
    }
    inputs.append(readout)
    row.append(inputs)
    paint()
    return row
  }

  function drawControls(): void {
    rows.textContent = ''
    for (const control of controls) rows.append(rowFor(control))
    rows.hidden = controls.length === 0
  }

  /** How one control reads, for telling a rebuilt control set from an unchanged one. */
  const shapeOf = (list: readonly LiveControl[]): string =>
    list.map((c) => `${c.field}:${c.type}:${c.kind}:${c.offset}:${c.min.join()}:${c.max.join()}`).join('|')

  /** Keep the value of a field that survived a recompile with the same type, and start the
   *  rest at the author's default, so an edit that renames one field leaves the others where
   *  the reader put them. An edit that changed no field leaves the rows alone, so a reader
   *  who is already dragging a slider keeps hold of it. */
  function adopt(next: readonly LiveControl[]): void {
    if (shapeOf(next) === shapeOf(controls)) return
    const before = new Map(controls.map((c) => [c.field, c]))
    const kept: Record<string, number[]> = {}
    for (const control of next) {
      const old = before.get(control.field)
      kept[control.field] =
        old && old.type === control.type ? (values[control.field] ?? [...control.value]) : [...control.value]
    }
    for (const key of Object.keys(values)) delete values[key]
    Object.assign(values, kept)
    controls = next
    drawControls()
  }

  drawControls()

  // ── the emitted output ────────────────────────────────────────────────────
  // The disclosure under the canvas holds what the compiler emitted. It follows the reader's
  // edits, so it never describes a program that is no longer on the canvas. Expressive Code
  // coloured the build's own output; an edit is coloured by the same function the editor uses.

  const showEmitted = (data: ShaderData): void => {
    const panes: [string, string][] = [
      ['wgsl', data.wgsl],
      ['vertex', data.vertex],
      ['fragment', data.fragment],
    ]
    for (const [name, text] of panes) {
      const pane = root.querySelector<HTMLElement>(`[data-live-emitted="${name}"]`)
      const body = pane?.querySelector<HTMLElement>('pre code')
      if (!body) continue
      body.innerHTML = highlight(text)
      const copyButton = pane?.querySelector<HTMLElement>('.copy button')
      if (copyButton) copyButton.dataset.code = text
    }
  }

  // ── diagnostics ───────────────────────────────────────────────────────────
  // Nothing is written here while the code compiles, the way MDN's own editor says nothing
  // until something breaks. The region is a status, so rewriting it is announced; it is left
  // alone when the message set has not moved, so typing does not talk over the reader.

  const say = (state: 'idle' | 'loading' | 'ok' | 'error' | 'stale', list: readonly Message[], note?: string): void => {
    const next = list.map((m) => (m.line === undefined ? m.text : `${copy.lineAt.replace('{line}', String(m.line))}  ${m.text}`))
    root.dataset.liveState = state
    if (next.join('\n') === reported.join('\n') && !note) return
    reported = next
    messages.textContent = ''
    for (const message of list) {
      const line = el('div', 'live-message')
      if (message.line === undefined) {
        line.textContent = message.text
      } else {
        // A located message walks the reader to the line, which is what the line number is for.
        const jump = el('button', 'live-jump', copy.lineAt.replace('{line}', String(message.line)))
        jump.setAttribute('type', 'button')
        jump.addEventListener('click', () => editor?.goTo(message.line!, 1))
        line.append(jump, document.createTextNode(`  ${message.text}`))
      }
      messages.append(line)
    }
    if (note) messages.append(el('div', 'live-note', note))
  }
  say('idle', [])

  // ── editing ───────────────────────────────────────────────────────────────

  let editor: LiveEditor | null = null
  let composing = false
  let timer = 0
  // Every edit takes a number. A compile that finishes after a later edit started throws its
  // answer away, so a slow compile cannot put an older program back on the canvas.
  let generation = 0

  async function recompile(): Promise<void> {
    if (!editor || composing) return
    const mine = ++generation
    if (!handle.compilerLoaded) say('loading', [], copy.loading)
    const { compileLive } = await loadCompiler()
    handle.compilerLoaded = true
    if (mine !== generation) return
    const result = compileLive(payload.id, payload.data.title, editor.value(), payload.props)
    handle.compiles++
    const report: Message[] = result.diagnostics.map((d) => ({ text: d.message, ...(d.located ? { line: d.line } : {}) }))
    if (!result.data || !result.controls) {
      say('error', report, copy.keptFrame)
      return
    }
    const swapped = (await mounted?.swap(result.data)) ?? false
    if (mine !== generation) return
    if (!swapped) {
      // The compile was clean; what failed is the canvas. That is neither an error in the
      // reader's code nor a success, so it reads as its own state.
      say(report.length > 0 ? 'error' : 'stale', report, copy.noFrame)
      return
    }
    showEmitted(result.data)
    adopt(result.controls)
    say(report.length > 0 ? 'error' : 'ok', report, report.length > 0 ? copy.keptFrame : undefined)
  }

  function onEdit(): void {
    handle.edits++
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = 0
      void recompile()
    }, DEBOUNCE)
  }

  /** The editor arrives when the reader reaches for the code, so a page that is only read
   *  carries no textarea and no listeners. */
  function openEditor(index?: number): void {
    if (editor) {
      editor.focus(index)
      return
    }
    editor = mountEditor(wrapper, block, codeEl, payload.source, {
      ariaLabel: copy.editorAria,
      onInput: onEdit,
      onComposing: (state) => {
        composing = state
      },
    })
    editor.focus(index)
  }

  /** The point a caret API reports under a pixel, in whichever of the two spellings the
   *  browser has. */
  function caretAt(x: number, y: number): { node: Node; offset: number } | null {
    const doc = document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
      caretRangeFromPoint?: (x: number, y: number) => Range | null
    }
    const position = doc.caretPositionFromPoint?.(x, y)
    if (position) return { node: position.offsetNode, offset: position.offset }
    const range = doc.caretRangeFromPoint?.(x, y)
    return range ? { node: range.startContainer, offset: range.startOffset } : null
  }

  /** Where in the source a point on the rendered block falls, so the editor opens with the
   *  caret on the glyph the reader touched. The rendered rows are the source's own lines, so
   *  the row gives the line and the text before the point gives the column. */
  function offsetAt(x: number, y: number): number | undefined {
    const point = caretAt(x, y)
    if (!point) return undefined
    const from = point.node.nodeType === Node.ELEMENT_NODE ? (point.node as Element) : point.node.parentElement
    const row = from?.closest('.ec-line')
    if (!row || !codeEl.contains(row)) return undefined
    const line = [...codeEl.querySelectorAll('.ec-line')].indexOf(row)
    const lines = payload.source.split('\n')
    if (line < 0 || line >= lines.length) return undefined
    let column = 0
    if (point.node.nodeType === Node.TEXT_NODE) {
      const cell = row.querySelector('.code') ?? row
      const walk = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
      for (let node = walk.nextNode(); node; node = walk.nextNode()) {
        if (node === point.node) {
          column += point.offset
          break
        }
        column += node.textContent?.length ?? 0
      }
    }
    let at = 0
    for (let i = 0; i < line; i++) at += (lines[i]?.length ?? 0) + 1
    // An empty row carries a newline of its own, so the column is held to the line's length.
    return at + Math.min(column, lines[line]?.length ?? 0)
  }

  // The editor is mounted when the pointer comes up. A pointerdown on the block is also how a
  // reader starts selecting the source, and a transparent textarea focused in the middle of
  // that drag collapses the selection and gives the rest of the drag to text nobody can see.
  // A drag leaves the block alone, so a copy takes the source as written.
  let tapFrom: { x: number; y: number; id: number } | null = null
  const forgetTap = (): void => {
    tapFrom = null
  }
  const onBlockDown = (e: PointerEvent): void => {
    tapFrom = editor ? null : { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onBlockUp = (e: PointerEvent): void => {
    const from = tapFrom
    tapFrom = null
    if (!from || from.id !== e.pointerId || editor) return
    if (Math.abs(e.clientX - from.x) > TAP_SLOP || Math.abs(e.clientY - from.y) > TAP_SLOP) return
    if (window.getSelection()?.isCollapsed === false) return
    openEditor(offsetAt(e.clientX, e.clientY) ?? 0)
  }
  // Not `once`: a reset takes the editor away again, and the block has to open a new one.
  block.addEventListener('pointerdown', onBlockDown)
  block.addEventListener('pointerup', onBlockUp)
  block.addEventListener('pointercancel', forgetTap)
  block.addEventListener('pointerleave', forgetTap)
  root.querySelector<HTMLElement>('[data-live-edit]')?.addEventListener('click', () => openEditor(0))

  root.querySelector<HTMLElement>('[data-live-reset]')?.addEventListener('click', () => {
    for (const control of payload.controls) values[control.field] = [...control.value]
    forgetTap()
    if (editor) {
      editor.destroy()
      editor = null
      codeEl.innerHTML = highlight(payload.source)
    }
    controls = payload.controls
    drawControls()
    void (async () => {
      generation++
      if (handle.compilerLoaded) {
        const { compileLive } = await loadCompiler()
        const result = compileLive(payload.id, payload.data.title, payload.source, payload.props)
        if (result.data) {
          await mounted?.swap(result.data)
          showEmitted(result.data)
        }
      } else {
        await mounted?.swap(payload.data)
      }
      say('idle', [])
    })()
  })

  // ── mount ─────────────────────────────────────────────────────────────────

  void mountShader(canvas, payload.data, {
    interactive: true,
    onDemand,
    uniformValues,
    labels: {
      caption: { el: root.querySelector<HTMLElement>('[data-live-caption]'), text: copy.caption },
      ariaLabel: copy.aria,
    },
  })
    .then((m) => {
      mounted = m
    })
    .catch(() => {})
}

for (const root of document.querySelectorAll<HTMLElement>('[data-live-shader]')) {
  if (root.dataset.mounted) continue
  root.dataset.mounted = '1'
  setUp(root)
}
