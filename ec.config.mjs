// Expressive Code's options live HERE, not in `astro.config.mjs`, for one mechanical reason:
// the page renders its code frames with EC's `<Code>` component, which serialises the config
// to JSON to reach the renderer — so an options object holding a FUNCTION (the renderer hook
// below) fails the build with "not serializable to JSON. To use the `<Code>` component, please
// create a separate config file called `ec.config.mjs`". This is that file; the block is
// design-system §5 verbatim, moved whole. Every setting name was read out of the installed
// packages, so nothing here is a name that does not exist.
//
// No theme patch ships: M-6 measured every syntax colour of `github-dark-default` on this code
// ground and the dimmest (`comment` #8b949e) is 5.94:1.
//
// One cost of dropping EC's only JS module (below): the integration pushes its script asset
// unconditionally, so `dist/_astro/ec.<hash>.js` still ships and is still linked — now 0 bytes.
// The request count is what it already was and its body is empty, which is why this is left
// alone rather than fixed with post-build HTML surgery.
import { createRenderer } from 'astro-expressive-code'

export default {
  themes: ['github-dark-default'],
  defaultProps: { wrap: false, frame: 'code' },
  // The four scroll regions of design §5 are STATIC — `CodeFrame.astro`'s build-time DOM
  // pass names each frame's own `<pre>` with `tabindex`/`role="region"`/`aria-label`, and
  // §8's numbered focus order is asserted "identical at 1440 and at 390". Expressive Code
  // ships one JS module ("Scrollable block tabindex") that REMOVES `tabindex` and `role`
  // from any block whose content happens to fit the current viewport, which broke both:
  // measured at 1440, `B1.CODE` and `B3.EDITOR` fit (scrollWidth 688 === clientWidth), so
  // the walk found 46 stops and 2 regions instead of 48 and 4 (§8's list, corrected) — and
  // a `<pre>` stripped of `role` falls back to the implicit `generic` role, where ARIA 1.2
  // PROHIBITS the name the region still carried (axe `aria-prohibited-attr`, serious).
  // Dropping that one module makes the static attributes the whole truth at every width
  // and leaves this page's code frames with no runtime JS at all (I-16). The count check
  // is the guard: an EC upgrade that renames or drops the module fails the build here
  // rather than silently restoring the strip.
  customCreateRenderer: async (options) => {
    const renderer = await createRenderer(options)
    const kept = renderer.jsModules.filter((m) => !m.includes('tabindex-js-module'))
    if (kept.length !== renderer.jsModules.length - 1) {
      throw new Error(
        `[typeshade] expected exactly 1 Expressive Code tabindex JS module, found ` +
          `${renderer.jsModules.length - kept.length} of ${renderer.jsModules.length}. ` +
          `Re-check @expressive-code/core's base plugins before changing this filter.`,
      )
    }
    renderer.jsModules = kept
    return renderer
  },
  // The page has EXACTLY ONE copy affordance, and it is §adopt's submodule line (I-11,
  // design §5). Expressive Code adds one to every frame by default, which would put a
  // "copy" promise on `B1.CODE` — a slice that does not run standalone — and on the
  // typed-error fixture, which is a deliberately BROKEN snippet. Measured before this
  // was set: two extra buttons in the page's focus order at 1440 and at 390.
  frames: { showCopyToClipboardButton: false },
  styleOverrides: {
    borderRadius: '10px',
    borderWidth: '1px',
    borderColor: '#232B3C',
    codeBackground: '#10151F',
    codeForeground: '#e6edf3',
    codeFontSize: '12.5px',
    codeLineHeight: '1.6',
    uiFontSize: '11px',
    codePaddingBlock: '16px',
    codePaddingInline: '16px',
    focusBorder: '#F2B441',
    // The two code frames scroll below 64rem and their default thumb is `#8b949e33` — 0.2
    // alpha on `#10151F`, which is no affordance at all: a pointer user got no cue that the
    // region scrolls while a keyboard user got a tab stop. `--color-line-3` is §2's
    // control-identifying tier (the ghost button's border) and `--color-text-3` its hover, the
    // same move `.btn-ghost` makes. Set here rather than in global.css because Chromium
    // ignores `scrollbar-width`/`scrollbar-color` on an element carrying `::-webkit-scrollbar`
    // rules, which EC's own stylesheet gives every `<pre>`.
    scrollbarThumbColor: '#8E99B0',
    scrollbarThumbHoverColor: '#9AA5BB',
    codeFontFamily:
      "'Geist Mono Variable','Geist Mono Fallback',ui-monospace,SFMono-Regular,Menlo,monospace",
    uiFontFamily: "'Inter Variable','Inter Fallback',system-ui,sans-serif",
    // §types' wrong line is marked with EXACTLY what design §5 specifies for it — a 2 px wavy
    // `--color-diag` underline (DiagnosticBlock.astro) — and the marker annotation is only how
    // that line is identified at build time. Expressive Code's own default paints it with a
    // blue band and a blue accent border (`--ec-tm-markBg: #264a8980`), a colour that exists in
    // no token: design §1/§2 give the design system sole authority over colour, and the band
    // competed with the red squiggle that IS the signal. Both are cleared to zero alpha rather
    // than to a diag tint, so the line reads the way an editor draws it.
    textMarkers: { markBackground: '#00000000', markBorderColor: '#00000000' },
    frames: {
      shadowColor: 'transparent',
      frameBoxShadowCssValue: 'none',
      editorBackground: '#10151F',
      editorTabBarBackground: '#161C28',
      editorTabBarBorderBottomColor: '#232B3C',
      editorActiveTabBackground: '#10151F',
      editorActiveTabForeground: '#9AA5BB',
      editorActiveTabIndicatorTopColor: '#F2B441',
      editorActiveTabIndicatorBottomColor: 'transparent',
    },
  },
}
