import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

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
