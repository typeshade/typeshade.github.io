// The TypeShade mark: one stroke in, two strokes out. public/favicon.svg is the source;
// scripts/build-icons.ts asserts this record against it, and the header and the social
// card draw the mark from this record.
export const MARK = {
  viewBox: '0 0 32 32',
  strokeWidth: 3.5,
  d: 'M7 16H14M14 16L24 8.5M14 16L24 23.5',
} as const
