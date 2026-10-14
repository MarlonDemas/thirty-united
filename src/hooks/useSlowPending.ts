import { useCallback, useEffect, useRef, useState } from "react"
import { SLOW_MS } from "@/lib/timing"

/**
 * Tracks a pending call. `slow` flips after 5s so the view can add a still-working line.
 * Re-entry while pending is ignored (double taps).
 */
export function useSlowPending() {
  const [pending, setPending] = useState(false)
  const [slow, setSlow] = useState(false)
  const inFlight = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined
    inFlight.current = true
    setPending(true)
    setSlow(false)
    timer.current = setTimeout(() => mounted.current && setSlow(true), SLOW_MS)
    try {
      return await fn()
    } finally {
      clearTimeout(timer.current)
      inFlight.current = false
      if (mounted.current) {
        setPending(false)
        setSlow(false)
      }
    }
  }, [])

  return { pending, slow, run }
}
