import { useEffect, type ReactNode } from "react"
import { demote } from "@/world/tier"

/**
 * Owns the tier's live inputs. The tier itself lives in a session store (`useTier`), so the lazy DeviceProbe,
 * which renders in its own tree, reads the same value. Turning reduced motion or forced colours on mid-session
 * demotes; turning them off never promotes.
 */
export function TierProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const watch = (q: string, onMatch: () => void) => {
      const mq = window.matchMedia(q)
      const on = () => mq.matches && onMatch()
      mq.addEventListener?.("change", on)
      return () => mq.removeEventListener?.("change", on)
    }
    const offs = [
      watch("(prefers-reduced-motion: reduce)", () => demote("T0", "prefers-reduced-motion (turned on)")),
      watch("(forced-colors: active)", () => demote("forced-colors", "forced-colors (turned on)")),
    ]
    return () => offs.forEach((f) => f())
  }, [])
  return <>{children}</>
}
