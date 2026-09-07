// ═══ verify the section-4 typed-error proof — `bun run scripts/verify-typed-error.ts` ═══
//
// Astro does not build `scripts/`, so this stays out of the site. It calls the same
// `typedError()` the page frontmatter calls and asserts what a reader is entitled to assume:
//
//   1. the diagnostic is the real TypeScript property error (TS2339) at the snippet's wrong line;
//   2. the control arm is clean — proven inside typedError(), which throws otherwise, and
//      re-proven here by running the control snippet's own module through reflect();
//   3. the layout obeys std140: vec2 on 8, vec3/vec4 and structs on 16, each field's offset is
//      its own alignment's multiple, offsets ascend without overlap, and the block size is a
//      multiple of 16.
//
// Exit code is the verdict; every assertion prints what it compared.

import { typedError } from '../src/lib/typed-error.ts'

const EXPECTED_CODE = 2339 // TS2339 — "Property 'x' does not exist on type 'y'"

/** std140 base alignment, in bytes, for the DSL type keys a uniform block can hold. */
function std140Align(type: string): number {
  if (/^(f32|i32|u32|bool)$/.test(type)) return 4
  if (/^vec2</.test(type)) return 8
  if (/^vec[34]</.test(type)) return 16
  if (/^mat/.test(type)) return 16
  if (/^array</.test(type)) return 16
  return 16 // struct
}

let failures = 0
function check(ok: boolean, label: string, detail: string): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} — ${detail}`)
  if (!ok) failures++
}

const t0 = performance.now()
const r = typedError()
const firstCall = (performance.now() - t0) / 1000
const t1 = performance.now()
typedError()
const secondCall = (performance.now() - t1) / 1000

console.log('── snippet (as the page prints it, wrong line marked ►) ──')
r.snippet.split('\n').forEach((l, i) => {
  console.log(`${i + 1 === r.wrongLine ? '►' : ' '} ${String(i + 1).padStart(2)} | ${l}`)
})

console.log('\n── diagnostic (from the real TypeScript compiler) ──')
console.log(`TS${r.diagnostic.code} at line ${r.diagnostic.line}, column ${r.diagnostic.column}` +
  `${r.diagnostic.truncated ? ' (message truncated)' : ''}`)
console.log(r.diagnostic.message)

console.log('\n── control arm (the corrected snippet) ──')
console.log(r.fixed.snippet)
console.log('typedError() threw nothing, so the control arm type-checked with 0 diagnostics.')

console.log(`\n── std140 layout of ${r.layout.struct} (from reflect(), ${r.layout.size} bytes) ──`)
console.log('| field | type | offset | size |')
console.log('| --- | --- | ---: | ---: |')
for (const f of r.layout.fields) console.log(`| ${f.name} | \`${f.type}\` | ${f.offset} | ${f.size} |`)

console.log(`\n── cost ──`)
console.log(`type-check (first call): ${firstCall.toFixed(2)} s  ·  measured inside typedError(): ` +
  `${r.typeCheckSeconds.toFixed(2)} s  ·  memoized second call: ${secondCall.toFixed(4)} s`)

console.log('\n── assertions ──')
check(r.diagnostic.code === EXPECTED_CODE, 'diagnostic code',
  `TypeScript reported TS${r.diagnostic.code}; expected TS${EXPECTED_CODE}`)
check(/^Property '\w+' does not exist on type /.test(r.diagnostic.message), 'diagnostic text',
  `message starts with the TS2339 form: ${JSON.stringify(r.diagnostic.message.slice(0, 60))}…`)
check(r.diagnostic.line === r.wrongLine, 'diagnostic line',
  `diagnostic.line ${r.diagnostic.line} === wrongLine ${r.wrongLine}`)
check(r.snippet.split('\n')[r.wrongLine - 1]!.includes('colour'), 'wrongLine points at the wrong field',
  `line ${r.wrongLine} is ${JSON.stringify(r.snippet.split('\n')[r.wrongLine - 1]!.trim())}`)
check(r.snippet.split('\n').length <= 8, 'snippet length',
  `${r.snippet.split('\n').length} lines, cap is 8`)
check(!r.fixed.snippet.includes('colour') && r.fixed.snippet.includes('U.field.top'), 'control arm differs',
  'fixed.snippet reads U.field.top, snippet reads U.field.colour')
check(secondCall < firstCall / 10, 'memoized within a build',
  `second call ${secondCall.toFixed(4)} s vs first ${firstCall.toFixed(2)} s`)

check(r.layout.fields.length > 0, 'layout populated', `${r.layout.fields.length} fields from reflect()`)
let cursor = 0
for (const f of r.layout.fields) {
  const align = std140Align(f.type)
  check(f.offset % align === 0, `std140 alignment of '${f.name}'`,
    `offset ${f.offset} is a multiple of ${align} (${f.type})`)
  check(f.offset >= cursor, `std140 ordering of '${f.name}'`,
    `offset ${f.offset} >= end of previous field (${cursor})`)
  cursor = f.offset + f.size
}
check(r.layout.size % 16 === 0 && r.layout.size >= cursor, 'std140 block size',
  `${r.layout.size} is a multiple of 16 and covers the last field (ends at ${cursor})`)
const vec4s = r.layout.fields.filter((f) => f.type.startsWith('vec4<'))
check(vec4s.length > 0 && vec4s.every((f) => f.offset % 16 === 0), 'vec4 fields are 16-byte aligned',
  vec4s.map((f) => `${f.name}@${f.offset}`).join(', ') || 'none present')

console.log(`\n${failures === 0 ? 'OK — all assertions passed' : `${failures} assertion(s) FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
