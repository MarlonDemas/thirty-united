import { useEffect, useState } from "react"
import { keyboardOpen, type Viewport } from "@/world/shots"

const editable = (el: Element | null) =>
  !!el && (el.matches("textarea, select, [contenteditable=''], [contenteditable=true]") || (el.matches("input") && !el.matches("[type=checkbox], [type=radio], [type=button], [type=submit]")))

let tallest = { w: 0, h: 0 }

function read(): Viewport {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w !== tallest.w || h > tallest.h) tallest = { w, h: w !== tallest.w ? h : Math.max(h, tallest.h) }
  const vv = window.visualViewport
  const vvH = vv?.height ?? h
  return { w, h, vvTop: vv?.offsetTop ?? 0, vvH, keyboard: keyboardOpen(tallest.h, vvH, editable(document.activeElement)) }
}

const same = (a: Viewport, b: Viewport) =>
  a.w === b.w && a.h === b.h && a.vvTop === b.vvTop && a.vvH === b.vvH && a.keyboard === b.keyboard

/** The layout and visual viewports, live: resize, visual viewport resize and scroll, and focus moving to or from a field. */
export function useViewport(): Viewport {
  const [v, setV] = useState(read)
  useEffect(() => {
    const update = () => setV((prev) => {
      const next = read()
      return same(prev, next) ? prev : next
    })
    const later = () => requestAnimationFrame(update) // focus lands before the keyboard resizes the viewport
    const vv = window.visualViewport
    window.addEventListener("resize", update)
    vv?.addEventListener("resize", update)
    vv?.addEventListener("scroll", update)
    document.addEventListener("focusin", later)
    document.addEventListener("focusout", later)
    return () => {
      window.removeEventListener("resize", update)
      vv?.removeEventListener("resize", update)
      vv?.removeEventListener("scroll", update)
      document.removeEventListener("focusin", later)
      document.removeEventListener("focusout", later)
    }
  }, [])
  return v
}
