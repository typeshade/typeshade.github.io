// Build-time facts, computed from the vendored mirror (vendor/shader-dsl = typeshade/typeshade).
// Every code sample and every number on the page comes from here, so the page cannot drift
// from what the compiler actually emits or contains.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { examples } from '../../vendor/shader-dsl/examples/index.ts'
import { emitModule, emitGlslModule } from '../../vendor/shader-dsl/src/index.ts'

const rawSources = import.meta.glob('../../vendor/shader-dsl/examples/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const sourceByFile = Object.fromEntries(
  Object.entries(rawSources).map(([p, src]) => [p.split('/').pop()!, src]),
)

/** The text between `from` (inclusive) and the first `to` after it (inclusive), else ''. */
function between(text: string, from: string, to: string): string {
  const a = text.indexOf(from)
  if (a < 0) return ''
  const b = text.indexOf(to, a + from.length)
  return b < 0 ? text.slice(a) : text.slice(a, b + to.length)
}

const ex = examples.find((e) => e.id === 'gradient')
if (!ex) throw new Error("example 'gradient' not in the mirror's registry")
const source = sourceByFile[ex.file] ?? ''
const wgsl = emitModule(ex.module)
const glsl = emitGlslModule(ex.module, 'fragment')

function css(v: readonly number[]): string {
  return `rgb(${v.slice(0, 3).map((c) => Math.round(c * 255)).join(' ')})`
}
const ctl = ex.controls as Record<string, { kind: string; value?: readonly number[] }>

/** The hero: one authored fragment function, the fragment it emits for each target, and the
 *  two colours it blends — all from the same example the docs render live. */
export const hero = {
  file: ex.file,
  authored: between(source, 'const fsGradient = fn(', '\n)'),
  wgsl: between(wgsl, '@fragment', '\n}'),
  glsl: between(glsl, 'void main()', '\n}'),
  top: ctl.top?.value ? css(ctl.top.value) : '#7dd3fc',
  bottom: ctl.bottom?.value ? css(ctl.bottom.value) : '#0b0f14',
}

const vendorRoot = path.resolve(process.cwd(), 'vendor/shader-dsl')
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.ts')) out.push(p)
  }
  return out
}
const srcFiles = walk(path.join(vendorRoot, 'src'))
const testFiles = srcFiles.filter((f) => f.endsWith('.test.ts'))
const srcLoc = srcFiles
  .filter((f) => !f.endsWith('.test.ts'))
  .reduce((n, f) => n + readFileSync(f, 'utf8').split('\n').length, 0)
function pinnedCommit(): string {
  try {
    return execSync('git -C vendor/shader-dsl rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export const facts = {
  examples: examples.length,
  fp64Examples: examples.filter((e) => e.id.startsWith('fp64')).length,
  testFiles: testFiles.length,
  srcLocRounded: `${Math.round(srcLoc / 1000)}k`,
  pinnedCommit: pinnedCommit(),
  packageName: JSON.parse(readFileSync(path.join(vendorRoot, 'package.json'), 'utf8')).name as string,
}
