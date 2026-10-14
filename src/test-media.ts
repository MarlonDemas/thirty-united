/** Install a matchMedia whose reduced-motion / forced-colors answers the test controls. */
export function stubMedia(flags: { reduced?: boolean; forced?: boolean } = {}) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion")
      ? !!flags.reduced
      : query.includes("forced-colors")
        ? !!flags.forced
        : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}
