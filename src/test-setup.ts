import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  ;(globalThis as { __reduced?: boolean }).__reduced = false
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? !!(globalThis as { __reduced?: boolean }).__reduced : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  window.sessionStorage.clear()
  // jsdom has no canvas: getContext returns null (no WebGL, no 2D), as on a browser without canvas support.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
