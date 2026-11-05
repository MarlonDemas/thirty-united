// matchday-rsvp: the ONE transport for the game, the fast lane and the no-WebGL page. Three-free. Two Convex actions, called with ConvexHttpClient (fetch only):
//   api.otp.requestCode { email, inviteKey }                       -> { status: 'sent' | 'rate_limited' | 'invalid_email' | 'invalid_link' | 'service_unavailable' }
//   api.rsvp.verifyAndSave { email, code, payload, inviteKey }     -> { status: 'saved' | 'updated' | 'invalid_code' | 'code_expired' | 'too_many_attempts' | 'no_code' | 'invalid_payload' | ... }
//   api.declines.submitDecline { firstName, surname, reason?, noticeVersion, inviteKey } -> { status: 'saved' | 'rate_limited' | 'invalid_payload' | 'invalid_link' | 'service_unavailable' }   (a name-only decline: no email, no code)
// Page-wide state of the save:  idle -> sending -> sent | failed | idle (a refused code goes back to idle)   and   closed (no invite key, or the server said invalid_link).
//   - The confirmation renders only from a saved/updated response (getSent()); nothing is ever "accepted locally".
//   - Each call is raced against a 10 s timer (ConvexHttpClient has no AbortSignal). A timed-out or thrown call is { status: 'failed' }; it is never retried for you.
//     A save that timed out may still have landed: sending the same code again returns the stored row, so a retry is safe.
//   - A code belongs to the exact normalised email it was requested for (hasCodeFor); a different email needs a new request.
//   - The invite key is read once from ?k= into memory. No storage. Raw Convex errors and payloads are never logged (they echo guest data).
//   - Production is also CLOSED while EVENT.privacy has placeholders (privacyProblems) or VITE_CONVEX_URL is missing.
import { EVENT, MISSING_KEY_MESSAGE } from './config.js';
import { buildPayload, buildDecline, normalizeEmail } from './fields.js';

const TIMEOUT_MS = 10000;
let state = 'idle', sent = null, inflight = null, codeFor = null, linkBad = false, closed = null, clientP = null;
const INVITE_KEY = (() => { try { return new URLSearchParams(location.search).get('k') || ''; } catch { return ''; } })();
const subs = new Set();
const setState = (s) => { state = s; for (const fn of [...subs]) { try { fn(s); } catch { /* a listener must never break the send */ } } };

export const getState = () => state;
export const onState = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const CLOSED_TEXT = 'RSVPs open soon';

// Allowlist check for EVENT.privacy: returns the keys that are not a real value (missing, non-string, blank, [bracket] placeholder, TBC/TODO, contact not an email or https URL, policyUrl not a real https URL). Pure.
const PRIVACY_KEYS = ['responsibleParty', 'contact', 'retention', 'policyUrl'], NOT_REAL = /^(tbc|tbd|todo|n\/?a|-+)$/i, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const httpsUrl = (t) => { try { const u = new URL(t); return u.protocol === 'https:' && !!u.hostname; } catch { return false; } };
export function privacyProblems(P) {
  return PRIVACY_KEYS.filter((k) => {
    const v = P?.[k]; if (typeof v !== 'string') return true;
    const t = v.trim(); if (!t || /[[\]]/.test(t) || NOT_REAL.test(t)) return true;
    return k === 'policyUrl' ? !httpsUrl(t) : k === 'contact' ? !(EMAIL.test(t) || httpsUrl(t)) : false;
  });
}
// Why the form must be closed, as [{ msg }] (empty = open). Pure (dev and the URL are passed in) so node can test it. Dev is never closed for privacy; a missing Convex URL closes it everywhere.
export function closedReasons({ privacy, convexUrl, dev }) {
  const r = [];
  if (!convexUrl) r.push({ msg: '[matchday] RSVP form closed: VITE_CONVEX_URL is not set.' });
  else if (!/^https:\/\/[a-z0-9.-]+$/i.test(convexUrl) && !(dev && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(convexUrl))) r.push({ msg: '[matchday] RSVP form closed: VITE_CONVEX_URL must be an https:// origin (http://127.0.0.1 in dev).' });
  const bad = dev ? [] : privacyProblems(privacy);
  if (bad.length) r.push({ msg: '[matchday] RSVP form closed: EVENT.privacy has missing, placeholder or invalid value(s) in: ' + bad.join(', ') + ' (policyUrl must be a real https:// URL, contact an email or https URL).' });
  return r;
}
const convexUrl = () => (import.meta.env.VITE_CONVEX_URL || '').replace(/\/+$/, '');
// Production config problem (placeholders, no backend). Computed once and logged once.
export function isClosed() {
  if (closed === null) { const r = closedReasons({ privacy: EVENT.privacy, convexUrl: convexUrl(), dev: !!import.meta.env.DEV }); r.forEach((x) => console.error(x.msg)); closed = r.length > 0; }
  return closed;
}
// The invite link: no ?k=, or a call came back invalid_link. Both show the same message.
const linkProblem = () => !INVITE_KEY || linkBad;
// The text a closed page shows instead of the questions, or null while the form is open.
export const closedText = () => (linkProblem() ? MISSING_KEY_MESSAGE : isClosed() ? CLOSED_TEXT : null);
const closeLink = () => { linkBad = true; setState('closed'); };

// The saved reply ({ status, firstName, attending, ticketNo, answers: { surname, preferredName, plusOne, plusOneName } }), frozen, or null until a saved/updated response arrived.
export const getSent = () => sent;
export const hasCodeFor = (email) => codeFor !== null && codeFor === normalizeEmail(email || '');
// Dev only: the staged views reset a page between runs. Never reachable in a production build.
export function resetForDev() { if (import.meta.env.DEV) { state = linkBad ? 'closed' : 'idle'; sent = null; inflight = null; codeFor = null; for (const fn of [...subs]) fn(state); } }

// The client and the generated api are loaded on the first call, so the intro never pays for them and never constructs a client it does not use.
function client() {
  clientP ??= Promise.all([import('convex/browser'), import('../../convex/_generated/api.js')]).then(([{ ConvexHttpClient }, { api }]) => ({ http: new ConvexHttpClient(convexUrl(), { skipConvexDeploymentUrlCheck: !!import.meta.env.DEV, logger: false }), api }), (e) => { clientP = null; throw e; });
  return clientP;
}
function timed(p) {
  return new Promise((res, rej) => { const id = setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS); p.then((v) => { clearTimeout(id); res(v); }, (e) => { clearTimeout(id); rej(e); }); });
}

// Asks for a code for `email`. Resolves to the server's { status, retryAfterMs? } or { status: 'failed' } (timeout, offline, anything thrown) or { status: 'closed' }. Never rejects, never retries.
export async function requestCode(email) {
  if (closedText()) return { status: 'closed' };
  const e = normalizeEmail(email || '');
  try {
    const r = await timed(client().then(({ http, api }) => http.action(api.otp.requestCode, { email: e, inviteKey: INVITE_KEY })));
    if (r.status === 'invalid_link') { closeLink(); return { status: 'closed' }; }
    if (r.status === 'sent' || r.status === 'rate_limited') codeFor = e;   // a rate-limited email was sent a code a moment ago: the guest may be holding it
    return r.status === 'rate_limited' && typeof r.retryAfterMs === 'number' ? { status: r.status, retryAfterMs: r.retryAfterMs } : { status: String(r.status) };
  } catch { return { status: 'failed' }; }
}

// Verifies the 6-digit `code` and saves the answers. side 'home'|'away', values = the flat answers (fields.js). Resolves to { status, ... }:
//   saved | updated (+ firstName, attending, ticketNo) | invalid_code (+ attemptsLeft, null if the server sent none) | code_expired | too_many_attempts | no_code | invalid_payload (+ errors) | invalid_answers | service_unavailable | failed | closed
// A second call while one is in flight shares it; after a save it returns the saved reply. It does not need requestCode to have answered first: a request that timed out may still have sent the email, and the server's no_code says when nothing was.
export function verifyAndSave(side, values, code) {
  if (state === 'sent' && sent) return Promise.resolve({ ...sent });
  if (state === 'sending' && inflight) return inflight;
  if (closedText()) return Promise.resolve({ status: 'closed' });
  let built;
  try { built = buildPayload(side, values); } catch { return Promise.resolve({ status: 'invalid_answers' }); }
  setState('sending');
  inflight = (async () => {
    try {
      const r = await timed(client().then(({ http, api }) => http.action(api.rsvp.verifyAndSave, { email: built.email, code: String(code || '').trim(), payload: built.payload, inviteKey: INVITE_KEY })));
      inflight = null;
      if (r.status === 'saved' || r.status === 'updated') {
        const ticketNo = Number(r.ticketNo);
        if (!Number.isFinite(ticketNo)) throw new Error('no ticket number');   // never a confirmation reading "Seat NaN": the catch below reports failed
        // `answers` is what the guest typed that the shirts and the poster use (the confirmation heading uses preferredName; every other confirmation field comes from the server). In memory only.
        sent = Object.freeze({ status: r.status, firstName: String(r.firstName ?? built.payload.firstName), attending: r.attending, ticketNo,
          answers: Object.freeze({ surname: built.payload.surname, preferredName: built.payload.preferredName, plusOne: !!built.payload.plusOne, plusOneName: built.payload.plusOneName }) });
        setState('sent'); return { ...sent };
      }
      if (r.status === 'invalid_link') { closeLink(); return { status: 'closed' }; }
      setState('idle');
      if (r.status === 'invalid_code') return { status: r.status, attemptsLeft: typeof r.attemptsLeft === 'number' && Number.isFinite(r.attemptsLeft) ? r.attemptsLeft : null };
      if (r.status === 'invalid_payload') return { status: r.status, errors: r.errors && typeof r.errors === 'object' ? { ...r.errors } : {} };
      return { status: String(r.status) };
    } catch { inflight = null; setState('failed'); return { status: 'failed' }; }
  })();
  return inflight;
}

// A name-only decline (a guest who has not replied before): no email and no code. values = the flat answers (firstName, surname, reason). Shares the page-wide state with verifyAndSave.
// Resolves to { status: 'saved', firstName, attending: 'no', nameOnly: true } or rate_limited | invalid_payload (+ errors) | invalid_answers | service_unavailable | failed | closed.
// The server answers saved for a duplicate too, so nothing here can say "already declined".
export function submitDecline(values) {
  if (state === 'sent' && sent) return Promise.resolve({ ...sent });
  if (state === 'sending' && inflight) return inflight;
  if (closedText()) return Promise.resolve({ status: 'closed' });
  let payload;
  try { payload = buildDecline(values); } catch { return Promise.resolve({ status: 'invalid_answers' }); }
  setState('sending');
  inflight = (async () => {
    try {
      const r = await timed(client().then(({ http, api }) => http.action(api.declines.submitDecline, { ...payload, inviteKey: INVITE_KEY })));
      inflight = null;
      if (r.status === 'saved') {
        sent = Object.freeze({ status: 'saved', firstName: payload.firstName, attending: 'no', nameOnly: true, answers: Object.freeze({}) });
        setState('sent'); return { ...sent };
      }
      if (r.status === 'invalid_link') { closeLink(); return { status: 'closed' }; }
      setState('idle');
      if (r.status === 'invalid_payload') return { status: r.status, errors: r.errors && typeof r.errors === 'object' ? { ...r.errors } : {} };
      return { status: String(r.status) };   // rate_limited | service_unavailable
    } catch { inflight = null; setState('failed'); return { status: 'failed' }; }
  })();
  return inflight;
}
