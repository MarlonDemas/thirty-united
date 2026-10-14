import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { SealedView } from "@/components/SealedView"
import { getSoundOn } from "@/lib/sound"
import { setReducedMotion } from "@/test-utils"

const mount = () => render(<SealedView onTorn={() => {}} focusHeading={false} />)
const tab = () => screen.queryByRole("button", { name: /^sound/i })

describe("SealedView Sound tab", () => {
  it("renders off and pressed=false by default", () => {
    mount()
    expect(tab()).toHaveAttribute("aria-pressed", "false")
    expect(getSoundOn()).toBe(false)
  })
  it("toggles aria-pressed and the stored preference", async () => {
    const user = userEvent.setup()
    mount()
    await user.click(tab()!)
    expect(tab()).toHaveAttribute("aria-pressed", "true")
    expect(getSoundOn()).toBe(true)
    await user.click(tab()!)
    expect(tab()).toHaveAttribute("aria-pressed", "false")
    expect(getSoundOn()).toBe(false)
  })
  it("is not rendered under reduced motion", () => {
    setReducedMotion(true)
    mount()
    expect(tab()).toBeNull()
  })
  it("is not rendered when the invite key is missing", () => {
    render(<SealedView onTorn={() => {}} focusHeading={false} missingKey />)
    expect(tab()).toBeNull()
  })
})
