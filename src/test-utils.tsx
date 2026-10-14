import type { RsvpApi, RequestCodeResult, VerifyResult } from "@/lib/api"
import { vi } from "vitest"

/** Flip `prefers-reduced-motion: reduce` for the current test (reset before each test). */
export function setReducedMotion(value: boolean) {
  ;(globalThis as { __reduced?: boolean }).__reduced = value
}

export function fakeApi(over: {
  requestCode?: (email: string) => Promise<RequestCodeResult>
  verifyAndSave?: RsvpApi["verifyAndSave"]
} = {}) {
  return {
    requestCode: vi.fn(over.requestCode ?? (async () => ({ status: "sent" }) as RequestCodeResult)),
    verifyAndSave: vi.fn(
      over.verifyAndSave ??
        (async () =>
          ({ status: "saved", ticketNo: 7, firstName: "Thandi", surname: "Nkosi", team: "Orlando Pirates", attending: "yes" }) as VerifyResult),
    ),
  }
}
