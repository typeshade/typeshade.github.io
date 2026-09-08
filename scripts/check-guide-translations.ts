// Every translated guide section against its English source, before the build (bun run
// check:guide, part of bun run build). The reader (src/lib/guide-translations.ts) has already
// refused a file whose recorded hash is not the pinned section's. This script checks what a
// translation must keep and what it must not carry:
//   1. The fenced code blocks, byte for byte and in the same order; every inline code span of
//      the English present the same number of times; the same numerals; the same link targets;
//      the same number of headings.
//   2. Korean prose in 합쇼체 with no exclamation marks, none of the countable translation
//      tells the im-not-ai rulebook lists, and no five sentences in a row on the same ending.
//   3. No prose paragraph left in English.
import { guideSections } from '../src/lib/guide.ts'
import { guideTranslations, GUIDE_TRANSLATIONS_DIR } from '../src/lib/guide-translations.ts'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const SPAN_MAX = 120
const SAME_ENDING_STREAK = 5

type Problem = { file: string; what: string }
const problems: Problem[] = []

const blocks = (s: string): string[] => [...s.matchAll(/```[\s\S]*?```/g)].map((m) => m[0].trim())
const strip = (s: string): string => s.replace(/```[\s\S]*?```/g, '')
// A span may break across a line in the source; single newlines inside prose are spaces. A
// run longer than SPAN_MAX is a stray backtick, and is ignored on both sides.
const spans = (s: string): Map<string, number> => {
  const m = new Map<string, number>()
  for (const x of strip(s).replace(/\n(?!\n)/g, ' ').matchAll(/`([^`]+)`/g)) {
    const key = x[1].replace(/\s+/g, ' ')
    if (key.length > SPAN_MAX) continue
    m.set(key, (m.get(key) ?? 0) + 1)
  }
  return m
}
const numerals = (s: string): string => (strip(s).match(/(?<![A-Za-z\d.`])\d+(?:\.\d+)*(?![A-Za-z\d])/g) ?? []).sort().join(' ')
const linkTargets = (s: string): string => [...strip(s).matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort().join(' ')
const headings = (s: string): number => (strip(s).match(/^#{2,6}\s/gm) ?? []).length

const KO_TELLS: Array<{ name: string; re: RegExp; max: number }> = [
  { name: 'A-1 "~에 대해" three or more times', re: /에 대해/g, max: 2 },
  { name: 'A-2 "~를 통해" three or more times', re: /[를을] 통해/g, max: 2 },
  { name: 'A-3 "~에 있어"', re: /에 있어/g, max: 0 },
  { name: 'A-7 "가지고 있"', re: /가지고 있/g, max: 0 },
  { name: 'A-8 double passive', re: /되어지|지게 된/g, max: 0 },
  { name: 'A-9 "~에 의해"', re: /에 의해/g, max: 0 },
  { name: 'A-19 double particle', re: /에서의|으로의|에로의|에의 /g, max: 0 },
  { name: 'D signature phrase', re: /결론적으로|시사하는 바|주목할 만|다음과 같은|크게 .{1,3} 가지/g, max: 0 },
  { name: 'H-1 sentence-initial conjunction, three or more', re: /(?:^|\. )(?:또한|따라서|즉|나아가|아울러|게다가|더욱이)\b/g, max: 2 },
  { name: 'H-3 "이는" opening, three or more', re: /(?:^|\. )이는 /g, max: 2 },
]

function sameEndingStreak(prose: string): number {
  const sentences = prose.split(/(?<=[.!?])\s+/).map((t) => t.trim().replace(/[.!?]$/, '')).filter((t) => /[가-힣]$/.test(t))
  let best = 0, run = 0, last = ''
  for (const t of sentences) {
    const end = t.slice(-3)
    run = end === last ? run + 1 : 1
    last = end
    best = Math.max(best, run)
  }
  return best
}

const english = new Map(guideSections.map((s) => [s.id, s.body]))
const root = path.resolve(process.cwd(), GUIDE_TRANSLATIONS_DIR)
const locales = existsSync(root) ? readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []
let files = 0
for (const locale of locales) {
  for (const t of guideTranslations(locale).values()) {
    files += 1
    const en = english.get(t.id)!
    const ko = t.body
    const push = (what: string) => problems.push({ file: t.file, what })
    const eb = blocks(en), kb = blocks(ko)
    if (eb.length !== kb.length) push(`code blocks: ${eb.length} in English, ${kb.length} in the translation`)
    else eb.forEach((b, i) => { if (b !== kb[i]) push(`code block ${i + 1} differs from the English`) })
    const es = spans(en), ks = spans(ko)
    for (const [k, n] of es) if ((ks.get(k) ?? 0) < n) push(`code span \`${k}\` appears ${n} time(s) in English, ${ks.get(k) ?? 0} in the translation`)
    if (numerals(en) !== numerals(ko)) push(`numerals differ: English [${numerals(en)}], translation [${numerals(ko)}]`)
    if (linkTargets(en) !== linkTargets(ko)) push(`link targets differ: English [${linkTargets(en)}], translation [${linkTargets(ko)}]`)
    if (headings(en) !== headings(ko)) push(`headings: ${headings(en)} in English, ${headings(ko)} in the translation`)
    const prose = strip(ko).replace(/`[^`\n]*`/g, '')
    if (locale === 'ko') {
      for (const tell of KO_TELLS) {
        const n = (prose.match(tell.re) ?? []).length
        if (n > tell.max) push(`${tell.name} (${n})`)
      }
      const streak = sameEndingStreak(prose)
      if (streak >= SAME_ENDING_STREAK) push(`E-2 ${streak} sentences in a row end the same way`)
      if (/해요|어요|예요/.test(prose)) push('해요체 in prose')
    }
    if (/!/.test(prose.replace(/!=/g, ''))) push('an exclamation mark in prose')
    // CommonMark reads a closing ** only when no punctuation precedes it or nothing letter-like
    // follows it, and an opening ** only when no punctuation follows it or nothing letter-like
    // precedes it. English writes **`code`** and a space; a translation that glues a particle to
    // it (**`FnHandle`**입니다) prints the asterisks. Drop the emphasis or put a space.
    const marks = strip(ko)
    const badClose = marks.match(/\*\*[^*\n]+[^\p{L}\p{N}\s]\*\*(?=[\p{L}\p{N}])/gu) ?? []
    const badOpen = marks.match(/[\p{L}\p{N}]\*\*`[^`\n]+`\*\*/gu) ?? []
    if (badClose.length || badOpen.length) push(`bold markers CommonMark cannot parse: ${[...badClose, ...badOpen].slice(0, 3).join(' | ')}`)
    const latin = prose.split(/\n\s*\n/).filter((p) => p.trim() && !/^[#>|+*-]/.test(p.trim()) && !/[가-힣]/.test(p) && (p.match(/[A-Za-z]{3,}/g) ?? []).length >= 4)
    if (latin.length) push(`${latin.length} prose paragraph(s) left in English: ${latin[0].trim().slice(0, 60)}`)
  }
}
if (problems.length) {
  for (const p of problems) console.error(`  ${p.file}: ${p.what}`)
  console.error(`check-guide-translations: ${problems.length} problem(s)`)
  process.exit(1)
}
console.log(`check-guide-translations: ${files} translated section(s) in ${locales.length} language(s), no problems`)
