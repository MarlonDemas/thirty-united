import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { getSoundOn } from "@/lib/sound"
import { setReducedMotion } from "@/test-utils"
import { getTierState } from "@/world/tier"
import { WorldChips } from "@/world/WorldChips"

const mount = (props: Partial<Parameters<typeof WorldChips>[0]> = {}) =>
  render(<WorldChips hidden={false} missingKey={false} {...props} />)
const sound = () => screen.queryByRole("button", { name: /^sound/i })
const still = () => screen.queryByRole("button", { name: /^still/i })

// Moved from SealedView.sound.test.tsx: the Sound tab left the ticket for the world's chip row.
describe("Sound chip", () => {
  it("renders off and pressed=false by default", () => {
    mount()
    expect(sound()).toHaveAttribute("aria-pressed", "false")
    expect(getSoundOn()).toBe(false)
  })
  it("toggles aria-pressed and the stored preference", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(sound()!)
    expect(sound()).toHaveAttribute("aria-pressed", "true")
    expect(getSoundOn()).toBe(true)
    await user.click(sound()!)
    expect(sound()).toHaveAttribute("aria-pressed", "false")
    expect(getSoundOn()).toBe(false)
  })
  it("is not rendered under reduced motion", () => {
    setReducedMotion(true)
    mount()
    expect(sound()).toBeNull()
  })
  it("is not rendered when the invite key is missing", () => {
    mount({ missingKey: true })
    expect(sound()).toBeNull()
    expect(still()).not.toBeNull()
  })
})

describe("Still chip", () => {
  it("drops the session to T1 and stops the ambient motion", async () => {
    const user = userEvent.setup()
    mount()
    expect(still()).toHaveAttribute("aria-pressed", "false")
    await user.click(still()!)
    expect(still()).toHaveAttribute("aria-pressed", "true")
    expect(getTierState().still).toBe(true)
    expect(getTierState().tier).toBe("T1")
  })
  it("is not rendered under reduced motion (already still)", () => {
    setReducedMotion(true)
    mount()
    expect(still()).toBeNull()
  })
  it("the row hides while the keyboard is open", () => {
    const { container } = mount({ hidden: true })
    expect(container.querySelector(".chips")).toHaveAttribute("hidden")
  })
})
