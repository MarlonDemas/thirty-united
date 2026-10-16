import { useCallback, useRef } from "react"
import { forcedColors, prefersReducedMotion } from "@/lib/motionPrefs"

const FIELDS = "input,textarea,select"

/**
 * Puts a still copy of the panel's view in the ghost, where the view sits: no ids, names or test ids (the live view
 * keeps them), with the values the guest just typed or picked (checks and radios draw from their cloned data-checked);
 * its animations are off (index.css). Nothing when the view has no box on screen.
 */
export function snapshotInto(ghost: HTMLElement, view: HTMLElement) {
  if (!view.offsetHeight) return // (this read also flushes style, so a fade cut short starts again)
  const copy = view.cloneNode(true) as HTMLElement
  for (const el of [copy, ...copy.querySelectorAll("*")]) for (const a of ["id", "name", "data-testid"]) el.removeAttribute(a)
  const from = view.querySelectorAll<HTMLInputElement>(FIELDS)
  copy.querySelectorAll<HTMLInputElement>(FIELDS).forEach((el, i) => (el.value = from[i].value))
  // The ghost has the panel's box, so the view's offsets in the panel (less its scroll) place the copy exactly.
  copy.style.cssText = `position:absolute;width:${view.offsetWidth}px;top:${view.offsetTop - view.parentElement!.scrollTop}px;left:${view.offsetLeft}px`
  ghost.replaceChildren(copy) // the ghost shows from here (display: none while empty)
}

/**
 * panel-change as one cross-fade in place (tokens.md). `hold`, just before a beat change, freezes what the panel shows
 * in the ghost: an opaque, inert copy of the panel laid over it. The new view renders under it at full strength; once
 * it is up (`viewRef` attaches, so a view still loading keeps the copy up) the ghost alone fades out (index.css) and
 * is emptied at the end. Every pixel goes straight from the old view to the new one. Reduced motion and forced
 * colours swap at once.
 */
export function usePanelFade() {
  const ghostRef = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLElement | null>(null)
  const frame = useRef(0)

  // Stops the fade and empties the ghost; `keep` leaves the copy in it.
  const clear = useCallback((keep?: boolean) => {
    cancelAnimationFrame(frame.current)
    ghostRef.current?.removeAttribute("data-fade")
    if (!keep) ghostRef.current?.replaceChildren()
  }, [])

  const hold = useCallback(() => {
    // A view still loading has no box to copy: the copy the ghost holds stays up until the next view attaches
    // (snapshotInto replaces it whenever there is a new one).
    clear(true)
    const ghost = ghostRef.current
    if (ghost && view.current && !prefersReducedMotion() && !forcedColors()) snapshotInto(ghost, view.current)
  }, [clear])

  const viewRef = useCallback(
    (el: HTMLElement | null) => {
      view.current = el
      const ghost = ghostRef.current
      if (!el || !ghost?.firstChild || ghost.hasAttribute("data-fade")) return // nothing held, or already fading
      ghost.setAttribute("data-fade", "")
      // The fade's clock moves by the frames drawn, at most 34 ms each: the beat change's slow first frames (new plates
      // to raster) hold the fade where it is, never skip it ahead in one frame. No Web Animations: swap at once.
      const fade = ghost.getAnimations?.()[0]
      if (!fade) return clear()
      fade.pause()
      const end = +fade.effect!.getTiming().duration!
      let t = 0
      let last = 0
      const tick = (now: number) => {
        t += last && Math.min(now - last, 34)
        last = now
        fade.currentTime = t
        if (t < end) frame.current = requestAnimationFrame(tick)
        else clear()
      }
      frame.current = requestAnimationFrame(tick)
    },
    [clear],
  )

  return { ghostRef, viewRef, hold }
}
