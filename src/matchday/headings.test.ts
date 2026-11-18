import { describe, expect, it, vi } from 'vitest'

// config.js awaits document.fonts at import; jsdom has none.
vi.hoisted(() => { Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve([]) }, configurable: true }) })
// @ts-expect-error plain JS module
const { confirmCard } = await import('./ui.js')
// @ts-expect-error plain JS module
const { codeCard, declineCard } = await import('./codecard.js')

const noop = () => {}
const first = (nodes: Node[]) => nodes.find((n) => /^H[12]$/.test((n as Element).tagName)) as Element
const cb = { getValues: () => ({}), onSaved: noop, onFix: noop, onClosed: noop }

// The fallback page has no other heading once the form is gone, so its cards pass level 'h1'; the game keeps h2.
describe('card headings', () => {
  it('stay h2 in the game', () => {
    expect(first(confirmCard({ attending: 'no', firstName: 'Ada' })).tagName).toBe('H2')
    expect(first(codeCard({ side: 'home', setEmail: noop, ...cb }).nodes).tagName).toBe('H2')
    expect(first(declineCard(cb).nodes).tagName).toBe('H2')
  })
  it('become the one h1 on the fallback page', () => {
    const c = first(confirmCard({ attending: 'no', firstName: 'Ada' }, { id: 'fb-h', level: 'h1' }))
    expect(c.tagName).toBe('H1'); expect(c.id).toBe('fb-h'); expect(c.className).toContain('display')
    expect(first(codeCard({ side: 'home', setEmail: noop, level: 'h1', ...cb }).nodes).tagName).toBe('H1')
    expect(first(declineCard({ level: 'h1', ...cb }).nodes).tagName).toBe('H1')
  })
})
