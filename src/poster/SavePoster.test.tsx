import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"
import SavePoster, { DRAW_AT_MS } from "@/poster/SavePoster"
import { STAMP_AT_MS } from "@/world/WorldStage"

const renderPoster = vi.hoisted(() => vi.fn())
vi.mock("@/poster/compositor", () => ({ renderPoster }))

const saved = (over: Partial<SavedResult> = {}): SavedResult => ({
  status: "saved",
  ticketNo: 17,
  firstName: "Thandi",
  surname: "Nkosi",
  attending: "yes",
  ...over,
})
const payload: RsvpPayload = { firstName: "Thandi", surname: "Nkosi", attending: "yes", plusOne: true, plusOneName: "Lerato Mokoena" }
const file = new File(["jpeg"], "thirty-united-poster.jpg", { type: "image/jpeg" })
const URL_ = "data:image/jpeg;base64,AAAA"

const nav = navigator as unknown as Record<string, unknown>
function stubShare(canShare: boolean | undefined) {
  const share = vi.fn(() => Promise.resolve())
  nav.share = canShare === undefined ? undefined : share
  nav.canShare = canShare === undefined ? undefined : vi.fn(() => canShare)
  return share
}

beforeEach(() => {
  ;(globalThis as { __reduced?: boolean }).__reduced = true // draw at once (no wait for the stamp)
  renderPoster.mockReset()
  renderPoster.mockResolvedValue({ file, url: URL_ })
})
afterEach(() => {
  delete nav.share
  delete nav.canShare
})

const ready = () => waitFor(() => expect(renderPoster).toHaveBeenCalled())

describe("SavePoster", () => {
  it("draws the poster from the poster fields only: no surname reaches the compositor", async () => {
    stubShare(undefined)
    render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    expect(renderPoster).toHaveBeenCalledWith({ attending: "yes", name: "THANDI", number: "17", plusOne: "+ LERATO" })
    expect(JSON.stringify(renderPoster.mock.calls)).not.toMatch(/nkosi|mokoena/i)
  })

  it("Share shows once the file is made, where canShare({ files }) is true, and shares that file in the tap", async () => {
    const share = stubShare(true)
    render(<SavePoster saved={saved()} payload={payload} />)
    expect(screen.getByRole("button", { name: "Save your poster" })).toBeInTheDocument()
    const btn = await screen.findByRole("button", { name: "Share" })
    expect(navigator.canShare).toHaveBeenCalledWith({ files: [file] })
    fireEvent.click(btn)
    expect(share).toHaveBeenCalledTimes(1) // synchronously, in the tap
    expect(share).toHaveBeenCalledWith({ files: [file] })
    expect(screen.getByText("Save it now. We don't keep a copy.")).toBeInTheDocument()
  })

  it("no Share where files cannot be shared (or there is no navigator.share at all); Save stays", async () => {
    stubShare(false)
    const { unmount } = render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    await act(async () => {})
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull()
    expect(screen.getByRole("button", { name: "Save your poster" })).toBeInTheDocument()
    unmount()
    stubShare(undefined)
    render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    await act(async () => {})
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull()
  })

  it("Save opens the viewer: a modal with the poster image, its alt text and the long-press line; Esc closes and focus returns", async () => {
    stubShare(undefined)
    render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    await act(async () => {})
    const save = screen.getByRole("button", { name: "Save your poster" })
    fireEvent.click(save)
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(dialog).toHaveAccessibleName("Press and hold the poster to save it")
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", URL_)
    expect(img).toHaveAccessibleName(
      "Poster: Makes holds up a red shirt reading THANDI 17. THIRTY UNITED, Monday 21 December 2026. Stamped Signed. Credit: plus LERATO",
    )
    const close = screen.getByRole("button", { name: "Close" })
    expect(close).toHaveFocus()
    fireEvent.keyDown(dialog, { key: "Tab" })
    expect(close).toHaveFocus() // focus stays in the viewer
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(save).toHaveFocus()
  })

  it("shows a decorative thumbnail of the poster once drawn", async () => {
    stubShare(undefined)
    let done: (v: unknown) => void = () => {}
    renderPoster.mockReturnValue(new Promise((ok) => (done = ok)))
    render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    expect(screen.queryByTestId("poster-thumb")).toBeNull()
    expect(screen.getByTestId("poster-slot")).toBeInTheDocument() // the slot is reserved before the draw
    await act(async () => done({ file, url: URL_ }))
    const thumb = screen.getByTestId("poster-thumb")
    expect(thumb).toHaveAttribute("src", URL_)
    expect(thumb).toHaveAttribute("aria-hidden", "true")
    expect(thumb).toHaveAttribute("alt", "")
    fireEvent.click(screen.getByRole("button", { name: "Save your poster" }))
    expect(screen.getByRole("img")).toHaveAttribute("src", URL_) // the viewer's image is the same URL
  })

  it("a tap on Save before the poster is drawn opens the viewer as soon as it is", async () => {
    stubShare(undefined)
    let done: (v: unknown) => void = () => {}
    renderPoster.mockReturnValue(new Promise((ok) => (done = ok)))
    render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Save your poster" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByRole("button", { name: "Making your poster…" })).not.toHaveAttribute("aria-busy")
    await act(async () => done({ file, url: URL_ }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("waits for the stamp to land before drawing (unless reduced motion)", () => {
    expect(DRAW_AT_MS).toBe(STAMP_AT_MS)
    vi.useFakeTimers()
    try {
      ;(globalThis as { __reduced?: boolean }).__reduced = false
      render(<SavePoster saved={saved()} payload={payload} />)
      vi.advanceTimersByTime(1700)
      expect(renderPoster).not.toHaveBeenCalled()
      vi.advanceTimersByTime(200)
      expect(renderPoster).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it("if the poster cannot be drawn, logs it, says so in a status and offers no buttons", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const err = new Error("no canvas")
    renderPoster.mockRejectedValue(err)
    render(<SavePoster saved={saved()} payload={payload} />)
    const msg = await screen.findByText("Your poster couldn't be made on this device. Your seat is saved.")
    expect(msg).toHaveAttribute("role", "status")
    expect(msg).not.toHaveFocus() // nobody asked for it: focus stays where the guest is
    expect(screen.queryByRole("button")).toBeNull()
    expect(error).toHaveBeenCalledWith(expect.any(String), err)
    error.mockRestore()
  })

  it("a tap on Save that ends in failure moves focus to the message, not to the page", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    let fail: (e: unknown) => void = () => {}
    renderPoster.mockReturnValue(new Promise((_, no) => (fail = no)))
    render(<SavePoster saved={saved()} payload={payload} />)
    await ready()
    const save = screen.getByRole("button", { name: "Save your poster" })
    save.focus()
    fireEvent.click(save)
    await act(async () => fail(new Error("no canvas")))
    expect(screen.getByRole("status")).toHaveFocus()
    error.mockRestore()
  })

  it("a No gets no poster", async () => {
    const { container } = render(<SavePoster saved={saved({ attending: "no" })} payload={{ ...payload, attending: "no" }} />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
    expect(renderPoster).not.toHaveBeenCalled()
  })
})

/** The poster chunk's own sources (tests and the build-time og.ts excepted), plus the shared lettering module. */
const SOURCES = Object.entries(
  import.meta.glob<string>(["./*.{ts,tsx}", "../world/lettering.ts"], { query: "?raw", import: "default", eager: true }),
).filter(([path]) => !/\.test\.|\/og\.ts$/.test(path))

/** Runtime import specifiers: `import … from "x"`, bare `import "x"` and `import("x")`; `import type` is skipped. */
function runtimeImports(path: string, src: string): string[] {
  const specs = [
    ...[...src.matchAll(/^\s*import\s+(?!type\b)[^"']*?\bfrom\s+["']([^"']+)["']/gm)].map((m) => m[1]),
    ...[...src.matchAll(/^\s*import\s+["']([^"']+)["']/gm)].map((m) => m[1]),
    ...[...src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
  ]
  // "./x" and "../world/x" written as the "@/" alias, so a relative import cannot slip past the list.
  const dir = path.startsWith("../world/") ? "@/world" : "@/poster"
  return specs.map((x) => x.replace(/^\.\.\/world\//, "@/world/").replace(/^\.\//, `${dir}/`).replace(/\.tsx?$/, ""))
}

describe("the lazy poster chunk keeps first paint flat", () => {
  // A proxy only: the real gate is the 160 kB gz first-paint budget, checked on `npm run build`.
  it("proxy check (the real gate is the 160 kB gz first-paint budget): imports none of the modules that split the entry chunk", () => {
    const paths = SOURCES.map(([p]) => p)
    expect(paths).toEqual(expect.arrayContaining(["./SavePoster.tsx", "./compositor.ts", "./scene.ts", "../world/lettering.ts"]))
    expect(paths).not.toContain("./og.ts")
    const all = SOURCES.flatMap(([p, src]) => runtimeImports(p, src))
    expect(all).toEqual(expect.arrayContaining(["@/world/layers", "@/poster/compositor", "react"])) // the parser finds imports
    for (const [p, src] of SOURCES) {
      const imports = runtimeImports(p, src)
      for (const banned of ["lucide-react", "react-dom", "@/world/WorldStage", "@/world/shots"]) expect(imports, p).not.toContain(banned)
    }
  })

  it("the import parser sees every form, and skips type-only imports", () => {
    const src = 'import a from "a"\nimport {\n  b,\n} from "b"\nimport "c"\nimport type { D } from "d"\nconst e = () => import("e")\nimport { type F, g } from "./g"\n'
    expect(runtimeImports("./x.ts", src).sort()).toEqual(["@/poster/g", "a", "b", "c", "e"])
  })
})
