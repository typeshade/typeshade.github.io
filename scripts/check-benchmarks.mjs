// End-to-end instrument check: real WGSL, browser Worker, consent UI and local Wrangler D1.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchChromium } from './playwright.mjs';
import { checkRegressions } from './check-regressions.mjs';

const scratch = mkdtempSync(path.join(tmpdir(), 'typeshade-benchmarks-'));
const port = 40000 + Math.floor(Math.random() * 2000);
const url = `http://127.0.0.1:${port}`;
const wrangler = 'node_modules/wrangler/bin/wrangler.js';
const env = { ...process.env, WRANGLER_SEND_METRICS: 'false' };
execFileSync(
  'node',
  [wrangler, 'd1', 'migrations', 'apply', 'typeshade', '--local', '--persist-to', scratch],
  { env, stdio: 'pipe' },
);
const server = spawn(
  'node',
  [
    wrangler,
    'dev',
    '--local',
    '--ip',
    '127.0.0.1',
    '--port',
    String(port),
    '--persist-to',
    scratch,
  ],
  { env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] },
);
let logs = '';
server.stdout.on('data', (s) => {
  logs += s;
});
server.stderr.on('data', (s) => {
  logs += s;
});
let browser;
const catalog = JSON.parse(readFileSync('src/lib/benchmarks/catalog-v1.json', 'utf8'));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${url}/benchmarks/`)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* server starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, `Local Worker did not start: ${logs.slice(-3000)}`);
  browser = await launchChromium();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let posts = 0;
  let workerLoads = 0;
  page.on('request', (r) => {
    if (r.url().includes('/data/benchmarks/') && r.method() === 'POST') posts++;
    if (/runner\.worker-.*\.js/.test(r.url())) workerLoads++;
  });
  const record = async () =>
    JSON.parse(
      await page.locator('[data-benchmarks]:not([data-paired]) [data-record]').textContent(),
    );
  const run = async () => {
    await page.locator('[data-benchmarks]:not([data-paired]) [data-run]').click();
    await page.waitForFunction(
      () => document.querySelector('[data-benchmarks]:not([data-paired]) [data-stop]').disabled,
      {},
      { timeout: 90000 },
    );
    return record();
  };
  await page.goto(`${url}/benchmarks/`);
  assert(await page.locator('[data-benchmarks]:not([data-paired]) [data-send]').isDisabled());
  assert.equal(
    await page.locator('[data-benchmarks]:not([data-paired]) [data-consent]').isChecked(),
    false,
  );
  assert.equal(posts, 0);
  assert.equal(workerLoads, 0);
  assert.equal(
    await page.locator('[data-benchmarks]:not([data-paired]) [data-record]').textContent(),
    '',
  );
  const first = await run();
  assert.equal(first.status, 'complete');
  assert.equal(first.results.length, catalog.cases.length);
  assert(
    first.results.every(
      (r) =>
        r.status === 'passed' &&
        r.corruptionDetected &&
        r.checkedValues > 0 &&
        r.wallMs.length === 3,
    ),
  );
  assert(first.results.every((r) => r.gpuNs === null || r.gpuNs.every((n) => n > 0)));
  assert.equal(first.metadata.webgl.state, 'available');
  assert.equal(typeof first.metadata.webgl.debugExtension, 'boolean');
  assert.equal(posts, 0);
  assert(await page.locator('[data-benchmarks]:not([data-paired]) [data-send]').isDisabled());
  await page.locator('[data-benchmarks]:not([data-paired]) [data-consent]').check();
  await page.locator('[data-benchmarks]:not([data-paired]) [data-send]').click();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-benchmarks]:not([data-paired]) [data-send-status]')
      .textContent.startsWith('Results received.'),
  );
  assert.equal(posts, 1);
  assert(await page.locator('[data-benchmarks]:not([data-paired]) [data-send]').isDisabled());
  const retry = await page.evaluate(
    async (r) =>
      (
        await fetch('/data/benchmarks/records/', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ consent: true, record: r }),
        })
      ).status,
    first,
  );
  assert.equal(retry, 200);
  const invalid = structuredClone(first);
  invalid.digest = 'bad';
  assert.equal(
    await page.evaluate(
      async (r) =>
        (
          await fetch('/data/benchmarks/records/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ consent: true, record: r }),
          })
        ).status,
      invalid,
    ),
    400,
  );
  assert.equal((await fetch(`${url}/data/benchmarks/records/`)).status, 405);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-benchmarks]:not([data-paired]) [data-download]').click();
  const download = await downloadPromise;
  assert(download.suggestedFilename().includes(first.id));
  await download.saveAs(path.join(scratch, 'download.json'));
  assert.deepEqual(JSON.parse(readFileSync(path.join(scratch, 'download.json'), 'utf8')), first);

  // Stop an extended run. No completion timings are fabricated for the interrupted work.
  await page.locator('[data-benchmarks]:not([data-paired]) [data-consent]').uncheck();
  await page
    .locator('[data-benchmarks]:not([data-paired]) [data-profile]')
    .selectOption('extended');
  await page.locator('[data-benchmarks]:not([data-paired]) [data-run]').click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[data-benchmarks]:not([data-paired]) [data-results] tr').length >
      0,
  );
  await page.locator('[data-benchmarks]:not([data-paired]) [data-stop]').click();
  const partial = await record();
  assert.equal(partial.status, 'cancelled');
  assert(partial.results.length > 0 && partial.results.length < catalog.cases.length * 3);
  assert.equal(
    await page.locator('[data-benchmarks]:not([data-paired]) [data-consent]').isChecked(),
    false,
  );

  const extended = await run();
  assert.equal(extended.status, 'complete');
  assert.equal(extended.results.length, catalog.cases.length * 3);
  assert(extended.results.every((r) => r.wallMs.length === 15 && r.corruptionDetected));

  // Deny timestamp support and renderer extension in the actual Worker runtime.
  await page.route('**/runner.worker-*.js', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `const originalHas = GPUSupportedFeatures.prototype.has; GPUSupportedFeatures.prototype.has = function(n) { return n === 'timestamp-query' ? false : originalHas.call(this,n); }; const originalExtension = WebGL2RenderingContext.prototype.getExtension; WebGL2RenderingContext.prototype.getExtension = function(n) { return n === 'WEBGL_debug_renderer_info' ? null : originalExtension.call(this,n); };\n${await response.text()}`,
    });
  });
  await page.locator('[data-benchmarks]:not([data-paired]) [data-profile]').selectOption('quick');
  const noTiming = await run();
  assert.equal(noTiming.status, 'complete');
  assert.equal(noTiming.metadata.webgpu.timestamps, false);
  assert(noTiming.results.every((r) => r.gpuNs === null));
  assert.equal(noTiming.metadata.webgl.debugExtension, false);
  assert.equal(noTiming.metadata.webgl.unmaskedRenderer, null);
  await page.unrouteAll();

  // GPU output rejection probe: the compiled layout output is deliberately wrong.
  await page.route('**/runner.worker-*.js', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    assert(source.includes('out[i] = src[i].f0;'));
    await route.fulfill({
      response,
      body: source.replaceAll('out[i] = src[i].f0;', 'out[i] = src[i].f0 + 1.0;'),
    });
  });
  const broken = await run();
  assert.equal(broken.status, 'failed');
  assert(broken.results.some((r) => r.status === 'failed' && r.reason === 'validation'));
  assert.equal(broken.results.filter((r) => r.status === 'passed').length, 0);
  await page.unrouteAll();

  // No adapter is an explicit outcome, without invented zero-time samples.
  await page.route('**/runner.worker-*.js', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `GPU.prototype.requestAdapter = async () => null;\n${await response.text()}`,
    });
  });
  const unsupported = await run();
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(unsupported.results.length, 0);
  assert.equal(unsupported.metadata.webgpu.available, false);
  await page.unrouteAll();

  // Both localized pages, mobile/desktop, both themes, with the navigation opened.
  const measurements = [];
  mkdirSync('shots/benchmarks', { recursive: true });
  await checkRegressions(page, url);
  for (const locale of ['', '/ko'])
    for (const width of [390, 1440])
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`${url}${locale}/benchmarks/`);
        assert.equal((await run()).status, 'complete');
        await page.locator('[data-paired] [data-run]').click();
        await page.waitForFunction(
          () => document.querySelector('[data-paired] [data-stop]').disabled,
          {},
          { timeout: 90000 },
        );
        const paired = JSON.parse(await page.locator('[data-paired] [data-record]').textContent());
        assert.equal(paired.status, 'complete');
        assert.equal(await page.locator('[data-paired] [data-table] thead').isVisible(), true);
        assert.equal(
          await page.locator('[data-benchmarks]:not([data-paired]) [data-table] thead').isVisible(),
          true,
        );
        assert.equal(
          await page
            .locator('[data-benchmarks]:not([data-paired]) [data-results] td')
            .first()
            .evaluate((el) => getComputedStyle(el).display),
          'table-cell',
        );
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
          document.documentElement.classList.toggle('dark', value === 'dark');
        }, theme);
        await page.screenshot({
          path: `shots/benchmarks/${locale ? 'ko' : 'en'}-${width}-${theme}.png`,
          fullPage: true,
        });
        if (width === 390) await page.locator('.site-menu > summary').click();
        else
          await page
            .locator('.site-lang')
            .first()
            .evaluate((el) => {
              el.open = true;
            });
        await page.screenshot({
          path: `shots/benchmarks/${locale ? 'ko' : 'en'}-${width}-${theme}-menu.png`,
          fullPage: true,
        });
        measurements.push(
          await page.evaluate(
            ({ locale, width, theme }) => {
              const rect = (selector) => {
                const r = document.querySelector(selector).getBoundingClientRect();
                return { width: r.width, height: r.height };
              };
              const added = document.querySelector('[data-paired]');
              added.hidden = true;
              const footerBefore = rect('.site-footer');
              const headerBefore = rect('.site-header');
              const controlsBefore = rect('[data-benchmarks]:not([data-paired]) [data-controls]');
              added.hidden = false;
              return {
                locale,
                width,
                theme,
                document: document.documentElement.scrollWidth,
                heading: document.querySelector('h1').textContent,
                header: rect('.site-header'),
                footerBefore,
                headerBefore,
                controlsBefore,
                footer: rect('.site-footer'),
                controls: rect('[data-benchmarks]:not([data-paired]) [data-controls]'),
                comparison: rect('[data-paired] [data-controls]'),
                comparisonTable: rect('[data-paired] [data-table]'),
              };
            },
            { locale, width, theme },
          ),
        );
      }
  assert(measurements.every((r) => r.document <= r.width));
  assert.deepEqual(errors, []);
  writeFileSync('shots/benchmarks/measurements.json', JSON.stringify(measurements, null, 2));
  writeFileSync('shots/benchmarks/instrument-record.json', JSON.stringify(first, null, 2));
  console.log(
    `benchmarks: ${first.results.length} GPU workloads; consent, D1 storage/retry/rejection, download, cancellation, absent timestamps/renderer info, corrupt GPU output, no adapter and localized layouts passed. Software GPU execution is instrument validation.`,
  );
} finally {
  await browser?.close();
  if (process.platform === 'win32') server.kill('SIGTERM');
  else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      /* already stopped */
    }
  }
  await new Promise((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once('exit', resolve);
  });
  rmSync(scratch, { recursive: true, force: true });
}
