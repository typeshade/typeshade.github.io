// The gallery page (src/components/pages/GalleryPage.astro): the approved entries the Worker
// lists, one card each. Every word from the data reaches the page as text nodes, so a title
// cannot write markup into it.
import { fetchGallery, fetchShare, type GalleryEntry } from './example-data-client.ts';
import { decodeSource } from './source-link.ts';
import { reservedValue } from '../lib/live-shader-contract.ts';
import { mountShader } from '../lib/shader-runtime.ts';

interface GalleryCopy {
  readonly empty: string;
  readonly unavailable: string;
  readonly by: string;
  readonly views: string;
  readonly viewOne: string;
  readonly open: string;
}

/** The clock the preview is drawn at: a frame in, so a shader that fades in from nothing at
 *  time 0 is not a black card. */
const PREVIEW_SECONDS = 1.5;

/** One preview at a time: the compiler is a single thread and a page of cards would otherwise
 *  compile all of them in the same task. */
let queue: Promise<void> = Promise.resolve();

/** Draw one frame of the card's program into its canvas. A program the preview cannot draw (a
 *  file set, a compute entry, a compile error) leaves no box at all:
 *  the card is its title and its meta line, and never a grey frame with a note in it. */
async function preview(entry: GalleryEntry, box: HTMLElement): Promise<void> {
  const canvas = box.querySelector('canvas');
  if (!canvas) return;
  try {
    const share = await fetchShare(entry.id);
    const code = share ? new URLSearchParams(share.fragment).get('code') : null;
    const source = code ? await decodeSource(code) : undefined;
    if (!source) return box.remove();
    const { compileLive } = await import('./live-shader-compile.ts');
    const result = compileLive(`gallery-${entry.id}`, entry.title, source);
    if (!result.data) return box.remove();
    // The box is in the layout already, so it has the size the drawing buffer takes.
    const data = result.data;
    const mounted = await mountShader(canvas, data, {
      still: true,
      uniformValues: (name, _seconds, _instance, clock) =>
        reservedValue(name, PREVIEW_SECONDS, canvas.width, canvas.height, [0.5, 0.5], clock),
    });
    if (mounted.backend === 'none') return box.remove();
    box.dataset.ready = '1';
  } catch {
    box.remove();
  }
}

/** Draw each card's preview when it comes near the screen, in the order it does. */
function previews(entries: readonly GalleryEntry[], list: HTMLElement): void {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const seen = new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        if (!change.isIntersecting) continue;
        const box = change.target as HTMLElement;
        seen.unobserve(box);
        const entry = byId.get(box.dataset.galleryPreview ?? '');
        if (entry) queue = queue.then(() => preview(entry, box));
      }
    },
    { rootMargin: '200px' },
  );
  for (const box of list.querySelectorAll<HTMLElement>('[data-gallery-preview]')) seen.observe(box);
}

function card(entry: GalleryEntry, copy: GalleryCopy, locale: string): HTMLLIElement {
  const item = document.createElement('li');
  const thumb = document.createElement('a');
  thumb.className = 'gallery-thumb';
  thumb.href = entry.url;
  thumb.tabIndex = -1;
  thumb.setAttribute('aria-hidden', 'true');
  thumb.dataset.galleryPreview = entry.id;
  thumb.append(document.createElement('canvas'));
  const heading = document.createElement('h2');
  const link = document.createElement('a');
  link.href = entry.url;
  link.textContent = entry.title;
  heading.append(link);
  const meta = document.createElement('p');
  meta.className = 'gallery-meta';
  const parts: string[] = [];
  if (entry.author) parts.push(copy.by.replace('{name}', entry.author));
  if (entry.approvedAt) {
    const date = new Date(entry.approvedAt);
    if (!Number.isNaN(date.getTime()))
      parts.push(
        date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
      );
  }
  parts.push(
    entry.views === 1
      ? copy.viewOne
      : copy.views.replace('{count}', entry.views.toLocaleString(locale)),
  );
  meta.replaceChildren(
    ...parts.map((part) => {
      const span = document.createElement('span');
      span.textContent = part;
      return span;
    }),
  );
  const open = document.createElement('a');
  open.className = 'gallery-open';
  open.href = entry.url;
  open.textContent = copy.open;
  item.append(thumb, heading, meta, open);
  return item;
}

export function initGallery(): void {
  const list = document.querySelector<HTMLElement>('[data-gallery-list]');
  const status = document.querySelector<HTMLElement>('[data-gallery-status]');
  if (!list || !status) return;
  const copy = JSON.parse(list.dataset.copy ?? '{}') as GalleryCopy;
  const locale = list.dataset.locale ?? 'en';
  void fetchGallery().then((entries) => {
    if (!entries) {
      status.textContent = copy.unavailable;
      return;
    }
    if (entries.length === 0) {
      status.textContent = copy.empty;
      return;
    }
    list.replaceChildren(...entries.map((entry) => card(entry, copy, locale)));
    list.hidden = false;
    status.hidden = true;
    previews(entries, list);
  });
}
