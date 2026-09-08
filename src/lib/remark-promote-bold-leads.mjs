// A few sections of AUTHORING.md use a bold run as a pseudo-heading instead of real Markdown
// syntax: a paragraph that is nothing but "**Label**", or a paragraph or list item that opens
// with "**Label**" and continues in the same block ("**Label.** rest of the sentence" or
// "- **Label** ... rest of the sentence"). Real headings drive both the rendered outline
// (Docs.astro reads them from Astro's own heading collection) and the "On this page" panel, so
// a section written this way renders with neither. This runs only on a section with no real
// heading of its own, and turns exactly that convention into one; a paragraph or list item that
// opens some other way is left as it is.
import { visit } from 'unist-util-visit'

const GUIDE = 'AUTHORING.md'
// The leftover separator between a bold lead and the rest of its sentence: an em dash (written
// here as an escape so this file itself carries no literal one), a plain dash, or nothing, when
// the bold run already ends the sentence with its own period.
const LEAD_SEP = /^\s*(?:[\u2014-]\s*)?/

const startsWithBold = (node) => node?.type === 'paragraph' && node.children[0]?.type === 'strong'

const headingFrom = (strong) => ({ type: 'heading', depth: 3, children: strong.children })

/** A bold-lead paragraph split into its heading and, if the sentence continues, a paragraph for
 *  the rest. `null` for a paragraph whose first child is anything else. */
function splitLead(paragraph) {
  if (!startsWithBold(paragraph)) return null
  const [strong, ...tail] = paragraph.children
  const heading = headingFrom(strong)
  if (tail.length === 0) return [heading]
  const first = tail[0]
  if (first.type === 'text') first.value = first.value.replace(LEAD_SEP, '')
  return [heading, { type: 'paragraph', children: tail }]
}

// The overview section keeps AUTHORING.md's own top-level '# ' line, since its h1 carries the
// page's own title, but that depth never reaches the outline (Docs.astro keeps depth 2 and 3
// only). A section counts as headless the same way here: by whether it has one of those depths,
// regardless of any other heading node it carries.
const hasOutlineHeading = (tree) => {
  let found = false
  visit(tree, 'heading', (h) => {
    if (h.depth === 2 || h.depth === 3) found = true
  })
  return found
}

export default function remarkPromoteBoldLeads() {
  return (tree, file) => {
    if (!String(file?.path ?? '').endsWith(GUIDE)) return
    if (hasOutlineHeading(tree)) return

    // A bare paragraph opening with a bold run, wherever it sits: before-after's section
    // headers ("**Calling another function**", alone), and the callouts in the guide's own
    // opening blockquote ("**Import paths.** Author from…"). A list item's own lead paragraph
    // is handled separately below, so the list stays intact until the whole item is rebuilt.
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index === null || index === undefined || parent.type === 'listItem') return
      const split = splitLead(node)
      if (!split) return
      parent.children.splice(index, 1, ...split)
      return index + split.length
    })

    // A list used as a definition list: every item opens the same way ("- **Label** ... rest.").
    // Its bullet and indent are a poor stand-in for a heading, so the whole list unwraps into a
    // flat run of heading and paragraph pairs, one per item.
    visit(tree, 'list', (node, index, parent) => {
      if (!parent || index === null || index === undefined) return
      const items = node.children.filter((c) => c.type === 'listItem')
      if (items.length < 2 || !items.every((li) => startsWithBold(li.children[0]))) return
      const replacement = items.flatMap((li) => {
        const [lead, ...rest] = li.children
        return [...(splitLead(lead) ?? [lead]), ...rest]
      })
      parent.children.splice(index, 1, ...replacement)
      return index + replacement.length
    })

    // Quick reference is one table with no bold lead anywhere to promote. A heading in front of
    // the table still gives it an outline entry and the same three-column layout every other
    // guide page has.
    if (!hasOutlineHeading(tree)) {
      const at = tree.children.findIndex((n) => n.type === 'table')
      if (at !== -1) tree.children.splice(at, 0, { type: 'heading', depth: 3, children: [{ type: 'text', value: 'Reference table' }] })
    }
  }
}
