import { ANCHORS } from "@/world/layers"
import { MOON, moonPath } from "@/world/draw"

/** The moon in its clear patch of sky: the disc, the lit part (`moonPath`) and a halo. */
export function Moon() {
  const { x, y, r } = ANCHORS.moon
  const R = r * MOON.haloScale
  return (
    <svg
      className="layer"
      style={{ left: x - R, top: y - R, width: 2 * R, height: 2 * R, zIndex: 1 }}
      viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
      data-layer="moon"
    >
      <defs>
        <radialGradient id="moon-halo">
          <stop offset={r / R} stopColor="var(--scene-moon-halo)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--scene-moon-halo)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={R} fill="url(#moon-halo)" />
      <circle r={r} fill="#2B3142" />
      <path d={moonPath(r, MOON.illuminated, MOON.litSide)} fill="var(--scene-moon-core)" />
    </svg>
  )
}
