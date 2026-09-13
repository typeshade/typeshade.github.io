<p align="center">
  <a href="https://typeshade.dev/">
    <img height="112" src="./public/apple-touch-icon.png" alt="TypeShade">
  </a>
</p>

# TypeShade

**TypeScript for shaders.**

TypeShade lets you author shader programs in TypeScript with a TypeShade-specific language model. A source file opts into that model with the file-level directive `"use typeshade"`.

```ts
"use typeshade";

export function fragment(uv: vec2): vec4 {
  return vec4(uv, 0.0, 1.0);
}
```

The compiler lowers the source to an intermediate representation and emits shader source for the host. The current targets are WGSL for WebGPU and GLSL ES 3.00 for WebGL2. **There is no TypeShade runtime.**

## Why TypeShade?

Shader authoring should keep the parts developers already know from TypeScript: types, editor feedback, modules, and familiar control flow, while making GPU-specific rules explicit.

TypeShade is designed around that boundary:

- **TypeScript authoring:** write shader code in a familiar editor environment.
- **TypeShade semantics:** `"use typeshade"` marks the file as a shader compilation unit instead of ordinary application code.
- **Static diagnostics:** invalid shader operations are reported before the host runs the program.
- **Multiple targets:** one source model can emit WGSL or GLSL for the supported hosts.
- **No runtime layer:** the host consumes the emitted shader source directly.

## Learn

Start with the documentation site:

- [Introduction](https://typeshade.dev/guide/introduction/)
- [Quick start](https://typeshade.dev/guide/quick-start/)
- [Authoring / language guide](https://typeshade.dev/guide/authoring/)
- [API reference](https://typeshade.dev/api/)
- [Examples](https://typeshade.dev/guide/examples/)

The important concept to understand first is **`"use typeshade"`**. It is the boundary between ordinary TypeScript and TypeShade's shader authoring semantics.

## Repository layout

| Path | Purpose |
| --- | --- |
| `typeshade/` | TypeShade compiler and language implementation |
| `typeshade.github.io/` | Documentation site, examples, and generated reference |
| `.github/` | CI and repository automation |

The documentation site is built with Astro and deployed to GitHub Pages. The compiler is vendored as a git submodule so examples and generated API documentation can be checked against a pinned compiler revision.

## Development

```bash
git clone --recurse-submodules https://github.com/typeshade/typeshade.github.io
cd typeshade.github.io
bun install
bun run dev
```

The production build verifies generated artifacts, documentation consistency, links, and SEO before deployment. See `DESIGN.md` for the site's writing and design rules and `.claude/skills/typeshade-site/SKILL.md` for the site maintenance workflow.

## Status

TypeShade is pre-release. The public authoring model on `main` is file-level `"use typeshade"`; package and compiler details may change while the language surface matures.

## License

TypeShade is released under the MIT License.
