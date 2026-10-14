#!/usr/bin/env node
// Usage: npx convex run admin:listRsvps | node scripts/export-rsvps.mjs > rsvps.csv
import { readFileSync } from "node:fs";

const COLUMNS = [
  "ticketNo",
  "email",
  "firstName",
  "surname",
  "preferredName",
  "attending",
  "plusOne",
  "plusOneName",
  "sport",
  "team",
  "otherSport",
  "funFact",
  "howKnowMakes",
  "inviteChannel",
  "whatsapp",
  "createdAt",
  "updatedAt",
];
const DATE_COLUMNS = new Set(["createdAt", "updatedAt"]);

function cell(key, value) {
  if (value === undefined || value === null) return "";
  let s = DATE_COLUMNS.has(key) ? new Date(value).toISOString() : String(value);
  // Neutralise spreadsheet formulas. Only a single plain number (e.g. -5, 3.14) is exempt
  // from the leading +/- rule; anything like "-1-1" or "+27 82..." gets the ' prefix.
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s))) {
    s = `'${s}`;
  }
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function toCsv(rows) {
  const lines = [COLUMNS.join(",")];
  for (const row of rows) lines.push(COLUMNS.map((k) => cell(k, row[k])).join(","));
  return lines.join("\n") + "\n";
}

function parseInput(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // `convex run` may print log lines before the JSON; take from the first [ or {.
    const start = trimmed.search(/[[{]/);
    if (start === -1) throw new Error("No JSON found on stdin");
    return JSON.parse(trimmed.slice(start));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = parseInput(readFileSync(0, "utf8"));
  if (!Array.isArray(rows)) {
    console.error("Expected a JSON array (output of `convex run admin:listRsvps`).");
    process.exit(1);
  }
  process.stdout.write(toCsv(rows));
}
