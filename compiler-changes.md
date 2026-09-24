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
  reference's constructors family, handled in #PR.
- 0012: a `"use typeshade"` directive after another statement is `TS8069`: its error-code page
  with a trigger and a fix, and the `TS8001` line, which now means no directive at all, in both
  locales, handled in #PR.
- 0014: `console` calls reach the host from WebGPU under `console: 'gpu'`: the Playground's
  Console tab fed by the CPU run's sink and by the WebGPU run's decoded console buffer (and the
  f32 rounding the CPU run's storage inputs were missing), the `gpu-console` example in the
  gallery, the picker and the Korean blurbs, a `TS8071` page compiled with the option, a Console
  category in the API reference, and glossary terms kept apart from the driver log, handled in
  #PR.
