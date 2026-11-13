// usage: pnpm smoke [simSeconds=900] [--port 5173]   (needs `pnpm dev` running)
// Behaviour check. Fast-forwards the world with window.__dbg.simStep(dt) (no rendering), samples
// window.__dbg.agents() and counts overlaps and stuck agents. Writes captures/matchday/smoke.json.
// Exit 0 = pass; 1 = overlaps, stuck agents, console errors or a missing hook.
//
// World contract:
//   window.__dbg.simStep(dt)  advance the simulation deterministically, no render
//   window.__dbg.agents()     -> [{ id, name, x, z, heading, len, wid | radius, domain?, related?: [id], stuck?: bool }]
//                                heading in radians, forward = (sin h, cos h); len/wid = footprint box in metres,
//                                or radius for a circle; related = ids it may legitimately touch (owner, towed, attached).
//                                Worlds with no moving agents return [].
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const pi = args.indexOf('--port');
const port = pi >= 0 ? args[pi + 1] : '5173';
const pos = args.filter((a, i) => !a.startsWith('--') && (pi < 0 || i !== pi + 1));
const slug = 'matchday';
const [secs = '900'] = pos;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'captures', slug);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(String(e)));

const report = { slug, simSeconds: +secs, hook: false, samples: 0, agentsMax: 0, overlaps: [], stuck: [], consoleErrors: errs };
try {
  await page.goto(`http://localhost:${port}/?k=capture-dummy-key`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__start === true, null, { timeout: 60000 });
  await page.getByRole('button', { name: 'Play the match' }).click();   // the plain invitation comes first
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 90000 });
  report.hook = await page.evaluate(() => typeof window.__dbg?.simStep === 'function' && typeof window.__dbg?.agents === 'function');
  if (report.hook) {
    Object.assign(report, await page.evaluate(async (secs) => {
      const D = window.__dbg, dt = 1 / 30, overl = new Map(), stuck = new Map();
      let samples = 0, agentsMax = 0;
      // oriented-box SAT; a circle is a box of side 2r (conservative)
      const box = (a) => {
        const L = a.len ?? 2 * a.radius, W = a.wid ?? 2 * a.radius, h = a.heading || 0, s = Math.sin(h), c = Math.cos(h);
        return { x: a.x, z: a.z, ax: [[s, c, L / 2], [c, -s, W / 2]] };
      };
      const hit = (A, B) => {
        for (const [ux, uz] of [...A.ax, ...B.ax]) {
          const d = Math.abs((B.x - A.x) * ux + (B.z - A.z) * uz);
          const pr = (R) => R.ax.reduce((t, [x, z, hh]) => t + Math.abs(x * ux + z * uz) * hh, 0);
          if (d > pr(A) + pr(B) - 0.05) return false;
        }
        return true;
      };
      for (let i = 0; i < secs * 30; i++) {
        D.simStep(dt);
        if (i % 3) continue; // sample at 10 Hz
        const list = D.agents(); samples++; agentsMax = Math.max(agentsMax, list.length);
        const bx = list.map(box);
        for (let x = 0; x < list.length; x++) {
          const a = list[x];
          if (a.stuck && !stuck.has(a.name)) stuck.set(a.name, { name: a.name, t: +(i * dt).toFixed(1), at: [Math.round(a.x), Math.round(a.z)], status: a.status });
          for (let y = x + 1; y < list.length; y++) {
            const b = list[y];
            if ((a.domain ?? 0) !== (b.domain ?? 0)) continue;
            if (a.related?.includes(b.id) || b.related?.includes(a.id)) continue;
            if (Math.abs(a.x - b.x) > 60 || Math.abs(a.z - b.z) > 60) continue;
            if (!hit(bx[x], bx[y])) continue;
            const k = `${a.name}|${b.name}`, o = overl.get(k) || { a: a.name, b: b.name, t: +(i * dt).toFixed(1), at: [Math.round(a.x), Math.round(a.z)], samples: 0 };
            o.samples++; overl.set(k, o);
          }
        }
      }
      return { samples, agentsMax, overlaps: [...overl.values()], stuck: [...stuck.values()] };
    }, +secs));
  }
} catch (e) { report.error = String(e.message || e); }

await writeFile(join(out, 'smoke.json'), JSON.stringify(report, null, 2));
await browser.close();
const pass = report.hook && !report.overlaps.length && !report.stuck.length && !errs.length && !report.error;
console.log(JSON.stringify({ slug, pass, hook: report.hook, simSeconds: +secs, agentsMax: report.agentsMax, overlaps: report.overlaps.length, stuck: report.stuck.length, consoleErrors: errs.length, error: report.error, file: join(out, 'smoke.json') }));
if (!pass) for (const o of [...report.overlaps.slice(0, 10), ...report.stuck.slice(0, 10)]) console.error(JSON.stringify(o));
process.exit(pass ? 0 : 1);
