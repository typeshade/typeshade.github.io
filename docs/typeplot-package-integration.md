# TypePlot package integration

## Scope

- Baseline: `2ea4efff78e7fab08346e1610e1f0edc05e19ea1` (site main).
- Compiler pin: `91c2fe31de045ebf0e5f2c333ac98b95cc460280`, unchanged.
- TypePlot review dependency: `typeshade/typeplot#1`, commit `099c252cc3257ead0bedc22d41e4412cb9e9ec51`.
- Install the independent package from its pinned Git commit.
- Import the shared shader documents and plot interaction controller through package subpaths.
- Keep the site's renderer, lazy compiler, controls, source editor and Playground project transport.
- Remove the duplicated local shader and interaction controller.
- Preserve current article copy, dimensions, navigation and visual behavior.

## Verification

Implementation and verification pending. Required checks cover formatting, TypeScript, the production build, SEO and links, compiler edit parity, and actual WebGPU/WebGL2 plot interactions. No merge is authorized for this integration PR.
