import { useConvex } from "convex/react"
import { Suspense, lazy, useMemo } from "react"
import { InvitePage } from "@/components/InvitePage"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import type { RsvpApi } from "@/lib/api"
import { getInviteKey } from "@/lib/inviteKey"
import { TierProvider } from "@/world/TierProvider"
import { api as convexApi } from "../convex/_generated/api"

// `?debug=1` only: the device probe is its own chunk, never fetched otherwise.
const debug = new URLSearchParams(window.location.search).get("debug") === "1"
const DeviceProbe = lazy(() => import("@/components/DeviceProbe"))

export default function App() {
  const convex = useConvex()
  const api = useMemo<RsvpApi>(
    () => ({
      requestCode: (email) =>
        convex.action(convexApi.otp.requestCode, { email, inviteKey: getInviteKey() ?? "" }),
      verifyAndSave: (args) =>
        convex.action(convexApi.rsvp.verifyAndSave, { ...args, inviteKey: getInviteKey() ?? "" }),
    }),
    [convex],
  )
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
