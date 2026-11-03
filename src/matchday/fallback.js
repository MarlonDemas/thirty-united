// matchday-rsvp: the no-WebGL / load-failure / lost-context page. A plain HTML page: event details, then the fast-lane form. No three.js (imports config.js, ui.js, submit.js, teardown.js only).
// Sets window.__fallback and window.__ready so capture/tests do not hang, and keeps the contract stubs (__views, __setView, __dbg) callable.
// It sends through the same submit.js as the game (one page-wide state, one `rsvp:submit` on success), so an RSVP the game already sent shows its confirmation here, never a fresh form.
import { EVENT } from './config.js';
import { h, fastLaneForm, confirmCard, crestMark, summaryRows, SEND_FAILED } from './ui.js';
import { getState, getSent, getFailed, getValues, onState, submitRsvp } from './submit.js';
import { runTeardown } from './teardown.js';

export function showFallback(reason) {
  if (window.__fallback) return;
  window.__fallback = true;
  runTeardown();   // the game (if it got that far) stops its loop, listeners and timers, so Space/Enter/arrows belong to this page again
  document.querySelectorAll('canvas').forEach((c) => c.remove());   // a half-built scene may have appended its canvas before failing
  const ui = document.getElementById('ui'); ui.replaceChildren();

  const card = h('section', { id: 'card', class: 'glass fb', role: 'group', 'aria-labelledby': 'fb-h', tabindex: '-1' });
  const showConfirm = () => {
    const p = getSent(); if (!p) return;
    card.replaceChildren(...confirmCard(p.side, p, { id: 'fb-h', display: true }));
    card.querySelector('h2').focus({ preventScroll: true });
  };
  // A send that failed before the switch (e.g. in the game): show those answers read-only with Send again, which resends the exact payload under the same key. A fresh form would let changed answers go out under a new key.
  const showRetry = (p) => {
    const btn = h('button', { class: 'btn', type: 'button', text: 'Send again', onclick: () => { submitRsvp(p.side, p); } }), err = h('p', { class: 'err', role: 'alert', text: SEND_FAILED });
    card.replaceChildren(h('p', { class: 'kicker', text: p.side === 'away' ? 'AWAY' : 'HOME' }), h('h2', { id: 'fb-h', class: 'display', tabindex: '-1', text: 'Reply not sent' }), err, h('dl', {}, summaryRows(p)), h('div', { class: 'row' }, btn));
    onState((st) => { btn.disabled = st === 'sending' || st === 'sent'; err.hidden = st !== 'failed'; });
    card.querySelector('h2').focus({ preventScroll: true });
  };
  if (getState() === 'sent') showConfirm();
  else if (getFailed()) { showRetry(getFailed()); onState((st) => { if (st === 'sent') showConfirm(); }); }
  // A send still in flight (started in the game before the switch): no editable form, or a failure would let changed answers go out under a new key. Settle into the confirmation or the read-only retry; the first subscription removes itself.
  else if (getState() === 'sending') {
    card.replaceChildren(h('h2', { id: 'fb-h', class: 'display', tabindex: '-1', text: 'Sending your reply…' }), h('p', { class: 'kicker', role: 'status', 'aria-live': 'polite', text: 'Please wait a moment.' }));
    const off = onState((st) => { if (st === 'sent') { off(); showConfirm(); } else if (st === 'failed' && getFailed()) { off(); showRetry(getFailed()); onState((s) => { if (s === 'sent') showConfirm(); }); } });
  }
  else {
    const title = h('h2', { id: 'fb-h', class: 'display', tabindex: '-1', text: EVENT.title });
    const details = h('dl', {}, h('dt', { text: 'When' }), h('dd', { text: `${EVENT.date}, ${EVENT.kickoff}` }), h('dt', { text: 'Where' }), h('dd', { text: EVENT.venue }), h('dt', { text: 'Host' }), h('dd', { text: EVENT.host }));
    const { form } = fastLaneForm({ capped: false, onSend: ({ side, values }) => { submitRsvp(side, values); } });
    card.append(h('div', { class: 'fb-head' }, crestMark(), h('p', { class: 'kicker', text: 'You are invited' })), title, details, h('p', { class: 'kicker', text: 'Your reply' }), form);
    onState((st) => { if (st === 'sent') showConfirm(); });   // also covers a send the game started just before the context was lost
  }
  ui.append(h('main', { id: 'fb' }, card));

  if (import.meta.env.DEV) Object.defineProperty(window, '__rsvp', { get: getValues, configurable: true });

  window.__views ??= []; window.__setView ??= () => {}; window.__dbg ??= { simStep() {}, agents: () => [] };
  window.__ready = true;
  document.getElementById('boot')?.remove();
  document.body.dataset.fallback = reason;
}
