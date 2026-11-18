import { beforeEach, describe, expect, it, vi } from 'vitest'

// config.js awaits document.fonts at import; jsdom has none.
vi.hoisted(() => { Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve([]) }, configurable: true }) })

const submitDecline = vi.hoisted(() => vi.fn())
vi.mock('./submit.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  submitDecline,
  closedText: () => null,
  getSent: () => null,
}))
// @ts-expect-error plain JS module
const { showFallback } = await import('./fallback.js')

const guest = { side: 'away', values: { attending: 'no', repliedBefore: 'no', firstName: 'Mary', surname: 'Smith' } }
const button = (name: string) => [...document.querySelectorAll('button')].find((b) => b.textContent === name && !b.hidden) as HTMLButtonElement
const flush = () => new Promise((r) => setTimeout(r))
const until = async (cond: () => unknown) => { for (let i = 0; i < 50 && !cond(); i++) await flush() }

// The guest presses Continue (a name-only decline), the server answers `reply`, then they press "Check my answers".
async function checkMyAnswers(reply: unknown) {
  submitDecline.mockResolvedValue(reply)
  showFallback('load-failed', guest)
  button('Continue').click()
  await until(() => button('Check my answers'))
  button('Check my answers').click()
}

describe('fallback form after "Check my answers"', () => {
  beforeEach(() => {
    delete (window as { __fallback?: boolean }).__fallback
    document.body.innerHTML = '<div id="ui"></div><div id="boot"></div>'
    submitDecline.mockReset()
  })

  it('should_focus_the_first_invalid_field_when_the_server_returned_field_errors', async () => {
    await checkMyAnswers({ status: 'invalid_answers', errors: { surname: 'Use letters only.' } })
    const surname = document.querySelector<HTMLInputElement>('#fl-surname')
    expect(surname).not.toBeNull()
    expect(document.activeElement).toBe(surname)
  })

  it.each(['rate_limited', 'service_unavailable'])('should_focus_the_heading_when_the_server_said_%s', async (status) => {
    await checkMyAnswers({ status })
    const heading = document.querySelector('h1')
    expect(document.querySelector('#fast-form')).not.toBeNull()   // back on the form, not the decline card
    expect(heading?.id).toBe('fb-h')
    expect(document.activeElement).toBe(heading)
  })
})

describe('fallback form page text', () => {
  beforeEach(() => {
    delete (window as { __fallback?: boolean }).__fallback
    document.body.innerHTML = '<div id="ui"></div><div id="boot"></div>'
  })

  it.each([
    ['no_reason', undefined],
    ['load-failed', 'load-failed'],
  ])('should_not_print_null_or_undefined_on_the_form_page_when_the_reason_is_%s', (_name, reason) => {
    showFallback(reason)
    expect(document.querySelector('#fast-form')).not.toBeNull()
    const text = document.querySelector('#card')?.textContent ?? ''
    // No \b: textContent joins sibling text nodes with no space, so a stray "null" can sit between letters ("instead.nullYour").
    expect(text).not.toMatch(/null|undefined/)
  })
})
