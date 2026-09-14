// The browser half of <LiveShader>. It runs the canvas, builds the controls from the
// reflection the build inlined, and hands the reader's edits to the compiler.
//
// What is in this module and what is not. The runtime (src/lib/shader-runtime.ts) and the
// contract (src/lib/live-shader-contract.ts) are here, which is a few kilobytes. The compiler
// is behind a dynamic import (./live-shader-compile.ts) that is awaited on the first edit and
// shared by every instance on the page, so a reader who only watches a page never downloads
// TypeScript.

import { mountShader, type MountedShader, type ShaderData, type StateStrings } from '../lib/shader-runtime.ts'
import {
  clamp,
  initialValues,
  reservedValue,
  type ControlProps,
  type LiveControl,
} from '../lib/live-shader-contract.ts'
import { mountEditor, type LiveEditor } from './live-shader-editor.ts'
import { highlight } from './live-shader-highlight.ts'

/** What LiveShader.astro inlined for one example. */
interface LivePayload {
  readonly id: string
  readonly source: string
  readonly offset: number
  readonly data: ShaderData
  readonly controls: readonly LiveControl[]
  readonly props: ControlProps
}

/** The words for one instance, written by the page from src/i18n. */
interface LiveCopy {
  readonly editorAria: string
  readonly hint: string
  readonly compiling: string
  readonly loading: string
  readonly clean: string
  readonly keptFrame: string
  readonly controls: string
  readonly reset: string
  readonly backend: { readonly webgpu: string; readonly webgl2: string; readonly none: string }
  readonly aria: StateStrings
  readonly lineAt: string
  readonly component: readonly string[]
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
  const pre = root.querySelector<HTMLElement>('[data-live-code] pre')
  const code = pre?.querySelector<HTMLElement>('code') ?? null
  const status = root.querySelector<HTMLElement>('[data-live-status]')
  const messages = root.querySelector<HTMLElement>('[data-live-diagnostics]')
  const panel = root.querySelector<HTMLElement>('[data-live-controls]')
  const rawPayload = document.getElementById(root.dataset.payload ?? '')?.textContent
  if (!canvas || !pre || !code || !status || !messages || !panel || !rawPayload) return
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
  let frozen: number | null = prefersReducedMotion() ? STILL_SECONDS : null
  let diagnostics: string[] = []
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
    diagnostics: () => [...diagnostics],
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
  }

  function rowFor(control: LiveControl): HTMLElement {
    const row = el('div', 'live-control')
    row.dataset.field = control.field
    const head = el('div', 'live-control-head')
    const name = el('code', undefined, control.field)
    head.append(name)
    if (control.label) head.append(el('span', 'live-control-label', control.label))
    const readout = el('output', 'live-control-value')
    head.append(readout)
    row.append(head)

    const label = control.label ? `${control.field}, ${control.label}` : control.field
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
      row.append(box)
      paint()
      return row
    }

    if (control.kind === 'color') {
      const picker = document.createElement('input')
      picker.type = 'color'
      picker.value = toHex(values[control.field] ?? [])
      picker.setAttribute('aria-label', label)
      picker.addEventListener('input', () => {
        fromHex(picker.value).forEach((n, i) => write(control, i, n))
        paint()
      })
      row.append(picker)
      paint()
      return row
    }

    if (control.kind === 'pad') {
      const pad = el('div', 'live-pad')
      pad.tabIndex = 0
      pad.setAttribute('role', 'group')
      pad.setAttribute('aria-label', label)
      const dot = el('span', 'live-pad-dot')
      pad.append(dot)
      const place = (): void => {
        const v = values[control.field] ?? [0, 0]
        const min = control.min
        const max = control.max
        const fx = ((v[0] ?? 0) - (min[0] ?? 0)) / Math.max(1e-6, (max[0] ?? 1) - (min[0] ?? 0))
        const fy = ((v[1] ?? 0) - (min[1] ?? 0)) / Math.max(1e-6, (max[1] ?? 1) - (min[1] ?? 0))
        dot.style.left = `${fx * 100}%`
        // The pad's y axis runs up, the way the shader's does.
        dot.style.top = `${(1 - fy) * 100}%`
        pad.setAttribute('aria-valuetext', (values[control.field] ?? []).map((n) => show(control, n)).join(', '))
        paint()
      }
      const move = (e: PointerEvent): void => {
        const box = pad.getBoundingClientRect()
        const fx = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
        const fy = 1 - Math.min(1, Math.max(0, (e.clientY - box.top) / box.height))
        write(control, 0, (control.min[0] ?? 0) + fx * ((control.max[0] ?? 1) - (control.min[0] ?? 0)))
        write(control, 1, (control.min[1] ?? 0) + fy * ((control.max[1] ?? 1) - (control.min[1] ?? 0)))
        place()
      }
      pad.addEventListener('pointerdown', (e) => {
        pad.setPointerCapture(e.pointerId)
        move(e)
      })
      pad.addEventListener('pointermove', (e) => {
        if (pad.hasPointerCapture(e.pointerId)) move(e)
      })
      pad.addEventListener('keydown', (e) => {
        const axis = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 0 : e.key === 'ArrowUp' || e.key === 'ArrowDown' ? 1 : -1
        if (axis < 0) return
        e.preventDefault()
        const away = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : -1
        const stride = (control.step[axis] ?? 0.01) * 8
        write(control, axis, (values[control.field]?.[axis] ?? 0) + away * stride)
        place()
      })
      row.append(pad)
      place()
      return row
    }

    // A float is a slider and an integer a stepper; a vector of either is one per component.
    const inputs = el('div', 'live-control-inputs')
    for (let i = 0; i < control.components; i++) {
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
      inputs.append(input)
    }
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
    list.map((c) => `${c.field}:${c.type}:${c.kind}:${c.min.join()}:${c.max.join()}`).join('|')

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
      const copy = pane?.querySelector<HTMLElement>('.copy button')
      if (copy) copy.dataset.code = text
    }
  }

  // ── diagnostics ───────────────────────────────────────────────────────────

  const say = (state: 'idle' | 'loading' | 'ok' | 'error', lines: string[]): void => {
    diagnostics = lines
    root.dataset.liveState = state
    messages.textContent = ''
    if (lines.length === 0) {
      messages.append(el('span', 'live-clean', state === 'loading' ? copy.loading : copy.clean))
      return
    }
    for (const line of lines) messages.append(el('div', 'live-message', line))
    if (state === 'error') messages.append(el('div', 'live-kept', copy.keptFrame))
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
    if (!handle.compilerLoaded) say('loading', [])
    const { compileLive } = await loadCompiler()
    handle.compilerLoaded = true
    if (mine !== generation) return
    const result = compileLive(payload.id, payload.data.title, editor.value(), payload.props)
    handle.compiles++
    const report = result.diagnostics.map((d) => `${copy.lineAt.replace('{line}', String(d.line))}  ${d.message}`)
    if (!result.data || !result.controls) {
      say('error', report)
      return
    }
    const swapped = (await mounted?.swap(result.data)) ?? false
    if (mine !== generation) return
    showEmitted(result.data)
    adopt(result.controls)
    say(swapped ? 'ok' : 'error', report)
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
    editor = mountEditor(block, codeEl, payload.source, {
      ariaLabel: copy.editorAria,
      onInput: onEdit,
      onComposing: (state) => {
        composing = state
      },
    })
    editor.focus(index)
  }

  block.addEventListener('pointerdown', () => openEditor(), { once: true })
  const opener = root.querySelector<HTMLElement>('[data-live-edit]')
  opener?.addEventListener('click', () => openEditor(0))

  const reset = root.querySelector<HTMLElement>('[data-live-reset]')
  reset?.addEventListener('click', () => {
    for (const control of payload.controls) values[control.field] = [...control.value]
    if (editor) {
      editor.destroy()
      editor = null
      codeEl.innerHTML = highlight(payload.source)
    }
    controls = payload.controls
    drawControls()
    void (async () => {
      if (!handle.compilerLoaded) {
        say('idle', [])
        await mounted?.swap(payload.data)
        return
      }
      const { compileLive } = await loadCompiler()
      const result = compileLive(payload.id, payload.data.title, payload.source, payload.props)
      if (result.data) {
        await mounted?.swap(result.data)
        showEmitted(result.data)
      }
      say('idle', [])
    })()
  })

  // ── mount ─────────────────────────────────────────────────────────────────

  void mountShader(canvas, payload.data, {
    interactive: true,
    uniformValues,
    labels: {
      caption: {
        el: status,
        text: {
          webgpu: copy.backend.webgpu,
          webgl2: copy.backend.webgl2,
          none: copy.backend.none,
          'still-webgpu': copy.backend.webgpu,
          'still-webgl2': copy.backend.webgl2,
        },
      },
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
