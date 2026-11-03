// matchday-rsvp: the ONE submit path for the game, the quick-reply form and the no-WebGL page. Three-free (imports config.js only).
// State is page-wide:  idle -> sending -> sent | failed   (failed may go back to sending: a retry reuses the same idempotency key).
//   - RSVP_ENDPOINT blank: in dev, no network, straight to `sent`. In production the form is CLOSED (isClosed(): "RSVPs open soon", nothing sent) unless RSVP_MODE = 'event-only'.
//   - Missing, blank, placeholder or malformed privacy values (privacyProblems), or a refused endpoint (closedReasons), also close the production form.      - Set: one POST (https only, or http://localhost in dev), no cookies, no referrer, 10 s timeout.
//   - `rsvp:submit` fires once, on `sent`, frozen. With an endpoint its detail is only { side, notice } (the server already has the data); with no endpoint (event-only) it carries the full payload.  Confirmation UI must render only on `sent`.
// The payload is an allowlist (side, name, and for HOME email, mobile, guests, + idempotencyKey, notice), rebuilt from the FIELDS validators on the way out.
import { EVENT, FIELDS, RSVP_ENDPOINT, RSVP_MODE, NOTICE_VERSION } from './config.js';
import { endpointProblem } from './endpoint.js';

let state = 'idle', sent = null, inflight = null, key = null, keyBody = null, last = null, warned = false, closed = null;
const subs = new Set();
const setState = (s) => { state = s; for (const fn of [...subs]) { try { fn(s); } catch (e) { console.warn('[matchday] state listener failed', e); } } };

export const getState = () => state;
export const CLOSED_TEXT = 'RSVPs open soon';
// Allowlist check for EVENT.privacy: returns the keys that are not a real value (missing, non-string, blank, [bracket] placeholder, TBC/TODO, contact not an email or https URL, policyUrl not a real https URL). Pure: no import.meta.env, so node can test it.
const PRIVACY_KEYS = ['responsibleParty', 'contact', 'retention', 'policyUrl'], NOT_REAL = /^(tbc|tbd|todo|n\/?a|-+)$/i, EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const httpsUrl = (t) => { try { const u = new URL(t); return u.protocol === 'https:' && !!u.hostname; } catch { return false; } };
export function privacyProblems(P) {
  return PRIVACY_KEYS.filter((k) => {
    const v = P?.[k]; if (typeof v !== 'string') return true;
    const t = v.trim(); if (!t || /[\[\]]/.test(t) || NOT_REAL.test(t)) return true;
    return k === 'policyUrl' ? !httpsUrl(t) : k === 'contact' ? !(EMAIL.test(t) || httpsUrl(t)) : false;
  });
}
// Why the form must be closed, as [{ warn, msg }] (empty = open). Pure (dev is passed in, no import.meta.env) so node can test it; dev is never closed. Bad privacy values and a refused endpoint (credentials, query/fragment, not https) are errors; a blank endpoint outside 'event-only' is a warning.
export function closedReasons({ privacy, endpoint, mode, dev }) {
  if (dev) return [];
  const r = [], bad = privacyProblems(privacy), why = endpoint ? endpointProblem(endpoint, false) : null;
  if (bad.length) r.push({ msg: '[matchday] RSVP form closed: EVENT.privacy has missing, placeholder or invalid value(s) in: ' + bad.join(', ') + ' (policyUrl must be a real https:// URL, contact an email or https URL).' });
  if (why) r.push({ msg: '[matchday] RSVP form closed: ' + why.replace(/; nothing was sent\.$/, '.') });
  if (!endpoint && mode !== 'event-only') r.push({ warn: true, msg: "[matchday] RSVP form closed: RSVP_ENDPOINT is blank and RSVP_MODE is not 'event-only'." });
  return r;
}
// Production only. Computed once and logged once; the answer comes entirely from closedReasons().
export function isClosed() {
  if (closed === null) { const r = closedReasons({ privacy: EVENT.privacy, endpoint: RSVP_ENDPOINT, mode: RSVP_MODE, dev: !!import.meta.env.DEV }); r.forEach((x) => console[x.warn ? 'warn' : 'error'](x.msg)); closed = r.length > 0; }
  return closed;
}
// The last attempted payload while the state is `failed` (so a fallback page can show those answers and resend them under the same key), else null.
export const getFailed = () => (state === 'failed' ? last : null);
// The payload that was accepted (frozen), or null until `sent`.
export const getSent = () => sent;
// Values only ({ side, name, ... }, no key or notice): what __rsvp shows in dev.
export const getValues = () => { if (!sent) return null; const { idempotencyKey, notice, ...v } = sent; return v; };
export const onState = (fn) => { subs.add(fn); return () => subs.delete(fn); };

// Dev only: the game's test hooks reset a page between runs. Never reachable in a production build.
export function resetForDev() { if (import.meta.env.DEV) { state = 'idle'; sent = null; inflight = null; key = null; keyBody = null; last = null; for (const fn of [...subs]) fn(state); } }

const uuid = () => crypto.randomUUID?.() ?? [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

// side 'home' | 'away', values by field key. Throws on anything the validators reject. Unknown keys are dropped.
export function buildPayload(side, values) {
  if (side !== 'home' && side !== 'away') throw new Error('side must be home or away');
  const p = { side };
  for (const f of FIELDS) {
    if (side === 'away' && f.key !== 'name') continue;
    const r = f.validate(values?.[f.key] ?? '');
    if (!r.ok) throw new Error('invalid ' + f.key);
    p[f.key] = r.value;
  }
  // Backstop for N3: the key belongs to one exact body, so changed answers never go out under an old key (the fast lane locks its fields after the first send, and the fallback resends the stored payload, so this only guards other callers).
  const body = JSON.stringify(p); if (body !== keyBody) { keyBody = body; key = uuid(); }
  p.idempotencyKey = key;
  p.notice = NOTICE_VERSION;
  return p;
}

// Dev only: ?endpoint=https://... overrides the blank constant so a test can exercise the network path. The branch is stripped from production builds.
const endpoint = () => (import.meta.env.DEV ? new URLSearchParams(location.search).get('endpoint') : null) || RSVP_ENDPOINT;
// endpointProblem (credentials, query/fragment, host charset, https only) lives in endpoint.js so the build applies the same rule.
function allowed(url) { const why = endpointProblem(url, !!import.meta.env.DEV); if (why) console.error('[matchday] ' + why); return !why; }

// 10 s abort. AbortSignal.timeout is missing in older browsers, so fall back to AbortController + setTimeout (done() clears the timer once the fetch settles).
const timeoutSignal = (ms) => { if (AbortSignal.timeout) return { signal: AbortSignal.timeout(ms), done() {} }; const c = new AbortController(), id = setTimeout(() => c.abort(), ms); return { signal: c.signal, done: () => clearTimeout(id) }; };
// Resolves to the new state ('sent' | 'failed'). Never rejects. A second call while sending shares the first; after `sent` it is a no-op.
export function submitRsvp(side, values) {
  if (state === 'sent') return Promise.resolve('sent');
  if (state === 'sending' && inflight) return inflight;
  if (isClosed()) return Promise.resolve('failed');   // the UI never offers Send when closed; this is the belt to that braces
  let payload;
  last = null;
  try { payload = buildPayload(side, values); last = payload; } catch (e) { console.warn('[matchday] RSVP rejected before sending:', e.message); setState('failed'); return Promise.resolve('failed'); }
  const url = endpoint();
  if (!url) { accept(payload, true); return Promise.resolve('sent'); }
  setState('sending');
  inflight = (async () => {
    let t;
    try {
      if (!allowed(url)) { if (!warned) { warned = true; console.warn('[matchday] RSVP_ENDPOINT is not allowed (see the error above); nothing was sent.'); } throw new Error('endpoint not allowed'); }
      t = timeoutSignal(10000);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: t.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      accept(payload, false); return 'sent';
    } catch { inflight = null; setState('failed'); return 'failed'; } finally { t?.done(); }
  })();
  return inflight;
}
// toHost = no endpoint (event-only): the event IS the integration point, so it carries the full payload. With an endpoint the server already has the answers, so the event is { side, notice } only (no personal data for page scripts).
function accept(payload, toHost) {
  sent = Object.freeze({ ...payload }); inflight = null; setState('sent');
  window.dispatchEvent(new CustomEvent('rsvp:submit', { detail: Object.freeze(toHost ? { ...payload } : { side: payload.side, notice: payload.notice }) }));
}
