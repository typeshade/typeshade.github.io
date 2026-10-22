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
