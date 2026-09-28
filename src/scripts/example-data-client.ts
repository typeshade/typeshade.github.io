// The example data the Worker serves (worker/index.ts, docs/cloudflare.md), as the pages read
// it. Every read fails soft: `astro dev`, `astro preview` and a host with no Worker answer
// /api/ with a 404 or an HTML page, and a page then shows what its build has and no more.
import type { DataLocale, ExampleRecord, ReleaseIndex } from '../lib/example-data.ts';

async function get<T>(path: string): Promise<T | undefined> {
  try {
    const res = await fetch(path, { headers: { accept: 'application/json' } });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

let index: Promise<ReleaseIndex | undefined> | undefined;

/** The current release's index, fetched once per page. */
export const fetchIndex = (): Promise<ReleaseIndex | undefined> =>
  (index ??= get<ReleaseIndex>('/api/examples/'));

/** One example with its file and its emitted text. */
export const fetchExample = (id: string): Promise<ExampleRecord | undefined> =>
  /^[a-z0-9][a-z0-9-]*$/.test(id)
    ? get<ExampleRecord>(`/api/examples/${id}/`)
    : Promise.resolve(undefined);

/** The page's language, as the data keys its words. */
export const pageLocale = (): DataLocale => document.documentElement.lang as DataLocale;

/** A line's inline marks as DOM: a code span, and a link's text. Written with nodes, so the
 *  text from the data never reaches the page as markup. */
export function inlineNodes(text: string): Node[] {
  const nodes: Node[] = [];
  const plain = text.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
  plain.split(/(`[^`]*`)/).forEach((part) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      const code = document.createElement('code');
      code.textContent = part.slice(1, -1);
      nodes.push(code);
    } else if (part) nodes.push(document.createTextNode(part));
  });
  return nodes;
}
