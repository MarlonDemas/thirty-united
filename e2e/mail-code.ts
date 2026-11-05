import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * Test-only code source. The local Convex deployment runs MAIL_PROVIDER=mock, which writes
 * "[mail:mock] code for <email>: <code>" to its function logs; we read them with
 * `npx convex logs`. No production code exposes codes.
 * Requires `npx convex dev` running against the local deployment.
 */
export async function fetchCode(
  email: string,
  opts: { exclude?: string[]; timeoutMs?: number } = {},
): Promise<string> {
  const { exclude = [], timeoutMs = 30_000 } = opts;
  const re = new RegExp(`\\[mail:mock\\] code for ${escape(email)}: (\\d{6})`, "g");
  const child = spawn("npx", ["convex", "logs", "--history", "200"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buf = "";
  child.stdout.on("data", (d) => (buf += d.toString()));
  child.stderr.on("data", (d) => (buf += d.toString()));
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      const codes = [...buf.matchAll(re)].map((m) => m[1]).filter((c) => !exclude.includes(c));
      if (codes.length) return codes[codes.length - 1];
      await new Promise((r) => setTimeout(r, 250));
    }
  } finally {
    child.kill("SIGTERM");
  }
  throw new Error(`No mock-mail code for ${email} in local Convex logs within ${timeoutMs}ms`);
}

/** Clears the resend cooldown / daily buckets for one email via the existing host-only admin mutation. */
export async function resetLimits(email: string): Promise<void> {
  await run("npx", ["convex", "run", "admin:resetCodeLimits", JSON.stringify({ email })]);
}

type Name = { firstName: string; surname: string };

/** One name-only decline row via the host-only `admin:getDecline`, or null. Local backend only (same `convex run` path as resetLimits). */
export async function getDecline(n: Name): Promise<{ firstName: string; surname: string; reason?: string } | null> {
  const { stdout } = await run("npx", ["convex", "run", "admin:getDecline", JSON.stringify(n)]);
  // A null result prints nothing on stdout; a row prints as JSON (pretty-printed over several lines).
  const text = stdout.trim();
  if (text === "" || text === "null") return null;
  return JSON.parse(text.slice(text.indexOf("{")));
}

/** Erases a decline row and that name's per-name limiter bucket (`admin:deleteDecline`). */
export async function deleteDecline(n: Name): Promise<void> {
  await run("npx", ["convex", "run", "admin:deleteDecline", JSON.stringify(n)]);
}

/** Resets the global daily decline bucket (`admin:resetDeclineLimits`) so repeated runs never exhaust the 50/day cap. */
export async function resetDeclineLimits(): Promise<void> {
  await run("npx", ["convex", "run", "admin:resetDeclineLimits", "{}"]);
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
