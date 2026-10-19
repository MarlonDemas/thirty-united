import { afterEach, describe, expect, it, vi } from "vitest"
import { debugProbeOn } from "@/lib/debugProbe"

const at = (search: string) => window.history.replaceState(null, "", `/${search}`)

describe("debugProbeOn", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    at("")
  })

  it("is on in dev with ?debug=1", () => {
    vi.stubEnv("DEV", true)
    vi.stubEnv("VITE_DEBUG_PROBE", "")
    at("?debug=1")
    expect(debugProbeOn()).toBe(true)
  })

  it("is on in a production build that sets VITE_DEBUG_PROBE=1", () => {
    vi.stubEnv("DEV", false)
    vi.stubEnv("VITE_DEBUG_PROBE", "1")
    at("?debug=1")
    expect(debugProbeOn()).toBe(true)
  })

  it("is off in a production build without the var, even with ?debug=1", () => {
    vi.stubEnv("DEV", false)
    vi.stubEnv("VITE_DEBUG_PROBE", "")
    at("?debug=1")
    expect(debugProbeOn()).toBe(false)
  })

  it("is off without ?debug=1, even when the gate is open", () => {
    vi.stubEnv("DEV", true)
    vi.stubEnv("VITE_DEBUG_PROBE", "1")
    at("")
    expect(debugProbeOn()).toBe(false)
    at("?debug=0")
    expect(debugProbeOn()).toBe(false)
  })
})
