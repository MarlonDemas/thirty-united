#!/usr/bin/env node
// Usage: pnpm build && pnpm budget
// Entry budget: every module script, modulepreload link and stylesheet that dist/index.html
// references, gzipped, must total at most 160,000 bytes. Favicons, OG images and fonts are
// not counted. Node zlib level 6 per file, the same level as Vite's reporter, but Vite's encoder
// (flate2/zlib-rs) prints about 1% larger sizes, so treat this total as a floor.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET = 160_000;
const html = readFileSync("dist/index.html", "utf8");

const files = new Set();
for (const tag of html.match(/<(script|link)\b[^>]*>/g) ?? []) {
  const isScript = /^<script\b/.test(tag) && /\btype="module"/.test(tag);
  const isLink = /\brel="(modulepreload|stylesheet)"/.test(tag);
  const src = tag.match(/\b(?:src|href)="([^"]+)"/)?.[1];
  if ((isScript || isLink) && src) files.add(src.replace(/^\//, ""));
}

let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(`dist/${file}`), { level: 6 }).length;
  total += size;
  console.log(`${String(size).padStart(8)} B  ${file}`);
}

const headroom = BUDGET - total;
console.log(`${String(total).padStart(8)} B  total gzip (${files.size} files)`);
console.log(`${String(headroom).padStart(8)} B  headroom against ${BUDGET} B`);
if (headroom < 0) {
  console.error("Over the entry budget.");
  process.exit(1);
}
