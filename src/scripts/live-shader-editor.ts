// The editor a live example opens: the highlighted block Expressive Code already rendered,
// with a transparent textarea over it.
//
// Why this and not CodeMirror 6. CodeMirror, with its TypeScript language, history and line
// numbers, measures 404 KB minified and 133 KB gzipped as its own lazily loaded chunk; this
// file is part of the page's own module and costs a few kilobytes. On a phone a textarea is
// the platform's text field, so the caret, the selection handles and the keyboard are the
// ones the reader already knows. A Korean reader types through an input method, and an input
// method composes into a real text field without help: nothing here writes to the textarea's
// value, so composition is left alone and only the layer underneath is redrawn.
//
// The alignment rule: the textarea never draws text of its own (the text is transparent, the
// caret is not), so it has to sit exactly over the highlighted lines. The metrics are
// measured off the rendered block instead of restated, so Expressive Code's own padding and
// font stay the single source.

import { highlight } from './live-shader-highlight.ts'

export interface LiveEditor {
  /** What the reader has typed. */
  value(): string
  /** Put the caret in the editor, at `index` when one is given. */
  focus(index?: number): void
  /** Move the caret to a line and column, both one-based, for a diagnostic a reader clicks. */
  goTo(line: number, character: number): void
  /** Redo the measurement after the block has changed size. */
  measure(): void
  destroy(): void
}

export interface EditorOptions {
  /** Every keystroke, after the highlighted layer has been redrawn. */
  readonly onInput: (source: string) => void
  /** True while an input method is composing, when a recompile would see half a syllable. */
  readonly onComposing: (composing: boolean) => void
  readonly ariaLabel: string
}

const TAB = '  '

/** Put the editor on one Expressive Code block. `pre` is the block's own scroller and `code`
 *  the element holding its lines. */
export function mountEditor(pre: HTMLElement, code: HTMLElement, source: string, opts: EditorOptions): LiveEditor {
  const area = document.createElement('textarea')
  area.className = 'live-input'
  area.value = source
  area.spellcheck = false
  area.autocapitalize = 'off'
  area.setAttribute('autocorrect', 'off')
  area.setAttribute('autocomplete', 'off')
  area.setAttribute('aria-label', opts.ariaLabel)
  area.setAttribute('data-live-input', '')

  // The block scrolls through the textarea from here: two scrollers over the same text would
  // drift apart the moment either one of them moved.
  const scrolled = pre
  scrolled.style.overflow = 'hidden'
  scrolled.style.position = 'relative'
  scrolled.appendChild(area)

  const measure = (): void => {
    const anchor = code.querySelector<HTMLElement>('.ec-line .code') ?? code
    const style = getComputedStyle(anchor)
    const preBox = pre.getBoundingClientRect()
    const anchorBox = anchor.getBoundingClientRect()
    area.style.font = style.font
    area.style.fontFamily = style.fontFamily
    area.style.fontSize = style.fontSize
    area.style.lineHeight = style.lineHeight
    area.style.letterSpacing = style.letterSpacing
    area.style.tabSize = style.tabSize
    // The offset of the first rendered line inside the block, which is whatever padding
    // Expressive Code's stylesheet put there.
    area.style.paddingTop = `${anchorBox.top - preBox.top + pre.scrollTop}px`
    area.style.paddingLeft = `${anchorBox.left - preBox.left + pre.scrollLeft}px`
    area.style.height = `${pre.scrollHeight}px`
  }

  const syncScroll = (): void => {
    pre.scrollTop = area.scrollTop
    pre.scrollLeft = area.scrollLeft
  }

  /** Redraw the layer under the caret, then let the page know. The copy button carries the
   *  code as an attribute, so it is moved on too. */
  const paint = (): void => {
    code.innerHTML = highlight(area.value)
    const copy = pre.parentElement?.querySelector<HTMLElement>('.copy button')
    if (copy) copy.dataset.code = area.value
    measure()
    syncScroll()
    opts.onInput(area.value)
  }

  const onInput = (): void => paint()
  const onScroll = (): void => syncScroll()
  const onCompositionStart = (): void => opts.onComposing(true)
  const onCompositionEnd = (): void => {
    opts.onComposing(false)
    paint()
  }
  /** Tab indents instead of leaving the editor. Escape puts the tab key back, so a reader on
   *  a keyboard can always walk past the block. */
  let tabEscapes = false
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      tabEscapes = true
      return
    }
    if (e.key !== 'Tab' || tabEscapes) {
      tabEscapes = false
      return
    }
    e.preventDefault()
    const { selectionStart, selectionEnd, value } = area
    area.value = value.slice(0, selectionStart) + TAB + value.slice(selectionEnd)
    area.selectionStart = area.selectionEnd = selectionStart + TAB.length
    paint()
  }

  area.addEventListener('input', onInput)
  area.addEventListener('scroll', onScroll)
  area.addEventListener('keydown', onKeyDown)
  area.addEventListener('compositionstart', onCompositionStart)
  area.addEventListener('compositionend', onCompositionEnd)
  measure()

  /** The character offset of a one-based line and column. */
  const offsetOf = (line: number, character: number): number => {
    const lines = area.value.split('\n')
    let at = 0
    for (let i = 0; i < Math.min(line - 1, lines.length); i++) at += (lines[i]?.length ?? 0) + 1
    return at + Math.max(0, character - 1)
  }

  return {
    value: () => area.value,
    focus(index) {
      area.focus()
      if (index !== undefined) area.selectionStart = area.selectionEnd = index
    },
    goTo(line, character) {
      const at = offsetOf(line, character)
      area.focus()
      area.selectionStart = area.selectionEnd = at
    },
    measure,
    destroy() {
      area.removeEventListener('input', onInput)
      area.removeEventListener('scroll', onScroll)
      area.removeEventListener('keydown', onKeyDown)
      area.removeEventListener('compositionstart', onCompositionStart)
      area.removeEventListener('compositionend', onCompositionEnd)
      area.remove()
      scrolled.style.overflow = ''
    },
  }
}
