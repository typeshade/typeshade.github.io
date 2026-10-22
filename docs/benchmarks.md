# Performance benchmarks

## Request and baseline

The owner requested a general performance benchmark on 2026-10-22 UTC. Visitors can run
several experiments on their own device and voluntarily send the result. The first suite
includes proposal 0082's layout comparison. This is a site feature, not an implementation
of the proposed compiler optimizer.

Implementation starts from site main at `6876351`, with compiler pin `94203d3c`.
The page and collector are in progress. No production deployment is recorded yet.

## Scope

- Versioned experiment definitions, compiled shader fixtures and independent result checks.
- Layout, transfer, memory access, arithmetic, reduction, atomic contention, workgroup size
  and submission experiments, with bounded workload profiles and repetitions.
- WebGPU timing where timestamps are supported, host wall timing and pipeline setup costs.
- WebGPU adapter metadata and separately attributed WebGL renderer information, including
  the optional debug-renderer extension. Missing or redacted values remain unavailable.
- A browser worker with progress, cancellation and partial-result retention.
- English and Korean pages with local results, record inspection, download and explicit
  sending consent. No benchmark starts or sends a record on page load.
- A bounded same-origin collector using the site's existing D1 binding and a migration.
- Private maintainer export and paired-comparison analysis. No public raw-record listing.

## Evidence

Each record identifies the benchmark revision, compiler pin, shader fixtures, workload,
adapter information, browser, repetitions, samples and correctness outcomes. Known software
renderers remain distinguishable. WebGL renderer strings do not identify the WebGPU adapter.
The collector validates shape and provenance; submissions remain untrusted observations.
They do not automatically change compiler policy.

## Validation plan

Check schema rejection, absent timings, consent, cancellation, duplicate submissions, rate
limits and storage failures. Run every experiment in Chromium with real WebGPU execution,
including known-bad output probes. Software execution validates the instrument and does not
establish physical-device performance. Build and audit both locales, then inspect screenshots
at desktop and mobile widths in both themes. Record actual outcomes before requesting review.

The site change follows the existing compiler pin. Public compiler APIs, exposed buffer
layouts and proposal 0081's open deviation D1 remain unchanged.

## Instrument protocol

Catalog `2026-10-22.1` contains 22 cases. Its compiler is `94203d3c`, with emit level `O1`.
`scripts/benchmark-catalog.ts` compiles TypeShade at build-check time. The committed catalog
contains each source, WGSL, binding map and SHA-256. Its digest is
`016e717e5f9e53f0275dfc6b6b0238133b67e19ea9341720365c5c52bc64fa88`.
The browser ships these fixtures and the runner; it does not load the compiler.
The generator refuses to overwrite a changed revision. A future workload change needs a
new catalog and a retained validation contract for earlier records.

- Quick runs use 16,384 elements, one warmup and three samples.
- Standard runs use 16,384 and 65,536 elements, two warmups and seven samples.
- Extended runs add 262,144 elements, three warmups and fifteen samples.
- Profiles stop after 60, 180 and 600 seconds respectively. The visitor can stop sooner.
- A group holds alternatives for one suite and size. Their starting order rotates each
  round from a recorded random seed. Completed groups survive cancellation.
- Each case checks every output before and after timing. A bit flip must fail comparison.
  Input buffers must retain their original bytes. A failure names the active case.
- Fixtures use exact dyadic floats or unsigned integers. They do not need a tolerance.
- Setup includes allocation, pipeline creation and initial upload. Fixture construction,
  validation and setup stay outside timed dispatches.
- Host timing covers encoding, submission and completion, divided by dispatch count.
  Upload timing covers `writeBuffer` through completion. Readback also includes staging
  allocation, GPU copy, mapping and the host copy.
- Device timing covers a compute pass and divides by dispatch count. Missing timestamp
  support and unresolved or zero intervals produce `null`. Separate submits have no device
  interval. They can be compared by host time.
- Storage bytes count the input and output buffers. Uniform, query, staging and workgroup
  memory are additional. The largest layout group holds approximately 40 MiB of storage.

The layout cases cover scalar `f32` fields, full versus projected buffers, and reading one
or all fields. The single-field projected AoS and SoA programs also serve as a noise control.
They do not establish results for mixed types, vector alignment, writes or the full host
object pack/validation/copyback path. The prior 0082 instrument covers that host path.
This page measures WebGPU compute. WebGL supplies attributed renderer metadata in this
revision; WebGL render timings are a future suite.

## Collection and retention

The page starts no experiment or POST on load. Sending requires a finished local record,
an unchecked-by-default consent box and a separate button click. Starting another run
clears consent. Switching tabs cancels active work. JSON inspection and download work
without sending. Each run gets a new random UUID; no persistent device identifier is used.

The record includes the user agent, separately attributed WebGPU and WebGL information,
reported capabilities, workload provenance, status, raw samples and checks. Missing renderer
information remains `null` or empty as reported. WebGL's debug extension can be unavailable.
Its presence does not prove that WebGPU chose the same adapter. Reported software is labelled;
other adapters remain unclassified. Client reports cannot prove independent device counts.

The collector accepts same-origin JSON with explicit consent, up to 256 KiB. It validates
fields, profile sizes, fixture provenance, sample counts, checked-value counts and unique
rows. Identical UUID retries are idempotent; conflicting content returns `409`. It accepts
partial records, which analysis excludes. Submitted values and correctness claims remain
untrusted even after schema validation.

The server allows six new records per address per hour, 2,000 globally per day and at most
10,000 retained records. Rate increments and capacity insertion use atomic SQL statements.
The address is hashed with the current hour and is not stored in records. Temporary rate
entries expire at the end of their period. Records expire after 90 days. The daily cron
deletes expired rows. Export excludes expired rows even before that cleanup runs.
Cloudflare's existing request logs remain governed by the site's infrastructure settings.
No new binding, secret, account login or public raw-record endpoint is required.

## Maintainer commands

Run the collector locally with D1 migration `0008_benchmarks.sql`. `check:benchmarks` applies
all migrations to a temporary local database, starts Wrangler, then removes that database.
It does not submit to production.

1. Run `bun run build`.
2. Run `PLAYWRIGHT_CHROMIUM=/path/to/chromium bun run check:benchmarks`.
3. Authenticate Wrangler using the existing maintainer access when exporting production data.
4. Run `bun scripts/benchmark-data.ts export .cache/benchmark-records.json`.
5. Run `bun scripts/benchmark-data.ts analyze .cache/benchmark-records.json`.

Export uses authenticated D1 access, an expiry filter, a server-time cutoff and UUID paging.
Add `--local` to export the default local D1 database. Analysis also accepts a downloaded
record or an array of records. Keep exported device records outside version control.

Analysis deduplicates run UUIDs and computes baseline/candidate median ratios within each
complete, correct run. It groups by catalog, compiler, profile, size, reported adapter and
browser. It reports run counts, median and p10/p90 ratios, with software separated. These
percentiles describe the submitted runs; they are not confidence intervals or device counts.
Controlled reproduction remains necessary before compiler policy changes.
