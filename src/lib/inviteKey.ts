const STORAGE_KEY = "thirty-united:k"

export const MISSING_KEY_MESSAGE = "This link is missing its invite key. Ask Makes to send you the full link."

/** Reads the invite key from sessionStorage. Never logged. */
export function getInviteKey(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

/**
 * Call once at app start. A non-empty `k` in the address wins and refreshes the copy kept for this
 * tab. The address is left untouched. With no `k`, the stored copy is the fallback.
 */
export function captureInviteKey(): void {
  try {
    const k = new URL(window.location.href).searchParams.get("k")
    if (!k) return
    window.sessionStorage.setItem(STORAGE_KEY, k)
  } catch {
    /* no window, bad URL, or private mode: the key is not kept for later navigations */
  }
}
