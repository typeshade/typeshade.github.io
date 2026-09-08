// The authoring guide in other languages: content/guide/<locale>/<section>.md, one file per
// section of AUTHORING.md, translated by hand from the English at the pinned commit. A file's
// front matter records the sha256 of the English body it was translated from. When the pin
// moves and a section's English changes, the build stops here and names the section, so a
// translation cannot drift from its source unnoticed. scripts/check-guide-translations.ts
// checks the rest: code blocks, code spans, numerals, links, headings and register.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { guideSections } from './guide.ts'

export const GUIDE_TRANSLATIONS_DIR = 'content/guide'

export interface GuideTranslation {
  readonly id: string
  readonly locale: string
  /** The markdown body, without the front matter. */
  readonly body: string
  /** The sha256 of the English body the translation was made from. */
  readonly source: string
  readonly sourceLine: number
  readonly order: number
  /** The file, relative to the site root. */
  readonly file: string
}

const FRONT = /^---\n([\s\S]*?)\n---\n/

export const englishHash = (body: string): string => createHash('sha256').update(body).digest('hex')

/** The directory one locale's translations live in, relative to the site root. */
export function translationDir(locale: string): string {
  return `${GUIDE_TRANSLATIONS_DIR}/${locale}`
}

/** Every translated section of one locale, keyed by section id. Empty when the locale has none. */
export function guideTranslations(locale: string): ReadonlyMap<string, GuideTranslation> {
  const dir = path.resolve(process.cwd(), translationDir(locale))
  const out = new Map<string, GuideTranslation>()
  if (!existsSync(dir)) return out
  const sections = new Map(guideSections.map((s) => [s.id, s]))
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
    const file = `${translationDir(locale)}/${name}`
    const text = readFileSync(path.join(dir, name), 'utf8')
    const m = FRONT.exec(text)
    if (!m) throw new Error(`[guide] ${file} has no front matter (id, source, sourceLine)`)
    const meta: Record<string, string> = {}
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
    const id = name.replace(/\.md$/, '')
    if (meta.id !== id) throw new Error(`[guide] ${file}: the front matter says id '${meta.id}', the file is named '${id}'`)
    const section = sections.get(id)
    if (!section) throw new Error(`[guide] ${file}: AUTHORING.md at the pinned commit has no section '${id}'`)
    const hash = englishHash(section.body)
    if (meta.source !== hash) {
      throw new Error(
        `[guide] ${file} was translated from an older '${id}' (source ${String(meta.source).slice(0, 12)}, the pinned English is ${hash.slice(0, 12)}); ` +
          'translate the section again from the pinned AUTHORING.md and record the new hash in its front matter',
      )
    }
    out.set(id, { id, locale, body: text.slice(m[0].length), source: hash, sourceLine: section.sourceLine, order: section.order, file })
  }
  return out
}
