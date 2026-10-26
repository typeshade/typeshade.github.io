# TypePlot v0.2.1 update

## Baselines

- Site baseline: `6125b072f167065c645a69008dc10a54d2fd0fe2`.
- Released dependency: `github:typeshade/typeplot#v0.2.1`.
- Release tag object: `87e80af`; target commit: `a5a9cef7626b0d780ee7899672c736eac0d5c356`.
- Compiler pin remains `91c2fe31de045ebf0e5f2c333ac98b95cc460280`.

## Compatibility changes

The site continues to import `typeplot/shaders` and `typeplot/interaction`. No TypePlot
renderer or compiler is added to the site browser runtime. The new shared shader documents
include the font and palette modules, and scalar spatial plots use `plotScalar3D`.

Graph blocks receive the release's camera, transform and appearance uniforms. Ordinary
shader blocks retain their existing reserved fields and primary-block ordering. The extra
font uniform block is reflected and bound by instance on both GPU tiers.

The released base font atlas is copied unchanged into `public/vendor/typeplot`, with its
licenses, NOTICE and SHA-256 provenance. `bun run sync:typeplot-assets` regenerates these
files from the installed package, and the build checks them. GPU hosts upload the image from
its URL. The Playground decodes pixels only when CPU evaluation needs the texture. These are
texture-decoding operations; chart graphics remain named TypeShade shader output.

LiveShader, edit compilation and Playground handoff share shader sources and defaults.
Resolution is measured in CSS pixels for plot layout and actual buffer density controls
font antialiasing. Editor and diagnostic link helpers load on use to preserve the initial
script budget. A reset or page exit invalidates a pending editor mount.

Shared module listings and generated targets populate when expanded. The main editable
callback remains server-rendered, and plaintext noscript fallbacks retain shader source
access without JavaScript. Shared library source is excluded from the page search index.

## Verification status

- Frozen lock installation, asset provenance check, site/worker TypeScript and changed-file
  formatting pass.
- The first full site build passes. All 49 changed graph stills were regenerated with
  Chromium/WebGPU using the existing production capture pipeline. The final build is running.
- Static import analysis initially measured 127,359 bytes of initial JavaScript. Deferred
  editor and error helpers address this; final artifact measurement is pending.
- No test suite was added or run for this update. Production browser capture regenerates
  the existing fallback images. Full browser regression checks remain CI work.
- Compiler pin, page widths, padding and grid columns are unchanged.

This PR is not merged or deployed. The v0.1.1 adoption evidence in
[typeplot-package-integration.md](typeplot-package-integration.md) is historical.
