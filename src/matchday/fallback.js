// matchday-rsvp: the no-WebGL / load-failure / lost-context page. A plain HTML page: event details, then the fast-lane form, then the code card (or, for a name-only decline, the decline card). No three.js (imports config.js, ui.js, ornament.js, codecard.js, submit.js, teardown.js only).
// Sets window.__fallback and window.__ready so capture/tests do not hang, and keeps the contract stubs (__views, __setView, __dbg) callable.
// It saves through the same submit.js as the game (one page-wide state), so a reply the game already saved shows its confirmation here, never a fresh form.
import { EVENT, DATE_LINE, setView } from './config.js';
import { h, fastLaneForm, confirmCard, statusLine } from './ui.js';
import { codeCard, declineCard } from './codecard.js';
import { mapServerErrors, withAttending, nameOnly } from './fields.js';
import { getSent, closedText } from './submit.js';
import { runTeardown } from './teardown.js';
import { corners, roundel, nameHeading, dateLockup, venueLine } from './ornament.js';

// initial = { side, values } the game already collected (a lost context), or null: the form then opens pre-filled.
export function showFallback(reason, initial = null) {
  if (window.__fallback) return;
  window.__fallback = true;
  runTeardown();   // the game (if it got that far) stops its loop, listeners and timers, so Space/Enter/arrows belong to this page again
  document.querySelectorAll('canvas').forEach((c) => c.remove());   // a half-built scene may have appended its canvas before failing
  const ui = document.getElementById('ui'); ui.replaceChildren();

  // L2 "Ivory and crimson": the card is the framed sheet. The corner arcs live on the card and the content in `body`, so a state change swaps the content without redrawing the frame.
  const body = h('div', { class: 'fbody' });
  const card = h('section', { id: 'card', class: 'glass fb l2 sheet', role: 'group', 'aria-labelledby': 'fb-h', tabindex: '-1' }, ...corners(), body);
  const render = (mode, ...nodes) => { card.dataset.mode = mode; body.replaceChildren(...(mode === 'form' ? [] : [roundel(true)]), ...nodes); };   // the form brings its own header (with the roundel)
  let code = null, answers = initial && Object.keys(initial.values ?? {}).length ? { side: initial.side ?? 'home', values: { ...initial.values } } : null;   // answers: { side, values } once the form has been filled (or handed over)
  const focusHead = () => card.querySelector('h1,h2')?.focus({ preventScroll: true });
  const showConfirm = (r) => { code?.dispose(); render('confirm', ...confirmCard(r, { id: 'fb-h', level: 'h1' })); focusHead(); };
  const showClosed = () => { code?.dispose(); render('closed', h('p', { class: 'kicker', text: DATE_LINE }), h('h1', { id: 'fb-h', class: 'display', tabindex: '-1', text: "You've been called up" }), h('p', { class: 'closed', role: 'status', text: closedText() ?? '' })); focusHead(); };
  const showCode = () => {
    if (closedText()) { showClosed(); return; }
    code?.dispose();
    const { side, values } = answers;
    const to = { onSaved: showConfirm, onClosed: showClosed, onFix: (errs) => showForm(mapServerErrors(errs, true)) };
    code = nameOnly(withAttending(side, values)) ? declineCard({ getValues: () => withAttending(side, values), id: 'fb-cc', level: 'h1', ...to })   // "Have you replied before?" = No: name-only, no code
      : codeCard({ side, getValues: () => withAttending(side, values), setEmail: (e) => { values.email = e; }, id: 'fb-cc', level: 'h1', ...to });
    render('code', ...code.nodes); card.querySelector('h1').id = 'fb-h'; focusHead(); code.start();
  };
  const showForm = (errors = null) => {
    const { form, setErrors } = fastLaneForm({ capped: false, init: answers ? withAttending(answers.side, answers.values) : {}, errors, onSend: ({ side, values }) => { answers = { side, values: { ...values } }; showCode(); } });
    // The form page's header (plate L2-form-yes.png): roundel, kicker, the one h1, tagline, date lockup and venue; "Host: Makes" is gone (the name already says it).
    // The ...(cond ? [x] : []) spread keeps a literal "null" out of the page text when the game loaded fine.
    render('form', h('div', { class: 'hd' }, roundel(true), h('p', { class: 'caps kick k1', text: "You've been called up" }), nameHeading({ id: 'fb-h', tabindex: '-1' }, true), h('p', { class: 'tg', text: EVENT.tagline }), dateLockup(true), venueLine(),
      ...(reason === 'load-failed' ? [statusLine('info', "The game didn't load. You can reply here instead.")] : []), h('div', { class: 'rule2', 'aria-hidden': 'true' }), h('p', { class: 'caps kick k2', text: 'Your reply' })), form);
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
