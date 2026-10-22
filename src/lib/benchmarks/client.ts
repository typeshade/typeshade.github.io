import type { Copy } from '../../i18n/index.ts';
import { catalog, type BenchRecord, type Metadata } from './contract.ts';
import { regressionCatalog, regressionRows, type RegressionRecord } from './regression-contract.ts';
import { postBenchmarkRecord } from './send-record.ts';
import { INSTRUMENT_REVISION, WORKLOAD_REVISION } from './workloads.ts';
import { PROFILES, type Profile, type Suite } from './definitions.ts';
import { expectedRows } from './contract.ts';
import { median } from './fixtures.ts';

export function mountBenchmarks(root: HTMLElement): void {
  const paired = root.hasAttribute('data-paired');
  const get = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-${name}]`)!;
  const copy = JSON.parse(get('benchmark-copy').textContent!) as Copy['benchmarks'];
  const run = get<HTMLButtonElement>('run');
  const stop = get<HTMLButtonElement>('stop');
  const send = get<HTMLButtonElement>('send');
  const download = get<HTMLButtonElement>('download');
  const consent = get<HTMLInputElement>('consent');
  const profile = get<HTMLSelectElement>('profile');
  const controls = get<HTMLFieldSetElement>('controls');
  const status = get('status');
  const progress = get<HTMLProgressElement>('progress');
  const checkboxes = [...root.querySelectorAll<HTMLInputElement>('[data-suite]')];
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let record: BenchRecord | RegressionRecord | undefined;
  let sending = false;
  let received = false;
  const refresh = () => {
    run.disabled = !!worker || (!paired && !checkboxes.some((c) => c.checked)) || sending;
    stop.disabled = !worker;
    controls.disabled = !!worker || sending;
    consent.disabled = sending;
    send.disabled = !record || !!worker || !consent.checked || sending || received;
    download.disabled = !record || !!worker;
  };
  const inspect = () => {
    if (!record) return;
    get('record').textContent = JSON.stringify(record, null, 2);
    const m = record.metadata;
    get('device').hidden = false;
    get('webgpu').textContent =
      [m.webgpu.vendor, m.webgpu.architecture, m.webgpu.device, m.webgpu.description]
        .filter(Boolean)
        .join(', ') || copy.unavailable;
    get('webgl').textContent = m.webgl.unmaskedRenderer || m.webgl.renderer || copy.unavailable;
    get('software').hidden =
      ![m.webgpu.description, m.webgpu.device, m.webgpu.architecture].some((s) =>
        /swiftshader|llvmpipe|software rasterizer/i.test(s),
      ) && m.webgpu.fallback !== true;
  };
  const finish = (state: BenchRecord['status']) => {
    worker?.terminate();
    worker = undefined;
    clearTimeout(timer);
    if (record) {
      record.status = state;
      record.finished = new Date().toISOString();
      inspect();
    }
    status.textContent = copy[state];
    progress.hidden = true;
    refresh();
    if (consent.checked) void sendRecord();
  };
  consent.addEventListener('change', refresh);
  checkboxes.forEach((c) => c.addEventListener('change', refresh));
  stop.addEventListener('click', () => finish('cancelled'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && worker) finish('cancelled');
  });
  document.addEventListener('benchmark-start', (event) => {
    if ((event as CustomEvent).detail !== root && worker) finish('cancelled');
  });
  window.addEventListener('pagehide', () => {
    worker?.terminate();
    clearTimeout(timer);
  });
  run.addEventListener('click', () => {
    if (worker || sending) return;
    document.dispatchEvent(new CustomEvent('benchmark-start', { detail: root }));
    const selected = checkboxes.filter((c) => c.checked).map((c) => c.value as Suite);
    if (!paired && !selected.length) return;
    const p = profile.value as Profile;
    const empty: Metadata = {
      userAgent: navigator.userAgent.slice(0, 512),
      webgpu: {
        available: false,
        vendor: '',
        architecture: '',
        device: '',
        description: '',
        fallback: null,
        timestamps: false,
        features: [],
        limits: {
          maxBufferSize: 0,
          maxStorageBufferBindingSize: 0,
          maxComputeInvocationsPerWorkgroup: 0,
        },
      },
      webgl: {
        state: 'unavailable',
        debugExtension: false,
        vendor: null,
        renderer: null,
        unmaskedVendor: null,
        unmaskedRenderer: null,
      },
    };
    record = paired
      ? {
          schema: 2,
          revision: WORKLOAD_REVISION,
          instrument: INSTRUMENT_REVISION,
          digest: regressionCatalog.digest,
          workload: regressionCatalog.workload,
          builds: [regressionCatalog.builds[0]!.revision, regressionCatalog.builds[1]!.revision],
          runtimes: [
            regressionCatalog.builds[0]!.runtimeDigest,
            regressionCatalog.builds[1]!.runtimeDigest,
          ],
          id: crypto.randomUUID(),
          started: new Date().toISOString(),
          finished: new Date().toISOString(),
          profile: p,
          status: 'cancelled',
          orderSeed: crypto.getRandomValues(new Uint16Array(1))[0]!,
          metadata: empty,
          peers: [],
          loadMs: [],
          results: [],
        }
      : {
          schema: 1,
          revision: catalog.revision,
          compiler: catalog.compiler,
          digest: catalog.digest,
          id: crypto.randomUUID(),
          started: new Date().toISOString(),
          finished: new Date().toISOString(),
          profile: p,
          suites: selected,
          status: 'cancelled',
          orderSeed: crypto.getRandomValues(new Uint16Array(1))[0]!,
          metadata: empty,
          results: [],
        };
    received = false;
    get('send-status').textContent = '';
    get('results').replaceChildren();
    if (paired) {
      get('pair-results').replaceChildren();
      get('pairs').hidden = true;
    }
    get('empty').hidden = false;
    get('table').hidden = true;
    get('device').hidden = true;
    get('software').hidden = true;
    get('record').textContent = '';
    progress.max = paired ? regressionRows(PROFILES[p].sizes) : expectedRows(p, selected);
    progress.value = 0;
    progress.hidden = false;
    status.textContent = copy.running;
    const instance = paired
      ? new Worker(new URL('./regression.worker.ts', import.meta.url), { type: 'module' })
      : new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });
    worker = instance;
    instance.onmessage = ({ data }) => {
      if (worker !== instance || !record) return;
      if (data.type === 'metadata') {
        record.metadata = data.metadata;
        if (record.schema === 2) {
          record.peers = data.peers;
          record.loadMs = data.loadMs;
        }
        inspect();
      } else if (data.type === 'progress')
        status.textContent = `${copy.running}: ${data.id}, ${data.n} (${record.results.length}/${progress.max})`;
      else if (data.type === 'result') {
        record.results.push(data.row);
        progress.value = record.results.length;
        const row = document.createElement('tr');
        const cells = paired
          ? [
              data.row.id,
              copy[data.row.build as 'baseline' | 'candidate'],
              data.row.n,
              data.row.peakBufferBytes,
              data.row.coldMs.toFixed(3),
              median(data.row.wallMs)?.toFixed(3) ?? copy.unavailable,
              median(data.row.gpuNs ?? [])?.toFixed(0) ?? copy.unavailable,
              data.row.status === 'passed' ? copy.passed : copy.failed,
            ]
          : [
              data.row.id,
              data.row.n,
              data.row.storageBytes,
              median(data.row.wallMs)?.toFixed(3) ?? copy.unavailable,
              median(data.row.gpuNs ?? [])?.toFixed(0) ?? copy.unavailable,
              data.row.status === 'passed' ? copy.passed : copy.failed,
            ];
        for (const [index, value] of cells.entries()) {
          const cell = document.createElement('td');
          if (index === 0) {
            const code = document.createElement('code');
            code.textContent = String(value);
            cell.append(code);
          } else cell.textContent = String(value);
          row.append(cell);
        }
        get('results').append(row);
        get('empty').hidden = true;
        get('table').hidden = false;
        if (record.schema === 2 && data.row.build === 'candidate') {
          const a = record.results.find(
            (r) => r.build === 'baseline' && r.id === data.row.id && r.n === data.row.n,
          );
          const b = record.results.find(
            (r) => r.build === 'candidate' && r.id === data.row.id && r.n === data.row.n,
          );
          const sameAdapter =
            record.peers.length === 2 &&
            JSON.stringify(record.peers[0]!.webgpu) === JSON.stringify(record.peers[1]!.webgpu);
          if (sameAdapter && a?.status === 'passed' && b?.status === 'passed') {
            const ratio = (x: number | null, y: number | null) =>
              x !== null && y !== null && x > 0 && y > 0 ? (x / y).toFixed(3) : copy.unavailable;
            const pair = document.createElement('tr');
            for (const value of [
              a.id,
              a.n,
              ratio(median(a.wallMs), median(b.wallMs)),
              ratio(median(a.gpuNs ?? []), median(b.gpuNs ?? [])),
              ratio(a.peakBufferBytes, b.peakBufferBytes),
            ]) {
              const td = document.createElement('td');
              td.textContent = String(value);
              pair.append(td);
            }
            get('pair-results').append(pair);
            get('pairs').hidden = false;
          }
        }
      } else if (data.type === 'done') finish(data.status);
    };
    instance.onerror = () => {
      if (worker === instance) finish('failed');
    };
    worker.postMessage({ profile: p, suites: selected, seed: record.orderSeed });
    timer = setTimeout(() => {
      if (worker === instance) finish('cancelled');
    }, PROFILES[p].seconds * 1000);
    refresh();
  });
  download.addEventListener('click', () => {
    if (!record || worker) return;
    const href = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = href;
    a.download = `typeshade-benchmark-${record.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  });
  const sendRecord = async () => {
    if (!record || worker || !consent.checked || sending || received) return;
    sending = true;
    refresh();
    try {
      const outcome = await postBenchmarkRecord(record, consent.checked);
      if (outcome.status === 'failed') {
        get('send-status').textContent =
          outcome.code === 'rate' ? copy.rateLimited : copy.sendFailed;
      } else {
        received = true;
        get('send-status').textContent =
          copy.sent +
          ' ' +
          copy.receipt.replace('{id}', outcome.id).replace('{time}', outcome.receivedAt);
      }
    } catch {
      get('send-status').textContent = copy.sendFailed;
    } finally {
      sending = false;
      refresh();
    }
  };
  send.addEventListener('click', () => void sendRecord());
  refresh();
}
