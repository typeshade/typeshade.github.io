// Browser integration regression for the MNIST lab. The IDX responses are small deterministic
// fixtures delivered by Playwright; the TypeShade WebGPU/WebGL2 compute dispatches are real.
// No dependency on the public dataset host or backend CPU training during this smoke test.
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChromium } from './playwright.mjs';
import { serveDist } from './serve-dist.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = 39000 + Math.floor(Math.random() * 1000);

function fixture(split, image) {
  const count = split === 'train' ? 256 : 64;
  const bytes = Buffer.alloc((image ? 16 : 8) + count * (image ? 784 : 1));
  bytes.writeUInt32BE(image ? 2051 : 2049, 0);
  bytes.writeUInt32BE(count, 4);
  if (image) {
    bytes.writeUInt32BE(28, 8);
    bytes.writeUInt32BE(28, 12);
    for (let row = 0; row < count; row++) {
      const label = row % 10;
      for (let i = 0; i < 784; i++) {
        const x = i % 28,
          y = Math.floor(i / 28);
        bytes[16 + row * 784 + i] = Math.abs(x - (label * 2 + 4)) < 2 && y > 5 && y < 22 ? 255 : 0;
      }
    }
  } else {
    for (let row = 0; row < count; row++) bytes[8 + row] = row % 10;
  }
  return gzipSync(bytes);
}

const paths = new Map([
  ['train-images-idx3-ubyte.gz', fixture('train', true)],
  ['train-labels-idx1-ubyte.gz', fixture('train', false)],
  ['t10k-images-idx3-ubyte.gz', fixture('test', true)],
  ['t10k-labels-idx1-ubyte.gz', fixture('test', false)],
]);
const server = await serveDist(dist, port);
let browser;
try {
  browser = await launchChromium();
  for (const tier of ['webgpu', 'webgl2']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/storage/v1/b/cvdf-datasets/o/**', async (route) => {
      const objectPath = decodeURIComponent(new URL(route.request().url()).pathname);
      const name = objectPath.split('/').at(-1);
      const bytes = paths.get(name);
      if (!bytes) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status: 200,
        body: bytes,
        contentType: 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
      });
    });
    await page.goto(server.url + '/guide/mnist/');
    await page.locator('[data-tier]').selectOption(tier);
    await page.locator('[data-count]').selectOption('128');
    await page.locator('[data-epochs]').selectOption('1');
    await page.locator('[data-start]').click();
    await page.waitForFunction(
      (name) => {
        const status = document.querySelector('[data-status]')?.textContent ?? '';
        return status.startsWith('Training finished') || status.startsWith('Unable to run MNIST');
      },
      undefined,
      { timeout: 360_000 },
    );
    const status = await page.locator('[data-status]').innerText();
    if (!status.startsWith('Training finished') || !status.includes(tier)) {
      throw new Error(tier + ' did not train through the requested TypeShade backend: ' + status);
    }
    const rows = await page.locator('[data-results] > li').allInnerTexts();
    if (rows.length !== 1 || !rows[0].includes('Test accuracy') || !rows[0].includes('Loss'))
      throw new Error(tier + ' produced no measured test metrics: ' + rows.join(' | '));
    await page.locator('[data-sample]').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-probabilities] > li').length === 10,
    );
    const prediction = await page.locator('[data-guess]').innerText();
    if (!prediction.startsWith('Prediction:') || errors.length > 0)
      throw new Error(
        tier + ' inference failed: ' + prediction + ', errors: ' + errors.join(' / '),
      );
    console.log('[mnist] ' + tier + ': ' + status + '; ' + rows[0] + '; ' + prediction);
    await page.close();
  }
} finally {
  await browser?.close();
  server.close();
}
