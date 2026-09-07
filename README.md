# typeshade.dev

The TypeShade website, deployed to GitHub Pages by `.github/workflows/deploy.yml`.

The compiler is consumed the documented way: `vendor/shader-dsl` is the read-only mirror
[typeshade/typeshade](https://github.com/typeshade/typeshade) as a git submodule, and every
code sample and every number on the page is computed at build time from it.

```bash
git clone --recurse-submodules https://github.com/typeshade/typeshade.github.io
bun install
bun run dev
```

To move the pinned compiler forward: `git -C vendor/shader-dsl pull origin main`, then commit
the submodule pointer.
