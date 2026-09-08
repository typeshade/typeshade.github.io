// The guide's cross-links into the reference. The first time a page writes a public export's
// name in inline code, that code becomes a link to the export's page, the way MDN links a
// function's first mention. An exact name only, with an optional "()"; inline code only, so a
// code block and a heading are left alone; and once per name per page, so a section reads as
// prose and not as a list of links.
//
// Only the guide is linked. Its sections are rendered from the vendored AUTHORING.md, which
// the loader names through the fileURL option (src/content.config.ts); the reference's own
// markdown comes through the same pipeline with no file and is left as it is.
import { SKIP, visit } from 'unist-util-visit'
import { apiSlugByName } from './api-nav.ts'

const GUIDE = 'AUTHORING.md'

export default function remarkApiLinks() {
  return (tree, file) => {
    if (!String(file?.path ?? '').endsWith(GUIDE)) return
    const slugs = apiSlugByName()
    const linked = new Set()
    // A link into the reference the page already carries counts as the name's one mention:
    // src/lib/remark-package-name.mjs turns a link whose text is an export's name into one,
    // and it runs first. Without this the same name would be linked twice on the page.
    visit(tree, 'link', (node) => {
      if (!/^\/api\//.test(node.url ?? '')) return
      const only = node.children.length === 1 && node.children[0].type === 'inlineCode' ? node.children[0].value : ''
      if (only) linked.add(only.replace(/\(\)$/, ''))
    })
    visit(tree, (node, index, parent) => {
      if (node.type === 'heading' || node.type === 'link' || node.type === 'linkReference') return SKIP
      if (node.type !== 'inlineCode' || !parent || index === null || index === undefined) return
      const name = node.value.replace(/\(\)$/, '')
      const slug = slugs.get(name)
      if (!slug || linked.has(name)) return
      linked.add(name)
      parent.children[index] = { type: 'link', url: `/api/${slug}/`, children: [node] }
    })
  }
}
