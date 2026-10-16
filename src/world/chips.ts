import type { CSSProperties } from "react"

/**
 * The Sound and Still chips (components.md WorldChip, option B): icon-only square buttons stacked in one column at
 * the top right. These numbers are the only source: WorldChips writes them as CSS custom properties that
 * index.css sizes the chips from, and the shots derive the chip zone the title must clear from the same object.
 */
export const CHIP = {
  /** From the safe-area top and right edges. */
  inset: 12,
  /** Square, at least 44 x 44 CSS px. */
  size: 44,
  gap: 8,
  count: 2,
  /** How far the focus indicator reaches outside a chip: 2 px offset + 3 px moonlight ring + 2 px panel halo. */
  focusReach: 2 + 3 + 2,
} as const

/** The custom properties index.css reads for `.chips` and `.chip`. */
export const chipVars = {
  "--chip-inset": `${CHIP.inset}px`,
  "--chip-size": `${CHIP.size}px`,
  "--chip-gap": `${CHIP.gap}px`,
  "--chip-reach": `${CHIP.focusReach}px`,
} as CSSProperties

/**
 * The box the chip column can paint into, focus indicator included, in screen px from the top right of the frame
 * (the safe area aside). The title lockup must clear it on every shot that shows the title.
 */
export const CHIP_ZONE = {
  top: CHIP.inset - CHIP.focusReach,
  right: CHIP.inset - CHIP.focusReach,
  w: CHIP.size + 2 * CHIP.focusReach,
  h: CHIP.count * CHIP.size + (CHIP.count - 1) * CHIP.gap + 2 * CHIP.focusReach,
} as const
