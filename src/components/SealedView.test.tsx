import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SealedView } from "@/components/SealedView"
import { getPass } from "@/world/pass"
import type { TierState } from "@/world/tier"

// The 3D pass is only asked for on a WebGL tier with WebGL: jsdom has neither, so both are faked here.
vi.mock("@/lib/webgl", () => ({ hasWebGL: () => true }))
vi.mock("@/world/tier", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/world/tier")>()
  return { ...mod, useTier: (): TierState => ({ ...mod.getTierState(), tier: "T3" }) }
})

/** Renders the view with the pass up (ready), presses "Tear open", and returns the settle to resolve by hand. */
function setup() {
  const slot = document.body.appendChild(document.createElement("div"))
  const onTorn = vi.fn()
  const onStageEnd = vi.fn()
  const view = render(<SealedView onTorn={onTorn} onStageEnd={onStageEnd} focusHeading={false} passSlot={slot} />)
  const req = getPass()
  if (!req) throw new Error("no pass request")
  act(() => req.onReady())
  let resolve = () => {}
  const settle = vi.fn(() => new Promise<void>((r) => (resolve = r)))
  req.settleRef.current = settle
  fireEvent.click(screen.getByRole("button", { name: /tear open/i }))
  expect(settle).toHaveBeenCalledOnce()
  return { ...view, onTorn, onStageEnd, settled: () => act(async () => resolve()) }
}

describe("SealedView hand-off from the 3D pass", () => {
  const ric = window.requestIdleCallback
  beforeEach(() => {
    // The pass is asked for when idle: now.
    window.requestIdleCallback = ((cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 })
      return 1
    }) as typeof window.requestIdleCallback
  })
  afterEach(() => {
    window.requestIdleCallback = ric
  })

  it("goes on in the DOM once the pass has settled", async () => {
    const { onStageEnd, settled } = setup()
    expect(onStageEnd).not.toHaveBeenCalled()
    await settled()
    expect(onStageEnd).toHaveBeenCalledOnce()
  })

  it("does nothing more when the pass settles (on its way out) after the view is gone", async () => {
    const { onStageEnd, onTorn, settled, unmount } = setup()
    unmount()
    await settled()
    await act(() => new Promise((r) => setTimeout(r, 250))) // past the stage fade, where the tear would start
    expect(onStageEnd).not.toHaveBeenCalled()
    expect(onTorn).not.toHaveBeenCalled()
  })
})
