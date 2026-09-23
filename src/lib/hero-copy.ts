// The wording on the social card at /og/: the front page's headline and its one sentence.
import { en } from '../i18n/en.ts';

export const heroCopy = {
  h1: en.front.title,
  // The lede carries its code spans as markdown, which Rich renders on the page. The card
  // draws plain text into a picture, so the backticks come off instead of printing.
  sub: en.front.lede.replace(/`/g, ''),
} as const;
