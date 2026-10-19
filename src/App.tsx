import { Suspense, lazy, useEffect, useState } from "react"
import { InvitePage } from "@/components/InvitePage"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { lazyRsvpApi } from "@/lib/convexApi"
import { debugProbeOn } from "@/lib/debugProbe"
import { getInviteKey } from "@/lib/inviteKey"
import { TierProvider } from "@/world/TierProvider"

// `?debug=1` in dev and preview builds only (see debugProbe.ts): in production the probe is not in the bundle at all.
// The gate is repeated inline at the import because the bundler only drops the chunk when it sees the literal env reads.
const debug = debugProbeOn()
const DeviceProbe =
  (import.meta.env.DEV || import.meta.env.VITE_DEBUG_PROBE === "1")
    ? lazy(() => import("@/components/DeviceProbe"))
    : null

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
      {debug && DeviceProbe && (
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
