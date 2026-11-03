// matchday-rsvp: DOM builders shared by the game (flow.js) and the no-WebGL page (fallback.js). NO three.js import here, so the fallback path never depends on it.
// User text is only ever written with textContent / text nodes (see h()). Validation is f.validate() from config.js, the same for every path.
import { EVENT, FIELDS } from './config.js';
import { getState, onState, isClosed, CLOSED_TEXT } from './submit.js';

export const SEND_FAILED = "We couldn't send your reply. Try again.";

// DOM helper: strings become text nodes, never markup.
export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c);
  return e;
}

// One control per field. Text fields are an <input>; a `type: 'choice'` field (guests 0-3, the side) is a radiogroup of buttons (arrow keys move + select, Enter selects and submits).
// Both validate through f.validate(string), so the data shape is unchanged. Options are values or { value, label }.
// Returns the label + control nodes; the caller owns the <form>, the error line and the submit.
export function fieldControl(f, id, errEl, { init, submit, onPick } = {}) {
  let control, read, invalid, focusFirst;
  if (f.type === 'choice') {
    let val = init != null ? String(init) : '';
    const group = h('div', { class: 'seg' + (f.options.length === 2 ? ' two' : ''), role: 'radiogroup', 'aria-labelledby': id + '-l', 'aria-describedby': id + '-err' });
    const opts = f.options.map((o) => { const v = typeof o === 'object' ? o.value : o, label = typeof o === 'object' ? o.label : String(o);
      return h('button', { class: 'opt', type: 'button', role: 'radio', 'aria-checked': 'false', tabindex: '-1', 'data-value': String(v), 'data-side': typeof o === 'object' ? o.side : null, text: label }); });
    const sync = () => opts.forEach((b, i) => { const on = b.dataset.value === val; b.setAttribute('aria-checked', String(on)); b.tabIndex = (val ? on : i === 0) ? 0 : -1; });
    const pick = (b, focus) => { val = b.dataset.value; invalid(false); errEl.textContent = ''; sync(); onPick?.(val); if (focus) b.focus(); };
    opts.forEach((b, i) => {
      b.addEventListener('click', () => pick(b));
      b.addEventListener('keydown', (ev) => {
        const k = ev.key, n = opts.length, j = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % n : k === 'ArrowLeft' || k === 'ArrowUp' ? (i + n - 1) % n : -1;
        if (j >= 0) { ev.preventDefault(); pick(opts[j], true); } else if (k === 'Enter') { ev.preventDefault(); submit?.(); }   // Enter submits what is chosen; it never chooses for you
      });
    });
    group.append(...opts); sync();
    control = group; read = () => val; invalid = (on) => (on ? group.setAttribute('aria-invalid', 'true') : group.removeAttribute('aria-invalid')); focusFirst = () => (opts.find((b) => b.tabIndex === 0) || opts[0]).focus();
    return { nodes: [h('div', { class: 'label', id: id + '-l', text: f.label }), group], control, read, invalid, focusFirst };
  }
  control = h('input', { id, name: f.key, type: f.type, inputmode: f.inputmode, autocomplete: f.autocomplete, placeholder: f.placeholder, maxlength: String(f.maxlength ?? 200), 'aria-describedby': id + '-err', value: init ?? '' });
  read = () => control.value; invalid = (on) => (on ? control.setAttribute('aria-invalid', 'true') : control.removeAttribute('aria-invalid')); focusFirst = () => control.focus();
  return { nodes: [h('label', { for: id, text: f.label }), control], control, read, invalid, focusFirst };
}

// Validates one control through its field's validator, shows or clears the error, and returns { ok, value | error }. Every submit path uses this.
export function checkField(f, control, err) {
  const r = f.validate(control.read());
  err.textContent = r.ok ? '' : r.error; control.invalid(!r.ok);
  return r;
}

// A one-field <form> (the game's field cards): label + control + its own error line. onValid gets the validated value. Returns { form, input, err }.
// Production form that must not collect anything (submit.js isClosed()): the state replaces the questions and Send stays disabled.
export const closedNote = () => h('p', { class: 'closed', role: 'status', text: CLOSED_TEXT });
export function fieldInput(f, id, onValid, init) {
  if (isClosed()) { const form = h('form', { novalidate: true, onsubmit: (ev) => ev.preventDefault() }, closedNote()); return { form, input: null, err: null, closed: true }; }
  const err = h('p', { class: 'err', id: id + '-err', role: 'alert' });
  let c;
  const form = h('form', { novalidate: true, onsubmit: (ev) => {
    ev.preventDefault(); const r = checkField(f, c, err);
    if (r.ok) onValid(r.value); else c.focusFirst();
  } });
  c = fieldControl(f, id, err, { init, submit: () => form.requestSubmit() });
  form.append(...c.nodes, err);
  return { form, input: c.control, err };
}

// POPIA short notice (config.js EVENT.privacy), shown before the first personal field everywhere. In the capped overlay cards (`capped`, the default) it is a <details>
// whose summary is the notice's first sentence (who uses what, for what), so a phone still shows it while collapsed; the panel holds the rest (optional, retention, rights).
// Open on wide screens, collapsed on phones, where the whole notice is ~5 lines and would crowd the centred card. The full page (fallback) shows it inline as one sentence.
export function privacyNotice({ capped = true, side = 'home' } = {}) {
  if (!EVENT.privacy) return Object.assign(h('p', { class: 'notice' }), { setSide() {} });   // missing config: the form is closed in production anyway, so render nothing rather than throw
  const P = EVENT.privacy, link = /^https:\/\//.test(P.policyUrl) ? h('a', { href: P.policyUrl, target: '_blank', rel: 'noopener noreferrer', text: ' Full notice' }) : null;
  const val = (k) => (typeof P[k] === 'string' && P[k].trim() ? P[k] : `[${k} missing]`);   // a missing/blank key shows as "[contact missing]", never "undefined"; any non-blank string (placeholders too) shows as written
  // The wording follows the side: AWAY only gives a name, so it never claims email, mobile or event details. setSide() swaps it when the quick-reply guest picks a side.
  // lead + ' ' + rest is the one notice sentence (NOTICE_VERSION covers it), split so the lead can be the summary; only the lead depends on the side.
  const lead = (s) => `${val('responsibleParty')} uses ${s === 'away' ? 'your name only' : 'your name, email and mobile only'} to manage RSVPs for this event${s === 'away' ? '' : ' and send you event details'}.`;
  const rest = () => `Replying is optional. We delete your details ${val('retention')}. You can ask to see, correct or delete them at ${val('contact')}.`;
  const t1 = document.createTextNode(lead(side)), t2 = document.createTextNode(rest()), setSide = (s) => { t1.data = lead(s); t2.data = rest(); };
  if (!capped) return Object.assign(h('p', { class: 'notice' }, t1, ' ', t2, link), { setSide });
  return Object.assign(h('details', { class: 'notice', open: !matchMedia('(max-width: 560px)').matches }, h('summary', {}, t1), h('p', {}, t2, link)), { setSide });
}

// Closing card for a sent RSVP (game, quick reply and no-WebGL page alike). Returns the card's children. values = the sent payload.
export function confirmCard(side, values, { id = 'd-h', kicker, display = side === 'home' } = {}) {
  const away = side === 'away';
  return [h('p', { class: 'kicker', text: kicker ?? (away ? 'AWAY' : 'HOME') }),
    h('h2', { id, class: display ? 'display' : false, tabindex: '-1', text: away ? 'Thanks for letting us know.' : 'Your RSVP is confirmed' }),
    h('p', { text: away ? `We'll miss you, ${values.name}.` : 'Await your invitation with further details.' }),
    away ? null : h('dl', {}, summaryRows(values))].filter(Boolean);   // no null child: replaceChildren(null) would print the text "null"
}

// ---- fast lane: the whole RSVP as one <form> (side, then the fields for that side, one Send) -------------------------------------------
// HOME = every FIELDS entry; AWAY = the name only (same set as the game's AWAY card). Browser autofill sees one form with name/autocomplete on every input.
export const AWAY_FIELD = FIELDS.find((f) => f.key === 'name');
const SIDE_FIELD = { key: 'side', label: 'Can you make it?', type: 'choice', options: [{ value: 'home', side: 'home', label: 'Attending' }, { value: 'away', side: 'away', label: "Can't make it" }],
  validate(v) { return v === 'home' || v === 'away' ? { ok: true, value: v } : { ok: false, error: "Please choose Attending or Can't make it." }; } };

// onSend({ side: 'home'|'away', values: { name, ... } }) runs with validated values only, and never while a send is in flight or after one succeeded (shared state, submit.js).
// The form mirrors that state: Send is disabled while sending or sent, and a failed send shows SEND_FAILED with Send enabled again.
export function fastLaneForm({ onSend, capped = true }) {
  if (isClosed()) {
    const form = h('form', { id: 'fast-form', name: 'rsvp', novalidate: true, onsubmit: (ev) => ev.preventDefault() }, closedNote(), h('div', { class: 'row' }, h('button', { class: 'btn', type: 'submit', disabled: true, text: 'Send' })));
    return { form };
  }
  let side = '', locked = false;
  const notice = privacyNotice({ capped });
  const form = h('form', { id: 'fast-form', name: 'rsvp', autocomplete: 'on', novalidate: true });
  const items = [SIDE_FIELD, ...FIELDS].map((f) => {
    const id = 'fl-' + f.key, err = h('p', { class: 'err', id: id + '-err', role: 'alert' });
    const c = fieldControl(f, id, err, { submit: () => form.requestSubmit(), onPick: f === SIDE_FIELD ? (v) => { side = v; notice.setSide(v); for (const it of items) it.w.hidden = side === 'away' && it.f !== SIDE_FIELD && it.f !== AWAY_FIELD; } : undefined });
    return { f, c, err, w: h('div', { class: 'fl-field' }, ...c.nodes, err) };
  });
  const btn = h('button', { class: 'btn', type: 'submit', text: 'Send' }), failed = h('p', { class: 'err', role: 'alert' });
  // N3: after the first send attempt the answers are frozen (inputs readonly, radios disabled), so "Send again" can only resend exactly what was sent, under the same idempotency key.
  const lock = () => { locked = true; for (const it of items) { if (it.f.type === 'choice') it.c.control.querySelectorAll('button').forEach((b) => { b.disabled = true; }); else it.c.control.readOnly = true; } };
  const sync = (st) => { btn.textContent = locked && st === 'failed' ? 'Send again' : 'Send'; btn.disabled = st === 'sending' || st === 'sent'; failed.textContent = st === 'failed' ? SEND_FAILED : ''; failed.hidden = st !== 'failed'; };
  onState(sync); sync(getState());
  form.append(notice, ...items.map((it) => it.w), failed, h('div', { class: 'row' }, btn));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault(); if (getState() === 'sending' || getState() === 'sent') return;
    const values = {}; let first = null;
    for (const it of items) {
      if (it.w.hidden) continue;
      const r = checkField(it.f, it.c, it.err);
      if (r.ok) values[it.f.key] = r.value; else first ??= it;
    }
    if (first) { first.c.focusFirst(); return; }
    const { side: s, ...rest } = values; lock(); onSend({ side: s, values: rest });
  });
  return { form };
}

// Rows for a confirmation card (dt/dd), from validated values.
export const summaryRows = (values) => FIELDS.filter((f) => values[f.key] != null).flatMap((f) => [h('dt', { text: f.short }), h('dd', { text: String(values[f.key]) })]);

// The kit crest as a 32 px mark (shield + star), filled with --kit-home via currentColor. Decorative: aria-hidden.
export function crestMark() {
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'crest'); s.setAttribute('aria-hidden', 'true');
  const p = (d, fill) => { const e = document.createElementNS(NS, 'path'); e.setAttribute('d', d); e.setAttribute('fill', fill); s.append(e); };
  p('M4 3h16v10c0 4-3.4 6.6-8 8-4.6-1.4-8-4-8-8V3z', 'currentColor');
  p('M12 7l1.2 3.4H17l-3 2.2 1.1 3.5L12 14l-3.1 2.1L10 12.6 7 10.4h3.8z', 'var(--paper-100)');
  return s;
}

// Mute button icon (speaker, with waves or a cross). Decorative: aria-hidden; the button carries the label.
export const svgIcon = (muted) => {
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  const path = (d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', d.endsWith('z') ? 'currentColor' : 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round'); s.append(p); };
  path('M3 9v6h4l5 4V5L7 9H3z');
  if (muted) { path('M16 9l5 6'); path('M21 9l-5 6'); [...s.querySelectorAll('path')].slice(-2).forEach((q) => { q.style.stroke = 'var(--text-muted)'; }); } else { path('M16 8.5a5 5 0 0 1 0 7'); path('M18.5 6a8.5 8.5 0 0 1 0 12'); }
  return s;
};
