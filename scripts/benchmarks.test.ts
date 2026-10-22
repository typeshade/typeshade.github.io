import { afterEach, beforeEach, expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { benchmarkRequest, cleanupBenchmarks } from '../worker/benchmarks.ts';
import {
  catalog,
  parseRecord,
  storageBytes,
  outputLength,
  type BenchRecord,
} from '../src/lib/benchmarks/contract.ts';
import {
  EXPERIMENTS,
  PROFILES,
  SUITES,
  RECORD_BYTES,
  HOURLY_LIMIT,
  DAILY_LIMIT,
} from '../src/lib/benchmarks/definitions.ts';
import { fixture, matches } from '../src/lib/benchmarks/fixtures.ts';

export function exampleRecord(): BenchRecord {
  return {
    schema: 1,
    revision: catalog.revision,
    compiler: catalog.compiler,
    digest: catalog.digest,
    id: crypto.randomUUID(),
    started: '2026-10-22T00:00:00.000Z',
    finished: '2026-10-22T00:00:01.000Z',
    profile: 'quick',
    suites: [...SUITES],
    status: 'complete',
    orderSeed: 1,
    metadata: {
      userAgent: 'test-browser',
      webgpu: {
        available: true,
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
    },
    results: EXPERIMENTS.map((e) => ({
      id: e.id,
      n: 16384,
      status: 'passed',
      reason: 'none',
      setupMs: 1,
      wallMs: [1, 2, 3],
      gpuNs: null,
      gpuTiming: 'unsupported',
      checkedValues: outputLength(e, 16384),
      corruptionDetected: true,
      storageBytes: storageBytes(e, 16384),
    })),
  };
}
let sqlite: Database;
let db: D1Database;
beforeEach(() => {
  sqlite = new Database(':memory:');
  sqlite.exec(readFileSync('worker/migrations/0008_benchmarks.sql', 'utf8'));
  const statement = (sql: string, args: unknown[] = []) => ({
    bind(...values: unknown[]) {
      return statement(sql, values);
    },
    async first() {
      return sqlite.query(sql).get(...(args as (string | number | null)[]));
    },
    async run() {
      const result = sqlite.query(sql).run(...(args as (string | number | null)[]));
      return { success: true, meta: { changes: result.changes } };
    },
  });
  db = {
    prepare: statement,
    async batch(items: { run(): Promise<unknown> }[]) {
      return Promise.all(items.map((s) => s.run()));
    },
  } as unknown as D1Database;
});
afterEach(() => sqlite.close());
const request = (record: unknown = exampleRecord(), options: RequestInit = {}) =>
  new Request('https://typeshade.dev/data/benchmarks/records/', {
    method: 'POST',
    headers: {
      origin: 'https://typeshade.dev',
      'content-type': 'application/json',
      'cf-connecting-ip': '192.0.2.1',
    },
    body: JSON.stringify({ consent: true, record }),
    ...options,
  });

test('catalog definitions agree; every workload detects corrupted and truncated outputs', () => {
  expect(
    catalog.cases.map(
      ({ source: _source, wgsl: _wgsl, shader: _shader, bindings: _bindings, ...e }) => e,
    ),
  ).toEqual(EXPERIMENTS);
  for (const e of EXPERIMENTS)
    for (const n of PROFILES.extended.sizes) {
      const { expected } = fixture(e, n);
      expect(matches(expected.slice(), expected)).toBe(true);
      const corrupt = expected.slice();
      corrupt[corrupt.length - 1]! ^= 1;
      expect(matches(corrupt, expected)).toBe(false);
      expect(matches(expected.subarray(1), expected)).toBe(false);
    }
});
test('strict provenance, row completeness, nullable timing and exact profile samples', () => {
  expect(parseRecord(exampleRecord()).results).toHaveLength(EXPERIMENTS.length);
  const mutations = [
    (r: any) => {
      r.digest = 'forged';
    },
    (r: any) => {
      r.privateProgram = 'not accepted';
    },
    (r: any) => {
      r.metadata.url = 'not accepted';
    },
    (r: any) => {
      r.results[0].wallMs[0] = NaN;
    },
    (r: any) => {
      r.results[0].gpuNs = [0, 0, 0];
      r.results[0].gpuTiming = 'available';
    },
    (r: any) => {
      r.results[0].n = 1000;
    },
    (r: any) => {
      r.results[0].storageBytes++;
    },
    (r: any) => {
      r.results[0].wallMs.pop();
    },
    (r: any) => {
      r.results[0].corruptionDetected = false;
    },
    (r: any) => {
      r.results.push(r.results[0]);
    },
    (r: any) => {
      r.results.pop();
    },
  ];
  for (const mutate of mutations) {
    const r = exampleRecord();
    mutate(r);
    expect(() => parseRecord(r)).toThrow();
  }
  const partial = exampleRecord();
  partial.status = 'cancelled';
  partial.results = [];
  expect(parseRecord(partial).results).toEqual([]);
});
test('collector stores once, rejects a conflicting retry, and never exposes raw records', async () => {
  const record = exampleRecord();
  expect((await benchmarkRequest(request(record), db)).status).toBe(201);
  expect((await benchmarkRequest(request(record), db)).status).toBe(200);
  record.metadata.userAgent = 'changed';
  expect((await benchmarkRequest(request(record), db)).status).toBe(409);
  expect(sqlite.query('SELECT COUNT(*) AS count FROM benchmark_records').get()).toEqual({
    count: 1,
  });
  expect(
    (await benchmarkRequest(new Request('https://typeshade.dev/data/benchmarks/records/'), db))
      .status,
  ).toBe(405);
});
test('consent, same-origin, body size and JSON limits are enforced before storage', async () => {
  for (const consent of [false, null, undefined])
    expect(
      (
        await benchmarkRequest(
          request(undefined, { body: JSON.stringify({ consent, record: exampleRecord() }) }),
          db,
        )
      ).status,
    ).toBe(400);
  expect(
    (
      await benchmarkRequest(
        request(undefined, {
          headers: { origin: 'https://elsewhere.test', 'content-type': 'application/json' },
        }),
        db,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await benchmarkRequest(
        request(undefined, {
          headers: { origin: 'https://typeshade.dev', 'content-type': 'text/plain' },
        }),
        db,
      )
    ).status,
  ).toBe(415);
  expect(
    (await benchmarkRequest(request(undefined, { body: ' '.repeat(RECORD_BYTES + 1) }), db)).status,
  ).toBe(413);
  expect((await benchmarkRequest(request(undefined, { body: '{' }), db)).status).toBe(400);
  expect(sqlite.query('SELECT COUNT(*) AS count FROM benchmark_records').get()).toEqual({
    count: 0,
  });
});
test('hourly and global limits use server time; expired records and hashes are removed', async () => {
  const now = Date.parse('2026-10-22T03:30:00Z');
  for (let i = 0; i < HOURLY_LIMIT; i++)
    expect((await benchmarkRequest(request(), db, now)).status).toBe(201);
  expect((await benchmarkRequest(request(), db, now)).status).toBe(429);
  expect((await benchmarkRequest(request(), db, now + 3600000)).status).toBe(201);
  expect(JSON.stringify(sqlite.query('SELECT * FROM benchmark_rates').all())).not.toContain(
    '192.0.2.1',
  );
  const day = Math.floor(now / 86400000);
  sqlite.query('UPDATE benchmark_rates SET uses = ? WHERE key = ?').run(DAILY_LIMIT, `day:${day}`);
  const other = request(undefined, {
    headers: {
      origin: 'https://typeshade.dev',
      'content-type': 'application/json',
      'cf-connecting-ip': '192.0.2.2',
    },
  });
  expect((await benchmarkRequest(other, db, now)).status).toBe(429);
  await cleanupBenchmarks(db, now + 91 * 86400000);
  expect(sqlite.query('SELECT COUNT(*) AS count FROM benchmark_records').get()).toEqual({
    count: 0,
  });
  expect(sqlite.query('SELECT COUNT(*) AS count FROM benchmark_rates').get()).toEqual({ count: 0 });
});
test('capacity and storage errors fail without exposing internals', async () => {
  sqlite.exec(`with recursive ids(i) as (values(1) union all select i+1 from ids where i<10000)
    insert into benchmark_records select cast(i as text), 'hash', 0, 9999999999999, '{}' from ids;`);
  expect((await benchmarkRequest(request(), db)).status).toBe(503);
  const broken = {
    prepare() {
      throw new Error('private database details');
    },
  } as unknown as D1Database;
  const response = await benchmarkRequest(request(), broken);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private');
});

test('analysis pairs within runs, separates reported software and counts runs without device claims', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'benchmark-analysis-'));
  try {
    const record = exampleRecord();
    record.metadata.webgpu.architecture = 'swiftshader';
    const file = path.join(dir, 'records.json');
    writeFileSync(file, JSON.stringify([record, record]));
    const summary = JSON.parse(
      execFileSync('bun', ['scripts/benchmark-data.ts', 'analyze', file], { encoding: 'utf8' }),
    );
    expect(summary.duplicatesRemoved).toBe(1);
    expect(summary.summary.length).toBeGreaterThan(0);
    expect(
      summary.summary.every(
        (r: any) =>
          r.runs === 1 &&
          r.rendererClass === 'reported-software' &&
          r.baselineOverCandidateMedian === 1,
      ),
    ).toBe(true);
    writeFileSync(file, JSON.stringify(record));
    expect(
      JSON.parse(
        execFileSync('bun', ['scripts/benchmark-data.ts', 'analyze', file], { encoding: 'utf8' }),
      ).summary.length,
    ).toBeGreaterThan(0);
    record.status = 'cancelled';
    writeFileSync(file, JSON.stringify(record));
    expect(
      JSON.parse(
        execFileSync('bun', ['scripts/benchmark-data.ts', 'analyze', file], { encoding: 'utf8' }),
      ).excludedIncomplete,
    ).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

import {
  regressionCatalog,
  type RegressionRecord,
} from '../src/lib/benchmarks/regression-contract.ts';
import retainedCatalogs from '../src/lib/benchmarks/regression-catalogs.json';
import { parseAnyRecord } from '../src/lib/benchmarks/records.ts';
import {
  APPLICATIONS,
  WORKLOAD_REVISION,
  INSTRUMENT_REVISION,
  applicationInput,
  expectedApplication,
  numbersMatch,
} from '../src/lib/benchmarks/workloads.ts';
import { nextBatch, MAX_DISPATCHES, validDeviceSamples } from '../src/lib/benchmarks/timing.ts';
import { pairedResults, summarizePaired } from '../src/lib/benchmarks/comparison.ts';
import { postBenchmarkRecord } from '../src/lib/benchmarks/send-record.ts';
import { reportGroups, formatChange } from '../src/lib/benchmarks/report.ts';
function pairedRecord(): RegressionRecord {
  const metadata = exampleRecord().metadata;
  const ids = [...regressionCatalog.builds[0]!.cases.map((e) => e.id), ...APPLICATIONS];
  return {
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
    started: '2026-10-22T00:00:00.000Z',
    finished: '2026-10-22T00:00:01.000Z',
    profile: 'quick',
    status: 'complete',
    orderSeed: 1,
    metadata,
    peers: [structuredClone(metadata), structuredClone(metadata)],
    loadMs: [1, 2],
    results: ids.flatMap((id) =>
      [0, 1].map((build) => {
        const e = regressionCatalog.builds[0]!.cases.find((e) => e.id === id);
        return {
          id,
          n: 16384,
          build: build === 0 ? ('baseline' as const) : ('candidate' as const),
          kind: e
            ? ('compiled' as const)
            : id === 'resident-image'
              ? ('resident' as const)
              : ('host' as const),
          status: 'passed' as const,
          reason: 'none' as const,
          setupMs: 1,
          coldMs: 2,
          wallMs: build === 0 ? [2, 4, 6] : [1, 2, 3],
          readbackMs: id === 'resident-image' ? [1, 2, 3] : null,
          gpuNs: null,
          gpuTiming: 'unsupported' as const,
          dispatches: e?.dispatches ?? (id === 'resident-image' ? 16 : 1),
          checkedValues: e
            ? outputLength(e as any, 16384)
            : id === 'particles'
              ? 16384 * 8
              : id === 'peak'
                ? 1
                : id === 'collect'
                  ? 381
                  : 16384,
          corruptionDetected: true,
          logicalBytes: e
            ? storageBytes(e as any, 16384)
            : 16384 * (id === 'particles' ? 32 : id === 'collect' ? 8 : 4),
          peakBufferBytes: build === 0 ? 8192 : 4096,
          bufferAllocations: 3,
          gpuSubmissions: 4,
        };
      }),
    ),
  };
}
test('legacy and paired provenance, complete pairs and checked outputs are enforced', () => {
  expect(parseAnyRecord(exampleRecord()).schema).toBe(1);
  expect(parseAnyRecord(pairedRecord()).schema).toBe(2);
  const retained = retainedCatalogs[0]!;
  const older = pairedRecord();
  older.revision = retained.workloadRevision;
  older.instrument = retained.instrument;
  const retainedIds = [...retained.builds[0]!.cases.map((e) => e.id), ...APPLICATIONS];
  older.results = older.results.filter((row) => retainedIds.includes(row.id));
  older.digest = retained.digest;
  older.workload = retained.workload;
  older.builds = [retained.builds[0]!.revision, retained.builds[1]!.revision];
  older.runtimes = [retained.builds[0]!.runtimeDigest, retained.builds[1]!.runtimeDigest];
  expect(parseAnyRecord(older).schema).toBe(2);
  for (const mutate of [
    (r: any) => r.builds.reverse(),
    (r: any) => r.runtimes.reverse(),
    (r: any) => (r.workload = '0'.repeat(64)),
    (r: any) => r.results.pop(),
    (r: any) => r.results[0].checkedValues--,
    (r: any) => r.results[1].dispatches++,
    (r: any) => r.results[0].wallMs.pop(),
    (r: any) => r.results.push(r.results[0]),
    (r: any) => (r.results[0].gpuNs = [0, 0, 0]),
    (r: any) => r.peers.pop(),
    (r: any) => (r.instrument = 'unversioned'),
  ]) {
    const r = pairedRecord();
    mutate(r);
    expect(() => parseAnyRecord(r)).toThrow();
  }
  const partial = pairedRecord();
  partial.status = 'cancelled';
  partial.results = partial.results.slice(0, 2);
  expect(parseAnyRecord(partial).results.length).toBe(2);
  expect(pairedResults(partial)).toEqual([]);
});
test('calibration is bounded and device validity uses only measured samples', () => {
  let count = 1;
  while (count < MAX_DISPATCHES) count = nextBatch(count, null);
  expect(count).toBe(MAX_DISPATCHES);
  expect(nextBatch(count, null)).toBe(count);
  expect(nextBatch(4, 3e6)).toBe(4);
  expect(validDeviceSamples([4000, 8000, 4000])).toEqual([4000, 8000, 4000]);
  expect(validDeviceSamples([4000, null, 4000])).toBeNull();
  expect(validDeviceSamples([0, 4000])).toBeNull();
});
test('unified workload contains each original experiment and application once per build', () => {
  expect(regressionCatalog.builds[0]!.cases.map((c) => c.id)).toEqual(
    catalog.cases.map((c) => c.id),
  );
  const r = pairedRecord();
  expect(r.results).toHaveLength(54);
  expect(new Set(r.results.map((row) => `${row.id}:${row.n}:${row.build}`)).size).toBe(54);
  expect(reportGroups(r, 16384, 'wall').map((g) => [g.section, g.items.length])).toEqual([
    ['applications', 5],
    ['data', 11],
    ['compute', 6],
    ['execution', 5],
  ]);
  for (const id of [
    'transfer-upload',
    'transfer-readback',
    'atomics-bins-1',
    'submission-batched',
    'submission-separate',
  ]) {
    const invalid = pairedRecord();
    invalid.results.find((row) => row.id === id)!.dispatches++;
    expect(() => parseAnyRecord(invalid)).toThrow();
  }
  const forged = pairedRecord();
  const transfer = forged.results.find((row) => row.id === 'transfer-upload')!;
  forged.metadata.webgpu.timestamps = true;
  transfer.gpuNs = [1, 2, 3];
  transfer.gpuTiming = 'available';
  expect(() => parseAnyRecord(forged)).toThrow();
});
test('section report separates sample overlap, missing measurements and invalid comparisons', () => {
  const r = pairedRecord();
  const item = () =>
    reportGroups(r, 16384, 'wall')
      .flatMap((g) => g.items)
      .find((i) => i.id === 'image')!;
  expect(item().change).toBe(-50);
  expect(item().state).toBe('overlap');
  r.results.find((row) => row.id === 'image' && row.build === 'baseline')!.wallMs = [8, 9, 10];
  expect(item().state).toBe('lower');
  r.results.find((row) => row.id === 'image' && row.build === 'candidate')!.wallMs = [11, 12, 13];
  expect(item().state).toBe('higher');
  expect(reportGroups(r, 16384, 'gpu').every((g) => g.items.every((i) => i.change === null))).toBe(
    true,
  );
  r.status = 'cancelled';
  expect(item().change).toBeNull();
  r.status = 'complete';
  r.peers[1]!.webgpu.device = 'different';
  expect(item().change).toBeNull();
});
test('report percentage labels keep direction without a negative zero', () => {
  expect(formatChange(-0.01)).toBe('0.0');
  expect(formatChange(-0)).toBe('0.0');
  expect(formatChange(-0.06)).toBe('-0.1');
  expect(formatChange(0.06)).toBe('0.1');
});
test('application references cover cold fields, insertion order and output corruption', () => {
  const input = applicationInput(16384);
  for (const id of APPLICATIONS) {
    const expected = expectedApplication(id, input);
    expect(numbersMatch(expected.slice(), expected)).toBe(true);
    const bad = expected.slice();
    bad[bad.length - 1]! += 1;
    expect(numbersMatch(bad, expected)).toBe(false);
    expect(numbersMatch(expected.slice(1), expected)).toBe(false);
  }
  expect(expectedApplication('particles', input).slice(4, 8)).toEqual([1, 2, 3, 4]);
});
test('paired ratios require a complete same-adapter run and expose sample spread', () => {
  const r = pairedRecord();
  const pairs = pairedResults(r);
  expect(pairs).toHaveLength(27);
  expect(pairs[0]!.wallRatio).toBe(2);
  expect(pairs[0]!.bufferRatio).toBe(2);
  expect(pairs[0]!.baselineWallP90).toBe(4);
  const repeated = structuredClone(r);
  repeated.id = crypto.randomUUID();
  const summary = summarizePaired([r, r, repeated]);
  expect(summary.every((row) => row.runs === 2)).toBe(true);
  expect(summary.find((row: any) => row.metric === 'wallRatio')?.median).toBe(2);
  r.peers[1]!.webgpu.architecture = 'different';
  expect(pairedResults(r)).toEqual([]);
});
test('shared sender validates consent and reports stable receipts on idempotent retries', async () => {
  const record = pairedRecord();
  const first = await benchmarkRequest(request(record), db);
  expect(first.status).toBe(201);
  const receipt: any = await first.json();
  expect(receipt.id).toBe(record.id);
  const retry = await benchmarkRequest(request(record), db);
  expect(retry.status).toBe(200);
  expect(await retry.json()).toEqual({ ...receipt, code: 'duplicate' });
  let sent = 0;
  const send = (async (_url: any, options: any) => {
    sent++;
    return benchmarkRequest(request(undefined, { body: options.body }), db);
  }) as typeof fetch;
  expect((await postBenchmarkRecord(record, false, send)).status).toBe('failed');
  expect(sent).toBe(0);
  expect((await postBenchmarkRecord({ ...record, workload: 'bad' }, true, send)).status).toBe(
    'failed',
  );
  expect(sent).toBe(0);
  expect(await postBenchmarkRecord(record, true, send)).toEqual({
    status: 'sent',
    id: receipt.id,
    receivedAt: receipt.receivedAt,
  });
  expect(sent).toBe(1);
  expect(
    await postBenchmarkRecord(
      record,
      true,
      (async () => new Response('{}', { status: 429 })) as typeof fetch,
    ),
  ).toEqual({ status: 'failed', code: 'rate' });
});
