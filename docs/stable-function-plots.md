# Stable function plot controls

The owner reported moving slider tracks when inverseSqrt alternates fractional and integer readouts,
and missing readable x and y axes, on 2026-10-23 UTC.
Baseline: site `fda26c5a1ea7ececf08a36a00c67a74bf0e3ddde`, compiler `91c2fe31`.

## Scope

Reserve readout width from each control's numeric range and formatting before interaction.
Show explicit coordinate axes and ticks for plotted function examples, using their actual bounds.
Apply the common control correction to other live examples without changing numeric precision.
Keep graph programs, canvas size, article width and site grids intact.
Track navigation and Git installation separately in site PR 231.

Implementation and verification are in progress.
