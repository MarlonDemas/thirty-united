// matchday-rsvp: the "VAR check" card at the END of the journey: ask for the emailed 6-digit code, then verify it and save the reply. Three-free; used by the game (hud card) and the plain page.
// The code is requested ONCE when the card opens (start()), never at the email station and never retried for the guest: every later request is a button press.
// Codes last 10 minutes; the server allows 1 per 60 s per email and 5 per day. A code belongs to the exact email it was requested for; changing the email asks for a new one.
// Returns { nodes, start(), dispose() }. The owner places `nodes` in a card and reacts to onSaved / onFix / onClosed. Guest text is only ever written with textContent.
import { h, statusLine, SEND_FAILED } from './ui.js';
import { FIELD } from './fields.js';
import { haptic, HAPTICS } from '../lib/haptics.ts';
import { requestCode, verifyAndSave, submitDecline, hasCodeFor, getSent, getState, onState } from './submit.js';

const CODE_LEN = 6;
const tries = (n) => `${n} ${n === 1 ? 'try' : 'tries'} left`;

export function codeCard({ side, getValues, setEmail, onSaved, onFix, onClosed, id = 'cc', level = 'h2' }) {
  let busy = false, needNew = false, dailyCap = false, coolUntil = 0, timer = 0, disposed = false, started = false;
  const email = () => getValues().email;
  const emailText = h('b', { class: 'mono' });
  const intro = h('p', {}, 'Your 6-digit code goes to ', emailText, '. It lasts 10 minutes.');
  const input = h('input', { id: id + '-code', name: 'one-time-code', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '12', pattern: '[0-9]*', placeholder: '000000', 'aria-describedby': id + '-st', class: 'code' });
  const label = h('label', { for: id + '-code', text: 'Your code' });
  const slot = h('div', { id: id + '-st', class: 'slot' });
  const confirm = h('button', { class: 'btn', type: 'submit', text: 'Confirm' });
  const resend = h('button', { class: 'btn ghost', type: 'button', text: 'Send a new code' });
  const change = h('button', { class: 'linkbtn', type: 'button', text: 'Wrong email?' });
  const fix = h('button', { class: 'btn ghost', type: 'button', hidden: true, text: 'Check my answers' });
  const emailIn = h('input', { id: id + '-email', name: 'email', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: '254', 'aria-describedby': id + '-ee' });
  const emailErr = h('p', { class: 'err', id: id + '-ee', role: 'alert' });
  const emailGo = h('button', { class: 'btn ghost', type: 'submit', text: 'Send a code to this email' });
  const emailForm = h('form', { class: 'ce', novalidate: true, hidden: true }, h('label', { for: id + '-email', text: 'Email' }), emailIn, emailErr, h('div', { class: 'row' }, emailGo));
  const form = h('form', { novalidate: true, autocomplete: 'off' }, label, input, slot, h('div', { class: 'row' }, confirm, resend), h('div', { class: 'row' }, fix, change));
  const heading = h(level, { id: id + '-h', tabindex: '-1', text: 'Check your inbox' });
  const nodes = [h('p', { class: 'kicker', id: id + '-k', text: 'VAR check' }), heading, intro, form, emailForm];

  const say = (tone, text) => slot.replaceChildren(statusLine(tone, text));
  const sync = () => {
    const sending = getState() === 'sending', left = Math.max(0, Math.ceil((coolUntil - Date.now()) / 1000));
    input.readOnly = busy || sending; confirm.disabled = busy || sending || needNew;
    change.disabled = busy || sending; emailGo.disabled = busy || sending;
    resend.disabled = busy || sending || dailyCap || left > 0;
    resend.textContent = left > 0 ? `Send a new code in ${left}s` : 'Send a new code';
    if (left === 0 && timer) { clearInterval(timer); timer = 0; }
  };
  const cool = (ms) => { coolUntil = Date.now() + Math.max(0, ms); if (!timer) timer = setInterval(sync, 1000); sync(); };
  const showEmail = () => { emailText.textContent = email(); };
  showEmail();

  async function request() {
    busy = true; needNew = false; sync(); say('info', 'Sending your code…');
    const r = await requestCode(email());
    if (disposed) return;
    busy = false;
    if (r.status === 'closed') { onClosed(); return; }
    if (r.status === 'sent') { dailyCap = false; say('ok', `Code sent to ${email()}. It lasts 10 minutes.`); cool(60000); input.focus({ preventScroll: true }); }
    else if (r.status === 'rate_limited' && r.retryAfterMs != null) { say('warn', 'A code went out a moment ago. Check your inbox, or ask for a new one when the timer ends.'); cool(r.retryAfterMs); }
    else if (r.status === 'rate_limited') { dailyCap = true; say('warn', "You've reached today's limit of codes for this email. Use the latest code from your inbox, or try again tomorrow."); }
    else if (r.status === 'invalid_email') { say('err', "That email address doesn't look right."); openEmail(); }
    else if (r.status === 'service_unavailable') say('err', "Codes aren't going out right now. Try again in a minute.");
    else say('err', "I couldn't send the code. Check your connection and try again.");
    sync();
  }
  function openEmail() { emailForm.hidden = false; emailIn.value = email(); emailIn.focus({ preventScroll: true }); }

  async function check() {
    const code = input.value.replace(/\D/g, '');
    if (code.length !== CODE_LEN) { say('err', 'Enter the 6-digit code.'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    input.removeAttribute('aria-invalid');
    busy = true; fix.hidden = true; sync(); say('info', 'Checking your code…');
    const r = await verifyAndSave(side, getValues(), code);
    if (disposed) return;
    busy = false;
    switch (r.status) {
      case 'saved': case 'updated': haptic(HAPTICS.number); onSaved(getSent() ?? r); return;   // the code was right and the reply is saved: the number lands
      case 'closed': onClosed(); return;
      case 'invalid_code': if (r.attemptsLeft == null) say('warn', "That code didn't match."); else if (r.attemptsLeft > 0) say('warn', `That code didn't match. ${tries(r.attemptsLeft)}`); else { needNew = true; say('err', 'Too many wrong tries. Send a new code.'); } input.value = ''; input.setAttribute('aria-invalid', 'true'); break;
      case 'code_expired': needNew = true; say('err', 'That code has expired. Send a new one.'); break;
      case 'too_many_attempts': needNew = true; say('err', 'Too many wrong tries. Send a new code.'); break;
      case 'no_code':   // the server has no live code for this email: if we never saw one requested, ask for it now; otherwise it was used or has lapsed
        if (!hasCodeFor(email())) { await request(); return; }
        needNew = true; say('err', "There's no code for this email yet. Send one."); break;
      case 'invalid_payload': case 'invalid_answers': say('err', 'A few answers need another look.'); fix.hidden = false; fix.dataset.errors = JSON.stringify(r.errors ?? {}); break;
      case 'service_unavailable': say('err', "Saving isn't working right now. Try again in a minute."); break;
      default: say('err', SEND_FAILED);
    }
    sync(); if (!fix.hidden) fix.focus({ preventScroll: true }); else if (needNew) resend.focus({ preventScroll: true }); else input.focus({ preventScroll: true });
  }

  input.addEventListener('input', () => { const d = input.value.replace(/\D/g, '').slice(0, CODE_LEN); if (d !== input.value) input.value = d; input.removeAttribute('aria-invalid'); });
  form.addEventListener('submit', (ev) => { ev.preventDefault(); if (!busy && getState() !== 'sending') check(); });
  resend.addEventListener('click', () => { if (!busy) request(); });
  change.addEventListener('click', () => { if (!busy) openEmail(); });
  fix.addEventListener('click', () => { let errors = {}; try { errors = JSON.parse(fix.dataset.errors || '{}'); } catch { /* the owner shows the form without field errors */ } onFix(errors); });
  emailForm.addEventListener('submit', (ev) => {
    ev.preventDefault(); if (busy) return;
    const r = FIELD.email.validate(emailIn.value);
    if (!r.ok) { emailErr.textContent = r.error; emailIn.setAttribute('aria-invalid', 'true'); emailIn.focus(); return; }
    emailErr.textContent = ''; emailIn.removeAttribute('aria-invalid');
    setEmail(r.value); showEmail(); emailForm.hidden = true; input.value = ''; request();   // a new email always needs a new code
  });
  const off = onState(sync);

  return {
    nodes,
    // Opens the card's conversation: asks for a code unless this exact email already has one in play (a card reopened after the answers were fixed).
    start() {
      if (started) return; started = true;
      if (hasCodeFor(email())) { say('info', 'Enter the code from your inbox.'); sync(); return; }
      request();
    },
    dispose() { disposed = true; off(); if (timer) clearInterval(timer); },
  };
}

// The name-only decline's send step (no email, no code): saves on open, and a failure stays here with a plain line and "Try again" (never a silent retry).
// Same shape as codeCard: { nodes, start(), dispose() }; the owner reacts to onSaved / onFix / onClosed. The guest's answers only travel through submit.js.
export function declineCard({ getValues, onSaved, onFix, onClosed, id = 'dc', level = 'h2' }) {
  let busy = false, disposed = false, started = false, errors = {};
  const slot = h('div', { id: id + '-st', class: 'slot' });
  const retry = h('button', { class: 'btn', type: 'button', hidden: true, text: 'Try again' });
  const fix = h('button', { class: 'btn ghost', type: 'button', hidden: true, text: 'Check my answers' });
  const nodes = [h('p', { class: 'kicker', id: id + '-k', text: 'Your reply' }), h(level, { id: id + '-h', tabindex: '-1', text: 'Sending your reply' }), slot, h('div', { class: 'row' }, retry, fix)];
  const say = (tone, text) => slot.replaceChildren(statusLine(tone, text));

  async function send() {
    busy = true; retry.hidden = true; fix.hidden = true; say('info', 'Sending your reply…');
    const r = await submitDecline(getValues());
    if (disposed) return;
    busy = false;
    switch (r.status) {
      case 'saved': haptic(HAPTICS.number); onSaved(getSent() ?? r); return;
      case 'closed': onClosed(); return;
      case 'invalid_payload': case 'invalid_answers': errors = r.errors ?? {}; say('err', 'A few answers need another look.'); fix.hidden = false; fix.focus({ preventScroll: true }); return;
      case 'rate_limited': say('warn', 'A lot of replies are coming in right now. Please try again in a little while.'); break;
      case 'service_unavailable': say('err', "Replying with just your name isn't open right now. Choose Check my answers, pick Yes, use my email, and I'll send you a code instead."); fix.hidden = false; break;   // the way out: the form, where the answer can switch
      default: say('err', SEND_FAILED);
    }
    retry.hidden = false; retry.focus({ preventScroll: true });
  }
  retry.addEventListener('click', () => { if (!busy) send(); });
  fix.addEventListener('click', () => onFix(errors));
  return { nodes, start() { if (started) return; started = true; send(); }, dispose() { disposed = true; } };
}
