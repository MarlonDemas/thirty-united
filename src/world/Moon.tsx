import type { CSSProperties } from "react"
import { ANCHORS } from "@/world/layers"
import { MOON, moonPath } from "@/world/draw"

/**
 * The moon in its clear patch of sky: a soft halo of `--scene-moon-halo` light (a CSS gradient that screens onto the
 * photo sky, as the bank glows do), then the disc and its lit part (`moonPath`). The lit part darkens a little toward
 * its limb and carries a faint static surface texture (one SVG turbulence filter, fixed seed, never animated), and
 * its edge is softened by a fraction of a pixel, so it reads as a moon in the photograph rather than a flat disc.
 */
export function Moon() {
  const { x, y, r } = ANCHORS.moon
  const R = r * MOON.haloScale
  const pad = 2 // room for the edge softening
  return (
    <>
      <span
        className="layer moon-halo"
        style={{ left: x - R, top: y - R, width: 2 * R, height: 2 * R, zIndex: 1, "--moon-core": `${(r / R) * 100}%` } as CSSProperties}
        data-layer="moon-halo"
      />
      <svg
        className="layer"
        style={{ left: x - r - pad, top: y - r - pad, width: 2 * (r + pad), height: 2 * (r + pad), zIndex: 1 }}
        viewBox={`${-r - pad} ${-r - pad} ${2 * (r + pad)} ${2 * (r + pad)}`}
        data-layer="moon"
      >
        <defs>
          {/* Limb darkening: the core colour across the face, cooling to the halo colour at the very edge. */}
          <radialGradient id="moon-limb" cx="0.46" cy="0.46" r="0.56">
            <stop offset="0.55" style={{ stopColor: "var(--scene-moon-core)" }} />
            <stop offset="1" style={{ stopColor: "var(--scene-moon-halo)" }} />
          </radialGradient>
          {/* Surface: low-frequency noise turned into faint cool-grey patches inside the drawn shape, then a 0.6 px soften. */}
          <filter id="moon-surface" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="21" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.56  0 0 0 0 0.62  0 0 0 0 0.72  -1.5 0 0 0 0.8"
              result="patches"
            />
            <feComposite in="patches" in2="SourceAlpha" operator="in" result="surface" />
            <feMerge result="moon">
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="surface" />
            </feMerge>
            <feGaussianBlur in="moon" stdDeviation="0.6" />
          </filter>
        </defs>
        <g filter="url(#moon-surface)">
          {/* The unlit sliver: barely there against the sky, as on a photograph (no rim). */}
          <circle r={r} fill="#2B3142" opacity="0.55" />
          <path d={moonPath(r, MOON.illuminated, MOON.litSide)} fill="url(#moon-limb)" />
        </g>
      </svg>
    </>
  )
}
