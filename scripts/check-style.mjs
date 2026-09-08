// Flags writing patterns this site does not use, in page source and in Markdown. The list
// is in DESIGN.md. A line ending in `<!-- ok -->` is skipped. Run: bun run check:style
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const SCAN_DIRS = ['src', 'scripts']
const SCAN_FILES = ['README.md', 'DESIGN.md']
const EXT = new Set(['.astro', '.ts', '.mjs', '.md', '.css'])

const RULES = [
  { name: 'em dash', re: /—/ },
  { name: '"X, not Y" contrast', re: /,\s+not\s+(?:a|an|the|to|by|of|in|as|from|about)\b/i },
  { name: '"X, never Y" contrast', re: /,\s+never\s+(?:a|an|the|to|by|of|in|as|from)\b/i },
  { name: '"rather than" contrast', re: /\brather than\b/i },
  { name: 'all-caps emphasis', re: /(?<![A-Z_#\-])\b(ONE|NEVER|NOT|SAME|BOTH|ONLY|FIRST|EVERY|EXACTLY|MUST|ALL|IS|ARE)\b(?![A-Z_\-])/ },
  { name: 'self-praise word', re: /\b(honest(?:ly|y)?|verbatim|ratified|load-bearing|injective|of record|deliberately|seamless(?:ly)?|blazing|effortless(?:ly)?|robust)\b/i },
  { name: 'uppercase label', re: /text-transform:\s*uppercase|\buppercase\b/ },
  { name: 'middle-dot metadata', re: /\S\s·\s\S/ },
  { name: 'font on the avoid list', re: /\b(Inter|Geist|Space Grotesk|Instrument Serif|Poppins)\b/ },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.astro' || name === 'vendor') continue
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (EXT.has(path.extname(p))) out.push(p)
  }
  return out
}

const files = [
  ...SCAN_DIRS.flatMap((d) => walk(path.join(root, d))),
  ...SCAN_FILES.map((f) => path.join(root, f)),
].filter((f) => !f.endsWith('check-style.mjs') && !f.endsWith('check-http-links.mjs'))

const hits = []
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (line.includes('<!-- ok -->')) return
    for (const rule of RULES) {
      if (rule.re.test(line)) hits.push(`${path.relative(root, file)}:${i + 1}  ${rule.name}: ${line.trim().slice(0, 100)}`)
    }
  })
}

if (hits.length > 0) {
  console.error(`check-style: ${hits.length} hit(s)\n` + hits.join('\n'))
  process.exit(1)
}
console.log(`check-style: ${files.length} files clean`)
