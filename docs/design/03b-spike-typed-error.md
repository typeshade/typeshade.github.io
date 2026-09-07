# Technical spike — the typed error and the reflected layout (2026-09-07)

`02-messaging.md` §6 section 4 claims a wrong field is a type error while you type, and that uniform layouts come from
`reflect()` so no offset is hand-derived. The brief forbids typing either into the page, so both are computed at build time
— the diagnostic by the real `typescript` compiler, the layout by the pinned mirror's `reflect()`.

| File | Role |
| --- | --- |
| `src/lib/typed-error-shader.ts` | The authored fragment, once — its TEXT is the snippet (between `// #region snippet` … `// #endregion snippet`), its MODULE is what `reflect()` reads. One fixture rather than a snippet string beside a hand-built module, so the printed snippet, the type-checked arm and the reflected module are the same bytes and cannot drift. |
| `src/lib/typed-error.ts` | Build-time only. Reads that text, type-checks two arms of it, returns the proof. Memoized per build. |
| `scripts/verify-typed-error.ts` | `bun run scripts/verify-typed-error.ts` — prints and asserts the three outputs. Astro does not build `scripts/`. |

## What it does

`typedError()` extracts the snippet region and substitutes its one `U.field.top` read for `U.field.colour`. One
`ts.createProgram` — project `tsconfig.json` options (`strict`, `allowImportingTsExtensions`, bundler resolution) plus
`noEmit` / `skipLibCheck` / `isolatedModules: false` / `types: ['@webgpu/types']` — holds **both** arms as in-memory files
at real paths inside `src/lib/`, so the fixture's import of `vendor/shader-dsl/src/index.ts` resolves as it does on disk
and one checker judges both. Per arm: `getPreEmitDiagnostics(program, file)`.

The instrument is gated, not trusted: the build fails if the control arm reports anything, or the wrong arm reports
nothing. Both gates were cut and each named its own half — `WRONG_READ` aimed at an existing field gave *"the WRONG arm
… produced no diagnostic — the type-check cannot tell a broken shader from a correct one"*, a planted type error gave
*"the CONTROL arm … must type-check clean; got 1: TS2322…"*. The second earned itself at once: the first draft substituted
over the whole file, hit the same string in a header comment, and left both arms identical and clean. Three further
guards — the region exists, the snippet is ≤ 8 lines (the brief's cap, enforced not remembered), and `U.field.top` occurs
in it exactly once.

## The diagnostic obtained — TS2339, snippet line 7, column 47

```
Property 'colour' does not exist on type '{ readonly time: ReadonlyNode<"f32">; readonly top: ReadonlyNode<"vec4<f32>">; readonly bottom: ReadonlyNode<"vec4<f32>">; }'.
```

161 characters on one line, under the 300-char cap, so `diagnostic.truncated` is `false`. Past the cap only the first line survives and the flag is set — render the flag, never a silently shortened message.

## The layout — `reflect(gradientModule).uniforms[0]`, std140, 48 bytes, align 16

| field | type | offset | size |
| --- | --- | ---: | ---: |
| `time` | `f32` | 0 | 4 |
| `top` | `vec4<f32>` | 16 | 16 |
| `bottom` | `vec4<f32>` | 32 | 16 |

The 12 padding bytes after `time` are the argument: a hand-derived table would put `top` at 4.

## Build-time cost

`bun run build`, three runs each — **before** (nothing imports it) 3.41 / 3.46 / 3.50 s; **with `typedError()` called
from a page's frontmatter** 4.64 / 4.67 / 4.63 s. **+1.18 s**, of which 0.83 s is the type-check (`typeCheckSeconds`)
and the rest is Vite resolving `typescript`. Under the ~8 s budget, so nothing was traded away: `skipLibCheck`, a two-root program and one program shared by both arms were in the first draft; the memo holds it at one type-check per build.

## How a page component renders it

Both marker forms were built and verified in the emitted HTML (`ec-line highlight mark` / `… ins`), with `const te = typedError()` in the frontmatter:

```astro
<Code code={te.snippet} lang="ts" meta={`{${te.wrongLine}}`} title="gradient.ts" />
<p class="diagnostic" role="note">TS{te.diagnostic.code} · line {te.diagnostic.line}:{te.diagnostic.column} — {te.diagnostic.message}</p>
<Code code={te.fixed.snippet} lang="ts" ins={[te.wrongLine]} />
```

The annotation is real text under the frame, never an image or a tooltip — the message is the proof, so it must survive a
screen reader. Beside it the layout as a four-column table (`field · type · offset · size`) captioned `reflect() · std140
· 48 bytes`, every cell from `te.layout`; never collapse the offset column, the padding is the point.

## API

```ts
typedError(): {
  snippet: string            // the ≤ 8-line fragment, with the wrong field read
  wrongLine: number          // 1-based line of that read within `snippet`
  diagnostic: { code: number; message: string; line: number; column: number; truncated: boolean }
  fixed: { snippet: string } // the same fragment, correct; proven to give 0 diagnostics
  layout: { struct: string; size: number; fields: { name; type; offset; size }[] }
  typeCheckSeconds: number
}
```

`diagnostic.line` equals `wrongLine` (snippet-relative), `column` is 1-based in that line. Throws on every failure above.
