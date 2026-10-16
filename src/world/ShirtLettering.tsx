import { useEffect, useRef } from "react"
import type { Quad } from "@/world/layers"
import { quadMatrix } from "@/world/draw"
import { LETTERING_COLOR, LETTERING_FONT, LETTERING_RES, NAME_Y, NUMBER_SIZE, NUMBER_Y, nameFont, quadBox } from "@/world/lettering"

const PAINT_PAUSE_MS = 120 // letter-paint: a pause in typing...
const PAINT_MS = 150 // ...then the new letters paint in

/**
 * The guest's name (and, once verified, the number) lettered onto a shirt quad, drawn to a DOM canvas (no blob
 * URLs: the CSP allows none). `animate` paints new letters in after a pause in typing; off on T0.
 */
export function ShirtLettering({
  quad,
  name,
  number,
  ghostNumber = false,
  animate,
  landNumber,
}: {
  quad: Quad
  name: string
  number: string | null
  /** Before verification the number area is a dashed outline only. */
  ghostNumber?: boolean
  animate: boolean
  /** The finale: the number lands (scale 1.15 to 1) at 900 ms. */
  landNumber?: boolean
}) {
  const { w, h } = quadBox(quad)
  const nameRef = useRef<HTMLCanvasElement>(null)
  const numRef = useRef<HTMLCanvasElement>(null)
  const painted = useRef("")

  useEffect(() => {
    let raf = 0
    const draw = (solid: number, alpha: number) => {
      const ctx = nameRef.current?.getContext("2d")
      if (!ctx) return
      ctx.setTransform(LETTERING_RES, 0, 0, LETTERING_RES, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (!name) return
      nameFont(ctx, name, w, h)
      ctx.fillStyle = LETTERING_COLOR
      ctx.textBaseline = "middle"
      const x0 = (w - ctx.measureText(name).width) / 2
      const head = name.slice(0, solid)
      ctx.globalAlpha = 1
      ctx.fillText(head, x0, h * NAME_Y)
      ctx.globalAlpha = alpha
      ctx.fillText(name.slice(solid), x0 + ctx.measureText(head).width, h * NAME_Y)
      ctx.globalAlpha = 1
    }
    const paint = () => {
      const prev = painted.current
      painted.current = name
      if (!animate || name.length <= prev.length || !name.startsWith(prev)) return draw(name.length, 1)
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / PAINT_MS)
        draw(prev.length, 1 - (1 - t) * (1 - t)) // ease-out
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const t = setTimeout(paint, animate ? PAINT_PAUSE_MS : 0)
    // Redraw in the real face once Barlow Condensed has loaded (the first draw may use the fallback).
    document.fonts?.load(`700 64px ${LETTERING_FONT}`).then(
      () => painted.current === name && draw(name.length, 1),
      () => {},
    )
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  }, [name, animate, w, h])

  useEffect(() => {
    const ctx = numRef.current?.getContext("2d")
    if (!ctx) return
    ctx.setTransform(LETTERING_RES, 0, 0, LETTERING_RES, 0, 0)
    ctx.clearRect(0, 0, w, h)
    if (number) {
      ctx.font = `700 ${h * NUMBER_SIZE}px ${LETTERING_FONT}`
      ctx.fillStyle = LETTERING_COLOR
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(number, w / 2, h * NUMBER_Y)
    } else if (ghostNumber) {
      ctx.setLineDash([8, 8])
      ctx.strokeStyle = "rgba(183, 211, 250, 0.55)"
      ctx.lineWidth = 3
      ctx.strokeRect(w * 0.3, h * 0.4, w * 0.4, h * 0.4)
    }
  }, [number, ghostNumber, w, h])

  const style = {
    left: 0,
    top: 0,
    width: w,
    height: h,
    transformOrigin: "0 0",
    transform: `matrix3d(${quadMatrix(w, h, quad).join(",")})`,
  }
  return (
    <div className="layer" style={{ ...style, zIndex: 7 }} data-layer="shirt-lettering">
      <canvas ref={nameRef} width={w * LETTERING_RES} height={h * LETTERING_RES} data-name={name} className="absolute inset-0 size-full" />
      <canvas
        key={number ?? "none"}
        ref={numRef}
        width={w * LETTERING_RES}
        height={h * LETTERING_RES}
        data-number={number ?? ""}
        className={landNumber && number ? "number-land absolute inset-0 size-full" : "absolute inset-0 size-full"}
      />
    </div>
  )
}
