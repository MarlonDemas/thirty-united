import { describe, expect, it, vi } from 'vitest'

// config.js awaits document.fonts at import; jsdom has none.
vi.hoisted(() => { Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve([]) }, configurable: true }) })
// @ts-expect-error plain JS module
const { FAST_KEYS, GROUPS, buildDecline, keysFor, nameOnly, noticeSide } = await import('./fields.js')

type V = Record<string, string | undefined>
const replied = [undefined, 'yes', 'no'] as const
const lane = (attending: string | undefined, repliedBefore?: string): V => ({ attending, repliedBefore })

describe('fields: fast lane', () => {
  it.each(replied)('yes and maybe never show decline-only fields (repliedBefore %s)', (r) => {
    for (const a of ['yes', 'maybe']) {
      const keys: string[] = keysFor(FAST_KEYS, lane(a, r))
      expect(keys).not.toContain('repliedBefore')
      expect(keys).not.toContain('reason')
      expect(keys).toContain('email')
      expect(nameOnly(lane(a, r))).toBe(false)
      expect(noticeSide(lane(a, r))).toBe('home')
    }
  })
  it('shows only the first question until answered', () => {
    expect(keysFor(FAST_KEYS, lane(undefined))).toEqual(['attendingFast'])
  })
  it.each([
    [undefined, ['attendingFast', 'repliedBefore', 'firstName', 'surname'], 'away', false],
    ['yes', ['attendingFast', 'repliedBefore', 'firstName', 'surname', 'email'], 'away', false],
    ['no', ['attendingFast', 'repliedBefore', 'firstName', 'surname', 'reason'], 'decline', true],
  ])('no with repliedBefore %s', (r, keys, notice, plain) => {
    expect(keysFor(FAST_KEYS, lane('no', r))).toEqual(keys)
    expect(noticeSide(lane('no', r))).toBe(notice)
    expect(nameOnly(lane('no', r))).toBe(plain)
  })
})

describe('fields: AWAY station', () => {
  it.each([
    [undefined, ['repliedBefore', 'firstName', 'surname'], 'away', false],
    ['yes', ['repliedBefore', 'firstName', 'surname', 'email'], 'away', false],
    ['no', ['repliedBefore', 'firstName', 'surname', 'reason'], 'decline', true],
  ])('repliedBefore %s', (r, keys, notice, plain) => {
    const v = { repliedBefore: r }
    expect(keysFor(GROUPS['1:away'], v)).toEqual(keys)
    expect(noticeSide(v, 'away')).toBe(notice)
    expect(nameOnly(v, 'away')).toBe(plain)
  })
  it('the home station is never a decline', () => {
    expect(noticeSide({ attending: 'no', repliedBefore: 'no' }, 'home')).toBe('home')
    expect(nameOnly({ attending: 'no', repliedBefore: 'no' }, 'home')).toBe(false)
  })
})

describe('fields: buildDecline', () => {
  it('builds the strict payload, omitting an empty reason', () => {
    expect(Object.keys(buildDecline({ firstName: 'Ada', surname: 'Lovelace', reason: '' })).sort()).toEqual(['firstName', 'noticeVersion', 'surname'])
    expect(buildDecline({ firstName: 'Ada', surname: 'Lovelace', reason: 'Away' }).reason).toBe('Away')
  })
  it('rejects digits in a name and links in a reason, including hidden-character forms', () => {
    expect(() => buildDecline({ firstName: 'Ada1', surname: 'Lovelace' })).toThrow()
    expect(() => buildDecline({ firstName: 'Ada', surname: 'Lovelace', reason: 'see https://x.io' })).toThrow()
    expect(() => buildDecline({ firstName: 'Ada', surname: 'Lovelace', reason: 'ht­tps://x.io' })).toThrow()
    expect(() => buildDecline({ firstName: 'Ada', surname: 'Lovelace', reason: 'ｈｔｔｐ：／／x.io' })).toThrow()
  })
})
