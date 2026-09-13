import { readFileSync, writeFileSync } from 'node:fs'

const file = 'src/lib/api.ts'
const source = readFileSync(file, 'utf8')
const marker = "  'src/core/ir/builder.ts': 'authoring',"
const additions = [
  "  'src/compiler/ts/compile.ts': 'authoring',",
  "  'src/compiler/ts/source-file.ts': 'authoring',",
  "  'src/compiler/ts/directive.ts': 'authoring',",
].join('\n') + '\n'

if (source.includes("'src/compiler/ts/compile.ts': 'authoring'")) {
  console.log(`API authoring categories already patched: ${file}`)
} else if (source.includes(marker)) {
  writeFileSync(file, source.replace(marker, additions + marker))
  console.log(`patched ${file}: classified TypeScript authoring exports`)
} else {
  throw new Error(`[api] could not find CATEGORY_BY_FILE insertion marker in ${file}`)
}
