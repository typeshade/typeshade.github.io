// The guide is rendered from the pinned commit, where the package still carries its
// pre-release scope. The site imports it by its release name everywhere, so the rendered
// guide does too, in prose, inline code and code blocks alike. Links into the repository
// become permalinks at that commit; a link to the upstream API site, which does not exist
// here, keeps its text and loses its link. An environment variable the compiler reads keeps
// the name it is spelt with at that commit, since that is the name that works.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { visit } from 'unist-util-visit'

const FROM = '@xgis/shader-dsl'
const TO = 'typeshade'
// Every section landed with an issue in the compiler's tracker, and its number is written
// into headings, prose and code comments alike. The site has no tracker to send a reader
// to, so the number goes wherever it appears.
const ISSUE = /\s*\(#\d+\)/g

const mirror = /url\s*=\s*(\S+)/.exec(readFileSync('.gitmodules', 'utf8'))?.[1]?.replace(/\.git$/, '')
const pin = execSync('git -C vendor/shader-dsl rev-parse --short HEAD', { encoding: 'utf8' }).trim()
if (!mirror || !/^[0-9a-f]{7,40}$/.test(pin)) throw new Error('[guide] no mirror url or pinned commit')

export default function remarkPackageName() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
        node.value = node.value.split(FROM).join(TO).replace(ISSUE, '')
      }
      if (node.type === 'link' && !/^(https?:|#|mailto:)/.test(node.url)) {
        if (node.url.startsWith('/')) {
          // An absolute path is the upstream API site's; unwrap to the link's text.
          parent.children.splice(index, 1, ...node.children)
          return index
        }
        node.url = `${mirror}/blob/${pin}/${node.url.replace(/^\.\//, '')}`
      }
    })
  }
}
