// Expressive Code options. They live here rather than in astro.config.mjs because the
// <Code> component needs them serialisable, and the theme selector is a function: the
// light or dark code theme follows the page's data-theme, or the system when none is set.
export default {
  themes: ['github-light', 'github-dark'],
  themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
}
