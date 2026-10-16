// OgCompositor runner (build-time, on the Mac; never ships): renders src/poster/og.ts in headless Chromium through
// the Vite dev server, so the preview uses the same layers and the same 2D scene code as the saved poster.
// Usage: node scripts/render-og.mjs <out.jpg>   (`npm run og` writes public/og.jpg, which index.html's og:image and
// twitter:image point at)
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
  const page = await browser.newPage()
  // A blank same-origin page: the plates load from the dev server, so the canvas stays exportable.
  await page.route(`${base}__og`, (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>og</title>" }))
  await page.goto(`${base}__og`)
  const url = await page.evaluate(async () => (await import("/src/poster/og.ts")).renderOg())
  const jpg = Buffer.from(url.slice(url.indexOf(",") + 1), "base64")
  writeFileSync(out, jpg)
  console.log(`${out}: ${(jpg.length / 1024).toFixed(1)} KiB`)
} finally {
  await browser.close()
  await server.close()
}
