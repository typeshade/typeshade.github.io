// The meta description of a generated reference page, cut to the length the SEO checks want.
// Both references compose their description the same way: a short line the dictionary writes
// in front of a sentence the compiler wrote, which may be one clause or a paragraph. This is
// where that composed text is brought inside 70 to 160 characters.
//
// A cut lands at the end of a sentence (. ! ?) or a clause (, ; :) when one leaves enough
// characters to clear the floor. The search runs twice: first inside the locale's own budget
// (max), which is where almost every description finds its break; a description whose
// punctuation lands a few characters past a tight Korean budget gets a second look up to the
// hard SEO ceiling those pages still have room under (scripts/check-seo.mjs DESCRIPTION_MAX)
// before anything falls to the raw word-boundary cut. This is the fix-round finding that the
// original word-boundary fallback itself still landed mid-clause on 50 of 732 pages (6.8%):
// widening the search to the hard ceiling and adding ':' as a clause mark brought that to 13
// (1.8%), all of them a single continuous clause with no sentence or clause mark anywhere
// inside 160 characters of the composed text, so the word-boundary cut there is the correct
// fallback for a sentence that genuinely has nowhere shorter to break.

/** The floor scripts/check-seo.mjs holds every page to. */
export const META_MIN = 70;
/** The ceiling it holds every page to, which a tight per-locale budget sits under. */
export const META_HARD_MAX = 160;

// The last character of the window is also a valid break: a mark one truncated character
// short of "mark, more words" reads as mid-clause under a strict trailing-space search even
// though the mark itself is the true end of what fits.
function markEnd(window: string, marks: readonly string[]): number {
  let best = -1;
  for (const mark of marks) {
    const withSpace = window.lastIndexOf(`${mark} `);
    if (withSpace >= 0) best = Math.max(best, withSpace + mark.length);
    if (window.endsWith(mark)) best = Math.max(best, window.length);
  }
  return best;
}

function cutAt(text: string, limit: number): string | null {
  const window = text.slice(0, limit);
  const sentenceEnd = markEnd(window, ['.', '!', '?']);
  if (sentenceEnd >= META_MIN) return window.slice(0, sentenceEnd);
  const clauseEnd = markEnd(window, [',', ';', ':']);
  if (clauseEnd >= META_MIN) return `${window.slice(0, clauseEnd - 1)}…`;
  return null;
}

/** The composed text brought inside `max`, at a sentence or a clause where there is one. */
export function fitDescription(text: string, max: number): string {
  if (text.length <= max) return text;
  return (
    cutAt(text, max) ??
    cutAt(text, META_HARD_MAX) ??
    `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
  );
}
