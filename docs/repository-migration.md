# Website repository migration

## Status

This document records the retirement change prepared from `typeshade/typeshade.github.io`
commit `3ac1d1f` on 2026-10-27. It describes a proposed repository transition. It does not
record a completed cutover.

The active website repository is [typeshade/web](https://github.com/typeshade/web). Use it for
current site development, issues, pull requests, and deployment work. This repository retains
its source tree and Git history as a historical snapshot. This change removes its four
site-maintenance workflows so both repositories cannot run the same site operations.

## Retired workflows

| Workflow | Previous role | Result after this change |
| --- | --- | --- |
| `deploy.yml` | Built and checked the site, created pull-request previews, and deployed the site and gallery Workers from `main`. | This repository no longer builds or deploys the site through Actions. |
| `pin-compiler.yml` | Opened compiler-pin pull requests and dispatched deployment checks. | Compiler pin updates must be maintained in `typeshade/web`. |
| `publish-examples.yml` | Published newer compiler examples to the site's Cloudflare storage on a schedule and on compiler updates. | This repository no longer publishes example data. |
| `gallery-setup.yml` | Ran manual Cloudflare gallery setup and maintenance tasks. | This repository no longer runs gallery operations. |

The deletion of these workflow files changes GitHub Actions for this repository only. It does
not change Cloudflare Workers, R2, D1, DNS, GitHub repository settings, secrets, or the compiler
repository's dispatch configuration. The workflow definitions and credentials needed by the
active repository must be reviewed there before the owner completes the cutover.

## Domain observations

At the baseline commit, `docs/cloudflare.md` records that `typeshade.dev` moved from GitHub
Pages to the Cloudflare Worker on 2026-09-28. It also records that the GitHub Pages A and AAAA
records were removed and that the Pages challenge TXT record remains for organization
verification. `public/CNAME` is absent, and commit `261367d` removed the GitHub Pages deployment
steps.

Read-only HTTP checks on 2026-10-27 returned `404` for both
`https://typeshade.github.io/` and `https://typeshade.github.io/guide/introduction/`. The same
check returned `200` for `https://typeshade.dev/`. These checks confirm the observed responses
at those URLs only. They do not inspect or change DNS, Cloudflare, or GitHub Pages settings.

The GitHub Pages address has no active site response to redirect in these observations. This
change adds no redirect and makes no claim that one has been configured. `typeshade.dev` keeps
its existing serving configuration until the owner separately approves and completes any
production change.

## Cutover boundary

This change does not archive or delete either repository. It does not alter repository rules,
secrets, DNS, Cloudflare resources, or other external settings. It does not deploy a site or
transfer ownership of a domain.

The owner should merge this retirement change only after the active repository has the intended
build, publishing, compiler-pin, and gallery workflows, and after its deployment path has been
verified. The owner handles any later repository, Actions, Cloudflare, DNS, or redirect changes
as separate operations. Until then, this document is a migration record for review, not evidence
that the operational transition is complete.
