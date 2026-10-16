import { useEffect, useState, type CSSProperties } from "react"
import { Pause, Volume2, VolumeX } from "lucide-react"
import { armAudio, getSoundOn, setSoundOn, unlockAudio } from "@/lib/sound"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { chipVars } from "@/world/chips"
import { setStill, useTier } from "@/world/tier"

/**
 * Sound and Still: two icon-only solid panel chips in a column at the top right over the world (sizes in chips.ts).
 * Sound names its state ("Sound off" / "Sound on"); Still is a toggle with `aria-pressed`. Hidden while the
 * on-screen keyboard is open and under forced colours (CSS). Sound follows only its own opt-in, so it stays under
 * reduced motion; it is not rendered without an invite key. Still is not rendered under reduced motion: already still.
 */
export function WorldChips({ hidden, missingKey, style }: { hidden: boolean; missingKey: boolean; style?: CSSProperties }) {
  const reduced = useReducedMotion()
  const { still } = useTier()
  const [sound, setSound] = useState(getSoundOn)
  useEffect(armAudio, []) // an opt-in remembered from earlier in the tab unlocks on the next tap
  if (reduced && missingKey) return null

  const toggleSound = () => {
    const next = !sound
    setSoundOn(next)
    if (next) unlockAudio() // created on this tap, never earlier
    setSound(next)
  }

  return (
    <div className="chips" style={{ ...chipVars, ...style }} hidden={hidden}>
      {!missingKey && (
        <button
          type="button"
          className="chip"
          aria-label={sound ? "Sound on" : "Sound off"}
          data-on={sound}
          title="Sound plays through the speaker. A phone on silent stays quiet."
          onClick={toggleSound}
        >
          {sound ? <Volume2 aria-hidden="true" className="size-5" strokeWidth={1.5} /> : <VolumeX aria-hidden="true" className="size-5" strokeWidth={1.5} />}
        </button>
      )}
      {!reduced && (
        <button
          type="button"
          className="chip"
          aria-label="Still"
          aria-pressed={still}
          title="Stops the moving parts of the poster for this visit."
          onClick={() => setStill(!still)}
        >
          <Pause aria-hidden="true" className="size-5" strokeWidth={still ? 2.5 : 1.5} />
        </button>
      )}
    </div>
  )
}
