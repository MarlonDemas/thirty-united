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

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
