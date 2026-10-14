import { useEffect, useState } from "react"

/** Shared, mutable test-instrument state. Written by the scene, read by the overlay. */
export const stats = {
  chunkAt: typeof performance !== "undefined" ? Math.round(performance.now()) : 0,
  firstFrameAt: 0,
  frames: 0,
  stamps: [] as number[],
  moving: false,
  renderer: "n/a",
  glVersion: "n/a",
  dpr: 0,
  canvas: "n/a",
  status: "mounting",
}

export function recordFrame(moving: boolean) {
  const now = performance.now()
  if (!stats.firstFrameAt) stats.firstFrameAt = Math.round(now)
  stats.frames += 1
  stats.moving = moving
  stats.stamps.push(now)
  while (stats.stamps.length && now - stats.stamps[0] > 1000) stats.stamps.shift()
}

function snapshot() {
  const now = performance.now()
  const fps = stats.stamps.filter((t) => now - t <= 1000).length
  return [
    `fps ${fps} | frames ${stats.frames} | ${stats.moving ? "MOVING" : "AT REST"}`,
    `status ${stats.status}`,
    `chunk ready ${stats.chunkAt} ms | first frame ${stats.firstFrameAt || "-"} ms`,
    `gpu ${stats.renderer}`,
    `webgl ${stats.glVersion} | dpr ${stats.dpr}`,
    `viewport ${window.innerWidth}x${window.innerHeight} | canvas ${stats.canvas}`,
    `ua ${navigator.userAgent.slice(0, 90)}`,
  ]
}

/** `?debug=1` only: a fixed readout, because the phone has no devtools. */
export function DebugOverlay() {
  const [lines, setLines] = useState(snapshot)
  useEffect(() => {
    const id = setInterval(() => setLines(snapshot()), 250)
    return () => clearInterval(id)
  }, [])
  return (
    <div
      data-testid="lanyard-debug"
      className="pointer-events-none fixed top-2 left-2 z-50 max-w-[min(26rem,calc(100vw-1rem))] bg-ink/90 p-2 font-mono text-[10px] leading-snug break-words text-paper"
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  )
}
