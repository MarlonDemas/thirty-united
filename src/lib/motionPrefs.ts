/** True when the guest asked for reduced motion. Read on demand (no React), for haptics and sound. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false
}

/** True under forced-colors: decorative effects (tilt, speckle) are dropped. */
export function forcedColors(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(forced-colors: active)").matches
    : false
}
