import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
export async function checkRegressions(page, url) {
  // Supply faults in the real nested-worker realm; Chromium does not route its script requests.
  const fault = async (patch) =>
    page.route('**/regression.worker-*.js', async (route) => {
      const response = await route.fetch();
      const bootstrap = `const NativeWorker=Worker;self.Worker=class extends NativeWorker {
      constructor(url,options) {
        const text='import '+JSON.stringify(String(url))+';\\nconst originalFetch=self.fetch.bind(self);self.fetch=(u,o)=>originalFetch(new URL(u,'+${JSON.stringify(JSON.stringify(url))}+'),o);\\n'+${JSON.stringify(patch)};
        super(URL.createObjectURL(new Blob([text],{type:'text/javascript'})),options);
      }
    };\n`;
      await route.fulfill({ response, body: bootstrap + (await response.text()) });
    });
  await page.goto(`${url}/benchmarks/`);
  const root = page.locator('[data-paired]');
  const record = async () => JSON.parse(await root.locator('[data-record]').textContent());
  const run = async () => {
    await root.locator('[data-run]').click();
    await page.waitForFunction(
      () => document.querySelector('[data-paired] [data-stop]').disabled,
      {},
      { timeout: 120000 },
    );
    return record();
  };
  assert.equal(await root.locator('[data-consent]').isChecked(), false);
  const quick = await run();
  writeFileSync('shots/benchmarks/paired-quick.json', JSON.stringify(quick, null, 2));
  assert.equal(quick.status, 'complete', JSON.stringify(quick.results.at(-1)));
  assert.equal(quick.results.length, 30);
  assert(
    quick.results.every(
      (r) =>
        r.status === 'passed' &&
        r.corruptionDetected &&
        r.checkedValues > 0 &&
        r.wallMs.length === 3,
    ),
  );
  assert(quick.results.filter((r) => r.kind === 'compiled').every((r) => r.gpuSubmissions > 0));
  assert(quick.results.some((r) => r.kind === 'resident' && r.readbackMs.length === 3));
  assert.equal(await root.locator('[data-pair-results] tr').count(), 15);
  assert.equal(await root.locator('[data-send]').isDisabled(), true);
  await root.locator('[data-profile]').selectOption('extended');
  const extended = await run();
  assert.equal(extended.status, 'complete');
  assert.equal(extended.results.length, 90);
  assert(extended.results.every((r) => r.wallMs.length === 15 && r.status === 'passed'));
  writeFileSync('shots/benchmarks/paired-extended.json', JSON.stringify(extended, null, 2));
  await root.locator('[data-profile]').selectOption('quick');
  // Consent before a run sends the completed record once and shows a stable receipt.
  await root.locator('[data-consent]').check();
  await run();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-paired] [data-send-status]')
        .textContent.startsWith('Results received.'),
    {},
    { timeout: 20000 },
  );
  assert((await root.locator('[data-send-status]').textContent()).includes((await record()).id));
  assert(await root.locator('[data-send]').isDisabled());
  await root.locator('[data-consent]').uncheck();
  // Each version worker reports an unsupported adapter instead of zero timings.
  await fault('GPU.prototype.requestAdapter=async()=>null;');
  const unsupported = await run();
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(unsupported.results.length, 0);
  await page.unrouteAll();
  // Artifact bytes are checked before importing a runtime.
  await fault(
    "const fetchArtifact=self.fetch;self.fetch=async(u,o)=>{const r=await fetchArtifact(u,o);return String(u).includes('/benchmarks/artifacts/')?new Response((await r.text())+'/* modified */',{headers:r.headers}):r;};",
  );
  const corrupt = await run();
  assert.equal(corrupt.status, 'failed');
  assert.equal(corrupt.results.length, 0);
  await page.unrouteAll();
  // Timestamp support can be absent without failing application correctness.
  await fault(
    "const has=GPUSupportedFeatures.prototype.has;GPUSupportedFeatures.prototype.has=function(n){return n==='timestamp-query'?false:has.call(this,n)};",
  );
  const noTiming = await run();
  assert.equal(noTiming.status, 'complete');
  assert(noTiming.results.every((r) => r.gpuNs === null));
  await page.unrouteAll();
  // A corrupt GPU program fails validation and can send its failure with prior consent.
  await fault(
    "const create=GPUDevice.prototype.createShaderModule;GPUDevice.prototype.createShaderModule=function(d){return create.call(this,{...d,code:d.code.replaceAll('out[i] = src[i].f0;','out[i] = src[i].f0 + 1.0;')});};",
  );
  await root.locator('[data-consent]').check();
  const wrong = await run();
  assert.equal(wrong.status, 'failed');
  assert(wrong.results.some((r) => r.status === 'failed' && r.reason === 'validation'));
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-paired] [data-send-status]')
        .textContent.startsWith('Results received.'),
    {},
    { timeout: 20000 },
  );
  await root.locator('[data-consent]').uncheck();
  await page.unrouteAll();
  await root.locator('[data-profile]').selectOption('extended');
  await root.locator('[data-run]').click();
  await page.waitForFunction(
    () => document.querySelectorAll('[data-paired] [data-results] tr').length > 0,
  );
  await root.locator('[data-stop]').click();
  const partial = await record();
  assert.equal(partial.status, 'cancelled');
  assert(partial.results.length > 0 && partial.results.length < 90);
  assert.equal(partial.results.length % 2, 0);
  console.log(
    'paired benchmarks: actual GPU, host calls, resident chains, receipts, integrity, absent timings and cancellation passed',
  );
}
