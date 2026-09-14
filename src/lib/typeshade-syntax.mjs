/** TypeShade syntax injected into TypeScript highlighting. */
export default {
  id: 'typeshade-injection',
  name: 'TypeShade',
  scopeName: 'source.typeshade.injection',
  injectionSelector: 'L:source.ts, L:source.tsx',
  patterns: [
    // Keep standard TextMate scope families so the selected Shiki theme supplies colours.
    { name: 'keyword.control.typeshade.directive', match: '"use typeshade"|\'use typeshade\'' },
    { name: 'entity.name.function.typeshade.decorator', match: '@(?:compute|vertex|fragment|builtin|location|align)\\b' },
    { name: 'storage.type.typeshade.resource', match: '\\b(?:uniform|storage|array)\\b' },
    { name: 'support.type.typeshade.gpu', match: '\\b(?:f(?:16|32|64)|i(?:8|16|32|64)|u(?:8|16|32|64)|vec[234](?:[fiu]|f16|f32|f64|i8|i16|i32|i64|u8|u16|u32|u64)?|mat[234](?:x[234])?|bool)\\b' },
    { name: 'storage.modifier.typeshade.declare', match: '\\bdeclare\\b(?=\\s+(?:const|let)\\b)' },
  ],
};
