import { useState, type CSSProperties } from "react"
import type { Banks, Beat, Pose } from "@/world/beats"
import { ANCHORS, LAYERS, QUADS, layerUrl, plateSetFor, type Layer } from "@/world/layers"
import { Moon } from "@/world/Moon"
import { ShirtLettering } from "@/world/ShirtLettering"
import { isStillTier, type Tier } from "@/world/tier"

// Up to 20 CSS embers on T1 (here 14), rising from the ground in poster space. Fixed positions: no randomness.
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  x: 70 + ((i * 197) % 940),
  y: 1380 + ((i * 53) % 160),
  d: 6 + ((i * 7) % 5),
  delay: -((i * 1.3) % 9),
  drift: ((i % 5) - 2) * 18,
}))

const box = (l: Layer): CSSProperties => ({ left: l.bbox[0], top: l.bbox[1], width: l.bbox[2], height: l.bbox[3], zIndex: l.z })
const isPose = (name: string) => name.startsWith("l5-") || name.startsWith("l6-") || name.startsWith("l7-")

/**
 * The poster as DOM layers, in poster space (1080 x 1920). Always rendered: it is the whole world on T1 and T0
 * and the cover for every rebuild on T3 and T2. Banks are opacity-switched plates; the moon, the code lamps and
 * the shirt lettering are drawn in code.
 */
export function StillLayer({
  tier,
  still,
  beat,
  pose,
  mounted,
  banks,
  hangs,
  shirtName,
  shirtNumber,
  digits,
}: {
  tier: Tier
  still: boolean
  beat: Beat
  pose: Pose
  /** Pose and shirt plates fetched so far (they load only when a beat needs them). */
  mounted: readonly string[]
  banks: Banks
  hangs: boolean
  shirtName: string
  shirtNumber: string | null
  digits: number
}) {
  const t0 = isStillTier(tier)
  const drawTier: Tier = tier === "forced-colors" ? "T0" : tier
  // The plate set is fixed for the visit: a later demotion (Still, context loss) keeps the files already fetched.
  const [plates] = useState(() => plateSetFor(tier))
  return (
    <>
      {LAYERS.map((l) => {
        const src = layerUrl(l.name, plates)
        if (!src || !l.tiers.includes(drawTier)) return null
        const common = { src, alt: "", draggable: false, decoding: "async" as const, "data-layer": l.name }
        if (l.bank) return <img key={l.name} {...common} className="layer layer-bank" style={{ ...box(l), opacity: banks[l.bank - 1] }} />
        if (isPose(l.name) || l.name === "l8-shirt") {
          if (!mounted.includes(l.name)) return null
          const on = l.name === "l8-shirt" ? hangs : pose === l.name
          return <img key={l.name} {...common} className={l.name === "l8-shirt" ? "layer layer-shirt" : "layer layer-pose"} data-on={on} style={box(l)} />
        }
        return <img key={l.name} {...common} className={l.name === "united" ? "layer layer-united" : "layer"} style={box(l)} />
      })}
      <Moon />
      {/* One glow per bank on its tower head, struck with that bank's plate (same opacity, same timing). */}
      {ANCHORS.banks.map(({ x, y, r, z }, i) => (
        <span
          key={i}
          className="layer bank-glow"
          data-bank={i + 1}
          data-on={banks[i] > 0}
          style={{ left: x - r, top: y - r, width: 2 * r, height: 2 * r, zIndex: z, opacity: banks[i] }}
        />
      ))}
      {beat === "code" &&
        ANCHORS.lamps.map(([x, y], i) => (
          <span
            key={i}
            className="code-lamp"
            data-on={i < digits}
            style={{ left: x - ANCHORS.lampR, top: y - ANCHORS.lampR, width: 2 * ANCHORS.lampR, height: 2 * ANCHORS.lampR, zIndex: 4 }}
          />
        ))}
      {hangs && <ShirtLettering quad={QUADS["l8-shirt"]} name={shirtName} number={null} ghostNumber animate={!t0} />}
      {beat === "signed" && (
        <div className={t0 ? "layer" : "layer lettering-in"} style={{ inset: 0, zIndex: 7 }}>
          <ShirtLettering quad={QUADS["l7-makes-signing"]} name={shirtName} number={shirtNumber} animate={false} landNumber={!t0} />
        </div>
      )}
      {/* No embers on the code beat (the lamps carry it) or the No end (no red there). */}
      {!t0 && !still && beat !== "code" && beat !== "no-end" && (
        <div className="layer" style={{ inset: 0, zIndex: 9 }}>
          {EMBERS.map((e, i) => (
            <span
              key={i}
              className="ember"
              style={
                {
                  left: e.x,
                  top: e.y,
                  "--ember-d": `${e.d}s`,
                  "--ember-delay": `${e.delay}s`,
                  "--ember-drift": `${e.drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
