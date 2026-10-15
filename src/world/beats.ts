import type { Attending } from "@/lib/schemas/rsvp"

/** The page's views (InvitePage's state machine). */
export type View = "sealed" | "attendance" | "form" | "code" | "stub"

/** One beat per camera shot (CHOSEN.md table). */
export type Beat = "cover" | "chapter1" | "chapter2" | "code" | "signed" | "no-end"

export const BEATS: readonly Beat[] = ["cover", "chapter1", "chapter2", "code", "signed", "no-end"]

export function beatFor(view: View, attending?: Attending): Beat {
  switch (view) {
    case "sealed":
      return "cover"
    case "attendance":
      return "chapter1"
    case "form":
      return "chapter2"
    case "code":
      return "code"
    case "stub":
      return attending === "no" ? "no-end" : "signed"
  }
}

/** A bank's light: off, half (Maybe holds bank 2 at half) or full. */
export type BankLevel = 0 | 0.5 | 1
export type Banks = readonly [BankLevel, BankLevel, BankLevel, BankLevel]

/**
 * Progress is light (CHOSEN.md): cover 0 banks, Chapter 1 one, Chapter 2 two (half on Maybe), the code three,
 * signed four. A No never strikes past the first bank: it holds at the pre-match lights to the end.
 */
export function banksFor(beat: Beat, attending?: Attending): Banks {
  const no = attending === "no"
  const second: BankLevel = attending === "maybe" ? 0.5 : 1
  switch (beat) {
    case "cover":
      return [0, 0, 0, 0]
    case "chapter1":
    case "no-end":
      return [1, 0, 0, 0]
    case "chapter2":
      return no ? [1, 0, 0, 0] : [1, second, 0, 0]
    case "code":
      return no ? [1, 0, 0, 0] : [1, second, 1, 0]
    case "signed":
      return [1, 1, 1, 1] // ignition: every bank to full, Maybe's half bank too
  }
}

export const litCount = (b: Banks) => b.filter((l) => l > 0).length

/** Draft lines from the recommendation (Chapter 1, the world's answer). Owner rewrites them. */
export const ANSWER_LINES: Record<Attending, string> = {
  yes: "You're in. The lights are coming on.",
  maybe: "Maybe. We'll keep a light on.",
  no: "Sorry you'll miss it.",
}

/**
 * What the live region says when the world changes (the world itself is aria-hidden). Leaving Chapter 1 the
 * world answers the pick; any other new strike reads as a count. Nothing changed: nothing to say.
 */
export function worldLine(from: { beat: Beat; banks: Banks }, to: { beat: Beat; banks: Banks }, attending?: Attending): string {
  if (from.beat === "chapter1" && to.beat === "chapter2" && attending) return ANSWER_LINES[attending]
  const before = litCount(from.banks)
  const after = litCount(to.banks)
  if (after > before) return `${after} of 4 floodlights on`
  return ""
}

/** Makes's plate per beat. The wave and signing plates load only when a beat needs them. */
export type Pose = "l5-makes" | "l6-makes-wave" | "l7-makes-signing"

export function poseFor(beat: Beat, attending?: Attending): Pose {
  if (beat === "signed") return "l7-makes-signing"
  if (beat === "no-end") return "l6-makes-wave"
  if ((beat === "chapter2" || beat === "code") && attending === "no") return "l6-makes-wave" // "Makes keeps waving"
  return "l5-makes"
}

/** The hanging shirt (L8) is in the world for Yes and Maybe from Chapter 2 until he holds it up at the signing. */
export const shirtHangs = (beat: Beat, attending?: Attending) =>
  (beat === "chapter2" || beat === "code") && attending !== "no" && attending !== undefined
