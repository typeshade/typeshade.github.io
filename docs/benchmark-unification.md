# Unified benchmark

## Request and baseline

The owner requested one benchmark that includes every existing experiment and correctness
check, with one run control, progress indicator, result ID and reporting flow. Site baseline
is `13786f8cfab945084b6b5dac891adce1466248bc`. The compiler pin remains
`94203d3cab6433065bbe111c3b93f66a4058828e`.

## Scope

- Combine every device experiment and application case in one versioned workload.
- Run each case against both exact compiler/runtime builds, with alternating samples.
- Merge overlapping cases so each case appears once per size and build.
- Check outputs and unchanged inputs, and reject deliberately corrupted results.
- Provide one profile selector, run/stop control and progress indicator.
- Show grouped comparison cards with horizontal bars, raw values and sample variability.
- Offer timing and buffer-memory views, with explicit unavailable values and JSON inspection.
- Keep one result ID, consent control, JSON download, report request and receipt.
- Keep older reports readable and separate incompatible measurement cohorts.
- Preserve voluntary reporting, private D1 storage, retention and rate limits.

## Validation

Build and audit both localized pages. Check artifact reproducibility and retained report
contracts. Run the complete workload in Chromium with WebGPU, including transfer, atomics,
submission patterns, application calls and resident calls. Check negative GPU outputs,
cancellation, missing timing support, consent, retries and local D1 collection. Inspect both
languages and themes at 390 and 1440 pixels, including menus and populated results.

## Status

In progress. This change does not implement proposal 0082 or close proposal 0081 deviation D1.
Record the validation commands, dates and results before marking the pull request ready.
