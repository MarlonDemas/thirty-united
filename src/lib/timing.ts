// keep in step with convex/challenges.ts and convex/lib/limits.ts
export const CODE_TTL_MS = 10 * 60 * 1000
export const RESEND_COOLDOWN_MS = 60 * 1000
export const SLOW_MS = 5000
export const TIMEOUT_MS = 15000

export class TimeoutError extends Error {
  constructor() {
    super("timeout")
    this.name = "TimeoutError"
  }
}

/** Convex gives no request timeout, so race the call. We never retry silently: a retry would send a second email. */
export function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError()), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

/** 0:42 style countdown from milliseconds. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

/** "1 try left" / "3 tries left" */
export function triesLeft(n: number): string {
  return `${n} ${n === 1 ? "try" : "tries"} left`
}

/** Wait time for a rate-limit line. */
export function formatWait(ms: number | undefined): string {
  if (ms === undefined) return "a minute"
  const s = Math.max(1, Math.ceil(ms / 1000))
  if (s < 60) return `${s} ${s === 1 ? "second" : "seconds"}`
  const m = Math.ceil(s / 60)
  return `${m} ${m === 1 ? "minute" : "minutes"}`
}
