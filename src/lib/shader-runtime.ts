// Dependency-free WebGPU / WebGL2 runner for one emitted example: a single
// fullscreen-triangle pass.
//
// This file imports nothing from the compiler. The WGSL, the GLSL ES 3.00 stages, the
// std140 field offsets and the entry-point names are emitted at build time by
// hero-shader.ts and arrive here as plain data.

/** Device-pixel-ratio ceiling. A fullscreen fragment shader is fill-rate bound, so a 3× phone
 *  would pay 4× the pixels for detail nobody can see behind body text. */
const MAX_DPR = 1.5
/** The clock value of the single frame drawn under `prefers-reduced-motion: reduce` ,
 *  far enough in for the noise-driven examples to have settled into their steady look. */
const STILL_SECONDS = 3

/** How the host fills one uniform-struct field each frame.
 *
 *  A structural copy of `examples/_shared.ts` `Control` in the compiler. It is copied so the
 *  browser bundle does not import the compiler's module graph. `hero-shader.ts` translates
 *  the mirror's union into this one at build time and throws on a kind that is missing here,
 *  so the two cannot drift silently. */
export type Control =
  | { readonly kind: 'time' } // elapsed seconds → f32
  | { readonly kind: 'resolution' } // drawing-buffer size in px → vec2<f32>
  // Pointer state as vec4 [x, y, down, used]. The page has no pointer input, so it packs
  // [0,0,0,0], and `used = 0` is exactly the flag the examples read to render their canonical
  // autopilot framing (the one thumbnails and render gates see).
  | { readonly kind: 'mouse' }
  | { readonly kind: 'const'; readonly value: readonly number[] }
  | { readonly kind: 'slider'; readonly value: number } // held at the author's default
  | { readonly kind: 'toggle'; readonly value: boolean } // f32 1 / 0
  // Log-magnitude sweep → a SCALAR f64 field: `base·10^s + offset`, where s is the default of
  // the `magField` slider. Packed as two f32 (hi, lo) into the field's 8 std140 bytes, the
  // host half of the emulated-double story.
  | {
      readonly kind: 'logmag1d'
      readonly magField: string
      readonly base: number
      readonly offset: number
    }

/** One std140 field of the module's uniform block, as `reflect()` recovered it. */
export interface UniformField {
  readonly name: string
  /** DSL type key, `'f32'`, `'vec2<f32>'`, `'f64'`. Reported for the page builder; the
   *  packer switches on the control. */
  readonly type: string
  /** Byte offset inside the block. Always a multiple of 4, so `offset / 4` indexes the
   *  Float32Array view. */
  readonly offset: number
}

/** Everything the runtime needs about the module's interface, all of it from `reflect()`. */
export interface ShaderLayout {
  /** Uniform-block size in bytes, already padded to its std140 alignment. 0 = no block. */
  readonly size: number
  /** GLSL binds the block by its struct name (`layout(std140) uniform <block> { … } U;`),
   *  which is not the WGSL variable name, getting this wrong does not fail to link, it
   *  silently lands on binding point 0. */
  readonly block: string
  readonly group: number
  readonly binding: number
  readonly fields: readonly UniformField[]
  /** WGSL entry points. GLSL ES 3.00 always emits `main`. */
  readonly vertexEntry: string
  readonly fragmentEntry: string
  /** Texture bindings the module declares. Today this is only the compiler's auto-injected
   *  `_fp64` fast-math guard, which wants a 1×1 opaque-white texel; `hero-shader.ts` throws
   *  at build time on any other texture, so a data-texture example can never reach here and
   *  get a white square instead of its data. */
  readonly textures: readonly { readonly name: string; readonly binding: number }[]
}

/** The build-time payload for one example: both targets, the layout, the controls. */
export interface ShaderData {
  readonly id: string
  readonly title: string
  /** One WGSL module carrying both entry points. */
  readonly wgsl: string
  readonly vertex: string // GLSL ES 3.00, vertex stage
  readonly fragment: string // GLSL ES 3.00, fragment stage
  readonly layout: ShaderLayout
  /** Per-field fill strategy, keyed by uniform-field name. */
  readonly controls: Readonly<Record<string, Control>>
}

export type Backend = 'webgpu' | 'webgl2' | 'none'

/** The state a mount's strings are written for. `still-*` is the one-frame path, taken under
 *  `prefers-reduced-motion` or by `still`, and is a separate key because the hero says
 *  something different there while a `still` mount says exactly what its backend row says
 *  . */
export type LabelState = Backend | 'still-webgpu' | 'still-webgl2'

/** One string per state. Full, never partial: a missing key is a label that would go blank on
 *  the path nobody tested. */
export type StateStrings = Readonly<Record<LabelState, string>>

/** A text node this mount owns, plus what it says in each state. */
export interface LabelSlot {
  readonly el: HTMLElement | null
  readonly text: StateStrings
}

/** Everything on this mount whose wording names a backend. Written together, from one value
 *  , so a caption and an accessible name can never disagree. */
export interface MountLabels {
  /** The `<figcaption>`, the caption plate. */
  readonly caption?: LabelSlot
  /** The canvas's own accessible name. */
  readonly ariaLabel?: StateStrings
}

export interface MountOptions {
  /** Skip the WebGPU probe and go straight to WebGL2. `?forcegl2=1` on the page URL sets
   *  this too, so a verification run can exercise the GLSL half without a code change. */
  readonly forceWebGl2?: boolean
  /** Draw exactly one frame at the pinned clock and stop, no rAF, no observers. The same
   *  path `prefers-reduced-motion: reduce` takes, so a still mount is not a second code path
   *  . An example with no `time` control redraws an identical frame forever
   *  without it. */
  readonly still?: boolean
  /** The mount's own per-state strings and the elements they are written into. */
  readonly labels?: MountLabels
}

export interface MountedShader {
  /** Which backend is drawing. `'none'` means both failed, or the device was lost after
   *  mount, and the canvas was left transparent over whatever the page paints behind it.
   *  A live getter that always agrees with `canvas.dataset.backend`. */
  readonly backend: Backend
  /** Frames drawn since mount. Exactly 1, and final, on the still path. */
  readonly frames: number
  stop(): void
}

declare global {
  /** The per-element handle. A page mounts several canvases, so the state a verification run
   *  reads (scripts/capture-stills.ts) hangs off the element, one handle per mount. */
  interface HTMLCanvasElement {
    __shader?: MountedShader
  }
}

// ── per-frame state: size, clock, uniform packing ───────────────────────────

const fr = Math.fround
/** A JS double as the two f32 the emulated-double lowering expects: hi + lo. */
const splitF64 = (x: number): [number, number] => [fr(x), fr(x - fr(x))]

interface FrameState {
  /** Packed std140 bytes for the current frame; null when the module binds no block. */
  readonly data: Float32Array<ArrayBuffer> | null
  readonly byteLength: number
  /** Match the drawing buffer to the CSS box × capped DPR. True when it changed. */
  resize(): boolean
  /** Repack every uniform field at shader time `seconds`. */
  pack(seconds: number): void
}

function createFrameState(canvas: HTMLCanvasElement, data: ShaderData): FrameState {
  const { layout, controls } = data
  const byteLength = layout.size
  const buf = byteLength > 0 ? new Float32Array(byteLength / 4) : null

  /** The live value of a `slider`/`toggle` field by name, `logmag1d` reads its `magField`. */
  const sliderValue = (field: string): number => {
    const c = controls[field]
    if (c?.kind === 'slider') return c.value
    if (c?.kind === 'toggle') return c.value ? 1 : 0
    return 0
  }

  const valueFor = (name: string, seconds: number): readonly number[] | null => {
    const c = controls[name]
    if (!c) return null // declared but uncontrolled → leave the zeros already in the buffer
    switch (c.kind) {
      case 'time':
        return [seconds]
      case 'resolution':
        return [canvas.width, canvas.height]
      case 'mouse':
        return [0, 0, 0, 0]
      case 'const':
        return c.value
      case 'slider':
        return [c.value]
      case 'toggle':
        return [c.value ? 1 : 0]
      case 'logmag1d':
        return splitF64(c.base * Math.pow(10, sliderValue(c.magField)) + c.offset)
    }
  }

  return {
    data: buf,
    byteLength,
    resize(): boolean {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width === w && canvas.height === h) return false
      canvas.width = w
      canvas.height = h
      return true
    },
    pack(seconds: number): void {
      if (!buf) return
      for (const f of layout.fields) {
        const v = valueFor(f.name, seconds)
        if (v) buf.set(v, f.offset / 4)
      }
    },
  }
}

// ── backends ────────────────────────────────────────────────────────────────

/** One compiled, bound, ready-to-draw fullscreen pass. */
interface Pass {
  draw(): void
  dispose(): void
  /** Register a handler for device/context loss, the loop stops and the canvas goes clear. */
  onLost(handler: () => void): void
}

const WHITE_TEXEL = new Uint8Array([255, 255, 255, 255])

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)
  if (!sh) throw new Error('createShader failed')
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? ''
    gl.deleteShader(sh)
    throw new Error(log || 'GLSL compile failed')
  }
  return sh
}

function createWebGl2Pass(canvas: HTMLCanvasElement, data: ShaderData, state: FrameState): Pass {
  // alpha:true + a transparent clear: a pass that stops drawing reveals the page behind it.
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false })
  if (!gl) throw new Error('no WebGL2 context')

  const vs = compile(gl, gl.VERTEX_SHADER, data.vertex)
  const fs = compile(gl, gl.FRAGMENT_SHADER, data.fragment)
  const prog = gl.createProgram()
  if (!prog) throw new Error('createProgram failed')
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'GLSL link failed')
  }
  gl.useProgram(prog)

  let ubo: WebGLBuffer | null = null
  if (state.data) {
    // GLSL binds the block by the struct name reflect() reported, see ShaderLayout.block.
    const idx = gl.getUniformBlockIndex(prog, data.layout.block)
    if (idx === gl.INVALID_INDEX) throw new Error(`no uniform block '${data.layout.block}'`)
    ubo = gl.createBuffer()
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
    gl.bufferData(gl.UNIFORM_BUFFER, state.byteLength, gl.DYNAMIC_DRAW)
    gl.uniformBlockBinding(prog, idx, 0)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo)
  }

  // The compiler's fp64 fast-math guard: a 1×1 white texel the emitted df64 helpers multiply
  // by, so no driver can constant-fold the error terms away.
  const guards: WebGLTexture[] = []
  data.layout.textures.forEach((t, i) => {
    const loc = gl.getUniformLocation(prog, t.name)
    if (!loc) return
    const tex = gl.createTexture()
    if (!tex) return
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, WHITE_TEXEL)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.uniform1i(loc, i)
    guards.push(tex)
  })
  gl.activeTexture(gl.TEXTURE0)

  gl.bindVertexArray(gl.createVertexArray())

  return {
    draw(): void {
      if (ubo && state.data) {
        gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, state.data)
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose(): void {
      // Clear before tearing down, so a stopped mount shows the still image beneath it.
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      for (const t of guards) gl.deleteTexture(t)
      if (ubo) gl.deleteBuffer(ubo)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
    onLost(handler): void {
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault()
        handler()
      })
    },
  }
}

async function createWebGpuPass(
  canvas: HTMLCanvasElement,
  data: ShaderData,
  state: FrameState,
): Promise<Pass> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) throw new Error('no navigator.gpu')
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) throw new Error('no WebGPU adapter')
  const device = await adapter.requestDevice()
  const ctx = canvas.getContext('webgpu')
  if (!ctx) throw new Error('no WebGPU canvas context')
  const format = navigator.gpu.getPreferredCanvasFormat()
  // premultiplied + a transparent clear, for the same reason WebGL2 asks for alpha:true.
  ctx.configure({ device, format, alphaMode: 'premultiplied' })

  device.pushErrorScope('validation')
  const shaderModule = device.createShaderModule({ code: data.wgsl })
  const err = (await shaderModule.getCompilationInfo()).messages.find((m) => m.type === 'error')
  if (err) {
    void device.popErrorScope()
    device.destroy()
    throw new Error(`WGSL: ${err.message}`)
  }
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: data.layout.vertexEntry },
    fragment: {
      module: shaderModule,
      entryPoint: data.layout.fragmentEntry,
      targets: [{ format }],
    },
    primitive: { topology: 'triangle-list' },
  })
  const pipeErr = await device.popErrorScope()
  if (pipeErr) {
    device.destroy()
    throw new Error(`WebGPU pipeline: ${pipeErr.message}`)
  }

  const entries: GPUBindGroupEntry[] = []
  const uniBuf =
    state.byteLength > 0
      ? device.createBuffer({
          size: state.byteLength,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
      : null
  if (uniBuf) entries.push({ binding: data.layout.binding, resource: { buffer: uniBuf } })
  for (const t of data.layout.textures) {
    const tex = device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    device.queue.writeTexture({ texture: tex }, WHITE_TEXEL, {}, [1, 1])
    entries.push({ binding: t.binding, resource: tex.createView() })
  }
  const bindGroup =
    entries.length > 0
      ? device.createBindGroup({ layout: pipeline.getBindGroupLayout(data.layout.group), entries })
      : null

  let disposed = false
  return {
    draw(): void {
      if (disposed) return
      if (uniBuf && state.data) device.queue.writeBuffer(uniBuf, 0, state.data)
      const encoder = device.createCommandEncoder()
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: ctx.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      })
      pass.setPipeline(pipeline)
      if (bindGroup) pass.setBindGroup(data.layout.group, bindGroup)
      pass.draw(3)
      pass.end()
      device.queue.submit([encoder.finish()])
    },
    dispose(): void {
      disposed = true
      // `unconfigure()` is what clears the canvas to transparent; destroying the device on
      // its own leaves the last presented frame on screen.
      ctx.unconfigure()
      device.destroy()
    },
    onLost(handler): void {
      void device.lost.then(() => {
        if (!disposed) handler()
      })
    },
  }
}

// ── mount ───────────────────────────────────────────────────────────────────

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const forceGl2FromUrl = (): boolean =>
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('forcegl2') === '1'

/** Which state's strings this mount prints. `'none'` has no still variant: there is no frame
 *  to be still about. */
const labelStateOf = (backend: Backend, still: boolean): LabelState =>
  backend === 'none' ? 'none' : still ? (`still-${backend}` as LabelState) : backend

/**
 * Compile and run one build-time-emitted example on this canvas: WebGPU when a device is
 * reachable, else WebGL2, else nothing at all, the canvas is left transparent so the page's
 * own background shows through. Never a black box, and no exception reaches the console.
 *
 * The canvas gets `data-backend` and the handle at `canvas.__shader`.
 */
export async function mountShader(
  canvas: HTMLCanvasElement,
  data: ShaderData,
  opts: MountOptions = {},
): Promise<MountedShader> {
  const state = createFrameState(canvas, data)
  const still = opts.still === true || prefersReducedMotion()
  const skipWebGpu = opts.forceWebGl2 === true || forceGl2FromUrl()
  state.resize()

  /** Caption and accessible name, written from one value in one tick , so no string on this
   *  mount can name a backend that is not the one in `data-backend`. */
  const applyLabels = (labelState: LabelState): void => {
    const l = opts.labels
    if (!l) return
    if (l.caption?.el) l.caption.el.textContent = l.caption.text[labelState]
    if (l.ariaLabel) canvas.setAttribute('aria-label', l.ariaLabel[labelState])
  }

  const qa = { backend: 'none' as Backend, frames: 0 }
  /** Draw one frame at `seconds`, counting it. The first call is also the backend's audition:
   *  a pass that compiled but cannot draw throws here and the next backend gets its turn. */
  const drawOnce = (pass: Pass, seconds: number): void => {
    state.pack(seconds)
    pass.draw()
    qa.frames++
  }

  let pass: Pass | null = null
  if (!skipWebGpu) {
    try {
      const p = await createWebGpuPass(canvas, data, state)
      drawOnce(p, still ? STILL_SECONDS : 0)
      pass = p
      qa.backend = 'webgpu'
    } catch {
      pass = null
      qa.frames = 0
    }
  }
  if (!pass) {
    try {
      const p = createWebGl2Pass(canvas, data, state)
      drawOnce(p, still ? STILL_SECONDS : 0)
      pass = p
      qa.backend = 'webgl2'
    } catch {
      pass = null
      qa.frames = 0
    }
  }

  canvas.dataset.backend = qa.backend
  applyLabels(labelStateOf(qa.backend, still))

  /** Everything that happens in one tick when this mount stops drawing. `dispose()` has
   *  already put the canvas back on the fallback ground; this moves `data-backend` and
   *  rewrites every string that named the backend that is gone, a stale image under a live
   *  backend name is the lie the asymmetric-backend row exists to prevent . */
  const degrade = (): void => {
    qa.backend = 'none'
    canvas.dataset.backend = 'none'
    applyLabels('none')
  }

  const handle = (stop: () => void): MountedShader => {
    const mounted: MountedShader = {
      get backend() {
        return qa.backend
      },
      get frames() {
        return qa.frames
      },
      stop,
    }
    // The per-element handle is the census source , so the runtime parks it rather
    // than trusting each host to.
    canvas.__shader = mounted
    return mounted
  }
  if (!pass) return handle(() => {})
  const live = pass
  // Still: one frame is drawn and that is the whole contract, no loop, and no observers
  // either, since a resize redraw would be frame two .
  if (still) {
    return handle(() => {
      live.dispose()
      degrade()
    })
  }

  let stopped = false
  let raf = 0
  let running = false
  let visible = true
  let seconds = 0
  let last = 0

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick)
    seconds += (now - last) / 1000
    last = now
    // A driver that fails mid-flight must not spray the console: stop, go transparent, and
    // relabel, `stop()` does all three.
    try {
      drawOnce(live, seconds)
    } catch {
      stop()
    }
  }
  const start = (): void => {
    if (running || stopped) return
    running = true
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  const pause = (): void => {
    if (!running) return
    running = false
    cancelAnimationFrame(raf)
  }
  function stop(): void {
    if (stopped) return
    stopped = true
    pause()
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', sync)
    live.dispose()
    degrade()
  }
  const sync = (): void => {
    if (stopped) return
    if (visible && !document.hidden) start()
    else pause()
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true
    sync()
  })
  io.observe(canvas)
  document.addEventListener('visibilitychange', sync)
  // The drawing buffer follows the CSS box from here instead of a per-frame layout read. A
  // paused canvas needs the extra redraw to look right; a running one gets one anyway.
  const ro = new ResizeObserver(() => {
    if (stopped) return
    const changed = state.resize()
    if (!changed || running) return
    try {
      drawOnce(live, seconds)
    } catch {
      stop()
    }
  })
  ro.observe(canvas)
  live.onLost(stop)

  sync()
  return handle(stop)
}
