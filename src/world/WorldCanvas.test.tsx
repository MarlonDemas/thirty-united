import { StrictMode } from "react"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Texture } from "three"
import { layerUrl } from "@/world/layers"
import { usePlateTextures } from "@/world/WorldCanvas"

// jsdom loads no images: the loader holds each request until the test lands or fails it.
type Pending = { url: string; onLoad: (t: Texture) => void; onError: () => void }
const loads = vi.hoisted(() => ({ pending: [] as Pending[] }))
vi.mock("three", async (importOriginal) => ({
  ...(await importOriginal<typeof import("three")>()),
  TextureLoader: class {
    load(url: string, onLoad: (t: Texture) => void, _p: unknown, onError: () => void) {
      loads.pending.push({ url, onLoad, onError })
    }
  },
}))

const texture = () => ({ dispose: vi.fn() }) as unknown as Texture & { dispose: ReturnType<typeof vi.fn> }
const land = (p: Pending) => {
  const t = texture()
  act(() => p.onLoad(t))
  return t
}
const A = "l5-makes"
const B = "l6-makes-wave"

describe("usePlateTextures", () => {
  beforeEach(() => {
    loads.pending = []
  })

  it("a plate whose load spans a change of names still lands", () => {
    const { result, rerender } = renderHook(({ names }) => usePlateTextures(names), { initialProps: { names: [A] } })
    expect(loads.pending.map((p) => p.url)).toEqual([layerUrl(A, 1080)])
    rerender({ names: [A, B] })
    const [a, b] = loads.pending
    const ta = land(a)
    expect(result.current.get(A)).toBe(ta) // without waiting on another plate to land
    const tb = land(b)
    expect(result.current.get(B)).toBe(tb)
  })

  it("a plate that lands after unmount is disposed, and unmount disposes the rest", () => {
    const { unmount } = renderHook(() => usePlateTextures([A, B]))
    const [a, b] = loads.pending
    const ta = land(a)
    unmount()
    expect(ta.dispose).toHaveBeenCalled()
    const tb = land(b)
    expect(tb.dispose).toHaveBeenCalled()
  })

  it("a StrictMode remount asks again and keeps one texture per plate", () => {
    const names = [A]
    const { result } = renderHook(() => usePlateTextures(names), { wrapper: StrictMode })
    expect(loads.pending).toHaveLength(2)
    const [first, second] = loads.pending
    const t1 = land(first)
    const t2 = land(second)
    expect(result.current.get(A)).toBe(t1)
    expect(t1.dispose).not.toHaveBeenCalled()
    expect(t2.dispose).toHaveBeenCalled()
  })
})
