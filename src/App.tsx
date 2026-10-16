import { Suspense, lazy, useEffect, useState } from "react"
import { InvitePage } from "@/components/InvitePage"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { lazyRsvpApi } from "@/lib/convexApi"
import { getInviteKey } from "@/lib/inviteKey"
import { TierProvider } from "@/world/TierProvider"

// `?debug=1` only: the device probe is its own chunk, never fetched otherwise.
const debug = new URLSearchParams(window.location.search).get("debug") === "1"
const DeviceProbe = lazy(() => import("@/components/DeviceProbe"))

export default function App() {
  const [api] = useState(() => lazyRsvpApi())
  // The Convex client loads after first paint, while the guest reads the cover.
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => api.preload(), { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(() => api.preload(), 1500)
    return () => window.clearTimeout(id)
  }, [api])
  return (
    <TierProvider>
    <ErrorBoundary>
      <InvitePage api={api} missingKey={getInviteKey() === null} />
      {debug && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <DeviceProbe />
          </Suspense>
        </ErrorBoundary>
      )}
    </ErrorBoundary>
    </TierProvider>
  )
}
