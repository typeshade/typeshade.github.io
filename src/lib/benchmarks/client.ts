import type { Copy } from '../../i18n/index.ts';
import { catalog, parseRecord, type BenchRecord, type Metadata } from './contract.ts';
import { PROFILES, type Profile, type Suite } from './definitions.ts';
import { expectedRows } from './contract.ts';
import { median } from './fixtures.ts';

export function mountBenchmarks(root: HTMLElement): void {
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
  let record: BenchRecord | undefined;
  let sending = false;
  let received = false;
  const refresh = () => {
    run.disabled = !!worker || !checkboxes.some((c) => c.checked) || sending;
    stop.disabled = !worker;
    controls.disabled = !!worker || sending;
    consent.disabled = !!worker || sending;
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
  };
  consent.addEventListener('change', refresh);
  checkboxes.forEach((c) => c.addEventListener('change', refresh));
  stop.addEventListener('click', () => finish('cancelled'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && worker) finish('cancelled');
  });
  window.addEventListener('pagehide', () => {
    worker?.terminate();
    clearTimeout(timer);
  });
  run.addEventListener('click', () => {
    if (worker || sending) return;
    const selected = checkboxes.filter((c) => c.checked).map((c) => c.value as Suite);
    if (!selected.length) return;
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
    record = {
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
    consent.checked = false;
    received = false;
    get('send-status').textContent = '';
    get('results').replaceChildren();
    get('empty').hidden = false;
    get('table').hidden = true;
    get('device').hidden = true;
    get('software').hidden = true;
    get('record').textContent = '';
    progress.max = expectedRows(p, selected);
    progress.value = 0;
    progress.hidden = false;
    status.textContent = copy.running;
    const instance = new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });
    worker = instance;
    instance.onmessage = ({ data }) => {
      if (worker !== instance || !record) return;
      if (data.type === 'metadata') {
        record.metadata = data.metadata;
        inspect();
      } else if (data.type === 'progress')
        status.textContent = `${copy.running}: ${data.id}, ${data.n} (${record.results.length}/${progress.max})`;
      else if (data.type === 'result') {
        record.results.push(data.row);
        progress.value = record.results.length;
        const row = document.createElement('tr');
        const cells = [
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
  send.addEventListener('click', async () => {
    if (!record || worker || !consent.checked || sending || received) return;
    sending = true;
    refresh();
    try {
      const checked = parseRecord(record);
      const response = await fetch('/data/benchmarks/records/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consent: true, record: checked }),
      });
      if (!response.ok) {
        get('send-status').textContent =
          response.status === 429 ? copy.rateLimited : copy.sendFailed;
      } else {
        received = true;
        get('send-status').textContent = copy.sent;
      }
    } catch {
      get('send-status').textContent = copy.sendFailed;
    } finally {
      sending = false;
      refresh();
    }
  });
  refresh();
}
