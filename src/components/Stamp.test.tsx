import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { setReducedMotion } from "@/test-utils"

const calls = vi.hoisted(() => ({ sound: 0, buzz: [] as unknown[] }))
vi.mock("@/lib/sound", () => ({ playStamp: () => calls.sound++ }))
vi.mock("@/lib/haptics", async (orig) => ({
  ...(await orig<typeof import("@/lib/haptics")>()),
  haptic: (p: unknown) => calls.buzz.push(p),
}))
const { Stamp } = await import("@/components/Stamp")

describe("Stamp sound and haptics", () => {
  beforeEach(() => {
    calls.sound = 0
    calls.buzz.length = 0
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it("lands with its sound and the built haptic (22 ms Yes, 12 ms Maybe)", () => {
    render(<Stamp variant="yes" />)
    render(<Stamp variant="maybe" />)
    act(() => vi.advanceTimersByTime(100))
    expect(calls.sound).toBe(2)
    expect(calls.buzz).toEqual([22, 12])
  })
  it("under reduced motion keeps the opt-in sound, but no haptic and no impact", () => {
    setReducedMotion(true)
    const onImpact = vi.fn()
    render(<Stamp variant="yes" onImpact={onImpact} />)
    act(() => vi.advanceTimersByTime(100))
    expect(calls.sound).toBe(1)
    expect(calls.buzz).toEqual([])
    expect(onImpact).not.toHaveBeenCalled()
  })
})
