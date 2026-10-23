# Concise documentation menu

The owner requested short, conventional menu labels on 2026-10-23 UTC.
The site baseline is `fda26c5a1ea7ececf08a36a00c67a74bf0e3ddde`.

## Scope

Use Docs for the header entry, Getting Started for the introductory navigation group,
and Quick Start for the installation page. Apply these names consistently in both locales,
including mobile navigation, the sidebar, footer, page heading and related entry links.
Retain existing destinations, localization, page descriptions and layout dimensions.
Use the conventional spelling Getting Started.

Verification and publication are in progress.

## Git installation

The owner also requested installation through an ordinary Git URL with npm.
Update the shared install command, package imports, setup instructions and pre-release text.
Verify the Git dependency's actual source entry points before documenting the execution command.
The repository itself can keep its compiler submodule; this change concerns reader installation.

## Observations

The live header contained Use TypeShade / TypeShade 사용하기 in both desktop and mobile navigation.
Captured 24 production views at 1440 and 390 pixels in both languages and themes.
The new labels are Docs, Getting Started, Quick Start and Playground.

Installed the public Git URL in an isolated npm project on 2026-10-23 UTC.
The resolved compiler revision was `e126e9af8642af7182a50044f552219a17070f99`.
The Git dependency exports TypeScript source; plain Node rejects type stripping under node_modules.
The documented tsx commands successfully compiled the page's gradient sample and generated its host views.
Plain Vite has the same source-loading limitation; running its CLI through tsx built the sample successfully.
Verified the documented npm prepare and npm build scripts with the installed Git dependency.
This source-install path does not require a compiler pin change or npm publishing hooks.

Menu changes and reader installation form the documentation entry workflow in this PR.

The owner separately reported slider movement and missing plot axes. Those graphics corrections
will be tracked in a separate pull request; this PR retains navigation and installation scope.
