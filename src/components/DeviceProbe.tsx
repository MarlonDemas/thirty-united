import { useEffect, useState } from "react"

/*
 * `?debug=1` only, lazy-loaded: a read-only device readout for the phase 0a phone test (cinematic recommendation,
 * sections 4 and 5). No network, no blob URLs, no workers. Everything runs once per page load at module scope,
 * so StrictMode's double render can't overwrite the sessionStorage stamp before it is read.
 */

export const PROBE_KEY = "thirty-united:debug-probe"

const loadedAt = Date.now()

/** The previous load's stamp, read before this load writes its own: shows whether sessionStorage survived. */
const previousLoad: number | "none" | "unavailable" = (() => {
  try {
    const prev = window.sessionStorage.getItem(PROBE_KEY)
    window.sessionStorage.setItem(PROBE_KEY, String(loadedAt))
    return prev === null ? "none" : Number(prev)
  } catch {
    return "unavailable"
  }
})()

const safe = (f: () => string): string => {
  try {
    return f()
  } catch (e) {
    return `error (${e instanceof Error ? e.name : "unknown"})`
  }
}

/** Best effort from the user agent only. WhatsApp's in-app browser may not name itself. */
function guessBrowser(ua: string): string {
  if (/WhatsApp/i.test(ua)) return "WhatsApp in-app WebView"
  if (/FBAN|FBAV|Instagram|Line\//i.test(ua)) return "social app WebView"
  if (/Android/i.test(ua)) {
    if (/; wv\)/.test(ua) || /Version\/\d/.test(ua)) return "Android WebView"
    if (/SamsungBrowser/.test(ua)) return "Samsung Internet (system browser)"
    if (/Firefox\//.test(ua)) return "Firefox (system browser)"
    return "Chrome or a Custom Tab (system browser)"
  }
  if (/iPhone|iPad|iPod/.test(ua)) {
    if (/CriOS|FxiOS|EdgiOS/.test(ua)) return "iOS third-party browser app"
    if (!/Safari\//.test(ua)) return "iOS WKWebView (in-app)"
    return "Safari or SFSafariViewController (system browser)"
  }
  return "desktop or unknown"
}

const canShareFiles = safe(() => {
  if (typeof navigator.canShare !== "function") return "n/a (no canShare)"
  if (typeof File === "undefined") return "n/a (no File)"
  const file = new File([new Uint8Array([0])], "probe.png", { type: "image/png" })
  return String(navigator.canShare({ files: [file] }))
})

/** WebGL2 first, WebGL1 as the fallback; the probe context is released straight away (as in lib/webgl). */
const gpu = (() => {
  try {
    const c = document.createElement("canvas")
    const gl2 = c.getContext("webgl2")
    const gl = (gl2 ?? c.getContext("webgl")) as WebGLRenderingContext | null
    if (!gl) return { webgl2: "no", context: "none", renderer: "n/a", maxTexture: "n/a" }
    const ext = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : `masked (${String(gl.getParameter(gl.RENDERER))})`
    const maxTexture = String(gl.getParameter(gl.MAX_TEXTURE_SIZE))
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return { webgl2: gl2 ? "yes" : "no", context: gl2 ? "webgl2" : "webgl1", renderer, maxTexture }
  } catch (e) {
    return { webgl2: "error", context: "none", renderer: e instanceof Error ? e.name : "error", maxTexture: "n/a" }
  }
})()

const time = (t: number) => new Date(t).toTimeString().slice(0, 8)
const media = (q: string) => safe(() => (typeof window.matchMedia === "function" ? String(window.matchMedia(q).matches) : "n/a"))

function lines(): string[] {
  const ua = navigator.userAgent
  const nav = navigator as Navigator & { deviceMemory?: number }
  const prev =
    typeof previousLoad === "number"
      ? `previous load ${time(previousLoad)} (${Math.round((loadedAt - previousLoad) / 1000)} s before this one)`
      : previousLoad === "none"
        ? "previous load none (first load, or storage was lost)"
        : "unavailable (storage blocked)"
  return [
    "DEVICE PROBE (?debug=1, read-only)",
    `ua ${ua}`,
    `guess ${guessBrowser(ua)} [GUESS from UA]`,
    `share ${typeof navigator.share} | canShare(files png) ${canShareFiles} | vibrate ${typeof navigator.vibrate}`,
    `webgl2 ${gpu.webgl2} | context ${gpu.context} | max texture ${gpu.maxTexture}`,
    `gpu ${gpu.renderer}`,
    `deviceMemory ${nav.deviceMemory ?? "n/a"} | cores ${navigator.hardwareConcurrency ?? "n/a"}`,
    `dpr ${window.devicePixelRatio} | viewport ${window.innerWidth}x${window.innerHeight}`,
    `sessionStorage ${prev} | this load ${time(loadedAt)}`,
    `reduced-motion ${media("(prefers-reduced-motion: reduce)")} | forced-colors ${media("(forced-colors: active)")}`,
  ]
}

export default function DeviceProbe() {
  const [rows, setRows] = useState(lines)
  useEffect(() => {
    const update = () => setRows(lines())
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return (
    <div
      data-testid="device-probe"
      className="pointer-events-none fixed bottom-2 left-2 z-50 max-w-[min(26rem,calc(100vw-1rem))] bg-ink/90 p-2 font-mono text-[10px] leading-snug break-words text-paper"
    >
      {rows.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  )
}
