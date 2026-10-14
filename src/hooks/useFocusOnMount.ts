import { useEffect, useRef } from "react"

/** Returns a ref for a view's heading and moves focus to it when the view mounts. */
export function useFocusOnMount<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (enabled) ref.current?.focus({ preventScroll: false })
  }, [enabled])
  return ref
}
