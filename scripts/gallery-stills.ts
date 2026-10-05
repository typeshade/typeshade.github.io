// Stills for the gallery's approved entries that have none: the entries sent in before the
// Playground captured one, and any whose capture failed (docs/cloudflare.md, The gallery). Each
// entry's share is opened on typeshade.dev in a headless browser, at its page and fragment and
// not through its short link, so the capture counts no view. The canvas is photographed once a
// backend draws, cropped to the gallery's still, encoded as WebP with sharp, then put in R2 and
// recorded in D1. A row that gained a still meanwhile is left as it is.
//
// Run: bun scripts/gallery-stills.ts [--dry-run]
// It reaches the remote bucket and database through wrangler, so it needs CLOUDFLARE_API_TOKEN
// (gallery-setup.yml runs it). --dry-run captures into gallery-stills/ and uploads nothing.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { launchChromium } from './playwright.mjs';
import {
  GALLERY_STILL_BYTES,
  GALLERY_STILL_HEIGHT,
  GALLERY_STILL_WIDTH,
  galleryStillKey,
} from '../src/lib/gallery-data.ts';
import { BUCKET, DATABASE } from '../src/lib/example-data.ts';

const SITE = process.env.GALLERY_SITE ?? 'https://typeshade.dev';
const dryRun = process.argv.includes('--dry-run');
const out = path.resolve('gallery-stills');
/** How long a program has to put a frame up on a software GPU. */
const DRAW_TIMEOUT = 120_000;
const ID = /^[A-Za-z0-9_-]{8,43}$/;

function wrangler(...args: string[]): string {
  const run = Bun.spawnSync(['bunx', 'wrangler', ...args], { stderr: 'inherit' });
  if (run.exitCode !== 0) throw new Error(`wrangler ${args.slice(0, 3).join(' ')} failed`);
  return run.stdout.toString();
}

interface Missing {
  readonly share_id: string;
  readonly path: string;
  readonly fragment: string;
}

const query = `SELECT s.share_id, h.path, h.fragment FROM submissions s JOIN shares h ON h.id = s.share_id
  WHERE s.status = 'approved' AND s.thumbnail is null ORDER BY s.created_at`;
const [answer] = JSON.parse(
  wrangler('d1', 'execute', DATABASE, '--remote', '--json', '--command', query),
) as { results: Missing[] }[];
const missing = (answer?.results ?? []).filter((row) => ID.test(row.share_id));
console.log(`[gallery-stills] ${missing.length} approved entries have no still`);
if (missing.length === 0) process.exit(0);

mkdirSync(out, { recursive: true });
const browser = await launchChromium();
const failed: string[] = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  for (const { share_id: id, path: page, fragment } of missing) {
    const tab = await context.newPage();
    try {
      await tab.goto(`${SITE}${page}#${fragment}`, { waitUntil: 'load' });
      await tab.waitForFunction(
        () => {
          const canvas = document.querySelector<HTMLCanvasElement>('[data-gpu-canvas]');
          return !!canvas && !canvas.hidden && (canvas.dataset.backend ?? 'none') !== 'none';
        },
        null,
        { timeout: DRAW_TIMEOUT },
      );
      // A few seconds of the program's clock, so an animated one is past its first frame.
      await tab.waitForTimeout(3000);
      const png = await tab.locator('[data-gpu-canvas]').screenshot();
      const webp = await sharp(png)
        .resize(GALLERY_STILL_WIDTH, GALLERY_STILL_HEIGHT, { fit: 'cover' })
        .webp({ quality: 82 })
        .toBuffer();
      if (webp.length > GALLERY_STILL_BYTES) throw new Error(`${webp.length} bytes`);
      const file = path.join(out, `${id}.webp`);
      writeFileSync(file, webp);
      console.log(`[gallery-stills] ${id}: ${webp.length} bytes`);
      if (dryRun) continue;
      wrangler(
        'r2',
        'object',
        'put',
        `${BUCKET}/${galleryStillKey(id)}`,
        '--file',
        file,
        '--content-type',
        'image/webp',
        '--remote',
      );
      wrangler(
        'd1',
        'execute',
        DATABASE,
        '--remote',
        '--command',
        `UPDATE submissions SET thumbnail = 'image/webp' WHERE share_id = '${id}' AND thumbnail is null`,
      );
    } catch (error) {
      failed.push(id);
      console.error(`[gallery-stills] ${id}: ${error instanceof Error ? error.message : error}`);
      // What the page showed instead, for the run's artifact: the title (a challenge page names
      // itself there), the Playground's status and canvas lines, and a screenshot.
      const seen = await tab
        .evaluate(() => ({
          title: document.title,
          status: document.querySelector('[data-status]')?.textContent?.trim() ?? '',
          canvas: document.querySelector('[data-gpu-note]')?.textContent?.trim() ?? '',
        }))
        .catch(() => null);
      if (seen) console.error(`[gallery-stills] ${id} showed ${JSON.stringify(seen)}`);
      await tab.screenshot({ path: path.join(out, `${id}-failed.png`) }).catch(() => {});
    } finally {
      await tab.close();
    }
  }
} finally {
  await browser.close();
}
if (failed.length > 0) {
  console.error(`[gallery-stills] no still for ${failed.join(', ')}`);
  process.exit(1);
}
