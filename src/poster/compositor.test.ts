import { describe, expect, it, vi } from "vitest"
import { drawPoster } from "@/poster/compositor"
import type { PosterFields } from "@/poster/fields"
import { AI_CREDIT, FIXTURE_LINE } from "@/poster/layout"

/** A 2D context that records what is written and drawn, and does nothing else. */
function recorder() {
  const text: string[] = []
  const images: unknown[] = []
  const ctx = new Proxy(
    {},
    {
      get(_, key) {
        if (key === "fillText") return (t: string) => text.push(t)
        if (key === "drawImage") return (img: unknown) => images.push(img)
        if (key === "measureText") return (t: string) => ({ width: Array.from(t).length * 20 })
        if (key === "createRadialGradient") return () => ({ addColorStop() {} })
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
  return { ctx, text, images }
}

/** The poster's words: the glyph-by-glyph lines joined back, plus the shirt lettering. */
function drawn(f: PosterFields) {
  const r = recorder()
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(r.ctx as never) // the shirt's flat canvas too
  drawPoster(r.ctx, (n) => ({ name: n }) as unknown as CanvasImageSource, f)
  return { all: r.text.join(""), text: r.text, images: r.images as { name: string }[] }
}

describe("drawPoster: only the poster fields and the fixed lines are written", () => {
  const yes: PosterFields = { attending: "yes", name: "THANDI", number: "17", plusOne: "+ LERATO" }

  it("Yes: the shirt name and number, the fixture line, the plus-one credit, the AI credit, SIGNED", () => {
    const { all, text } = drawn(yes)
    expect(text).toContain("THANDI")
    expect(text).toContain("17")
    for (const line of [FIXTURE_LINE, "+ LERATO", AI_CREDIT, "SIGNED", "21 DEC 2026"]) expect(all).toContain(line)
    expect(all).not.toMatch(/PENCILLED/)
  })

  it("Maybe: PENCILLED IN, and no credit line without a plus-one", () => {
    const { all } = drawn({ ...yes, attending: "maybe", plusOne: null })
    expect(all).toContain("PENCILLED IN")
    expect(all).not.toContain("SIGNED")
    expect(all).not.toContain("+")
    expect(all).toContain(AI_CREDIT)
  })

  it("writes nothing but those strings", () => {
    const { all } = drawn(yes)
    const allowed = ["THANDI", "17", FIXTURE_LINE, "+ LERATO", AI_CREDIT, "SIGNED", "·", "21 DEC 2026"]
    expect(allowed.reduce((rest, s) => rest.replace(s, ""), all)).toBe("")
  })

  it("draws the signing plates and the title, not the hanging shirt or the other poses", () => {
    const names = drawn(yes).images.map((i) => i.name).filter(Boolean)
    expect(names).toEqual(expect.arrayContaining(["l7-makes-signing", "thirty", "united", "l2b-stadium-on-b4"]))
    expect(names).not.toContain("l8-shirt")
    expect(names).not.toContain("l5-makes")
  })
})
