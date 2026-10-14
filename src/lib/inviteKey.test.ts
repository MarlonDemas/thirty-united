import { beforeEach, describe, expect, it } from "vitest"
import { captureInviteKey, getInviteKey } from "@/lib/inviteKey"

const at = (url: string) => window.history.replaceState(null, "", url)

describe("invite key capture", () => {
  beforeEach(() => at("/"))

  it("stores the k param and leaves the address unchanged", () => {
    at("/?utm=a&k=AbC123&x=1#rsvp")
    captureInviteKey()
    expect(getInviteKey()).toBe("AbC123")
    expect(window.sessionStorage.getItem("thirty-united:k")).toBe("AbC123")
    expect(window.location.search).toBe("?utm=a&k=AbC123&x=1")
    expect(window.location.hash).toBe("#rsvp")
  })

  it("a non-empty k in the address wins over the stored key", () => {
    window.sessionStorage.setItem("thirty-united:k", "old")
    at("/?k=fresh")
    captureInviteKey()
    expect(getInviteKey()).toBe("fresh")
  })

  it("an empty k keeps the stored key", () => {
    window.sessionStorage.setItem("thirty-united:k", "kept")
    at("/?k=")
    captureInviteKey()
    expect(getInviteKey()).toBe("kept")
  })

  it("falls back to the stored key when the address has none", () => {
    window.sessionStorage.setItem("thirty-united:k", "kept")
    captureInviteKey()
    expect(getInviteKey()).toBe("kept")
  })

  it("is null with no param and nothing stored", () => {
    captureInviteKey()
    expect(getInviteKey()).toBeNull()
  })
})
