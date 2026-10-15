import { afterEach, describe, expect, it, vi } from "vitest"
import { lazyRsvpApi, LOAD_TIMEOUT_MS, type ConvexLoader, type ConvexParts } from "@/lib/convexApi"
import { TIMEOUT_MS } from "@/lib/timing"

const refs = { otp: { requestCode: "otp:requestCode" }, rsvp: { verifyAndSave: "rsvp:verifyAndSave" } } as unknown as ConvexParts["api"]

function fakeLoader() {
  const action = vi.fn(async (ref: unknown) => (ref === refs.otp.requestCode ? { status: "sent" } : { status: "no_code" }))
  const load = vi.fn<ConvexLoader>(async () => ({ client: { action } as unknown as ConvexParts["client"], api: refs }))
  return { load, action }
}

describe("lazyRsvpApi: the Convex client loads after first paint", () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it("loads nothing until asked", () => {
    const { load } = fakeLoader()
    lazyRsvpApi(load)
    expect(load).not.toHaveBeenCalled()
  })

  it("preload and every call share one client", async () => {
    const { load, action } = fakeLoader()
    const api = lazyRsvpApi(load)
    api.preload()
    await expect(api.requestCode("a@b.co")).resolves.toEqual({ status: "sent" })
    await api.verifyAndSave({ email: "a@b.co", code: "123456", payload: {} as never })
    expect(load).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenNthCalledWith(1, refs.otp.requestCode, expect.objectContaining({ email: "a@b.co", inviteKey: expect.any(String) }))
    expect(action).toHaveBeenNthCalledWith(2, refs.rsvp.verifyAndSave, expect.objectContaining({ code: "123456", inviteKey: expect.any(String) }))
  })

  it("a failed chunk load rejects the call and the next call tries again", async () => {
    const { load: ok, action } = fakeLoader()
    const load = vi.fn<ConvexLoader>().mockRejectedValueOnce(new Error("offline")).mockImplementation(ok)
    const api = lazyRsvpApi(load)
    await expect(api.requestCode("a@b.co")).rejects.toThrow("offline")
    await expect(api.requestCode("a@b.co")).resolves.toEqual({ status: "sent" })
    expect(load).toHaveBeenCalledTimes(2)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it("two calls before the load settles share one load and one client", async () => {
    const { load: ok, action } = fakeLoader()
    let settle!: (p: ConvexParts) => void
    const load = vi.fn<ConvexLoader>(() => new Promise((r) => (settle = r)))
    const api = lazyRsvpApi(load)
    const a = api.requestCode("a@b.co")
    const b = api.verifyAndSave({ email: "a@b.co", code: "123456", payload: {} as never })
    settle(await ok())
    await expect(a).resolves.toEqual({ status: "sent" })
    await expect(b).resolves.toEqual({ status: "no_code" })
    expect(load).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledTimes(2)
  })

  it("a load slower than the bound rejects the call, and that call never sends its action", async () => {
    vi.useFakeTimers()
    try {
      const { load: ok, action } = fakeLoader()
      const parts = await ok()
      let settle!: (p: ConvexParts) => void
      const load = vi.fn<ConvexLoader>(() => new Promise((r) => (settle = r)))
      const api = lazyRsvpApi(load)
      const call = expect(api.verifyAndSave({ email: "a@b.co", code: "123456", payload: {} as never })).rejects.toThrow("timeout")
      await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS)
      await call
      expect(LOAD_TIMEOUT_MS).toBeLessThan(TIMEOUT_MS)
      settle(parts)
      await vi.advanceTimersByTimeAsync(0)
      expect(action).not.toHaveBeenCalled()
      // The retry shares the load that carried on: still one client.
      await expect(api.verifyAndSave({ email: "a@b.co", code: "123456", payload: {} as never })).resolves.toEqual({ status: "no_code" })
      expect(load).toHaveBeenCalledTimes(1)
      expect(action).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it("a failed load rejects verifyAndSave", async () => {
    const load = vi.fn<ConvexLoader>().mockRejectedValue(new Error("offline"))
    const api = lazyRsvpApi(load)
    await expect(api.verifyAndSave({ email: "a@b.co", code: "123456", payload: {} as never })).rejects.toThrow("offline")
  })

  it("a failed preload stays quiet", async () => {
    const load = vi.fn<ConvexLoader>().mockRejectedValue(new Error("offline"))
    const api = lazyRsvpApi(load)
    expect(() => api.preload()).not.toThrow()
    await Promise.resolve()
  })
})
