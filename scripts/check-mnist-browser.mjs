// Browser integration regression for the MNIST lab, using *official SHA-256 verified* IDX
// bytes delivered locally to Chromium. All TypeShade WebGPU/WebGL2 math is real.
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { parseIdx } from '../vendor/shader-dsl/journeys/mnist/idx.mjs';
import { referenceTrain, reference, referencePredict } from '../vendor/shader-dsl/journeys/mnist/reference.mjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChromium } from './playwright.mjs';
import { serveDist } from './serve-dist.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = 39000 + Math.floor(Math.random() * 1000);

// Always exercise the original official MNIST dataset with known SHA-256 hashes.
// The browser itself verifies the same checksums a second time before parsing IDX.
const officialSha256 = {
  'train-images-idx3-ubyte.gz': '440fcabf73cc546fa21475e81ea370265605f56be210a4024d2ca8f203523609',
  'train-labels-idx1-ubyte.gz': '3552534a0a558bbed6aed32b30c495cca23d567ec52cac8be1a0730e8010255c',
  't10k-images-idx3-ubyte.gz': '8d422c7b0a1c1c79245a5bcf07fe86e33eeafee792b84584aec276f5a2dbc4e6',
  't10k-labels-idx1-ubyte.gz': 'f7ae60f92e00ec6debd23a6088c31dbd2371eca3ffa0defaefb259924204aec6',
};
const paths = new Map();
for (const [name, expected] of Object.entries(officialSha256)) {
  const data = execFileSync(
    'curl',
    [
      '--fail',
      '--silent',
      '--show-error',
      '--location',
      '--retry',
      '2',
      'https://storage.googleapis.com/cvdf-datasets/mnist/' + name,
    ],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  const digest = createHash('sha256').update(data).digest('hex');
  if (digest !== expected) throw new Error('Official MNIST checksum mismatch: ' + name);
  paths.set(name, data);
}

// Independent double-precision oracle uses the exact same official samples/seed.
const training = parseIdx(
  gunzipSync(paths.get('train-images-idx3-ubyte.gz')),
  gunzipSync(paths.get('train-labels-idx1-ubyte.gz')),
  128,
);
const testing = parseIdx(
  gunzipSync(paths.get('t10k-images-idx3-ubyte.gz')),
  gunzipSync(paths.get('t10k-labels-idx1-ubyte.gz')),
  64,
);
const expectedModel = referenceTrain(training, { epochs: 1, batchSize: 16, rate: 0.1, seed: 123 });
let expectedLoss = 0;
let expectedCorrect = 0;
for (let at = 0; at < testing.labels.length; at += 16) {
  const metrics = reference(testing, expectedModel, at, Math.min(16, testing.labels.length - at));
  expectedLoss += metrics.stats[0] * Math.min(16, testing.labels.length - at);
  expectedCorrect += metrics.stats[1];
}
expectedLoss /= testing.labels.length;
const expectedAccuracy = expectedCorrect / testing.labels.length;

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
    const report = /Test accuracy ([0-9.]+)%, Loss ([0-9.]+)/.exec(rows[0]);
    if (!report ||
        Math.abs(Number(report[1]) / 100 - expectedAccuracy) > 0.0025 ||
        Math.abs(Number(report[2]) - expectedLoss) > 0.015)
      throw new Error(tier + ' diverged from independent MNIST f64 reference: ' +
        rows[0] + ', expected accuracy=' + expectedAccuracy + ', loss=' + expectedLoss);
    await page.locator('[data-sample]').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-probabilities] > li').length === 10,
    );
    const prediction = await page.locator('[data-guess]').innerText();
    if (!prediction.startsWith('Prediction:') || errors.length > 0)
      throw new Error(
        tier + ' inference failed: ' + prediction + ', errors: ' + errors.join(' / '),
      );
    const probabilitySum = await page
      .locator('[data-probabilities] meter')
      .evaluateAll((elements) => elements.reduce((sum, el) => sum + el.value, 0));
    if (Math.abs(probabilitySum - 1) > 0.0002)
      throw new Error(tier + ' probability sum mismatch: ' + probabilitySum);
    await page.locator('[data-sample]').click();
    await page.locator('[data-sample]').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-probabilities] > li').length === 10,
    );
    // The UI issues two predictions quickly. Only the final image may be shown.
    const finalIndex = 3;
    const expected = referencePredict(reference(testing, expectedModel, finalIndex, 1).logits);
    await page.waitForFunction(
      ({ predicted, probability }) => {
        const text = document.querySelector('[data-guess]')?.textContent ?? '';
        const match = /Prediction: ([0-9]+) \(([0-9.]+)%\)/.exec(text);
        return match && Number(match[1]) === predicted &&
          Math.abs(Number(match[2]) / 100 - probability) < 0.002;
      },
      { predicted: expected.predicted, probability: expected.probabilities[expected.predicted] },
      { timeout: 30_000 },
    );
    console.log('[mnist] REAL MNIST ' + tier + ': ' + status + '; ' + rows[0] + '; ' + prediction);
    await page.close();
  }
} finally {
  await browser?.close();
  server.close();
}
