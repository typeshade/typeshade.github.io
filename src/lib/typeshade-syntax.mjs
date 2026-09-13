/**
 * TypeShade product syntax lives in `.ts` files.
 * This injection augments TypeScript instead of introducing a new file language.
 */
const typeshadeSyntax = {
  name: 'typeshade-syntax',
  scopeName: 'source.typeshade.injection',
  injectTo: ['source.ts', 'source.tsx'],
  injectionSelector: 'L:source.ts, L:source.tsx',
  patterns: [
    {
      match: /"use typeshade"(?=\s*;?)/,
      name: 'keyword.control.use-typeshade',
    },
    {
      match: /@(compute|vertex|fragment|builtin|location|align|size|offset|ignore|interpolate)\b/,
      captures: {
        1: { name: 'entity.name.function.decorator.typeshade' },
      },
    },
    {
      match: /\b(declare)\s+(const|let)\b/,
      captures: {
        1: { name: 'keyword.declaration.resource.typeshade' },
        2: { name: 'storage.type.typeshade' },
      },
    },
    {
      match: /\b(uniform|storage|array|vec[234](?:[fiu])?|mat[234](?:x[234])?|f(?:16|32|64)|u(?:8|16|32|64)|i(?:8|16|32|64))\b/,
      name: 'support.type.typeshade',
    },
  ],
}

export default typeshadeSyntax
