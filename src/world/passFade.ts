/** The lanyard pass's cross-fade. Used only by the lazy three chunk (LanyardTicket); keep it out of pass.ts, which is in the entry. */

/** The pass's cross-fade with the DOM pass: 160 ms on `--ease-fade`, cubic-bezier(0.2, 0, 0, 1), as the stage fade. */
export const PASS_FADE_MS = 160

// The curve's x(t) and y(t) for control points (0.2, 0) and (0, 1), with the end points (0, 0) and (1, 1).
const bez = (t: number, a: number, b: number) => 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t
const easeX = (t: number) => bez(t, 0.2, 0)
const easeY = (t: number) => bez(t, 0, 1)

/** Bisect the monotonic `f` on [0, 1] for `f(t) = v`, as CSS solves its curve on x. */
function solve(f: (t: number) => number, v: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) < v) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** The eased value at linear progress `x` in [0, 1]. */
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : easeY(solve(easeX, x)))
/** The linear progress at which the eased value is `y`: the inverse of `ease`. */
const progressAt = (y: number) => (y <= 0 ? 0 : y >= 1 ? 1 : easeX(solve(easeY, y)))

/**
 * The new opacity after `dtMs` of fading toward `target`. Stateless: the linear progress is read back from the current
 * opacity through the curve, advanced by dt, and mapped forward again, so a fade reversed mid-way carries on from where
 * it is. Fading out runs the same curve downward (1 - ease), as a CSS transition to 0 does.
 */
export function fadeToward(opacity: number, target: number, dtMs: number): number {
  const step = Math.max(0, dtMs) / PASS_FADE_MS
  if (step === 0) return opacity
  return target > opacity
    ? Math.min(target, ease(progressAt(opacity) + step))
    : Math.max(target, 1 - ease(progressAt(1 - opacity) + step))
}
