// Compiles every fragment the front page shows (src/lib/landing-fragments.ts) with the pinned
// compiler and fails on a diagnostic, so the page never shows source the compiler refuses.
// Run: bun scripts/check-landing-fragments.ts (part of bun run build).
import { compile } from '../vendor/shader-dsl/src/compiler/ts/compile.ts'
import { compileTsSources } from '../vendor/shader-dsl/src/compiler/ts/module.ts'
import { landingFragments } from '../src/lib/landing-fragments.ts'

let problems = 0
for (const f of landingFragments) {
  const files = Object.entries(f.files).map(([fileName, source]) => ({ fileName, source }))
  // One file goes through compile(), the path every registered example and the Playground take;
  // a fragment with an import goes through the multi-file entry point.
  const r = files.length === 1 ? compile(files[0]!.source, { fileName: files[0]!.fileName }) : compileTsSources(files, f.show)
  const errors = r.diagnostics.filter((d) => d.category !== 'warning')
  for (const d of errors) {
    problems++
    console.error(`  ${f.id}: ${d.fileName ?? f.show}:${d.line}:${d.character} ${d.code} ${d.message}`)
  }
  if (errors.length === 0 && !r.wgsl) {
    problems++
    console.error(`  ${f.id}: compiled with no WGSL`)
  }
}
if (problems > 0) {
  console.error(`check-landing-fragments: ${problems} problem(s)`)
  process.exit(1)
}
console.log(`check-landing-fragments: ${landingFragments.length} fragments compile`)
