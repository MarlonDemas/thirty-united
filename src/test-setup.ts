import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { resetTier } from '@/world/tier'

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
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  document.elementFromPoint = () => null // input-otp probes it for the password-manager badge
  window.sessionStorage.clear()
  resetTier() // the tier store is per page load; each test is a fresh load
  // jsdom has no canvas: getContext returns null (no WebGL, no 2D), as on a browser without canvas support.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  cleanup()
})

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= RO as unknown as typeof ResizeObserver
