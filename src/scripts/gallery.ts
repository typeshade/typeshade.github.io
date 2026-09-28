// The gallery page (src/components/pages/GalleryPage.astro): the approved entries the Worker
// lists, one card each. Every word from the data reaches the page as text nodes, so a title
// cannot write markup into it.
import { fetchGallery, type GalleryEntry } from './example-data-client.ts';

interface GalleryCopy {
  readonly empty: string;
  readonly unavailable: string;
  readonly by: string;
  readonly views: string;
  readonly viewOne: string;
  readonly open: string;
}

function card(entry: GalleryEntry, copy: GalleryCopy, locale: string): HTMLLIElement {
  const item = document.createElement('li');
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
  item.append(heading, meta, open);
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
  });
}
