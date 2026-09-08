// The sections of the compiler's AUTHORING.md, read once at build time. The content loader
// (src/content.config.ts) takes the bodies from here, and the English copy takes each
// section's title and description from the same read, so the two cannot drift.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { authoringSections, type AuthoringSection } from './authoring.ts'

export const GUIDE_FILE = 'vendor/shader-dsl/AUTHORING.md'

export const guideSections: readonly AuthoringSection[] = authoringSections(
  readFileSync(path.resolve(process.cwd(), GUIDE_FILE), 'utf8'),
)

/** The id of every section with a page of its own, in the file's order. The overview is the
 *  text in front of the first heading, and it is the guide's own page. */
export const guideSectionIds: readonly string[] = guideSections.filter((s) => s.id !== 'overview').map((s) => s.id)
