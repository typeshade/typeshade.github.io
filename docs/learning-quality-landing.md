# Approved learning quality release

Owner approval: 2026-10-23, following PR #228.

Consolidate the approved dependent changes #219 through #228 into #228 targeting main:
Pow sizing, the function template and remaining lessons, contextual navigation, precision
and standalone search-entry articles, title spacing, Korean headings and the writing skill,
and the complete Korean prose pass. The earlier change records retain their measurements
and individual review evidence. PR #129 is unrelated and is not included.

Integration baseline: main `c5ce2d2`, compiler `3b40e065e17fd4d6929d4c30ab45656da73f0fcd`.
Preserve the newly published override, runtime-info and input-projection changes. Resolve
six Korean translation conflicts with the new source hashes and technical content intact.
Keep main as the integration commit's first parent: rule-history computes the previous
compiler pin from first-parent history, so this matches the final squash landing on main.
No compiler pointer differs from main in the consolidated pull request.

Layout review: retain the existing shell and document maximum widths. Pow's canvas is
capped at 32rem, with 90% inline size, and square controls at 22rem. Added worked diagrams
have a 352px maximum. New model grids describe their data; no existing page grid gained
columns. Title-to-body spacing is 24px. Original measurements and browser evidence are in
the individual change records. Integration verification and deployment are pending.
