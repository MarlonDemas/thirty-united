#!/usr/bin/env node
// Usage: npx convex run admin:listDeclines | node scripts/export-declines.mjs > declines.csv
// Declines are name-only and unverified: anyone with the link can decline under any name.
import { readFileSync } from "node:fs";
import { cell, parseInput } from "./export-rsvps.mjs";

const SOURCE = "self-reported, unverified";
const COLUMNS = ["source", "firstName", "surname", "reason", "noticeVersion", "createdAt", "updatedAt"];

export function toCsv(rows) {
  const lines = [COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(COLUMNS.map((k) => cell(k, k === "source" ? SOURCE : row[k])).join(","));
  }
  return lines.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = parseInput(readFileSync(0, "utf8"));
  if (!Array.isArray(rows)) {
    console.error("Expected a JSON array (output of `convex run admin:listDeclines`).");
    process.exit(1);
  }
  process.stdout.write(toCsv(rows));
}
