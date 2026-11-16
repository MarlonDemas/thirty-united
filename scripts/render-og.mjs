// OG runner (build-time, on the Mac; never ships): opens scripts/og.html (the L2 "Ivory and crimson" link preview, built from ornament.js and EVENT)
// in headless Chromium through the Vite dev server and saves a 1200 x 630 JPEG.
// Usage: node scripts/render-og.mjs <out.jpg>   (`pnpm og` writes public/og.jpg, which index.html's og:image and twitter:image point at)
// The previous preview (the poster-art teaser from src/poster/og.ts) is in git: `git show 297d043:public/og.jpg > public/og.jpg` restores it.
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"
import { createServer } from "vite"

const out = process.argv[2]
if (!out) {
  console.error("Usage: node scripts/render-og.mjs <out.jpg>")
  process.exit(1)
}

const root = fileURLToPath(new URL("..", import.meta.url))
const server = await createServer({ root, configFile: `${root}vite.config.ts`, logLevel: "error", server: { port: 0, hmr: false } })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce" })   // reduced motion: the finished picture, no draw-in
  await page.goto(`${base}scripts/og.html`)
  await page.waitForFunction(() => window.__og === true)
  await page.evaluate(() => Promise.all(['500 1em "Bodoni Moda"', 'italic 400 1em "Bodoni Moda"', '400 1em "Jost"', '450 1em "Inter Tight"'].map((f) => document.fonts.load(f))).then(() => document.fonts.ready))
  const jpg = await page.screenshot({ type: "jpeg", quality: 90 })
  writeFileSync(out, jpg)
  console.log(`${out}: ${(jpg.length / 1024).toFixed(1)} KiB`)
} finally {
  await browser.close()
  await server.close()
}
