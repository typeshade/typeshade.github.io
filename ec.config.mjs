// Expressive Code options. They live here rather than in astro.config.mjs because the
// <Code> component needs them serialisable, and the theme selector is a function: the
// light or dark code theme follows the page's data-theme, or the system when none is set.
//
// The copy button's tooltip is the one piece of chrome Expressive Code writes itself, so it
// carries the page's language: every <Code> is given its locale, and the words for each
// locale are set here. Node loads this file and cannot read src/i18n/*.ts, so the strings are
// repeated below and bun scripts/check-copy.ts fails the build when they drift from the
// dictionary they belong to (copy.code).
import { pluginFramesTexts } from 'expressive-code'

/** The copy button's two strings per locale, checked against the dictionary by check-copy. */
export const codeUiTexts = {
  en: { copy: 'Copy to clipboard', copied: 'Copied' },
  ko: { copy: '클립보드로 복사', copied: '복사됨' },
}
for (const [locale, texts] of Object.entries(codeUiTexts)) {
  pluginFramesTexts.overrideTexts(locale, { copyButtonTooltip: texts.copy, copyButtonCopied: texts.copied })
}

export default {
  themes: ['github-light', 'github-dark'],
  themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
  defaultLocale: 'en',
  // The github themes bring their own frame colours: a light background equal to the page
  // ground (so a frame reads as a bare 1px border, not a surface) and an orange active-tab
  // indicator outside the site's two-colour palette (accent blue, diagnostic red). Both are
  // pinned to the site's own tokens so a frame reads as one step off the ground in either
  // theme and carries no colour the palette doesn't have.
  styleOverrides: {
    frames: {
      editorBackground: 'var(--color-surface-1)',
      terminalBackground: 'var(--color-surface-1)',
      editorActiveTabIndicatorTopColor: 'transparent',
      editorActiveTabIndicatorBottomColor: 'transparent',
    },
  },
}
