// Playwright, resolved without making it a dependency of this site. The capture scripts run
// on a workstation and never in the build or the deploy, so the module and the browser binary are
// named by environment variables.
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
    // WebGPU on SwiftShader needs all of these.
    args: [
      '--enable-unsafe-webgpu',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--use-vulkan=swiftshader',
      '--enable-features=Vulkan',
    ],
  })
}
