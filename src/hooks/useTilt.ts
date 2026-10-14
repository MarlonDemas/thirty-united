import { useCallback, useEffect } from "react"
import { animate, useMotionValue, useTransform, type MotionStyle } from "motion/react"
import { forcedColors } from "@/lib/motionPrefs"

const FOLLOW = { type: "spring", stiffness: 140, damping: 18, mass: 0.8 } as const
const RETURN = { type: "spring", stiffness: 90, damping: 20 } as const
export const TILT_MOUSE = 9
export const TILT_TOUCH = 7
const PERSPECTIVE = 1100

/** Rotation in degrees for a pointer at (nx, ny) in -1..1 across the ticket. The pointer side presses away. */
export function tiltFor(nx: number, ny: number, max: number): { rotateX: number; rotateY: number } {
  const c = (n: number) => Math.min(1, Math.max(-1, n))
  return { rotateX: -c(ny) * max, rotateY: c(nx) * max }
}

/**
 * Pointer and finger tilt for the DOM ticket (M2.1). Spread `style` and `handlers` on the ticket.
 * Off when `enabled` is false (reduced motion, 3D layer mounted, mid-tear) and under forced-colors.
 */
export function useTilt(enabled: boolean) {
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const on = enabled && !forcedColors()
  // M2.4: the key light is fixed (upper left); the tilt only lengthens or shortens the contact shadow.
  // The side of the ticket that lifts toward the light throws the longer shadow. Transform only.
  const shadow: MotionStyle = {
    x: useTransform(rotateY, (r) => r * 0.8),
    y: useTransform(rotateX, (r) => -r * 0.8),
  }

  const reset = useCallback(() => {
    animate(rotateX, 0, RETURN)
    animate(rotateY, 0, RETURN)
  }, [rotateX, rotateY])

  // Switched off (mid-tear, 3D mounted): drop to flat at once so a drag never fights a leaning ticket.
  useEffect(() => {
    if (on) return
    rotateX.stop()
    rotateY.stop()
    rotateX.set(0)
    rotateY.set(0)
  }, [on, rotateX, rotateY])

  const aim = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!on) return
      // Over the tear handle the ticket eases flat: the hand is about to pull, not tilt.
      if ((e.target as HTMLElement).closest?.("[data-tilt-ignore]")) return reset()
      const r = e.currentTarget.getBoundingClientRect()
      if (!r.width || !r.height) return
      const t = tiltFor(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1, e.pointerType === "touch" ? TILT_TOUCH : TILT_MOUSE)
      animate(rotateX, t.rotateX, FOLLOW)
      animate(rotateY, t.rotateY, FOLLOW)
    },
    [on, rotateX, rotateY, reset],
  )

  const style: MotionStyle = { rotateX, rotateY, transformPerspective: PERSPECTIVE }
  const release = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") reset() // a mouse is still hovering; a finger has lifted
  }, [reset])
  const handlers = { onPointerDown: aim, onPointerMove: aim, onPointerLeave: reset, onPointerUp: release, onPointerCancel: reset }
  return { style, handlers, shadow }
}
