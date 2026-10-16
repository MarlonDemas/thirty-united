import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { setReducedMotion } from "@/test-utils"
import { layoutFor, placeShot, placeSignedWide, SHOTS } from "@/world/shots"
import { resetTier } from "@/world/tier"
import type { WorldCanvasProps } from "@/world/WorldCanvas"
import { GL_FADE_MS, SIGNED_PUSH_AT_MS, WorldStage } from "@/world/WorldStage"

// jsdom has no WebGL: the world canvas is a marker that hands its props to the test.
const canvas = vi.hoisted(() => ({ props: null as WorldCanvasProps | null }))
vi.mock("@/world/WorldCanvas", () => ({
  default: (props: WorldCanvasProps) => {
    canvas.props = props
    return <div data-testid="world-gl" />
  },
}))

const layout = layoutFor({ w: 390, h: 844, vvTop: 0, vvH: 844, keyboard: false })
const frame = { w: 390, h: 844 }
const mount = () =>
  render(
    <WorldStage
      beat="signed"
      attending="yes"
      layout={layout}
      vvTop={0}
      shirtName="THANDI"
      shirtNumber="17"
      digits={6}
      passSlot={document.createElement("div")}
    />,
  )
const world = () => screen.getByTestId("world-stage")
const transform = () => world().querySelector<HTMLElement>(".poster")!.style.transform
const css = (p: { s: number; tx: number; ty: number }) => `translate(${p.tx}px, ${p.ty}px) scale(${p.s})`

describe("the signing shot", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts wide while the banks fire, then pushes in to the face-and-shirt framing", () => {
    mount()
    expect(world()).toHaveAttribute("data-tier", "T1")
    expect(world()).toHaveAttribute("data-title-front", "false")
    expect(world()).toHaveAttribute("data-wide", "true")
    expect(transform()).toBe(css(placeSignedWide(frame)))
    act(() => vi.advanceTimersByTime(SIGNED_PUSH_AT_MS - 1))
    expect(world()).toHaveAttribute("data-wide", "true")
    act(() => vi.advanceTimersByTime(1))
    expect(world()).toHaveAttribute("data-wide", "false")
    expect(transform()).toBe(css(placeShot(SHOTS.signed, frame)))
  })

  it("reduced motion (T0) cuts straight to the final framing, every bank lit", () => {
    setReducedMotion(true)
    mount()
    expect(world()).toHaveAttribute("data-tier", "T0")
    expect(world()).toHaveAttribute("data-wide", "false")
    expect(transform()).toBe(css(placeShot(SHOTS.signed, frame)))
    for (const n of [1, 2, 3, 4]) expect(world().querySelector<HTMLElement>(`[data-layer=l2b-stadium-on-b${n}]`)!.style.opacity).toBe("1")
  })
})

describe("the title over the lanyard", () => {
  const cover = () =>
    render(
      <WorldStage beat="cover" layout={layout} vvTop={0} shirtName="" shirtNumber={null} digits={0} passSlot={document.createElement("div")} />,
    )
  // A WebGL2 device with a masked renderer: the heuristic picks T2 (as in tier.test.ts).
  const onT2 = () => {
    vi.stubGlobal("WebGL2RenderingContext", class {})
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({
      MAX_TEXTURE_SIZE: 0x0d33,
      getParameter: () => 8192,
      getExtension: () => null,
    } as unknown as RenderingContext)
    resetTier()
  }
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("on T2 the cover draws a copy of the title after the pass zone, at the poster's transform, out of the pointer's way", () => {
    onT2()
    cover()
    expect(world()).toHaveAttribute("data-tier", "T2")
    expect(world()).toHaveAttribute("data-title-front", "true") // index.css hides the poster's own copy meanwhile
    const front = screen.getByTestId("title-front")
    const zone = world().querySelector(".pass-zone")!
    // Later in the frame than the zone that holds the lanyard canvas: painted over it.
    expect(zone.compareDocumentPosition(front) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(front.style.transform).toBe(transform())
    expect(front).toHaveClass("poster-front")
    expect([...front.querySelectorAll("[data-layer]")].map((e) => e.getAttribute("data-layer"))).toEqual(["thirty", "united"])
  })

  it("on T2 the world canvas is the poster's first child, fades in on its first frame, then the plates hide", async () => {
    onT2()
    cover()
    const gl = await screen.findByTestId("world-gl") // the lazy chunk resolves on real timers
    vi.useFakeTimers()
    expect(world().querySelector(".poster")!.firstElementChild).toBe(gl)
    expect(world()).toHaveAttribute("data-gl", "off")
    expect(canvas.props).toMatchObject({ beat: "cover", tier: "T2", live: false })
    act(() => canvas.props!.onReady())
    expect(world()).toHaveAttribute("data-gl", "fading")
    act(() => vi.advanceTimersByTime(GL_FADE_MS))
    expect(world()).toHaveAttribute("data-gl", "live")
    expect(canvas.props!.live).toBe(true)
  })

  it("a hidden tab unmounts the world canvas (it lets go of its textures) and the DOM plates are the world again", async () => {
    onT2()
    cover()
    await screen.findByTestId("world-gl")
    act(() => canvas.props!.onReady())
    const vis = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(screen.queryByTestId("world-gl")).toBeNull()
    expect(world()).toHaveAttribute("data-gl", "off")
    vis.mockRestore()
  })

  it("T1 keeps the one title in the poster", () => {
    cover()
    expect(world()).toHaveAttribute("data-tier", "T1")
    expect(screen.queryByTestId("title-front")).toBeNull()
    expect(world().querySelectorAll("[data-layer=thirty]")).toHaveLength(1)
    expect(screen.queryByTestId("world-gl")).toBeNull()
  })
})
