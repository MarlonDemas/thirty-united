import { Suspense, lazy, useState, type LazyExoticComponent, type ReactNode } from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InvitePage } from "@/components/InvitePage"
import { snapshotInto, usePanelFade } from "@/hooks/usePanelFade"
import { stubMedia } from "@/test-media"
import { fakeApi } from "@/test-utils"

// jsdom has no layout: the view sits 24 px into the panel (its padding), which is scrolled 40 px.
let height = 300
beforeEach(() => {
  height = 300
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height)
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(342)
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(24)
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(24)
})

// jsdom has no Web Animations either: a stand-in for the ghost's CSS fade (index.css), 300 ms.
type Fake = { pause: () => void; currentTime: number; effect: { getTiming: () => { duration: number } } }
let fake: Fake
const withAnimations = () => {
  fake = { pause: vi.fn(), currentTime: -1, effect: { getTiming: () => ({ duration: 300 }) } }
  ;(Element.prototype as { getAnimations?: () => Fake[] }).getAnimations = function (this: Element) {
    return this.hasAttribute("data-fade") ? [fake] : []
  }
}
afterEach(() => {
  delete (Element.prototype as { getAnimations?: unknown }).getAnimations
  vi.restoreAllMocks()
})

// Frames are drawn only when the test draws them, 17 ms apart; a cancelled frame is gone and never runs.
function stubFrames() {
  const frames = new Map<number, FrameRequestCallback>()
  let id = 0
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    frames.set(++id, cb)
    return id
  })
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((n) => void frames.delete(n))
  let now = 1000
  const drawAll = () => {
    for (; frames.size; now += 17) {
      const [[n, cb]] = frames
      frames.delete(n)
      act(() => cb(now))
    }
  }
  return { frames, drawAll }
}

describe("snapshotInto", () => {
  it("copies the view without ids, names or test ids, with what the guest typed, where the view sat", () => {
    const view = document.createElement("div")
    view.innerHTML = `<h1 id="t">Your shirt</h1><input id="f" name="email" data-testid="e"><select name="s"><option>a</option><option>b</option></select>`
    const [email, select] = view.querySelectorAll<HTMLInputElement & HTMLSelectElement>("input,select")
    email.value = "thandi@example.com"
    select.value = "b"
    const panel = document.createElement("main")
    panel.append(view)
    vi.spyOn(panel, "scrollTop", "get").mockReturnValue(40)
    const ghost = document.createElement("div")
    ghost.className = "panel-ghost"

    snapshotInto(ghost, view)
    const copy = ghost.firstElementChild as HTMLElement
    expect(copy.querySelectorAll("[id],[name],[data-testid]")).toHaveLength(0)
    expect(copy.querySelector("h1")).toHaveTextContent("Your shirt")
    const [cEmail, cSelect] = copy.querySelectorAll<HTMLInputElement & HTMLSelectElement>("input,select")
    expect(cEmail.value).toBe("thandi@example.com")
    expect(cSelect.value).toBe("b")
    expect(copy.style.position).toBe("absolute")
    expect(copy.style.top).toBe("-16px") // where the guest saw it: 24 px into the panel, less its 40 px scroll
    expect(copy.style.left).toBe("24px")
    expect(copy.style.width).toBe("342px")
    expect(view.querySelector("#t")).not.toBeNull() // the live view is untouched
  })

  it("copies nothing when the view has no box on screen (hidden while a view loads)", () => {
    height = 0
    const ghost = document.createElement("div")
    snapshotInto(ghost, document.createElement("div"))
    expect(ghost.childElementCount).toBe(0)
  })
})

// A panel like InvitePage's: one keyed view, the ghost beside it. Each test gets a view still to load.
let release: () => void = () => {}
let Slow: LazyExoticComponent<() => ReactNode>
beforeEach(() => {
  Slow = lazy(() => new Promise<{ default: () => ReactNode }>((r) => (release = () => r({ default: () => <h1>Slow</h1> }))))
})
function Panel() {
  const { ghostRef, viewRef, hold } = usePanelFade()
  const [view, setView] = useState("a")
  const go = (v: string) => {
    // InvitePage's guard, the caller's not the hook's: only a change of view remounts it, and so fades the copy out.
    if (v !== view) hold()
    setView(v)
  }
  return (
    <>
      <main>
        <Suspense fallback={null}>
          <div key={view} ref={viewRef}>
            {view === "a" && <button onClick={() => go("b")}>Old view</button>}
            {view === "b" && (
              <>
                <button onClick={() => go("slow")}>New view</button>
                <button onClick={() => go("b")}>Same view</button>
              </>
            )}
            {view === "slow" && <Slow />}
          </div>
        </Suspense>
      </main>
      <div ref={ghostRef} data-testid="ghost" className="panel-ghost" aria-hidden="true" inert />
    </>
  )
}
const ghost = () => screen.getByTestId("ghost")

describe("usePanelFade", () => {
  it("holds the old view over the new one, then fades it by the frames drawn (a stall never skips ahead)", async () => {
    stubMedia()
    withAnimations()
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb))
    const user = userEvent.setup()
    render(<Panel />)
    expect(ghost()).toBeEmptyDOMElement()
    await user.click(screen.getByRole("button", { name: "Old view" }))
    expect(screen.getByRole("button", { name: "New view" })).toBeInTheDocument() // the live view swapped at once
    expect(screen.queryByRole("button", { name: "Old view" })).not.toBeInTheDocument() // the copy is aria-hidden
    expect(ghost()).toHaveTextContent("Old view")
    expect(ghost()).toHaveAttribute("data-fade")
    expect(fake.pause).toHaveBeenCalled()

    const at = (now: number) => act(() => frames.shift()!(now))
    const times: number[] = []
    for (const now of [1000, 1016, 1033, 1250, 1266]) {
      at(now) // 1033 -> 1250: a 217 ms stall moves the fade on by 34 ms, no more
      times.push(fake.currentTime)
    }
    expect(times).toEqual([0, 16, 33, 67, 83])
    for (let now = 1283; frames.length; now += 17) at(now)
    expect(fake.currentTime).toBeGreaterThanOrEqual(300)
    expect(ghost()).toBeEmptyDOMElement()
    expect(ghost()).not.toHaveAttribute("data-fade")
  })

  it("keeps the copy up, without fading, while the next view is still loading", async () => {
    stubMedia()
    stubFrames() // the fade it starts at the end must not run on into the next test's frames
    const user = userEvent.setup()
    render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" }))
    withAnimations()
    await user.click(screen.getByRole("button", { name: "New view" }))
    expect(ghost()).toHaveTextContent("New view")
    expect(ghost()).not.toHaveAttribute("data-fade") // no timer: it waits for the view
    await act(async () => release())
    expect(await screen.findByRole("heading", { name: "Slow" })).toBeInTheDocument()
    expect(ghost()).toHaveAttribute("data-fade")
  })

  it("a change during a fade replaces the copy (one copy, never two) and stops the old fade", async () => {
    stubMedia()
    withAnimations()
    const { frames, drawAll } = stubFrames()
    const user = userEvent.setup()
    render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" }))
    expect(ghost()).toHaveAttribute("data-fade")
    expect(frames.size).toBe(1) // the fade's next frame
    await user.click(screen.getByRole("button", { name: "New view" })) // no frame drawn in between
    expect(ghost().childElementCount).toBe(1)
    expect(ghost()).toHaveTextContent("New view")
    expect(ghost()).not.toHaveTextContent("Old view")
    expect(ghost()).not.toHaveAttribute("data-fade") // the next view is still loading
    expect(frames.size).toBe(0)
    drawAll()
    expect(fake.currentTime).toBe(-1) // the old fade's frames never move it
  })

  it("a second change while the next view loads keeps the copy it holds, then fades it once a view is up", async () => {
    stubMedia()
    withAnimations()
    const { drawAll } = stubFrames()
    const user = userEvent.setup()
    render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" })) // holds a copy of the old view
    expect(ghost()).toHaveTextContent("Old view")
    height = 0 // a view waiting for its chunk is display: none under Suspense: no box to copy
    await user.click(screen.getByRole("button", { name: "New view" }))
    expect(ghost().childElementCount).toBe(1)
    expect(ghost()).toHaveTextContent("Old view") // the panel shows the held copy, never blank
    expect(ghost()).not.toHaveAttribute("data-fade")
    height = 300
    await act(async () => release())
    expect(await screen.findByRole("heading", { name: "Slow" })).toBeInTheDocument()
    expect(ghost()).toHaveAttribute("data-fade") // the copy never sticks: the view that comes up fades it
    drawAll()
    expect(fake.currentTime).toBeGreaterThanOrEqual(300)
    expect(ghost()).toBeEmptyDOMElement()
  })

  it("a go() to the view already up holds nothing", async () => {
    stubMedia()
    withAnimations()
    const { drawAll } = stubFrames()
    const user = userEvent.setup()
    render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" }))
    drawAll()
    expect(ghost()).toBeEmptyDOMElement()
    await user.click(screen.getByRole("button", { name: "Same view" }))
    expect(ghost()).toBeEmptyDOMElement() // no copy over the live view, so none left stuck there
    expect(ghost()).not.toHaveAttribute("data-fade")
    expect(screen.getByRole("button", { name: "New view" })).toBeInTheDocument()
  })

  it("unmounting mid-fade throws nothing, even as the fade's frames still run", async () => {
    stubMedia()
    withAnimations()
    const { frames, drawAll } = stubFrames()
    const user = userEvent.setup()
    const { unmount } = render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" }))
    expect(frames.size).toBe(1)
    unmount()
    expect(drawAll).not.toThrow()
    expect(fake.currentTime).toBeGreaterThanOrEqual(300)
  })

  it("without Web Animations the copy goes as soon as the new view is up", async () => {
    stubMedia()
    const user = userEvent.setup()
    render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" }))
    expect(screen.getByRole("button", { name: "New view" })).toBeInTheDocument()
    expect(ghost()).toBeEmptyDOMElement()
  })

  it.each([
    ["reduced motion", { reduced: true }],
    ["forced colours", { forced: true }],
  ])("%s: swaps at once and holds nothing, even while the next view loads", async (_, flags) => {
    stubMedia(flags)
    withAnimations()
    const user = userEvent.setup()
    render(<Panel />)
    await user.click(screen.getByRole("button", { name: "Old view" }))
    expect(ghost()).toBeEmptyDOMElement()
    await user.click(screen.getByRole("button", { name: "New view" }))
    expect(ghost()).toBeEmptyDOMElement()
    expect(ghost()).not.toHaveAttribute("data-fade")
  })
})

describe("InvitePage panel-change", () => {
  it("fades only the first view in; every view after it comes up under the ghost", async () => {
    stubMedia({ reduced: true }) // swaps at once
    const user = userEvent.setup()
    render(<InvitePage api={fakeApi()} />)
    const entering = () => document.querySelectorAll("main.panel .view-enter") // the live view, not the ghost's copy
    expect(entering()).toHaveLength(1)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    expect(await screen.findByRole("heading", { level: 1, name: "Are you in?" })).toBeInTheDocument()
    expect(entering()).toHaveLength(0)
  })

  it("cross-fades the torn ticket into the attendance step; focus and the announcement are at once", async () => {
    stubMedia()
    withAnimations()
    const user = userEvent.setup()
    render(<InvitePage api={fakeApi()} />)
    const g = document.querySelector<HTMLElement>(".panel-ghost")!
    expect(g).toHaveAttribute("aria-hidden", "true")
    expect(g).toHaveAttribute("inert")
    expect(g).toBeEmptyDOMElement()
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Are you in?" })).toHaveFocus(), { timeout: 3000, interval: 10 })
    expect(g).toHaveTextContent("You've been called up")
    expect(g.querySelector("[id]")).toBeNull()
    expect(g).toHaveAttribute("data-fade")
    expect(screen.getAllByRole("status").some((n) => n.textContent === "Ticket opened")).toBe(true)
    await waitFor(() => expect(g).toBeEmptyDOMElement(), { timeout: 3000 }) // the real frames run the fade out
  })
})
