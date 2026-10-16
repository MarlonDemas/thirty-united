import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"
import { renderPoster } from "@/poster/compositor"
import { posterAlt, posterFieldsFor } from "@/poster/fields"

// Bundle note: this chunk must not import `lucide-react`, `react-dom`, `@/world/WorldStage` or `@/world/shots`.
// Each of those made Rolldown move shared code out of the entry chunk into a new first-paint chunk (about +1 kB gz).
// So the icons are drawn here and the viewer is a native <dialog> (the top layer, no portal).

/** When the stamp lands (WorldStage `STAMP_AT_MS`; a test keeps the two equal). */
export const DRAW_AT_MS = 1800

/** lucide `image-down`, `share-2` and `x` (24 x 24, stroked like the other icons at 1.5). */
const ICONS = {
  save: ["M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21", "m14 19 3 3v-5.5", "m17 22 3-3", "M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0"],
  share: ["M15 5a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M3 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M15 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M8.59 13.51 15.42 17.49", "M15.41 6.51 8.59 10.49"],
  close: ["M18 6 6 18", "m6 6 12 12"],
}
const Icon = ({ d }: { d: string[] }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
    {d.map((p) => (
      <path key={p} d={p} />
    ))}
  </svg>
)

type State = { kind: "rendering" } | { kind: "ready"; poster: { file: File; url: string } } | { kind: "failed" }

/** Share renders only where the browser can share this file (Android System WebView has no `navigator.share`). */
function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * SavePoster (components.md): "Save your poster" opens the viewer, "Share" hands the JPEG to the share sheet. The
 * poster is rendered on the phone during the stamp, so Share is ready when the panel returns, and never uploaded.
 * This module is the lazy boundary: the compositor, its draw code and the share logic load in this chunk.
 */
export default function SavePoster({ saved, payload }: { saved: SavedResult; payload: RsvpPayload }) {
  const fields = useMemo(() => posterFieldsFor(saved, payload), [saved, payload])
  const reduced = useReducedMotion()
  // Drawn when the stamp lands (at once under reduced motion); read once, so a later change never draws twice.
  const wait = useRef(reduced ? 0 : DRAW_AT_MS)
  const [state, setState] = useState<State>({ kind: "rendering" })
  const [open, setOpen] = useState(false)
  const [wantOpen, setWantOpen] = useState(false)
  // The guest tapped Save and the render then failed: focus goes to the message, not to <body> with the button.
  const [focusFailure, setFocusFailure] = useState(false)
  const saveRef = useRef<HTMLButtonElement>(null)
  const failureRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!fields) return
    let live = true
    const id = setTimeout(() => {
      renderPoster(fields)
        .then((poster) => live && setState({ kind: "ready", poster }))
        .catch((err: unknown) => {
          console.error("SavePoster: the poster could not be drawn", err)
          if (live) setState({ kind: "failed" })
        })
    }, wait.current)
    return () => {
      live = false
      clearTimeout(id)
    }
  }, [fields])

  useEffect(() => {
    if (focusFailure) failureRef.current?.focus()
  }, [focusFailure])

  // A tap on Save before the poster is drawn opens the viewer as soon as it is (or moves focus to the failure).
  if (wantOpen && state.kind !== "rendering") {
    setWantOpen(false)
    if (state.kind === "ready") setOpen(true)
    else setFocusFailure(true)
  }

  if (!fields) return null
  if (state.kind === "failed")
    return (
      <p ref={failureRef} role="status" tabIndex={-1} className="helper m-0">
        Your poster couldn't be made on this device. Your seat is saved.
      </p>
    )

  const poster = state.kind === "ready" ? state.poster : null
  const share = poster && canShareFile(poster.file) ? poster.file : null

  return (
    <div className="flex flex-col gap-3">
      <Button
        ref={saveRef}
        type="button"
        className="w-full"
        onClick={() => (poster ? setOpen(true) : setWantOpen(true))}
      >
        <Icon d={ICONS.save} />
        {wantOpen ? "Making your poster…" : "Save your poster"}
      </Button>
      {share && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          // Synchronous in the tap: the file is already made, so the user activation is still live.
          onClick={() => void navigator.share({ files: [share] }).catch(() => {})}
        >
          <Icon d={ICONS.share} />
          Share
        </Button>
      )}
      <p className="helper m-0">Save it now. We don't keep a copy.</p>
      {open && poster && (
        <PosterViewer
          url={poster.url}
          alt={posterAlt(fields)}
          onClose={() => {
            setOpen(false)
            saveRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}

const VIEWER: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  maxWidth: "none",
  maxHeight: "none",
  margin: 0,
  border: 0,
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "calc(12px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))",
  background: "var(--background)",
  color: "var(--foreground)",
  zIndex: 30,
}
const IMG: CSSProperties = { flex: "1 1 0", minHeight: 0, maxWidth: "100%", objectFit: "contain", WebkitTouchCallout: "default" }

/**
 * PosterViewer: the one overlay. The poster full screen as an `<img>` from a `data:` URL (long-press saves it on a
 * phone, right-click on a desktop), one line on how, and a close button. A modal <dialog>: the page behind is inert,
 * focus moves in and is returned, Esc closes, Tab stays on the close button.
 */
export function PosterViewer({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (typeof d.showModal === "function") d.showModal()
    else d.setAttribute("open", "")
    closeRef.current?.focus()
    return () => {
      if (d.open) d.close?.()
    }
  }, [])
  // Leave the top layer first: while the dialog is modal the page is inert and Save cannot take focus back.
  const close = () => {
    if (ref.current?.open) ref.current.close?.()
    onClose()
  }
  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby="poster-viewer-how"
      style={{ ...VIEWER, display: "flex" }}
      onCancel={(e) => {
        e.preventDefault() // the page closes it, so focus goes back to Save
        close()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          close()
        }
        if (e.key === "Tab") {
          e.preventDefault()
          closeRef.current?.focus()
        }
      }}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <p id="poster-viewer-how" className="m-0">
          Press and hold the poster to save it
        </p>
        <Button ref={closeRef} type="button" variant="outline" aria-label="Close" onClick={close}>
          <Icon d={ICONS.close} />
        </Button>
      </div>
      <img src={url} alt={alt} style={IMG} />
    </dialog>
  )
}
