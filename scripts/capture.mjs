// usage: pnpm capture [--port 5173]   (needs `pnpm dev` running)
// Opens the world at the root page, waits for window.__ready, screenshots every view in window.__views (4+), measures fps, builds a sheet two views wide
// (2x2 for four views; an odd last view is padded with black).
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const pi = args.indexOf('--port');
const port = pi >= 0 ? args[pi + 1] : '5173';
const slug = 'matchday';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'captures', slug);
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

const report = { slug, consoleErrors, fps: null, ready: false, views: [], webgl: null };
try {
  await page.goto(`http://localhost:${port}/?k=capture-dummy-key`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  report.ready = true;
  report.webgl = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl?.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : String(!!gl); });
  const n = await page.evaluate(() => window.__views.length);
  for (let i = 0; i < n; i++) {
    await page.evaluate(async (i) => { window.__setView(i); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, i);
    const file = join(out, `view-${i}.png`);
    await page.screenshot({ path: file });
    report.views.push({ i, name: await page.evaluate((i) => window.__views[i].name ?? String(i), i), file });
  }
  report.fps = await page.evaluate(() => new Promise((res) => { let f = 0; const t0 = performance.now(); (function tick() { f++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(Math.round((f * 1000) / (performance.now() - t0) * 10) / 10); })(); }));
  const m = report.views.length;
  if (m >= 4) {
    const rows = [];
    for (let i = 0; i < m; i += 2) rows.push(i + 1 < m ? `[${i}][${i + 1}]hstack[r${i / 2}]` : `[${i}]pad=iw*2:ih[r${i / 2}]`);
    const stack = rows.length > 1 ? `${rows.map((_, r) => `[r${r}]`).join('')}vstack=inputs=${rows.length},scale=1920:-1` : '[r0]scale=1920:-1';
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...report.views.flatMap((v) => ['-i', v.file]),
      '-filter_complex', `${rows.join(';')};${stack}`, '-frames:v', '1', join(out, 'sheet.png')]);
  }
} catch (e) {
  report.error = String(e.message || e);
}
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ ready: report.ready, fps: report.fps, consoleErrors: consoleErrors.length, webgl: report.webgl, sheet: join(out, 'sheet.png'), error: report.error }));
process.exit(report.ready && !consoleErrors.length && !report.error ? 0 : 1);
