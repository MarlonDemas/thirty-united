// Pure OTP helpers. Web Crypto only, so they run in the Convex default runtime,
// edge-runtime tests and Node alike.

export const CODE_LENGTH = 6;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const LOCAL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/** Sane (not RFC-exhaustive) email check. Expects an already-normalised address. */
export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > 254) return false;
  const at = email.indexOf("@");
  if (at < 1 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL_RE.test(local)) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  if (!labels.every((l) => LABEL_RE.test(l))) return false;
  return labels[labels.length - 1].length >= 2;
}

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  let out = "";
  for (const b of new Uint8Array(buf)) out += b.toString(16).padStart(2, "0");
  return out;
}

/** HMAC-SHA256(key = pepper, message = code), hex encoded. */
export async function hmacCode(code: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(code)));
}

/**
 * Rate-limiter key for a per-email bucket. HMAC over a prefixed message so keys are
 * not plaintext emails and can never collide with code hashes (which hash a 6-digit code).
 */
export async function limiterKey(normalizedEmail: string, pepper: string): Promise<string> {
  return await hmacCode(`rl:email:${normalizedEmail}`, pepper);
}

/** Compares without early exit on the first differing character. */
export function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

type FillRandom = (arr: Uint32Array<ArrayBuffer>) => ArrayLike<number>;

const RANGE = 10 ** CODE_LENGTH;
// Largest multiple of RANGE that fits in a uint32; draws at/above it are rejected
// so every code is equally likely (no modulo bias).
const LIMIT = Math.floor(2 ** 32 / RANGE) * RANGE;

/** Unbiased 6-digit code from crypto.getRandomValues (rejection sampling). */
export function generateCode(
  fill: FillRandom = (arr) => crypto.getRandomValues(arr),
): string {
  const buf = new Uint32Array(new ArrayBuffer(4));
  for (;;) {
    const n = fill(buf)[0];
    if (n < LIMIT) return String(n % RANGE).padStart(CODE_LENGTH, "0");
  }
}

export function isWellFormedCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
