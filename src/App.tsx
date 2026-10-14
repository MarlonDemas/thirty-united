import { useConvex } from "convex/react"
import { useMemo } from "react"
import { InvitePage } from "@/components/InvitePage"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import type { RsvpApi } from "@/lib/api"
import { getInviteKey } from "@/lib/inviteKey"
import { api as convexApi } from "../convex/_generated/api"

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
    <ErrorBoundary>
      <InvitePage api={api} missingKey={getInviteKey() === null} />
    </ErrorBoundary>
  )
}
