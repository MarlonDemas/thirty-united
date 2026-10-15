import { describe, expect, it } from "vitest"
import { banksFor, beatFor, litCount, poseFor, shirtHangs, worldLine, type Beat } from "@/world/beats"

describe("beatFor", () => {
  it("maps each view to its beat; the stub splits on the answer", () => {
    expect(beatFor("sealed")).toBe("cover")
    expect(beatFor("attendance")).toBe("chapter1")
    expect(beatFor("form", "yes")).toBe("chapter2")
    expect(beatFor("code", "maybe")).toBe("code")
    expect(beatFor("stub", "yes")).toBe("signed")
    expect(beatFor("stub", "maybe")).toBe("signed")
    expect(beatFor("stub", "no")).toBe("no-end")
  })
})

describe("banksFor (progress is light)", () => {
  it.each<[Beat, "yes" | "maybe" | "no" | undefined, number[]]>([
    ["cover", undefined, [0, 0, 0, 0]],
    ["chapter1", undefined, [1, 0, 0, 0]],
    ["chapter2", "yes", [1, 1, 0, 0]],
    ["chapter2", "maybe", [1, 0.5, 0, 0]],
    ["chapter2", "no", [1, 0, 0, 0]],
    ["code", "yes", [1, 1, 1, 0]],
    ["code", "maybe", [1, 0.5, 1, 0]],
    ["code", "no", [1, 0, 0, 0]],
    ["signed", "yes", [1, 1, 1, 1]],
    ["signed", "maybe", [1, 1, 1, 1]],
    ["no-end", "no", [1, 0, 0, 0]],
  ])("%s (%s) -> %j", (beat, attending, banks) => {
    expect(banksFor(beat, attending)).toEqual(banks)
  })

  it("lit count: cover 0, chapter 1 one, chapter 2 two, code three, signed four; No holds at one", () => {
    const yes = (["cover", "chapter1", "chapter2", "code", "signed"] as Beat[]).map((b) => litCount(banksFor(b, "yes")))
    expect(yes).toEqual([0, 1, 2, 3, 4])
    const no = (["chapter1", "chapter2", "code", "no-end"] as Beat[]).map((b) => litCount(banksFor(b, "no")))
    expect(no).toEqual([1, 1, 1, 1])
  })
})

describe("worldLine (the live region)", () => {
  const at = (beat: Beat, a?: "yes" | "maybe" | "no") => ({ beat, banks: banksFor(beat, a) })
  it("announces each strike, and the world's answer on leaving Chapter 1", () => {
    expect(worldLine(at("cover"), at("chapter1"))).toBe("1 of 4 floodlights on")
    expect(worldLine(at("chapter1"), at("chapter2", "yes"), "yes")).toBe("You're in. The lights are coming on.")
    expect(worldLine(at("chapter1"), at("chapter2", "no"), "no")).toBe("Sorry you'll miss it.")
    expect(worldLine(at("chapter2", "yes"), at("code", "yes"), "yes")).toBe("3 of 4 floodlights on")
    expect(worldLine(at("code", "yes"), at("signed", "yes"), "yes")).toBe("4 of 4 floodlights on")
  })
  it("says nothing when no light changes (No path, going back)", () => {
    expect(worldLine(at("chapter2", "no"), at("code", "no"), "no")).toBe("")
    expect(worldLine(at("code", "yes"), at("chapter2", "yes"), "yes")).toBe("")
  })
})

describe("poses and the hanging shirt", () => {
  it("cover stands, signed signs, No waves", () => {
    expect(poseFor("cover")).toBe("l5-makes")
    expect(poseFor("chapter2", "yes")).toBe("l5-makes")
    expect(poseFor("chapter2", "no")).toBe("l6-makes-wave")
    expect(poseFor("no-end", "no")).toBe("l6-makes-wave")
    expect(poseFor("signed", "maybe")).toBe("l7-makes-signing")
  })
  it("the shirt hangs for Yes and Maybe in Chapter 2 and the code, never for No", () => {
    expect(shirtHangs("chapter2", "yes")).toBe(true)
    expect(shirtHangs("code", "maybe")).toBe(true)
    expect(shirtHangs("chapter2", "no")).toBe(false)
    expect(shirtHangs("chapter1")).toBe(false)
    expect(shirtHangs("signed", "yes")).toBe(false) // he holds it up instead
  })
})
