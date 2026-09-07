// Playwright, resolved without making it a dependency of this site.
//
// The two capture scripts run on a workstation or a maintenance box, never inside `bun run
// build` and never in the Pages deploy (which builds from the COMMITTED artifacts and their
// hashes). Declaring `playwright` here would put a browser download into every `bun install`
// for two scripts that run when the mark or the hero changes — a few times a year.
//
// So the module and the browser binary are named by environment, and a missing one says
// exactly what to set rather than failing with a bare module-not-found.
export async function launchChromium() {
  const modulePath = process.env.PLAYWRIGHT_MODULE ?? 'playwright'
  let chromium
  try {
    ;({ chromium } = await import(modulePath))
  } catch (cause) {
    throw new Error(
      `[capture] cannot import '${modulePath}'. Point PLAYWRIGHT_MODULE at a Playwright ` +
        `installation (its index.mjs), and PLAYWRIGHT_CHROMIUM at the browser binary.`,
      { cause },
    )
  }
  return chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
    args: [
      // WebGPU on SwiftShader needs all four: --enable-unsafe-webgpu alone still leaves
      // `'gpu' in navigator === false` without --enable-unsafe-swiftshader.
      '--enable-unsafe-webgpu',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--use-vulkan=swiftshader',
      '--enable-features=Vulkan',
    ],
  })
}
