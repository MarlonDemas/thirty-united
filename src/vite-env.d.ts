interface ImportMetaEnv {
  /** "1" on Netlify preview builds: keeps the `?debug=1` probes in the bundle. Unset in production. */
  readonly VITE_DEBUG_PROBE?: string
}
