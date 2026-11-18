// matchday-rsvp: the no-WebGL / load-failure / lost-context page. A plain HTML page: event details, then the fast-lane form, then the code card (or, for a name-only decline, the decline card). No three.js (imports config.js, ui.js, ornament.js, codecard.js, submit.js, teardown.js only).
// Sets window.__fallback and window.__ready so capture/tests do not hang, and keeps the contract stubs (__views, __setView, __dbg) callable.
// It saves through the same submit.js as the game (one page-wide state), so a reply the game already saved shows its confirmation here, never a fresh form.
import { EVENT, DATE_LINE, setView } from './config.js';
import { h, fastLaneForm, confirmCard, statusLine } from './ui.js';
import { codeCard, declineCard } from './codecard.js';
import { mapServerErrors, withAttending, nameOnly } from './fields.js';
import { getSent, closedText } from './submit.js';
import { runTeardown } from './teardown.js';
import { corners, roundel, nameHeading } from './ornament.js';

// "Mon 21 Dec 2026 ◆ Venue TBA": the date shortened from EVENT.date (unchanged if it ever stops fitting the "Monday 21 December 2026" shape) and the venue; CSS keeps each piece on one line.
const dateVenue = () => h('p', { class: 'dv' }, h('span', {}, EVENT.date.trim().replace(/^(\S{3})\S*\s+(\d{1,2})\s+(\S{3})\S*\s+(\d{4})$/, '$1 $2 $3 $4'), h('i', { class: 'd', 'aria-hidden': 'true' })), ' ', h('span', { text: EVENT.venue }));

// initial = { side, values } the game already collected (a lost context), or null: the form then opens pre-filled.
export function showFallback(reason, initial = null) {
  if (window.__fallback) return;
  window.__fallback = true;
  runTeardown();   // the game (if it got that far) stops its loop, listeners and timers, so Space/Enter/arrows belong to this page again
  document.querySelectorAll('canvas').forEach((c) => c.remove());   // a half-built scene may have appended its canvas before failing
  const ui = document.getElementById('ui'); ui.replaceChildren();

  // L2 "Red Room": the card is the framed sheet. The corner arcs live on the card and the content in `body`, so a state change swaps the content without redrawing the frame.
  const body = h('div', { class: 'fbody' });
  const card = h('section', { id: 'card', class: 'glass fb l2 sheet', role: 'group', 'aria-labelledby': 'fb-h', tabindex: '-1' }, ...corners(), body);
  const render = (mode, ...nodes) => { card.dataset.mode = mode; body.replaceChildren(...(mode === 'form' || mode === 'signed' ? [] : [roundel(true)]), ...nodes); };   // the form brings its own header (with the roundel); a Yes / Not sure yet confirmation carries the shirt stub instead of a crest
  let code = null, answers = initial && Object.keys(initial.values ?? {}).length ? { side: initial.side ?? 'home', values: { ...initial.values } } : null;   // answers: { side, values } once the form has been filled (or handed over)
  const focusHead = () => card.querySelector('h1,h2')?.focus({ preventScroll: true });
  const showConfirm = (r) => { code?.dispose(); render(r.attending === 'no' ? 'confirm' : 'signed', ...confirmCard(r, { id: 'fb-h', level: 'h1', redRoom: true })); focusHead(); };
  const showClosed = () => { code?.dispose(); render('closed', h('p', { class: 'kicker', text: DATE_LINE }), h('h1', { id: 'fb-h', class: 'display', tabindex: '-1', text: "You've been called up" }), h('p', { class: 'closed', role: 'status', text: closedText() ?? '' })); focusHead(); };
  const showCode = () => {
    if (closedText()) { showClosed(); return; }
    code?.dispose();
    const { side, values } = answers;
    const to = { onSaved: showConfirm, onClosed: showClosed, onFix: (errs) => showForm(mapServerErrors(errs, true)) };
    code = nameOnly(withAttending(side, values)) ? declineCard({ getValues: () => withAttending(side, values), id: 'fb-cc', level: 'h1', ...to })   // "Have you replied before?" = No: name-only, no code
      : codeCard({ side, getValues: () => withAttending(side, values), setEmail: (e) => { values.email = e; }, id: 'fb-cc', level: 'h1', redRoom: true, ...to });
    render('code', ...code.nodes); card.querySelector('h1').id = 'fb-h'; focusHead(); code.start();
  };
  const showForm = (errors = null) => {
    const { form, setErrors } = fastLaneForm({ capped: false, redRoom: true, init: answers ? withAttending(answers.side, answers.values) : {}, errors, onSend: ({ side, values }) => { answers = { side, values: { ...values } }; showCode(); } });
    // The form page's header (Red Room): the crest, "Makes turns 30" (the one h1) and one date-and-venue line, then the "Your reply" kicker and the form. The kicker "You've been called up" and the tagline stay on the invitation.
    // The ...(cond ? [x] : []) spread keeps a literal "null" out of the page text when the game loaded fine.
    render('form', h('div', { class: 'hd' }, roundel(true), nameHeading({ id: 'fb-h', tabindex: '-1' }, true), dateVenue(),
      ...(reason === 'load-failed' ? [statusLine('info', "The game didn't load. You can reply here instead.")] : [])), h('p', { class: 'caps kick k2', text: 'Your reply' }), form);
    if (!(errors && setErrors?.(errors))) focusHead();   // returning to fix answers: the first invalid field; no field errors (kill switch, rate limit): the heading
  };
  if (getSent()) showConfirm(getSent());
  else if (closedText()) showClosed();
  else showForm();
  ui.append(h('main', { id: 'fb' }, card)); setView('light'); focusHead();   // the card is attached only now, so the first focus (form, closed message or confirmation) has to wait for it

  window.__views ??= []; window.__setView ??= () => {}; window.__dbg ??= { simStep() {}, agents: () => [] };
  window.__ready = true;
  document.getElementById('boot')?.remove();
  document.body.dataset.fallback = reason;
}
