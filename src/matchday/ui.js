// matchday-rsvp: DOM builders shared by the game (flow.js) and the no-WebGL page (fallback.js). NO three.js import here, so the fallback path never depends on it.
// User text is only ever written with textContent / text nodes (see h()). Validation is f.validate() from fields.js, the same for every path.
import { EVENT } from './config.js';
import { FIELD, FAST_KEYS, keysFor, valueOf } from './fields.js';
import { getState, onState, closedText } from './submit.js';
import { formatSeat } from '../lib/seat.ts';
import { buildIcs, googleCalendarUrl, ICS_FILE_NAME } from '../lib/calendar.ts';

export const SEND_FAILED = "I couldn't send your reply. Try again.";

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
    const group = h('div', { class: 'seg n' + f.options.length, role: 'radiogroup', 'aria-labelledby': id + '-l', 'aria-describedby': id + '-err' });
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
  control = h('input', { id, name: f.key, type: f.type, inputmode: f.inputmode, autocomplete: f.autocomplete, placeholder: f.placeholder, maxlength: String(f.maxlength ?? 200), 'aria-describedby': (f.help ? id + '-help ' : '') + id + '-err', value: init ?? '' });
  read = () => control.value; invalid = (on) => (on ? control.setAttribute('aria-invalid', 'true') : control.removeAttribute('aria-invalid')); focusFirst = () => control.focus();
  return { nodes: [h('label', { for: id, text: f.label }), control, f.help ? h('p', { class: 'help', id: id + '-help', text: f.help }) : null].filter(Boolean), control, read, invalid, focusFirst };
}

// Validates one control through its field's validator, shows or clears the error, and returns { ok, value | error }. Every submit path uses this.
export function checkField(f, control, err) {
  const r = f.validate(control.read());
  err.textContent = r.ok ? '' : r.error; control.invalid(!r.ok);
  return r;
}

// A closed page (no invite key, bad link, production config not ready): this text replaces the questions and nothing is sent.
export const closedNote = () => h('p', { class: 'closed', role: 'status', text: closedText() ?? '' });

// A <form> of several fields (a station's card, or the whole fast lane): label + control + its own error line per field, conditional fields shown only when their answer asks for them.
// keys = FIELD keys; init = flat values; onValid(values) gets cleaned values by value key (attendingFast comes back as `attending`); hidden fields are left out.
// Returns { form, items, read(), focusFirst(), setErrors({ key: msg }), onChange(fn) }. Validation is fields.js (the server's rules); the server stays authoritative.
export function fieldsForm({ keys, id, init = {}, onValid, onChange }) {
  let form;
  const items = keys.map((k) => {
    const f = FIELD[k], fid = `${id}-${k}`, err = h('p', { class: 'err', id: fid + '-err', role: 'alert' });
    const c = fieldControl(f, fid, err, { init: valueOf(init, k) ?? f.init, submit: () => form.requestSubmit(), onPick: () => { refresh(); onChange?.(read()); } });
    return { k, f, c, err, w: h('div', { class: 'fl-field' }, ...c.nodes, err) };
  });
  const read = () => Object.fromEntries(items.map((it) => [it.k === 'attendingFast' ? 'attending' : it.k, it.c.read()]));
  const refresh = () => { const shown = keysFor(keys, read()); for (const it of items) it.w.hidden = !shown.includes(it.k); };
  form = h('form', { novalidate: true, autocomplete: 'on', onsubmit: (ev) => {
    ev.preventDefault();
    const shown = keysFor(keys, read()), out = {}; let first = null;
    for (const it of items) {
      if (!shown.includes(it.k)) continue;
      const r = it.f.validate(it.c.read());
      it.err.textContent = r.ok ? '' : r.error; it.c.invalid(!r.ok);
      if (r.ok) out[it.k === 'attendingFast' ? 'attending' : it.k] = r.value; else first ??= it;
    }
    if (first) { first.c.focusFirst(); return; }
    onValid(out);
  } });
  form.append(...items.map((it) => it.w)); refresh();
  return {
    form, items, read, onChange: (fn) => { onChange = fn; },
    focusFirst: () => (items.find((it) => !it.w.hidden) ?? items[0]).c.focusFirst(),
    setErrors(errs) { let first = null; for (const it of items) { const m = errs[it.k]; it.err.textContent = m ?? ''; it.c.invalid(!!m); if (m && !it.w.hidden) first ??= it; } first?.c.focusFirst(); },
  };
}

// A status line: an icon and words, never colour alone (DESIGN.md section 4). tone: ok | warn | err | info.
const GLYPH = { ok: '✓', warn: '⏱', err: '!', info: 'i' };
export function statusLine(tone, text, attrs = {}) {
  return h('p', { class: 'status ' + tone, role: tone === 'err' ? 'alert' : 'status', ...attrs }, h('span', { class: 'ico', 'aria-hidden': 'true', text: GLYPH[tone] }), h('span', { text }));
}

// POPIA short notice (config.js EVENT.privacy), shown before the first personal field everywhere. In the capped overlay cards (`capped`, the default) it is a <details>
// whose summary is the notice's first sentence (who uses what, for what), so a phone still shows it while collapsed; the panel holds the rest (optional, retention, rights).
// Open on wide screens, collapsed on phones, where the whole notice is ~5 lines and would crowd the centred card. The full page (fallback) shows it inline as one sentence.
export function privacyNotice({ capped = true, side = 'home' } = {}) {
  if (!EVENT.privacy) return Object.assign(h('p', { class: 'notice' }), { setSide() {} });   // missing config: the form is closed in production anyway, so render nothing rather than throw
  const P = EVENT.privacy, link = /^https:\/\//.test(P.policyUrl) ? h('a', { href: P.policyUrl, target: '_blank', rel: 'noopener noreferrer', text: ' Full notice' }) : null;
  const val = (k) => (typeof P[k] === 'string' && P[k].trim() ? P[k] : `[${k} missing]`);   // a missing/blank key shows as "[contact missing]", never "undefined"; any non-blank string (placeholders too) shows as written
  // The wording follows the side: a decline only gives a name and email, so it never claims the rest. setSide() swaps it when the fast-lane guest changes their answer.
  // lead + ' ' + rest is the one notice sentence (NOTICE_VERSION covers it), split so the lead can be the summary; only the lead depends on the side.
  const lead = (s) => `${val('responsibleParty')} uses ${s === 'away' ? 'your name and email only' : 'your name, email, WhatsApp number (if you give one), team and plus-one name only'} to manage RSVPs for this event${s === 'away' ? '' : ' and send you event details'}.`;
  const rest = () => `Replying is optional. I delete your details ${val('retention')}. You can ask to see, correct or delete them at ${val('contact')}.`;
  const t1 = document.createTextNode(lead(side)), t2 = document.createTextNode(rest()), setSide = (s) => { t1.data = lead(s); t2.data = rest(); };
  if (!capped) return Object.assign(h('p', { class: 'notice' }, t1, ' ', t2, link), { setSide });
  return Object.assign(h('details', { class: 'notice', open: !matchMedia('(max-width: 560px)').matches }, h('summary', {}, t1), h('p', {}, t2, link)), { setSide });
}

// Closing card for a saved RSVP, built ONLY from the server's saved/updated reply { status, firstName, attending, ticketNo } (never from what the guest typed).
// "updated" is a returning guest: the same seat, kept. No exclamation marks; a No gets no warm closing line and no poster.
export const seatNo = formatSeat;   // lib/seat.ts: three digits, 007
export function confirmCard(r, { id = 'd-h' } = {}) {
  const back = r.status === 'updated', no = r.attending === 'no', maybe = r.attending === 'maybe';
  const who = r.answers?.preferredName?.trim() || r.firstName;   // the name the shirt and poster carry: preferred, else first
  const kicker = no ? 'Reply saved' : maybe ? 'Pencilled in' : 'Signed';
  const heading = no ? `${back ? 'Updated' : 'Noted'}, ${who}` : back ? `Welcome back, ${who}` : maybe ? `Pencilled in, ${who}` : `You're in, ${who}`;
  const body = no ? 'You are down as not coming. Use the same email to change your answer.'
    : back ? `Your answer is updated and seat ${seatNo(r.ticketNo)} is kept. I'll send the venue and details closer to the day.`
    : maybe ? `Seat ${seatNo(r.ticketNo)} is held while you decide. Use the same email to change your answer. I'll send the venue and details closer to the day.`
    : `I'll send the venue and details closer to the day.`;
  return [h('p', { class: 'kicker', text: kicker }), h('h2', { id, class: 'display', tabindex: '-1', text: heading }), h('p', { text: body }),
    no ? null : h('p', { class: 'seat', text: `Seat ${seatNo(r.ticketNo)} · Shirt ${r.ticketNo}` }), no ? null : keepsakeRow(r), h('p', { class: 'sign', text: 'Makes' })].filter(Boolean);
}

// Yes and Maybe only: add the day to a calendar (event fields only, no guest data) and open the keepsake poster. The .ics is a plain download; the poster is composed only when its button is pressed.
function keepsakeRow(r) {
  const file = new File([buildIcs()], ICS_FILE_NAME, { type: 'text/calendar' });
  const icsUrl = URL.createObjectURL(file);
  const ics = h('a', { class: 'btn ghost', href: icsUrl, download: ICS_FILE_NAME, text: 'Add to calendar' });
  // Swap in a fresh URL a moment after each download starts, so the old one is freed and a second tap still works.
  ics.addEventListener('click', () => { const used = ics.href; setTimeout(() => { URL.revokeObjectURL(used); ics.href = URL.createObjectURL(file); }, 1000); });
  const google = h('a', { class: 'btn ghost', href: googleCalendarUrl(), target: '_blank', rel: 'noopener noreferrer', text: 'Google Calendar' });
  const poster = h('button', { class: 'btn', type: 'button', text: 'View your poster' });
  const err = h('p', { class: 'err', role: 'alert' });
  poster.addEventListener('click', async () => {
    if (poster.disabled) return;
    poster.disabled = true; err.textContent = ''; poster.textContent = 'Making your poster…';
    try { await (await import('./posterview.js')).openPoster(r, poster); } catch { err.textContent = "The poster couldn't be made. Try again."; }
    poster.disabled = false; poster.textContent = 'View your poster';
  });
  return h('div', { class: 'keep' }, h('div', { class: 'row' }, poster), h('div', { class: 'row' }, ics, google), err);
}

// ---- fast lane: the whole RSVP as one <form> (can you make it, then the fields that answer asks for, one Send) --------------------------------------
// Every field is here, so a guest who never plays the game can still give the host everything. Yes and Not sure yet ask for everything; Can't make it asks for name and email.
// onSend({ side: 'home'|'away', values }) runs with validated flat values only (fields.js), and never while a save is in flight or after one succeeded (shared state, submit.js).
// init = earlier answers (values by key); errors = server errors by field key, shown inline when the form is reopened to fix them.
export function fastLaneForm({ onSend, capped = true, init = {}, errors = null }) {
  if (closedText()) {
    const form = h('form', { id: 'fast-form', name: 'rsvp', novalidate: true, onsubmit: (ev) => ev.preventDefault() }, closedNote());
    return { form };
  }
  const notice = privacyNotice({ capped, side: init.attending === 'no' ? 'away' : 'home' });
  const f = fieldsForm({ keys: FAST_KEYS, id: 'fl', init, onValid: (values) => { if (getState() === 'sending' || getState() === 'sent') return; onSend({ side: values.attending === 'no' ? 'away' : 'home', values }); },
    onChange: (v) => notice.setSide(v.attending === 'no' ? 'away' : 'home') });
  const form = f.form; form.id = 'fast-form'; form.name = 'rsvp';
  const btn = h('button', { class: 'btn', type: 'submit', text: 'Continue' });
  // The card replaces this form's nodes when it closes; the first state change after that releases the subscription (there is no close event to hook).
  let shown = false;
  const sync = (st) => { if (form.isConnected) shown = true; else if (shown) { off(); return; } btn.disabled = st === 'sending' || st === 'sent'; };
  const off = onState(sync); sync(getState());
  form.prepend(notice); form.append(h('div', { class: 'row' }, btn));
  if (errors) f.setErrors(errors);
  return { form, focusFirst: f.focusFirst };
}

// Mute button icon (speaker, with waves or a cross). Decorative: aria-hidden; the button carries the label.
export const svgIcon = (muted) => {
  const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  const path = (d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', d.endsWith('z') ? 'currentColor' : 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round'); s.append(p); };
  path('M3 9v6h4l5 4V5L7 9H3z');
  if (muted) { path('M16 9l5 6'); path('M21 9l-5 6'); [...s.querySelectorAll('path')].slice(-2).forEach((q) => { q.style.stroke = 'var(--text-muted)'; }); } else { path('M16 8.5a5 5 0 0 1 0 7'); path('M18.5 6a8.5 8.5 0 0 1 0 12'); }
  return s;
};
