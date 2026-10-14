import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PointerEvent } from "react"
import { useTilt } from "@/hooks/useTilt"
import { stubMedia } from "@/test-media"

const animateSpy = vi.hoisted(() => vi.fn())
vi.mock("motion/react", async (orig) => ({ ...(await orig<typeof import("motion/react")>()), animate: animateSpy }))

const pointer = (x: number, y: number) =>
  ({
    clientX: x,
    clientY: y,
    pointerType: "mouse",
    target: document.createElement("div"),
    currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
  }) as unknown as PointerEvent<HTMLElement>

beforeEach(() => animateSpy.mockClear())

describe("useTilt", () => {
  it("follows the pointer when enabled", () => {
    stubMedia()
    const { result } = renderHook(() => useTilt(true))
    result.current.handlers.onPointerMove(pointer(100, 50))
    expect(animateSpy).toHaveBeenCalledTimes(2)
    expect(animateSpy.mock.calls.map((c) => c[1])).toEqual([-0, 9]) // rotateX, rotateY at the right edge
  })
  it("stays flat when enabled is false", () => {
    stubMedia()
    const { result } = renderHook(() => useTilt(false))
    result.current.handlers.onPointerMove(pointer(100, 50))
    expect(animateSpy).not.toHaveBeenCalled()
    expect(result.current.style.rotateY).toHaveProperty("get")
  })
  it("stays flat under forced-colors even when enabled", () => {
    stubMedia({ forced: true })
    const { result } = renderHook(() => useTilt(true))
    result.current.handlers.onPointerDown(pointer(100, 50))
    expect(animateSpy).not.toHaveBeenCalled()
  })
  it("stays flat when the caller passes enabled=false for reduced motion", () => {
    // SealedView feeds `!reduced` into the hook; the hook itself only sees the boolean.
    stubMedia({ reduced: true })
    const { result } = renderHook(() => useTilt(!window.matchMedia("(prefers-reduced-motion: reduce)").matches))
    result.current.handlers.onPointerMove(pointer(0, 0))
    expect(animateSpy).not.toHaveBeenCalled()
  })
  it("drops a leaning ticket to flat when switched off", () => {
    stubMedia()
    const { result, rerender } = renderHook(({ on }) => useTilt(on), { initialProps: { on: true } })
    ;(result.current.style.rotateY as { set: (n: number) => void }).set(5)
    rerender({ on: false })
    expect((result.current.style.rotateY as { get: () => number }).get()).toBe(0)
  })
})
