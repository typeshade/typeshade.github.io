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
