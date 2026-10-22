# Benchmark regressions

## Request and baseline

The owner approved this change on 2026-10-22 UTC. The benchmark must show how
compiler and runtime changes affect the same application. Site baseline is
`02aa4ea9838024aa50c278a1c2d73c674cc4fbf8`. The documentation pin remains
`94203d3cab6433065bbe111c3b93f66a4058828e`.

## Scope

- Retain the first catalog and its collector contract for existing reports.
- Separate fixed workload identity from compiler, runtime and measurement identity.
- Compare two exact TypeShade revisions in one run, with alternating execution order.
- Measure compiled compute programs and complete TypeShade host calls, including
  first calls, repeated calls and repeated work on resident data.
- Include object arrays, image processing, reductions and collection aggregation.
- Record correctness, raw timing samples, bounded dispatch batches and attributable memory counts.
- Exclude warmup timestamps from measured-sample validity. Bound repeated work to avoid long GPU passes.
- Preserve voluntary sending, local inspection, private D1 records and the existing rate limits.
- Report paired ratios and variability without treating runs as independent devices.

## Verification

Run the site build, format and document checks before pushing. Validate both the legacy
and new collector contracts. Exercise actual WebGPU execution in Chromium, including
incorrect-output probes, absent timestamps, cancellation and both localized pages.
Record the exact commands and observed results before marking the pull request ready.
Software execution validates the instrument; physical-device observations determine
performance conclusions.

## Open items

Implementation and validation are in progress. The benchmark does not implement proposal 0082. Proposal 0081 deviation D1 remains open. Compiler proposal 0083 was accepted in
PR #735 and merged as `dab37659`; its implementation is PR #736. This change does not
move the documentation pin or depend on that pending implementation.
