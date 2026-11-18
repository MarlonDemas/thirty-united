import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// config.js awaits document.fonts at import; jsdom has none.
vi.hoisted(() => { Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve([]) }, configurable: true }) })

const requestCode = vi.hoisted(() => vi.fn())
const verifyAndSave = vi.hoisted(() => vi.fn())
vi.mock('./submit.js', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  requestCode,
  verifyAndSave,
  closedText: () => null,
  getSent: () => null,
  hasCodeFor: () => false,
}))
// @ts-expect-error plain JS module
const { confirmCard, fastLaneForm } = await import('./ui.js')
// @ts-expect-error plain JS module
const { codeCard } = await import('./codecard.js')
// @ts-expect-error plain JS module
const { createInvite } = await import('./invite.js')
// @ts-expect-error plain JS module
const { EVENT } = await import('./config.js')

const DRESS = 'Semi-casual, in your jersey. Any club, any sport, any era. No jersey? Wear red.'
const noop = () => {}
const flush = () => new Promise((r) => setTimeout(r))
const wrap = (nodes: Node[]) => { const d = document.createElement('div'); d.append(...nodes); document.body.append(d); return d }
const shown = (el: Element | null) => { for (let n = el; n; n = n.parentElement) if ((n as HTMLElement).hidden) return false; return !!el }
const before = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

beforeAll(() => {
  // privacyNotice() reads matchMedia in the capped (game) layout; jsdom has none.
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener: noop, removeEventListener: noop })) as unknown as typeof window.matchMedia
})
beforeEach(() => { document.body.innerHTML = ''; requestCode.mockReset() })

// ---- 2. dress code ----------------------------------------------------------------------------------------------------------
describe('dress code', () => {
  const reply = (attending: string, status = 'saved') => ({ status, firstName: 'Ada', attending, ticketNo: 7 })
  const dress = (root: Element) => [...root.querySelectorAll('p')].filter((p) => p.textContent === DRESS)

  it('should_state_the_dress_code_on_the_config_and_say_wear_red', () => {
    expect(EVENT.dressCode).toBe(DRESS)
  })
  it.each([
    ['yes', 'saved'], ['maybe', 'saved'], ['yes', 'updated'], ['maybe', 'updated'],
  ])('should_show_the_dress_line_once_for_%s_(%s)', (attending, status) => {
    for (const redRoom of [false, true]) {
      const root = wrap(confirmCard(reply(attending, status), { redRoom }))
      expect(dress(root)).toHaveLength(1)
    }
  })
  it.each([['saved'], ['updated']])('should_not_show_the_dress_line_when_the_guest_declines_(%s)', (status) => {
    for (const redRoom of [false, true]) {
      const root = wrap(confirmCard(reply('no', status), { redRoom }))
      expect(dress(root)).toHaveLength(0)
      expect(root.textContent).not.toMatch(/jersey|Wear red/)
    }
  })
  it('should_show_the_dress_line_on_the_invitation', () => {
    const { el } = createInvite({ onPlay: noop, onReply: noop })
    expect([...el.querySelectorAll('p')].some((p: Element) => p.textContent === DRESS)).toBe(true)
  })
})

// ---- 3 + 4. confirmCard ---------------------------------------------------------------------------------------------------
describe('confirmCard stub', () => {
  const reply = (attending: string, status = 'saved') => ({ status, firstName: 'Ada', attending, ticketNo: 7 })
  const stub = (root: Element) => root.querySelector('.stub')
  const stamp = (root: Element) => root.querySelector('.stamp')

  it('should_give_a_yes_a_stub_holding_the_seat_line_and_a_signed_stamp', () => {
    const root = wrap(confirmCard(reply('yes'), { redRoom: true }))
    const s = stub(root)!
    expect(s).not.toBeNull()
    expect(s.classList.contains('pc')).toBe(false)
    const seat = s.querySelector('p.seat')!
    expect(seat.textContent).toBe('Seat 007 · Shirt 7')
    expect(seat.closest('[aria-hidden="true"]')).toBeNull()   // a screen reader still gets the seat
    expect(stamp(root)!.textContent).toBe(`Signed · ${EVENT.shortDate}`)
    expect(stamp(root)!.getAttribute('aria-hidden')).toBe('true')
    // everything else on the stub is decoration
    const decor = [...s.children].filter((c) => c !== seat && !c.contains(seat))
    expect(decor.length).toBeGreaterThan(0)
    for (const d of decor) expect(d.getAttribute('aria-hidden')).toBe('true')
  })
  it('should_give_a_maybe_a_pencilled_stub', () => {
    const root = wrap(confirmCard(reply('maybe'), { redRoom: true }))
    expect(stub(root)!.classList.contains('pc')).toBe(true)
    expect(stub(root)!.querySelector('p.seat')!.textContent).toBe('Seat 007 · Shirt 7')
    expect(stamp(root)!.textContent).toBe('Pencilled in')
  })
  it('should_make_the_stub_follow_the_answer_for_a_returning_guest_who_now_says_maybe', () => {
    const root = wrap(confirmCard(reply('maybe', 'updated'), { redRoom: true }))
    expect(stub(root)!.classList.contains('pc')).toBe(true)
    expect(stamp(root)!.textContent).toBe('Pencilled in')
    expect(root.textContent).not.toContain('Signed ·')
  })
  it('should_make_the_stub_follow_the_answer_for_a_returning_guest_who_now_says_yes', () => {
    const root = wrap(confirmCard(reply('yes', 'updated'), { redRoom: true }))
    expect(stub(root)!.classList.contains('pc')).toBe(false)
    expect(stamp(root)!.textContent).toBe(`Signed · ${EVENT.shortDate}`)
  })
  it.each([['saved'], ['updated']])('should_give_a_no_no_stub_and_no_stamp_(%s)', (status) => {
    const root = wrap(confirmCard(reply('no', status), { redRoom: true }))
    expect(stub(root)).toBeNull()
    expect(stamp(root)).toBeNull()
    expect(root.querySelector('p.seat')).toBeNull()
  })
  it('should_still_honour_the_heading_level_and_id_options', () => {
    const root = wrap(confirmCard(reply('yes'), { redRoom: true, level: 'h1', id: 'fb-h' }))
    const head = root.querySelector('h1')!
    expect(head.id).toBe('fb-h')
    expect(head.textContent).toBe("You're in, Ada")
    expect(root.querySelector('h2')).toBeNull()
  })
  it.each(['yes', 'maybe', 'no'])('should_leave_the_game_card_without_a_stub_or_stamp_for_%s', (attending) => {
    const root = wrap(confirmCard(reply(attending)))
    expect(stub(root)).toBeNull()
    expect(stamp(root)).toBeNull()
    expect(root.querySelector('.stub, .stamp, [aria-hidden="true"]')).toBeNull()
    if (attending !== 'no') expect(root.querySelector('p.seat')!.textContent).toBe('Seat 007 · Shirt 7')
  })
})

// ---- 4. fastLaneForm --------------------------------------------------------------------------------------------------------
const build = (redRoom: boolean, capped = false) => { const { form } = fastLaneForm({ onSend: noop, capped, redRoom }); document.body.append(form); return form as HTMLFormElement }
const group = (form: Element, question: string) => {
  const lab = [...form.querySelectorAll('[id$="-l"]')].find((e) => e.textContent === question)!
  return form.querySelector(`[role=radiogroup][aria-labelledby="${lab.id}"]`)!
}
const pick = (form: Element, question: string, option: string) =>
  ([...group(form, question).querySelectorAll('[role=radio]')].find((b) => b.textContent === option) as HTMLElement).click()
const notice = (form: Element) => [...form.querySelectorAll('.notice')][0] as HTMLElement
const NAMES = ['The player', 'Contact', 'The supporter', 'Matchday']
const marker = (form: Element, name: string) => {
  const leaf = [...form.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent === name)
  return leaf ? leaf.parentElement! : null
}
const markersShown = (form: Element) => NAMES.filter((n) => shown(marker(form, n)))
const firstPersonal = (form: Element) => form.querySelector('#fl-firstName')!

describe('fastLaneForm default (the game)', () => {
  it('should_open_with_the_visible_privacy_notice_first_in_the_form', () => {
    const form = build(false)
    expect(form.firstElementChild).toBe(notice(form))
    expect(shown(notice(form))).toBe(true)
  })
  it('should_add_no_group_markers_or_small_optional_text_after_a_yes', () => {
    const form = build(false)
    pick(form, 'Can you make it?', 'Yes')
    for (const n of NAMES) expect(marker(form, n)).toBeNull()
    expect(form.querySelector('small')).toBeNull()
    expect(form.querySelector('label[for="fl-preferredName"]')!.textContent).toBe('Name on your shirt (optional)')
    expect(form.firstElementChild).toBe(notice(form))
    expect(shown(notice(form))).toBe(true)
  })
  // The game builds the form capped (the default in ui.js): the notice is a <details>, not the plain paragraph.
  it('should_keep_the_capped_details_notice_before_the_first_question', () => {
    const form = build(false, true)
    expect(notice(form).tagName).toBe('DETAILS')
    expect(form.firstElementChild).toBe(notice(form))
    expect(before(notice(form), group(form, 'Can you make it?'))).toBe(true)
    pick(form, 'Can you make it?', 'Yes')
    expect(form.firstElementChild).toBe(notice(form))
    expect(shown(notice(form))).toBe(true)
  })
  it('should_add_no_group_markers_to_the_capped_form', () => {
    const form = build(false, true)
    pick(form, 'Can you make it?', 'Yes')
    for (const n of NAMES) expect(marker(form, n)).toBeNull()
    expect(form.querySelector('.grp')).toBeNull()
  })
})

describe('fastLaneForm redRoom: privacy notice', () => {
  it('should_sit_directly_after_the_question_and_stay_hidden_until_it_is_answered', () => {
    const form = build(true)
    const question = form.children[0]
    expect(question.contains(group(form, 'Can you make it?'))).toBe(true)
    expect(notice(form).previousElementSibling).toBe(question)
    expect(shown(notice(form))).toBe(false)
  })
  it.each([
    ['Yes', null], ['Not sure yet', null], ["Can't make it", null], ["Can't make it", 'No, first time'], ["Can't make it", 'Yes, use my email'],
  ])('should_show_the_notice_inside_the_form_before_the_first_personal_field_after_%s_%s', (answer, replied) => {
    const form = build(true)
    pick(form, 'Can you make it?', answer as string)
    if (replied) pick(form, 'Have you replied before?', replied)
    expect(shown(notice(form))).toBe(true)
    expect(form.contains(notice(form))).toBe(true)
    expect(form.id).toBe('fast-form')
    expect(before(notice(form), firstPersonal(form))).toBe(true)
  })
  it.each([
    ['Yes', null], ['Not sure yet', null], ["Can't make it", 'No, first time'], ["Can't make it", 'Yes, use my email'],
  ])('should_keep_the_wording_identical_to_the_game_form_after_%s_%s', (answer, replied) => {
    const a = build(true)
    const b = build(false)
    for (const f of [a, b]) { pick(f, 'Can you make it?', answer as string); if (replied) pick(f, 'Have you replied before?', replied) }
    expect(notice(a).textContent).toBe(notice(b).textContent)
    expect(notice(a).textContent).toMatch(/uses .+ to manage RSVPs/)
  })
})

describe('fastLaneForm redRoom: group markers', () => {
  it.each([['Yes'], ['Not sure yet']])('should_show_all_four_numbered_markers_in_order_for_%s', (answer) => {
    const form = build(true)
    pick(form, 'Can you make it?', answer)
    expect(markersShown(form)).toEqual(NAMES)
    const marks = NAMES.map((n) => marker(form, n)!)
    for (let i = 0; i < marks.length - 1; i++) expect(before(marks[i], marks[i + 1])).toBe(true)
    expect(before(marker(form, 'The supporter')!, group(form, 'Your sport'))).toBe(true)
    expect(before(marker(form, 'Matchday')!, group(form, 'Bringing someone?'))).toBe(true)
    const numerals = NAMES.map((n) => marker(form, n)!.firstElementChild!)
    expect(numerals.map((n) => n.textContent)).toEqual(['I', 'II', 'III', 'IV'])
    for (const n of numerals) expect(n.getAttribute('aria-hidden')).toBe('true')
    expect(before(marker(form, 'The player')!, firstPersonal(form))).toBe(true)
    expect(before(marker(form, 'Contact')!, form.querySelector('#fl-email')!)).toBe(true)
  })
  it('should_show_no_markers_before_the_first_question_is_answered', () => {
    expect(markersShown(build(true))).toEqual([])
  })
  it.each([[null], ['No, first time'], ['Yes, use my email']])('should_show_no_markers_for_cant_make_it_(replied_before:_%s)', (replied) => {
    const form = build(true)
    pick(form, 'Can you make it?', "Can't make it")
    if (replied) pick(form, 'Have you replied before?', replied)
    expect(markersShown(form)).toEqual([])
  })
  it('should_hide_markers_again_when_the_guest_changes_the_answer_to_cant_make_it', () => {
    const form = build(true)
    pick(form, 'Can you make it?', 'Yes')
    pick(form, 'Can you make it?', "Can't make it")
    expect(markersShown(form)).toEqual([])
  })
  it('should_not_make_the_markers_headings', () => {
    const form = build(true)
    pick(form, 'Can you make it?', 'Yes')
    expect(form.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')).toHaveLength(0)
    for (const n of NAMES) expect(marker(form, n)!.closest('h1, h2, h3, h4, h5, h6, [role="heading"]')).toBeNull()
  })
})

// ---- 5. optional labels ----------------------------------------------------------------------------------------------------
describe('fastLaneForm redRoom: "(optional)" in labels', () => {
  const labelOf = (form: Element, id: string) => form.querySelector(`label[for="${id}"]`)!
  it.each([
    ['fl-preferredName', 'Name on your shirt (optional)'],
    ['fl-plusOneName', 'Their name (optional)'],
  ])('should_wrap_optional_in_small_and_keep_the_label_text_for_%s', (id, text) => {
    const form = build(true), game = build(false)
    for (const f of [form, game]) { pick(f, 'Can you make it?', 'Yes'); pick(f, 'Bringing someone?', 'Plus one') }
    const l = labelOf(form, id)
    expect(l.textContent).toBe(text)
    expect(l.textContent).toBe(labelOf(game, id).textContent)
    expect(l.querySelector('small')!.textContent).toBe('(optional)')
    expect(l.lastElementChild).toBe(l.querySelector('small'))
    expect(labelOf(game, id).querySelector('small')).toBeNull()
  })
  it('should_wrap_optional_in_small_on_the_decline_reason', () => {
    const form = build(true)
    pick(form, 'Can you make it?', "Can't make it"); pick(form, 'Have you replied before?', 'No, first time')
    const l = labelOf(form, 'fl-reason')
    expect(l.textContent).toBe('Reason (optional)')
    expect(l.querySelector('small')!.textContent).toBe('(optional)')
  })
  it('should_leave_labels_without_optional_alone', () => {
    const form = build(true)
    pick(form, 'Can you make it?', 'Yes')
    expect(labelOf(form, 'fl-firstName').textContent).toBe('First name')
    expect(labelOf(form, 'fl-firstName').querySelector('small')).toBeNull()
  })
})

// ---- 4. codeCard -------------------------------------------------------------------------------------------------------------
describe('codeCard redRoom cells', () => {
  const cb = { getValues: () => ({ email: 'a@b.co' }), onSaved: noop, onFix: noop, onClosed: noop }
  const mk = (redRoom: boolean) => { const c = codeCard({ side: 'home', setEmail: noop, redRoom, ...cb }); return { c, root: wrap(c.nodes) } }
  const input = (root: Element) => root.querySelector('#cc-code') as HTMLInputElement
  const cells = (root: Element) => { const box = [...root.querySelectorAll('[aria-hidden="true"]')].find((e) => e.children.length === 6); return box ? [...box.children].map((c) => c.textContent) : null }
  // Write through the prototype setter so only the `input` listener (not the instance `value` setter) can repaint the cells.
  const type = (i: HTMLInputElement, v: string) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })) }
  const attrs = (e: Element) => [...e.attributes].map((a) => `${a.name}=${a.value}`).sort()

  it('should_keep_exactly_one_real_code_input_with_the_same_id_label_and_attributes', () => {
    const a = mk(false).root, b = mk(true).root
    expect(b.querySelectorAll('input[name="one-time-code"]')).toHaveLength(1)
    expect(input(b)).not.toBeNull()
    expect(attrs(input(b))).toEqual(attrs(input(a)))
    expect(b.querySelector('label[for="cc-code"]')!.textContent).toBe('Your code')
    expect(b.querySelector('label[for="cc-code"]')!.textContent).toBe(a.querySelector('label[for="cc-code"]')!.textContent)
  })
  it('should_mirror_typed_digits_in_six_hidden_cells_and_empty_them_on_clear', () => {
    const { root } = mk(true)
    expect(cells(root)).toEqual(['', '', '', '', '', ''])
    type(input(root), '482')
    expect(cells(root)).toEqual(['4', '8', '2', '', '', ''])
    expect(input(root).value).toBe('482')
    type(input(root), '')
    expect(cells(root)).toEqual(['', '', '', '', '', ''])
  })
  it('should_repaint_the_cells_when_the_value_is_set_from_code', () => {
    const { root } = mk(true)
    input(root).value = '913'
    expect(cells(root)).toEqual(['9', '1', '3', '', '', ''])
  })
  it('should_empty_the_cells_when_the_guest_changes_the_email', async () => {
    requestCode.mockResolvedValue({ status: 'sent' })
    const { c, root } = mk(true)
    type(input(root), '4821')
    const buttons = [...root.querySelectorAll('button')]
    buttons.find((b) => b.textContent === 'Wrong email?')!.click()
    const email = root.querySelector('#cc-email') as HTMLInputElement
    email.value = 'new@example.com'
    email.form!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await flush()
    expect(input(root).value).toBe('')
    expect(cells(root)).toEqual(['', '', '', '', '', ''])
    c.dispose()
  })
  it('should_mark_only_the_expired_status_line_so_the_cells_can_go_gold', async () => {
    const mark = async (status: string) => {
      verifyAndSave.mockResolvedValue({ status })
      const { c, root } = mk(true)
      type(input(root), '482913')
      input(root).form!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      await flush()
      const st = root.querySelector('.status')!
      c.dispose()
      return [st.textContent, st.getAttribute('data-reason')]
    }
    expect(await mark('code_expired')).toEqual(['!That code has expired. Send a new one.', 'expired'])
    expect(await mark('too_many_attempts')).toEqual(['!Too many wrong tries. Send a new code.', null])
  })
  it('should_add_no_cells_without_the_option', () => {
    const { root } = mk(false)
    expect(cells(root)).toBeNull()
    expect(root.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
