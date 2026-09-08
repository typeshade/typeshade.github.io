// Expressive Code options. They live here rather than in astro.config.mjs because the
// <Code> component serialises the config to JSON and a function in astro.config.mjs would
// fail the build.
import { createRenderer } from 'astro-expressive-code'

export default {
  themes: ['github-light', 'github-dark'],
  useDarkModeMediaQuery: true,
  defaultProps: { wrap: false, frame: 'code' },
  // CodeFrame.astro names each frame's <pre> as a scroll region at build time. Expressive
  // Code ships one JS module that strips those attributes from a block that fits the
  // viewport, which would leave an aria-label on an element with no role; drop it.
  customCreateRenderer: async (options) => {
    const renderer = await createRenderer(options)
    const kept = renderer.jsModules.filter((m) => !m.includes('tabindex-js-module'))
    if (kept.length !== renderer.jsModules.length - 1) {
      throw new Error(`[typeshade] expected exactly 1 Expressive Code tabindex JS module`)
    }
    renderer.jsModules = kept
    return renderer
  },
  frames: { showCopyToClipboardButton: false },
  styleOverrides: {
    borderRadius: '6px',
    borderWidth: '1px',
    codeFontSize: '13px',
    codeLineHeight: '1.6',
    uiFontSize: '12px',
    codePaddingBlock: '14px',
    codePaddingInline: '14px',
    codeFontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    uiFontFamily: "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, sans-serif",
    textMarkers: { markBackground: '#00000000', markBorderColor: '#00000000' },
    // The github theme marks the active tab of a titled frame with its own accent colour.
    // The site uses one accent, so the indicator goes and the tab is drawn by its border.
    frames: {
      shadowColor: 'transparent',
      frameBoxShadowCssValue: 'none',
      editorActiveTabIndicatorTopColor: 'transparent',
      editorActiveTabIndicatorHeight: '0px',
      editorActiveTabBackground: 'var(--color-surface-1)',
      editorTabBarBackground: 'var(--color-ground)',
      editorTabBarBorderBottomColor: 'var(--color-line-1)',
    },
  },
}
