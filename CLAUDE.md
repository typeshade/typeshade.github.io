# Working in this repository with Claude Code

Read `DESIGN.md` for the writing and design rules and `.claude/skills/typeshade-site/SKILL.md`
for the maintenance workflow. This file adds what keeps the copy true to the compiler it
documents.

## The copy follows the pinned compiler

`vendor/shader-dsl` is the compiler, pinned as a git submodule. A page, a component or a script
that names something the compiler removed is wrong even when the build is green, so moving the
pin is a step with checks, not a memory:

- When a change moves the pin, run
  `bun vendor/shader-dsl/scripts/downstream-impact.ts --repo typeshade.github.io --submodule vendor/shader-dsl`
  and fix every line it lists: each one still names an export or a file the new compiler
  removes. It also lists every compiler change proposal the new pin implements that names this
  repository and that `compiler-changes.md` does not record yet: do the work the proposal lists,
  then add its id to that file. Then run `bun run check:guide`, which lists the Korean guide
  pages the new `AUTHORING.md` leaves stale.
- When you edit inside a `LINT.IfChange` block, edit its `LINT.ThenChange` targets in the same
  commit. `TYPESHADE_DOCS_ROOT=$PWD bun vendor/shader-dsl/scripts/ifchange.ts` checks this.
- `.claude/settings.json` runs both checks before every `git commit` and blocks the commit while
  one fails. A line of its own in the message, `NO_IFTTT=<reason>`, waives an unmet
  `LINT.ThenChange` and nothing else. Write it only after reading the target: a reviewer relies
  on it.
- CI runs the same checks on every pull request (`.github/workflows/deploy.yml`).

The compiler's `AGENTS.md` (section "Docs follow the code") describes the conventions these
checks come from.

## Merging

`main` is protected by a GitHub ruleset: a pull request, a Code Owner review (`.github/CODEOWNERS`)
and the required checks (`build`). The repository admin can bypass it, and an agent acting
through the owner's account can too, so the rule is written here:

- Merge only when every required check is green on the pull request's current head. A red
  check is fixed, never bypassed.
- Bypass only the review requirement, and only when the owner has said in the conversation to
  merge that pull request. The owner cannot approve their own pull request, so their go-ahead
  is the review.
- Never push to `main` directly, and never force-push it.
