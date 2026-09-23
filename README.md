<p align="center">
  <a href="https://typeshade.dev/">
    <img height="112" src="./public/favicon.svg" alt="TypeShade">
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

| Path                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `typeshade/`           | TypeShade compiler and language implementation        |
| `typeshade.github.io/` | Documentation site, examples, and generated reference |
| `.github/`             | CI and repository automation                          |

The documentation site is built with Astro and deployed to GitHub Pages. The compiler is vendored as a git submodule so examples and generated API documentation can be checked against a pinned compiler revision.

## Development

```bash
git clone --recurse-submodules https://github.com/typeshade/typeshade.github.io
cd typeshade.github.io
bun install
bun run dev
```

The production build verifies generated artifacts, documentation consistency, links, and SEO before deployment. See `DESIGN.md` for the site's writing and design rules and `.claude/skills/typeshade-site/SKILL.md` for the site maintenance workflow.

## Checks

`bun run format:check` runs first in CI, and `bun run format` fixes what it reports: Prettier over the TypeScript, CSS, JSON and Markdown, then `scripts/astro-semicolons.ts`, which writes the `;` in each component's frontmatter and `<script>`. Prettier leaves `.astro` files alone, because Astro keeps the whitespace written between tags and a reformatted component renders differently.

`bun run build` runs, in order:

- `check-style`: the voice rules in `DESIGN.md`, over `src/`, `scripts/` and the Markdown files, and that `src/styles/global.css` names only shared classes (DESIGN.md, Styling).
- `check-copy`: numerals, links and code spans equal in English and Korean; label widths.
- `check-i18n`: every string in the dictionaries, every locale URL through `localePath()`, no Hangul or locale literal outside `src/i18n/`, route parity between `src/pages` and `src/pages/ko`, one-line route files.
- `check-guide`: the Korean guide translations against the pinned English.
- `check-api`: the reference data from the compiler.
- The artifact hashes, the Korean font coverage, then Astro and Pagefind.

After the build: `bun run qa:seo`, `bun run qa:links` and `bun run qa:openseo` over `dist/`.

On a pull request, CI also checks what a compiler bump owes the site. The check runs `scripts/downstream-impact.ts` from the pinned compiler. It fails while a page, a component or a script still names an export or a file that the new pin removes. It also fails while a compiler change proposal that the new pin implements names this site and `compiler-changes.md` does not record its id. It also fails while a compiler `LINT.ThenChange(//typeshade.github.io/…)` target has not changed with its block. The site's own `LINT.IfChange` pairs are checked by the compiler's `scripts/ifchange.ts`. The compiler's `AGENTS.md` describes the convention.

## Status

TypeShade is pre-release. The public authoring model on `main` is file-level `"use typeshade"`; package and compiler details may change while the language surface matures.

## License

TypeShade is released under the MIT License.
