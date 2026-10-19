// `?debug=1` probes (device readout, pass overlay) exist only in dev and in builds that set VITE_DEBUG_PROBE=1
// (Netlify previews). Vite inlines both env reads. The lazy imports at the call sites repeat the same env check
// inline so a plain production build drops their chunks; this helper adds the runtime `?debug=1` check.
export const debugProbeOn = (): boolean =>
  (import.meta.env.DEV || import.meta.env.VITE_DEBUG_PROBE === "1") &&
  new URLSearchParams(window.location.search).get("debug") === "1"
