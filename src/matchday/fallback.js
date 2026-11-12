// matchday-rsvp: the no-WebGL / load-failure / lost-context page. A plain HTML page: event details, then the fast-lane form, then the code card (or, for a name-only decline, the decline card). No three.js (imports config.js, ui.js, codecard.js, submit.js, teardown.js only).
// Sets window.__fallback and window.__ready so capture/tests do not hang, and keeps the contract stubs (__views, __setView, __dbg) callable.
// It saves through the same submit.js as the game (one page-wide state), so a reply the game already saved shows its confirmation here, never a fresh form.
import { EVENT, DATE_LINE } from './config.js';
import { h, fastLaneForm, confirmCard, statusLine } from './ui.js';
import { codeCard, declineCard } from './codecard.js';
import { mapServerErrors, withAttending, nameOnly } from './fields.js';
import { getSent, closedText } from './submit.js';
import { runTeardown } from './teardown.js';

// initial = { side, values } the game already collected (a lost context), or null: the form then opens pre-filled.
export function showFallback(reason, initial = null) {
  if (window.__fallback) return;
  window.__fallback = true;
  runTeardown();   // the game (if it got that far) stops its loop, listeners and timers, so Space/Enter/arrows belong to this page again
  document.querySelectorAll('canvas').forEach((c) => c.remove());   // a half-built scene may have appended its canvas before failing
  const ui = document.getElementById('ui'); ui.replaceChildren();

  const card = h('section', { id: 'card', class: 'glass fb', role: 'group', 'aria-labelledby': 'fb-h', tabindex: '-1' });
  let code = null, answers = initial && Object.keys(initial.values ?? {}).length ? { side: initial.side ?? 'home', values: { ...initial.values } } : null;   // answers: { side, values } once the form has been filled (or handed over)
  const focusHead = () => card.querySelector('h1,h2')?.focus({ preventScroll: true });
  const showConfirm = (r) => { code?.dispose(); card.replaceChildren(...confirmCard(r, { id: 'fb-h', level: 'h1' })); focusHead(); };
  const showClosed = () => { code?.dispose(); card.replaceChildren(h('p', { class: 'kicker', text: DATE_LINE }), h('h1', { id: 'fb-h', class: 'display', tabindex: '-1', text: "You've been called up" }), h('p', { class: 'closed', role: 'status', text: closedText() ?? '' })); focusHead(); };
  const showCode = () => {
    if (closedText()) { showClosed(); return; }
    code?.dispose();
    const { side, values } = answers;
    const to = { onSaved: showConfirm, onClosed: showClosed, onFix: (errs) => showForm(mapServerErrors(errs, true)) };
    code = nameOnly(withAttending(side, values)) ? declineCard({ getValues: () => withAttending(side, values), id: 'fb-cc', level: 'h1', ...to })   // "Have you replied before?" = No: name-only, no code
      : codeCard({ side, getValues: () => withAttending(side, values), setEmail: (e) => { values.email = e; }, id: 'fb-cc', level: 'h1', ...to });
    card.replaceChildren(...code.nodes); card.querySelector('h1').id = 'fb-h'; focusHead(); code.start();
  };
  const showForm = (errors = null) => {
    const { form } = fastLaneForm({ capped: false, init: answers ? withAttending(answers.side, answers.values) : {}, errors, onSend: ({ side, values }) => { answers = { side, values: { ...values } }; showCode(); } });
    const details = h('dl', {}, h('dt', { text: 'When' }), h('dd', { text: EVENT.date }), h('dt', { text: 'Where' }), h('dd', { text: EVENT.venue }), h('dt', { text: 'Host' }), h('dd', { text: EVENT.host }));
    card.replaceChildren(h('p', { class: 'kicker', text: "You've been called up" }), h('h1', { id: 'fb-h', class: 'display', tabindex: '-1', text: EVENT.title }), h('p', { text: EVENT.tagline }), details, reason === 'load-failed' ? statusLine('info', "The game didn't load. You can reply here instead.") : null, h('p', { class: 'kicker', text: 'Your reply' }), form);
    focusHead();
  };
  if (getSent()) showConfirm(getSent());
  else if (closedText()) showClosed();
  else showForm();
  ui.append(h('main', { id: 'fb' }, card)); focusHead();   // the card is attached only now, so the first focus (form, closed message or confirmation) has to wait for it

  window.__views ??= []; window.__setView ??= () => {}; window.__dbg ??= { simStep() {}, agents: () => [] };
  window.__ready = true;
  document.getElementById('boot')?.remove();
  document.body.dataset.fallback = reason;
}
