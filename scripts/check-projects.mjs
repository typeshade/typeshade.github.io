// The projects the Playground's Download writes (src/lib/project-export.ts), checked the way a
// reader uses one. For every example of the built site:
//
//   1. the Playground opens it, holds its clock at 3 s, and its canvas is photographed;
//   2. Download is clicked, and the zip unpacked;
//   3. the project's dependencies are installed (once, and shared), `tshc sync` writes the host
//      views, `tshc check src/` and `tsc -p tsconfig.json` must report nothing, and `vite build`
//      must build it;
//   4. the built project is served and opened with its clock held at 3 s, and its frame is
//      compared with the Playground's.
//
// A project that installs, checks and builds but draws another picture than the Playground is
// the thing a reader would meet and the site would not, so the comparison fails the check.
//
//   bun run build && node scripts/check-projects.mjs [id ...]
//
// TYPESHADE_TARBALL=<a packed typeshade .tgz> installs that in place of the version a project
// names, for a compiler not on npm yet. PROJECTS_PORT picks the site's port (4481), and
// PROJECTS_WORK the folder the projects are unpacked into (a fresh temporary one).
// PLAYGROUND_MONACO_VIA_NODE=1 fetches the editor from its CDN with Node, as
// scripts/check-playground.mjs does, for a sandbox whose browser has no route out.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChromium } from './playwright.mjs';
import { serveDist } from './serve-dist.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!existsSync(path.join(dist, 'playground', 'index.html'))) {
  console.error('[projects] dist/ has no Playground: run `bun run build` first.');
  process.exit(2);
}
const only = process.argv.slice(2);
const work = process.env.PROJECTS_WORK ?? mkdtempSync(path.join(tmpdir(), 'typeshade-projects-'));
mkdirSync(work, { recursive: true });
const tarball = process.env.TYPESHADE_TARBALL ? path.resolve(process.env.TYPESHADE_TARBALL) : '';
/** The clock both sides are held at, the one every build-time still is captured at. */
const SECONDS = 3;
/** The largest mean difference per channel, out of 255, two frames of one program may show:
 *  the Playground and the project draw with the same shader on the same device, so what
 *  remains is the canvas's size and filtering. */
const MEAN_LIMIT = 6;
const CDN = 'cdn.jsdelivr.net';
const VIA_NODE = process.env.PLAYGROUND_MONACO_VIA_NODE === '1';

// ── the zip ──────────────────────────────────────────────────────────────────────────────

/** The files of a stored zip (src/scripts/workspace-folder.ts), by name. */
function unzip(bytes) {
  const files = new Map();
  let at = 0;
  while (bytes.readUInt32LE(at) === 0x04034b50) {
    const size = bytes.readUInt32LE(at + 18);
    const nameLength = bytes.readUInt16LE(at + 26);
    const extra = bytes.readUInt16LE(at + 28);
    const name = bytes.subarray(at + 30, at + 30 + nameLength).toString('utf8');
    const start = at + 30 + nameLength + extra;
    files.set(name, bytes.subarray(start, start + size));
    at = start + size;
  }
  return files;
}

// ── the Playground's side ────────────────────────────────────────────────────────────────

async function settle(page) {
  await page.waitForFunction(
    () => {
      const tool = document.querySelector('[data-playground]');
      const frame = document.querySelector('[data-gpu-frame]');
      if (!tool || !frame || frame.dataset.settled !== tool.dataset.version) return false;
      const canvas = document.querySelector('[data-gpu-canvas]');
      if (!canvas) return false;
      if (canvas.dataset.plotted === '1') return true;
      const backend = canvas.dataset.backend;
      if (backend && backend !== 'none') return (canvas.__shader?.frames ?? 0) > 0;
      return (document.querySelector('[data-gpu-note]')?.textContent ?? '').length > 0;
    },
    null,
    { timeout: 60_000 },
  );
}

const versionOf = (page) =>
  page.evaluate(() => Number(document.querySelector('[data-playground]')?.dataset.version ?? 0));

/** Opens an example in the Playground, photographs its canvas at the held clock, and clicks
 *  Download. */
async function fromPlayground(page, id) {
  const before = await versionOf(page);
  await page.selectOption('[data-example]', id);
  await page.waitForFunction(
    (b) => Number(document.querySelector('[data-playground]')?.dataset.version ?? 0) > b,
    before,
    { timeout: 20_000 },
  );
  await settle(page);
  const state = await page.evaluate(() => {
    const canvas = document.querySelector('[data-gpu-canvas]');
    return {
      backend: canvas?.dataset.backend ?? 'none',
      note: (document.querySelector('[data-gpu-note]')?.textContent ?? '').trim(),
    };
  });
  let shot;
  let size;
  if (state.backend === 'webgpu') {
    await page.evaluate(
      (s) => document.querySelector('[data-playground]').__playground.freeze(s),
      SECONDS,
    );
    const framesAt = await page.evaluate(
      () => document.querySelector('[data-gpu-canvas]').__shader?.frames ?? 0,
    );
    await page
      .waitForFunction(
        (n) => (document.querySelector('[data-gpu-canvas]').__shader?.frames ?? 0) >= n + 2,
        framesAt,
        { timeout: 60_000 },
      )
      .catch(() => {});
    await page.waitForTimeout(200);
    // The canvas is transparent over the frame's ground; over black it reads the way the
    // project's opaque canvas does, which shows what a pixel's colour is and not its alpha.
    await page.evaluate(() => {
      const frame = document.querySelector('[data-gpu-frame]');
      if (frame) frame.style.background = '#000';
    });
    await page.waitForTimeout(100);
    const canvas = page.locator('[data-gpu-canvas]');
    size = await canvas.evaluate((c) => [c.clientWidth, c.clientHeight]);
    shot = await canvas.screenshot();
    await page.evaluate(() => {
      document.querySelector('[data-playground]').__playground.freeze(null);
      const frame = document.querySelector('[data-gpu-frame]');
      if (frame) frame.style.background = '';
    });
  }
  await page.evaluate(() => {
    const note = document.querySelector('[data-file-error]');
    if (note) note.textContent = '';
  });
  const download = await Promise.race([
    page.waitForEvent('download', { timeout: 15_000 }),
    page
      .waitForFunction(
        () => (document.querySelector('[data-file-error]')?.textContent ?? '').length > 0,
        null,
        { timeout: 15_000 },
      )
      .then(() => null),
    page.click('[data-download]').then(() => new Promise(() => {})),
  ]);
  if (download === null) {
    const why = await page.evaluate(
      () => document.querySelector('[data-file-error]')?.textContent ?? '',
    );
    return { refused: why, state };
  }
  return { zip: readFileSync(await download.path()), shot, size, state };
}

// ── the project's side ───────────────────────────────────────────────────────────────────

const run = (cwd, command, args) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Installs the dependencies every project names, once, into `work/_deps`. */
function installShared(packageJson) {
  const deps = path.join(work, '_deps');
  if (existsSync(path.join(deps, 'node_modules', 'vite'))) return deps;
  mkdirSync(deps, { recursive: true });
  const manifest = JSON.parse(packageJson);
  if (tarball) manifest.dependencies.typeshade = `file:${tarball}`;
  delete manifest.scripts.prepare;
  writeFileSync(path.join(deps, 'package.json'), JSON.stringify(manifest, null, 2));
  console.log(
    `[projects] installing ${Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).join(', ')}${tarball ? ` (typeshade from ${tarball})` : ''}`,
  );
  run(deps, 'npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error']);
  return deps;
}

/** A project's frame, drawn by its build, with the clock held at `SECONDS`: the page's clock
 *  reads 0 while the program starts, then `SECONDS`, and a few frames are drawn at it. */
async function projectFrame(browser, dir, size) {
  const server = await serveDist(path.join(dir, 'dist'), 4500 + Math.floor(Math.random() * 400));
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on(
    'console',
    (m) => m.type() === 'error' && !/favicon/.test(m.text()) && errors.push(m.text()),
  );
  await page.addInitScript(() => {
    window.__clock = 0;
    performance.now = () => window.__clock;
    const raf = window.requestAnimationFrame.bind(window);
    window.__frames = 0;
    window.requestAnimationFrame = (callback) =>
      raf(() => {
        window.__frames += 1;
        callback(window.__clock);
      });
  });
  try {
    await page.goto(server.url);
    // Polled on a timer: Playwright's default polls on requestAnimationFrame, which would count
    // as the program's frames and move the clock before the program has read its start.
    await page.waitForFunction(() => window.__frames > 1, null, { timeout: 30_000, polling: 100 });
    await page.evaluate((ms) => (window.__clock = ms), SECONDS * 1000);
    const at = await page.evaluate(() => window.__frames);
    await page.waitForFunction((n) => window.__frames >= n + 3, at, {
      timeout: 30_000,
      polling: 100,
    });
    return { shot: await page.screenshot(), errors };
  } catch (error) {
    return { shot: undefined, errors: [...errors, String(error?.message ?? error)] };
  } finally {
    await page.close();
    server.close();
  }
}

/** A dispatch project's page: the names of the bindings it lists, once it has listed them. */
async function projectListing(browser, dir) {
  const server = await serveDist(path.join(dir, 'dist'), 4500 + Math.floor(Math.random() * 400));
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on(
    'console',
    (m) => m.type() === 'error' && !/favicon/.test(m.text()) && errors.push(m.text()),
  );
  try {
    await page.goto(server.url);
    await page
      .waitForFunction(() => document.querySelectorAll('main h2').length > 0, null, {
        timeout: 30_000,
        polling: 100,
      })
      .catch(() => {});
    await page.waitForTimeout(300);
    const titles = await page.$$eval('main h2', (nodes) => nodes.map((n) => n.textContent));
    return { titles, errors };
  } finally {
    await page.close();
    server.close();
  }
}

/** The mean difference per channel, out of 255, between two pictures of one size. */
async function compare(page, a, b) {
  return page.evaluate(
    async ([x, y]) => {
      const load = async (b64) =>
        createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const [p, q] = await Promise.all([load(x), load(y)]);
      const w = Math.min(p.width, q.width);
      const h = Math.min(p.height, q.height);
      const read = (bitmap) => {
        const c = new OffscreenCanvas(w, h).getContext('2d');
        c.drawImage(bitmap, 0, 0, w, h);
        return c.getImageData(0, 0, w, h).data;
      };
      const d1 = read(p);
      const d2 = read(q);
      let sum = 0;
      for (let i = 0; i < d1.length; i += 4)
        sum +=
          Math.abs(d1[i] - d2[i]) +
          Math.abs(d1[i + 1] - d2[i + 1]) +
          Math.abs(d1[i + 2] - d2[i + 2]);
      return sum / ((d1.length / 4) * 3);
    },
    [a.toString('base64'), b.toString('base64')],
  );
}

// ── the run ──────────────────────────────────────────────────────────────────────────────

const site = await serveDist(dist, Number(process.env.PROJECTS_PORT ?? 4481));
const browser = await launchChromium();
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => console.error(`[projects] the Playground threw: ${e.message}`));
  if (VIA_NODE)
    await page.route(`**://${CDN}/**`, async (route) => {
      const response = await fetch(route.request().url());
      return route.fulfill({
        status: response.status,
        headers: { 'content-type': response.headers.get('content-type') ?? 'text/javascript' },
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
  await page.goto(`${site.url}/playground/#example=hello`);
  await page.waitForSelector('[data-example]', { state: 'attached', timeout: 60_000 });
  await settle(page);
  const ids = (
    await page.$$eval('[data-example] option', (options) => options.map((o) => o.value))
  ).filter((id) => id && (only.length === 0 || only.includes(id)));
  const tool = await browser.newPage();
  for (const id of ids) {
    const result = { id, problems: [] };
    results.push(result);
    let from;
    try {
      from = await fromPlayground(page, id);
    } catch (error) {
      result.problems.push(`the Playground: ${error.message.split('\n')[0]}`);
      continue;
    }
    if (from.refused !== undefined) {
      result.refused = from.refused;
      continue;
    }
    const files = unzip(from.zip);
    const folder = [...files.keys()][0]?.split('/')[0];
    const dir = path.join(work, id);
    rmSync(dir, { recursive: true, force: true });
    for (const [name, bytes] of files) {
      const file = path.join(work, id, name.slice(folder.length + 1));
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, bytes);
    }
    const deps = installShared(files.get(`${folder}/package.json`).toString('utf8'));
    symlinkSync(path.join(deps, 'node_modules'), path.join(dir, 'node_modules'));
    for (const [step, command, args] of [
      ['tshc sync', 'npx', ['tshc', 'sync']],
      ['tshc check', 'npx', ['tshc', 'check', 'src/']],
      ['tsc', 'npx', ['tsc', '-p', 'tsconfig.json']],
      ['vite build', 'npx', ['vite', 'build', '--logLevel', 'error']],
    ]) {
      try {
        run(dir, command, args);
      } catch (error) {
        const text = `${error.stdout ?? ''}${error.stderr ?? ''}`
          .trim()
          .split('\n')
          .slice(0, 6)
          .join(' | ');
        result.problems.push(`${step}: ${text}`);
        break;
      }
    }
    if (result.problems.length > 0) continue;
    // A dispatch's project lists what the entry wrote, under the binding's name, where a drawn
    // one has a canvas: it has to run, and list each binding the entry writes.
    if (readFileSync(path.join(dir, 'index.html'), 'utf8').includes('<main></main>')) {
      const listed = await projectListing(browser, dir);
      if (listed.errors.length > 0)
        result.problems.push(`the page: ${listed.errors.slice(0, 2).join(' | ')}`);
      else if (listed.titles.length === 0) result.problems.push('the page lists nothing');
      else result.note = `lists ${listed.titles.join(', ')}`;
      continue;
    }
    if (!from.shot) {
      result.note = `the Playground drew on ${from.state.backend}: ${from.state.note.slice(0, 80)}`;
      continue;
    }
    const frame = await projectFrame(browser, dir, from.size);
    if (frame.errors.length > 0)
      result.problems.push(`the page: ${frame.errors.slice(0, 2).join(' | ')}`);
    if (!frame.shot) continue;
    writeFileSync(path.join(dir, 'playground.png'), from.shot);
    writeFileSync(path.join(dir, 'project.png'), frame.shot);
    result.mean = await compare(tool, from.shot, frame.shot);
    if (result.mean > MEAN_LIMIT)
      result.problems.push(
        `its frame differs from the Playground's: ${result.mean.toFixed(1)} per channel`,
      );
  }
} finally {
  await browser.close();
  site.close();
}

const refused = results.filter((r) => r.refused !== undefined);
const failed = results.filter((r) => r.problems.length > 0);
for (const r of results) {
  const status =
    r.refused !== undefined
      ? `refused: ${r.refused}`
      : r.problems.length > 0
        ? `FAIL ${r.problems.join('; ')}`
        : `ok${r.mean !== undefined ? ` (${r.mean.toFixed(2)})` : ''}${r.note ? ` ${r.note}` : ''}`;
  console.log(`  ${r.id}: ${status}`);
}
console.log(
  `[projects] ${results.length} examples: ${results.length - refused.length - failed.length} projects install, check, build and draw what the Playground draws; ${refused.length} refused; ${failed.length} failed. Projects in ${work}`,
);
process.exit(failed.length > 0 ? 1 : 0);
