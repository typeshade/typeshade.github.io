// typeshade.dev's Worker (docs/cloudflare.md). The site is the Astro build in dist/, served as
// static assets; wrangler.jsonc runs this Worker first on four prefixes only, and everything
// else never reaches it.
//
// /data/examples/         the current release's index: every example the compiler has, with
//                         the site's words for it (scripts/publish-examples.ts writes it)
// /data/examples/<id>/    one example: its file, its emitted WGSL and GLSL, its page meta
// /data/releases/         the releases the database records, newest first
// /data/shares/           POST: stores a Playground link's page and fragment in D1 and answers
//                         its short link
// /s/<id>/                the short link: a redirect to the page with its fragment
// /guide/examples/<id>/   the built page where the build has one; otherwise, for an example
// /ko/guide/examples/...  the current release has, the prebuilt template page filled in with
//                         it, so an example merged upstream has a page before the next build
import {
  releaseKey,
  TEMPLATE_ID,
  type DataLocale,
  type ExampleRecord,
  type ReleaseIndex,
} from '../src/lib/example-data.ts';

export interface Env {
  readonly ASSETS: Fetcher;
  readonly DATA: R2Bucket;
  readonly DB: D1Database;
}

/** The current release's id, read from D1 at most once a minute per isolate. */
let current: { readonly release: string | null; readonly until: number } | undefined;
async function currentRelease(env: Env): Promise<string | null> {
  if (current && current.until > Date.now()) return current.release;
  const row = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'current_release'`)
    .first<{ value: string }>()
    .catch(() => null);
  current = { release: row?.value ?? null, until: Date.now() + 60_000 };
  return current.release;
}

async function readJson<T>(env: Env, file: string): Promise<T | null> {
  const release = await currentRelease(env);
  if (!release) return null;
  const object = await env.DATA.get(releaseKey(release, file)).catch(() => null);
  return object ? ((await object.json()) as T) : null;
}

const ID = /^[a-z0-9][a-z0-9-]*$/;

/** The pages a short link may open: the Playground and an example's page, in either language. */
const SHARE_PATH = /^(\/ko)?\/(playground|guide\/examples\/[a-z0-9][a-z0-9-]*)\/$/;
/** What the Playground writes (writeHash): `code=` and the options, in URL-safe characters. */
const SHARE_FRAGMENT = /^code=[A-Za-z0-9._~%&=-]+$/;
/** A deflated file of a few thousand lines, with room to spare. */
const SHARE_MAX = 64 * 1024;
const SHARE_ID = /^[A-Za-z0-9_-]{8,43}$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // A release changes when the compiler does, a few times a day at most; a minute at the
      // edge keeps the reads off R2 without holding a new example back for long.
      'cache-control': 'public, max-age=60',
      'access-control-allow-origin': '*',
    },
  });
}

async function api(request: Request, url: URL, env: Env): Promise<Response> {
  const parts = url.pathname.split('/').filter(Boolean); // ['data', 'examples', id?]
  if (parts[1] === 'examples' && parts.length === 2) {
    const index = await readJson<ReleaseIndex>(env, 'index.json');
    return index ? json(index) : json({ error: 'no release is current' }, 503);
  }
  if (parts[1] === 'examples' && parts.length === 3 && ID.test(parts[2]!)) {
    const record = await readJson<ExampleRecord>(env, `examples/${parts[2]}.json`);
    return record ? json(record) : json({ error: `no example '${parts[2]}'` }, 404);
  }
  if (parts[1] === 'shares' && parts.length === 2) {
    return request.method === 'POST'
      ? createShare(request, url, env)
      : json({ error: 'POST a page and a fragment' }, 405);
  }
  if (parts[1] === 'releases' && parts.length === 2) {
    const { results } = await env.DB.prepare(
      `SELECT id, compiler_commit, compiler_date, site_commit, example_count, created_at
       FROM releases ORDER BY created_at DESC LIMIT 50`,
    ).all();
    return json({ current: await currentRelease(env), releases: results });
  }
  return json({ error: 'not found' }, 404);
}

const noStore = { 'cache-control': 'no-store' };

/** The id of a share: the SHA-256 of what it opens, in base64url, cut to `length`. */
async function shareId(target: string, length: number): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(target)),
  );
  const b64 = btoa(String.fromCharCode(...digest))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return b64.slice(0, length);
}

/** POST /data/shares/ with `{ path, fragment }`: the short link to that page and fragment. */
async function createShare(request: Request, url: URL, env: Env): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ error: 'another site' }, 403);
  const body = await request.text();
  if (body.length > SHARE_MAX + 512) return json({ error: 'too large' }, 413);
  let share: { path?: unknown; fragment?: unknown };
  try {
    share = JSON.parse(body) as typeof share;
  } catch {
    return json({ error: 'not JSON' }, 400);
  }
  const { path, fragment } = share;
  if (typeof path !== 'string' || !SHARE_PATH.test(path))
    return json({ error: 'not a page a link can open' }, 400);
  if (typeof fragment !== 'string' || !SHARE_FRAGMENT.test(fragment) || fragment.length > SHARE_MAX)
    return json({ error: 'not a Playground fragment' }, 400);
  const target = `${path}#${fragment}`;
  // Eight characters are 48 bits; a different share that already holds them takes a longer id.
  for (const length of [8, 12, 16, 43]) {
    const id = await shareId(target, length);
    await env.DB.prepare(
      `INSERT OR IGNORE INTO shares (id, path, fragment, created_at) VALUES (?, ?, ?, ?)`,
    )
      .bind(id, path, fragment, new Date().toISOString())
      .run();
    const row = await env.DB.prepare(`SELECT path, fragment FROM shares WHERE id = ?`)
      .bind(id)
      .first<{ path: string; fragment: string }>();
    if (row?.path === path && row.fragment === fragment) {
      return new Response(JSON.stringify({ id, url: `${url.origin}/s/${id}/` }), {
        headers: { 'content-type': 'application/json; charset=utf-8', ...noStore },
      });
    }
  }
  return json({ error: 'no free id' }, 500);
}

/** GET /s/<id>/ (and /s/<id>): the page the share opens, with its fragment. */
async function openShare(url: URL, env: Env): Promise<Response> {
  const id = /^\/s\/([^/]+)\/?$/.exec(url.pathname)?.[1];
  const row =
    id && SHARE_ID.test(id)
      ? await env.DB.prepare(`SELECT path, fragment FROM shares WHERE id = ?`)
          .bind(id)
          .first<{ path: string; fragment: string }>()
          .catch(() => null)
      : null;
  // /s/ is no page of the build's, so the asset handler answers it with the 404 page.
  if (!row) return env.ASSETS.fetch(new Request(new URL('/s/', url)));
  // A share never changes, so the redirect is cached like the file it names.
  return new Response(null, {
    status: 302,
    headers: {
      location: `${url.origin}${row.path}#${row.fragment}`,
      'cache-control': 'public, max-age=86400',
    },
  });
}

const escapeHtml = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** The dictionaries' inline marks, as src/components/Rich.astro renders the two a blurb uses:
 *  a code span, and a link, which keeps its text only unless it points at a page. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]*)`/g, '<code>$1</code>')
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_m, label: string, href: string) =>
      /^(https:\/\/|\/)/.test(href) ? `<a href="${href}">${label}</a>` : label,
    );
}

/** The template page, filled in with one example. The template is a built page
 *  (src/components/pages/RuntimeExamplePage.astro): the markup, the scripts and the styles are
 *  the build's, and only the example's own text is written in here. */
function fill(template: Response, record: ExampleRecord, locale: DataLocale, path: string) {
  const templatePath = `/guide/examples/${TEMPLATE_ID}/`;
  const { title, description } = record.page[locale];
  const name = record.title[locale];
  const retarget = (value: string): string => value.split(templatePath).join(path);
  // The template's own title and description, as the JSON-LD block repeats them.
  let templateTitle = '';
  let templateDescription = '';
  let ld = '';

  const panes: Record<string, string | undefined> = {
    source: record.source,
    wgsl: record.emitted.wgsl,
    vertex: record.emitted.glsl?.vertex,
    fragment: record.emitted.glsl?.fragment,
  };
  // The pane whose text the next [data-runtime-code] takes: the handlers run in document
  // order, and each code slot sits inside its pane.
  let pane: string | undefined;
  const playgroundExample = {
    id: record.id,
    source: record.source,
    title: name,
    description: record.blurb[locale],
  };

  return (
    new HTMLRewriter()
      .on('title', {
        text(chunk) {
          templateTitle += chunk.text;
          chunk.remove();
          if (chunk.lastInTextNode) chunk.after(escapeHtml(title), { html: true });
        },
      })
      .on('meta[name="description"]', {
        element(e) {
          templateDescription = e.getAttribute('content') ?? '';
          e.setAttribute('content', description);
        },
      })
      .on('meta[property="og:title"], meta[name="twitter:title"]', {
        element(e) {
          e.setAttribute('content', title);
        },
      })
      .on('meta[property="og:description"], meta[name="twitter:description"]', {
        element(e) {
          e.setAttribute('content', description);
        },
      })
      // The template keeps itself out of the index; the page it becomes is an example page.
      .on('meta[name="robots"]', {
        element(e) {
          e.remove();
        },
      })
      .on('[href*="/guide/examples/"], [content*="/guide/examples/"]', {
        element(e) {
          for (const attr of ['href', 'content']) {
            const value = e.getAttribute(attr);
            if (value?.includes(templatePath)) e.setAttribute(attr, retarget(value));
          }
        },
      })
      .on('script[type="application/ld+json"]', {
        text(chunk) {
          ld += chunk.text;
          chunk.remove();
          if (!chunk.lastInTextNode) return;
          const js = (s: string): string => JSON.stringify(s).slice(1, -1);
          let out = retarget(ld);
          if (templateTitle) out = out.split(js(templateTitle)).join(js(title));
          if (templateDescription) out = out.split(js(templateDescription)).join(js(description));
          chunk.after(out.replace(/</g, '\\u003c'), { html: true });
          ld = '';
        },
      })
      .on('[data-runtime="name"]', {
        element(e) {
          e.setInnerContent(name);
        },
      })
      .on('[data-runtime="blurb"]', {
        element(e) {
          e.setInnerContent(inline(record.blurb[locale]), { html: true });
        },
      })
      .on('[data-runtime="source-link"]', {
        element(e) {
          e.setAttribute('href', record.sourceHref);
        },
      })
      .on('[data-runtime="file-name"]', {
        element(e) {
          e.setInnerContent(record.file);
        },
      })
      .on('[data-runtime-corpus]', {
        element(e) {
          if (e.getAttribute('data-runtime-corpus') !== record.corpus) e.remove();
        },
      })
      .on('[data-runtime-tab]', {
        element(e) {
          const key = e.getAttribute('data-runtime-tab')!;
          if (panes[key] === undefined) e.remove();
          else if (key === 'source') e.setInnerContent(record.file);
        },
      })
      .on('[data-runtime-pane]', {
        element(e) {
          const key = e.getAttribute('data-runtime-pane')!;
          pane = panes[key];
          if (pane === undefined) e.remove();
          else if (key === 'source') e.setAttribute('data-entry-line', String(record.entryLine));
        },
      })
      .on('[data-runtime-code]', {
        element(e) {
          // One span per line, so the pane can open on the line the shader starts at
          // (src/scripts/example-stage.ts), as a built pane does.
          const lines = (pane ?? '').split('\n');
          e.setInnerContent(
            lines
              .map(
                (line, i) =>
                  `<span class="runtime-line">${escapeHtml(line)}${i < lines.length - 1 ? '\n' : ''}</span>`,
              )
              .join(''),
            { html: true },
          );
        },
      })
      .on('[data-playground]', {
        element(e) {
          e.setAttribute('data-examples', JSON.stringify([playgroundExample]));
          e.setAttribute('data-default-example', record.id);
        },
      })
      .on('[data-gpu-frame]', {
        element(e) {
          if (!record.still) return;
          // Astro scopes the Playground's styles by an attribute on each of its elements, so
          // the still carries the frame's own.
          const scope = [...e.attributes].find(([n]) => n?.startsWith('data-astro-cid-'));
          e.prepend(
            `<img src="/stills/${record.id}.webp" alt="" loading="eager" decoding="async"${scope ? ` ${scope[0]}` : ''}>`,
            { html: true },
          );
        },
      })
      .transform(template)
  );
}

/** /guide/examples/<id>/ and its Korean twin. */
async function examplePage(request: Request, url: URL, env: Env): Promise<Response> {
  const match = /^(\/ko)?\/guide\/examples\/([^/]+)\/$/.exec(url.pathname);
  const built = await env.ASSETS.fetch(request);
  // The routes end in a slash, and the asset handler redirects a path without one only when
  // the build has the page; a newer example's page gets the same redirect here.
  if (built.status === 404 && /^(\/ko)?\/guide\/examples\/[a-z0-9-]+$/.test(url.pathname))
    return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 307);
  if (!match || built.status !== 404) {
    // The template is not a page of its own.
    if (match?.[2] === TEMPLATE_ID)
      return env.ASSETS.fetch(new Request(new URL(`${match[1] ?? ''}/guide/examples/-/`, url)));
    return built;
  }
  const [, prefix = '', id = ''] = match;
  if (!ID.test(id) || request.method !== 'GET') return built;
  const record = await readJson<ExampleRecord>(env, `examples/${id}.json`);
  if (!record) return built;
  const template = await env.ASSETS.fetch(
    new Request(new URL(`${prefix}/guide/examples/${TEMPLATE_ID}/`, url)),
  );
  if (!template.ok) return built;
  const page = fill(template, record, prefix ? 'ko' : 'en', `/guide/examples/${id}/`);
  const headers = new Headers(page.headers);
  headers.set('cache-control', 'public, max-age=60');
  headers.set('x-typeshade-example', 'release');
  return new Response(page.body, { status: 200, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/data/')) return api(request, url, env);
    if (url.pathname.startsWith('/s/')) return openShare(url, env);
    if (/^(\/ko)?\/guide\/examples\//.test(url.pathname)) return examplePage(request, url, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
