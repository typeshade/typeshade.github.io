# Compiler changes this site has handled

A change to the compiler that alters what this site shows is agreed first as a proposal in the
compiler's `changes/` directory (the compiler's `changes/README.md` explains the process). Each
proposal lists, under `downstream`, the work it will owe this repository.

When a pull request moves the compiler pin (`vendor/shader-dsl`) past a proposal that names
`typeshade.github.io`, `scripts/downstream-impact.ts` fails the pull request until the proposal's
work is done on that branch and its id is recorded below. Record one list item per proposal: the
id first, then the pull request that did the work.

- 0001: a `for` loop takes a runtime bound and `while` is an open loop: the constructs page,
  the TS8006 and TS8007 copy and the TS8006 example, handled in #60.
- 0005: an array's `map`, `forEach`, `some`, `every` and `reduce` compile: the control-flow page's
  loop copy and its item on array methods (en and ko), and the array-methods example in the
  gallery, the Playground picker, the stills and the Korean blurbs, handled in #77.
- 0006: a storage binding's access mode is its second type argument: every
  `declare let x: storage<T>` the site shows, the resources page's access table and its copy,
  the uniform refusal line in both locales, the other copy that tied `let` to a writable binding, and the
  target-mapping type probes, handled in #77.
- 0007: a `switch` case body that would fall through is refused (`TS8017`), and the vector types
  are interfaces whose members include the swizzles: the control-flow page's switch row and the
  from-WGSL statements note in both locales, and the language reference, which reads an
  interface and folds its swizzles into one line, handled in #82.
- 0011: WGSL's `matCxRf` aliases are types and constructors: the nine names join the language
  reference's constructors family, handled in #83.
- 0012: a `"use typeshade"` directive after another statement is `TS8069`: its error-code page
  with a trigger and a fix, and the `TS8001` line, which now means no directive at all, in both
  locales, handled in #83.
- 0014: `console` calls reach the host from WebGPU under `console: 'gpu'`: the Playground's
  Console tab fed by the CPU run's sink and by the WebGPU run's decoded console buffer (and the
  f32 rounding the CPU run's storage inputs were missing), the `gpu-console` example in the
  gallery, the picker and the Korean blurbs, a `TS8071` page compiled with the option, a Console
  category in the API reference, and glossary terms kept apart from the driver log, handled in
  #83.
- 0009: ordinary TypeScript can import callable `.shade.ts` exports through the generated host view; the site-facing host-import copy and documentation are updated in #89.
- 0019: the Playground Console pane supports `console.table` events and the related method copy/checks are updated in #89.
- 0020: the class-builder documentation follows the compiler's `this`-parameter spelling in #89.
- 0008: a diagnostic says what the program is: the `TS8012` example goes, since its trigger is
  `TS8022` now, and its page says the number is retired, as `TS8011`'s does, once the registry
  reads "8011 and 8012 are retired"; no copy quoted a message with `struct:`, `vec3<f32>` or
  the `new` sentences, and the error-code pages compile their triggers at the pin, handled in
  #97.
- 0022: a shader file imports another: the `TS8004` page's fix imports the function from the
  file that declares it, a new `TS8072` page with a trigger and a fix, each showing the file it
  imports, in both locales; the copy that called a file a compilation unit or the whole
  program; the gallery's build-time compile and the Playground's language worker read an
  import through `readDocument`, and the toolbar names the file an example imports; the
  language service page names `readDocument` and `resolveImport`; the `imported-noise` example
  in the gallery, the picker and the Korean blurbs; and the Korean guide's two new sections,
  handled in #97.
- 0016: a host file calls a `@compute` entry and draws a full-screen `@fragment` entry, so the
  import the site held back is shown with its GPU call: the WebGPU and WebGL2 concept page's
  lead, ownership table and runtime section, and a new section on importing a module; the
  familiar-concepts row on Web APIs and the paragraph on where WebGPU fits; a front-page row for
  the host call; and the quick start's host section, which compiles the file today and imports
  it from 0.1.0 (the Vite plugin, the two `tsconfig.json` lines, `tshc sync` in `prepare`, and a
  host file that draws `hello.shade.ts`), in both locales, handled in #104.
- 0023: the command is `tshc`: the Korean translation of the guide section The CPU oracle, read
  again at the pin, and the quick start's import setup, which runs `tshc sync`, handled in #104.
- 0013: a loop that runs as a kernel: the control-flow page gains the kernel function, the
  proof's rules in one paragraph and the `TS8070` warning (en and ko); the WebGPU and WebGL2
  concept page's runtime copy gains the tiers, `configure({ prefer })` and `Resident`; the four
  loop examples, their gallery group, picker rows, Korean blurbs and the API reference's Runtime
  category came with #97, handled in #113.
- 0024: a shader module imports a package's by the package's name: the language service page's
  paragraph on imports (en and ko) names packages and the `package.json` reads; the Korean guide
  section The CPU oracle translated again from the pinned AUTHORING.md; the `TS8072` page reads
  the registry's sentences; the Playground has no `node_modules`, so it needs nothing, handled in
  #113.
- 0026: an example drawn in several passes: `src/lib/shader-runtime.ts` draws a pass list into
  canvas-sized `rgba16float` textures on WebGPU and WebGL2 (`RGBA8` where WebGL2 cannot render
  to floats, which the Playground's note says), two a pass, so a reader gets this frame's output
  of an earlier pass and the frame before's of itself or a later one; the live-shader contract
  gains `frame` and `timeDelta`, restated in DESIGN.md; the Playground draws a workspace file as
  a pass from the Pass toggle on its tab, opens an example's passes on, shows a texture named
  like a pass as its output in the bindings panel, shows a pass's own emit on its tab, carries
  the graph in the link and clears it on Restart; the CPU oracle draws the passes in order at
  frame 0; separable-blur and feedback-trail join the gallery, the picker, the Korean titles
  and lines and the stills (a still of a program with passes is the frame after a second of
  them); check-playground opens both on every engine, handled in #117.
- 0027: WebGL2 gives WGSL's answer for integer division, remainder and shift, and for a float's
  conversion to an integer: the Korean guide's values-and-mutation section says a float converts
  the same way on every target, through `_f2i` and `_f2u` on GLSL (Rule 11.12); no page shows
  GLSL's spelling of an integer operator, handled in #124.
- 0031: value parameters can be reassigned without changing the caller's value: the functions
  copy and a compiled parameter reassignment row (en and ko), and the TS8018 trigger now
  demonstrates a write to a temporary component, handled in #132.
- 0032: legal TypeScript variable and parameter names are escaped for a shader backend: the
  functions scope guidance (en and ko) follows surface section 62, while the TS8068 struct-field
  trigger keeps the remaining interface naming restriction, handled in #132.
- 0035: fieldless classes can be constructed and have methods: the class boundary copy and a
  compiled method-only class row (en and ko) explain the empty host object and internal GPU
  storage footprint. The TS8010 missing-field and TS8035 static-block examples still describe
  their remaining refusals, handled in #132.
- 0036: a direct declared nongeneric function argument can determine an integer-written local's
  scalar type: the integer-literal mapping row and its en/ko guidance describe integer demand,
  conflicting demands and the unchanged f32 default. Playground diagnostic regressions cover
  inference and disagreement, handled in #132.
- 0025: the WebGPU render and compute runners load compiled manifests into the public program
  runtime and bind resources by name, while the site keeps its WebGL2 path. Build-time,
  edited live and Playground payloads carry their manifests. Frame and pixel console captures
  use the runtime sink and keep source events; the API reference includes `typeshade/emit`
  and `repack` beside the runtime pages and concept guidance introduced in #125, handled in #132.
- 0028: render overrides use `RenderState.constants` and compute overrides use the pipeline's
  `constants`; console captures read dropped-call counts from `Frame.submit()`. Playground
  manifests are packed under the reader's emit options. English and Korean program-loading
  guidance explains overrides, console counts and the optional load-time emitter; focused
  regressions and browser probes check the migrated execution, handled in #132.
- 0037: integer-written locals take concrete declared demands from constructors, methods,
  typed initializers and simple assignments. The compiled mapping and English/Korean numeric
  guidance explain the contexts and unchanged conflict/default policy. Compiler/editor tests
  check constructor and method calls, assignment and hover agreement.
- 0038: a derived material may supply a proved read-only, dispatch-equivalent base view.
  The compiled class mapping and English/Korean class guidance explain accepted views and
  remaining override, receiver-write and alias-mutation limits. Compiler/editor fixtures
  accept the material view and retain the unsafe-override diagnostic.
- 0039: parameters and body locals may shadow module values while closures resolve the
  nearest declaration. The compiled function mapping and English/Korean scope guidance explain
  lexical shadowing and same-scope duplicate errors; focused fixtures check both behaviors.
- 0040: a parameter declared `Ref<T>` names the caller's variable, passed as `ref(x)`: the
  functions guide's parameters section and its sample, the reference-parameter and alias
  cards on the TypeScript mapping page with the WGSL they emit and the `TS8074` refusal, the
  parameter-reassignment card, the Korean translation of the authoring guide's new section,
  the glossary row, `ref` in the language reference, and the reference-parameters example in
  the gallery, the Playground picker, the stills and the Korean blurbs.
