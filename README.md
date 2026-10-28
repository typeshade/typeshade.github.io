<p align="center">
  <a href="https://typeshade.dev/">
    <img height="112" src="./public/favicon.svg" alt="TypeShade">
  </a>
</p>

# TypeShade

**TypeScript for shaders.**

> This repository preserves the website's earlier source and history. Active website
> development, issues, and pull requests belong in [typeshade/web](https://github.com/typeshade/web).
> Do not add new site features or maintenance changes here.

TypeShade lets you author shader programs in TypeScript with a TypeShade-specific language model. A source file opts into that model with the file-level directive `"use typeshade"`.

```ts
"use typeshade";

export function fragment(uv: vec2): vec4 {
  return vec4(uv, 0.0, 1.0);
}
```

The compiler lowers the source to an intermediate representation and emits shader source for the host. The current targets are WGSL for WebGPU and GLSL ES 3.00 for WebGL2. The compiled program can run through `typeshade/runtime` on WebGPU and WebGL2. Supported `@compute` entries also run on the WebGL2 tier through GLSL ES 3.00 passes.

## Why TypeShade?

Shader authoring should keep the parts developers already know from TypeScript: types, editor feedback, modules, and familiar control flow, while making GPU-specific rules explicit.

TypeShade is designed around that boundary:

- **TypeScript authoring:** write shader code in a familiar editor environment.
- **TypeShade semantics:** `"use typeshade"` marks the file as a shader file instead of ordinary application code. The file compiles with the shader files it imports as one program.
- **Static diagnostics:** invalid shader operations are reported before the host runs the program.
- **Multiple targets:** one source model can emit WGSL or GLSL for the supported hosts.
- **Two ways into a host:** the host consumes the emitted shader source directly, or imports the module through the Vite plugin and calls its entry points, which `typeshade/runtime` runs on WebGPU, WebGL2 or the CPU.

## Learn

Start with the documentation site:

- [Introduction](https://typeshade.dev/guide/introduction/)
- [Why TypeShade](https://typeshade.dev/guide/why/)
- [Quick start](https://typeshade.dev/guide/quick-start/)
- [Authoring / language guide](https://typeshade.dev/guide/authoring/)
- [API reference](https://typeshade.dev/api/)
- [Examples](https://typeshade.dev/guide/examples/)

The important concept to understand first is **`"use typeshade"`**. It is the boundary between ordinary TypeScript and TypeShade's shader authoring semantics.

## Repository status

The current website source is maintained in [typeshade/web](https://github.com/typeshade/web).
Use that repository for documentation, examples, site code, and deployment changes.

This repository keeps its existing source tree and Git history as a historical snapshot. Its
site build, compiler pinning, example publishing, and gallery setup workflows are retired here.
The site is no longer developed or deployed from this repository. See
[docs/repository-migration.md](docs/repository-migration.md) for the migration record and the
remaining cutover boundaries.

The old source is available for history and comparison. Its development instructions and
automation describe the previous site implementation and are not instructions for current work.

## Status

TypeShade is pre-release. The public authoring model on `main` is file-level `"use typeshade"`; package and compiler details may change while the language surface matures.

## License

TypeShade is released under the Apache License 2.0, and was released under the MIT License before that. The site states the license of the compiler commit it is pinned to, read from that commit's `package.json`. This repository is licensed under the Apache License 2.0 as well: see `LICENSE` and `NOTICE`.

## Device benchmarks

The English and Korean `/benchmarks/` pages run versioned WebGPU workloads in a browser
Worker. One run compares both exact compiler/runtime builds across every experiment and
correctness check. Four section charts show timing and buffer-memory changes. Visitors inspect
results from a visitor-initiated run. A notice below Run explains automatic reporting. The
site Worker stores authorized records privately in D1. See [docs/benchmarks.md](docs/benchmarks.md)
for retention, migration and maintainer commands, and
[docs/benchmark-unification.md](docs/benchmark-unification.md) for the unified report, and
[docs/benchmark-projection.md](docs/benchmark-projection.md) for the private input projection cohort.

`bun run check:benchmark-catalog` checks the retained original fixtures against their compiler.
`bun run check:regression-catalog` checks the unified workload against both exact builds.
After `bun run build`, `bun run check:benchmarks` runs the instrument, consent flow and local
D1 collector in Chromium. Set `PLAYWRIGHT_CHROMIUM` when Chromium is installed outside Playwright.
