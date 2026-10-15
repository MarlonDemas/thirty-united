import type { ConvexReactClient } from "convex/react"
import type { api as generatedApi } from "../../convex/_generated/api"
import type { RsvpApi } from "@/lib/api"
import { getInviteKey } from "@/lib/inviteKey"
import { TIMEOUT_MS, withTimeout } from "@/lib/timing"

/** What the RSVP calls need: one Convex client and the generated function references. */
export type ConvexParts = { client: Pick<ConvexReactClient, "action">; api: typeof generatedApi }
export type ConvexLoader = () => Promise<ConvexParts>

/**
 * The Convex client is its own chunk: the cover never calls the backend, so the client (about 21 kB gzipped) loads
 * after first paint, on idle or on the first call, whichever comes first. Same client and transport as before.
 */
export const loadConvex: ConvexLoader = async () => {
  const [{ ConvexReactClient }, { api }] = await Promise.all([import("convex/react"), import("../../convex/_generated/api")])
  return { client: new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string), api }
}

/**
 * How long a call waits for the client chunk. Shorter than the callers' TIMEOUT_MS, so a slow load rejects the call
 * before the caller gives up, and a call the guest has already seen fail never sends its action later. Only the call
 * is bounded: the load itself carries on and the retry shares it, so there is still one client.
 */
export const LOAD_TIMEOUT_MS = TIMEOUT_MS - 5000

/** The page's two backend calls over a lazily loaded Convex client, created once. */
export function lazyRsvpApi(load: ConvexLoader = loadConvex): RsvpApi & { preload(): void } {
  let parts: Promise<ConvexParts> | null = null
  const get = () => {
    if (!parts) {
      const p = load()
      parts = p
      // A failed chunk load (offline) is not cached: the next call tries again.
      p.catch(() => {
        if (parts === p) parts = null
      })
    }
    return parts
  }
  return {
    preload: () => {
      get().catch(() => {})
    },
    requestCode: async (email) => {
      const { client, api } = await withTimeout(get(), LOAD_TIMEOUT_MS)
      return client.action(api.otp.requestCode, { email, inviteKey: getInviteKey() ?? "" })
    },
    verifyAndSave: async (args) => {
      const { client, api } = await withTimeout(get(), LOAD_TIMEOUT_MS)
      return client.action(api.rsvp.verifyAndSave, { ...args, inviteKey: getInviteKey() ?? "" })
    },
  }
}
