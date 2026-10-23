# GLSL precision learning page

## Request

Answer searches for `precision highp float;` with an explanation useful without TypeShade.

## Outcome

Create an English and Korean concept page at `/guide/concepts/glsl-precision/`. Explain the
statement and its scope, stage and version defaults, precision choices, practical failure
modes, and capability inspection before the optional compiler-specific section.

Use a compact numerical rounding model with explicit assumptions. Keep device-reported
capabilities separate from simulated arithmetic. Preserve the existing compiler-derived
internals and link readers between the learning page and emit-option documentation.

## Review

Check normative claims against Khronos specifications and MDN. Review both languages at
1440 and 390 in both themes. Check native fallback, model controls, browser capability
queries, internal discovery, Pagefind search, metadata, links, and existing navigation.
