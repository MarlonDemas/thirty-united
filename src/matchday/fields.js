// matchday-rsvp: the RSVP questions, the one place that knows the payload. Three-free (imports config.js and the repo's pure rsvp helpers only).
// Mirrors convex/lib/validation.ts (limits, conditionals, "no" keeps names only); the server stays authoritative. Values are kept flat by key:
//   firstName, surname, preferredName, attending ('yes'|'maybe'), email, sport, otherSport, team, inviteChannel, whatsapp, plusOne ('yes'|'no'), plusOneName.
// A field is asked at one station (GROUPS) and again, all together, in the fast lane. choice fields are radiogroups; options are { value, label }.
import { clean, NOTICE_VERSION } from './config.js';
import { LIMITS, isValidEmail, normalizeEmail, normalizeWhatsapp } from '../lib/schemas/rsvp.ts';

const ok = (value) => ({ ok: true, value });
const bad = (error) => ({ ok: false, error });
const text = (v, { joiners = true } = {}) => clean(v, { joiners });

const nameField = (key, label, extra = {}) => ({
  key, label, type: 'text', inputmode: 'text', maxlength: LIMITS.name, ...extra,
  validate(v) { v = text(v); if (!v) return extra.optional ? ok('') : bad(key === 'surname' ? 'Add your surname.' : 'Add your first name.'); if (v.length > LIMITS.name) return bad(`Keep this under ${LIMITS.name} characters.`); return ok(v); },
});

export const FIELD = {
  firstName: nameField('firstName', 'First name', { autocomplete: 'given-name', placeholder: 'e.g. Alex' }),
  surname: nameField('surname', 'Surname', { autocomplete: 'family-name', placeholder: 'e.g. Morgan' }),
  preferredName: nameField('preferredName', 'Name on your shirt (optional)', { autocomplete: 'nickname', placeholder: 'If not your first name', optional: true }),
  attending: { key: 'attending', label: 'Will you be there?', type: 'choice', options: [{ value: 'yes', label: "I'll be there" }, { value: 'maybe', label: 'Not sure yet' }], init: 'yes',
    validate(v) { return v === 'yes' || v === 'maybe' ? ok(v) : bad('Pick one.'); } },
  attendingFast: { key: 'attending', label: 'Can you make it?', type: 'choice', options: [{ value: 'yes', label: 'Yes', side: 'home' }, { value: 'maybe', label: 'Not sure yet', side: 'home' }, { value: 'no', label: "Can't make it", side: 'away' }],
    validate(v) { return v === 'yes' || v === 'maybe' || v === 'no' ? ok(v) : bad("Pick Yes, Not sure yet or Can't make it."); } },
  email: { key: 'email', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: LIMITS.email, placeholder: 'you@example.com',
    validate(v) { v = text(v, { joiners: false }); if (!v) return bad('Add your email address.'); return isValidEmail(v) ? ok(normalizeEmail(v)) : bad('That email does not look right. Try name@example.com.'); } },
  sport: { key: 'sport', label: 'Your sport', type: 'choice', options: [{ value: 'football', label: 'Football' }, { value: 'other', label: 'Another sport' }],
    validate(v) { return v === 'football' || v === 'other' ? ok(v) : bad('Pick Football or Another sport.'); } },
  otherSport: { key: 'otherSport', label: 'Which sport', type: 'text', inputmode: 'text', maxlength: LIMITS.otherSport, placeholder: 'e.g. Rugby', showIf: (v) => v.sport === 'other',
    validate(v) { v = text(v); if (!v) return bad('Say which sport.'); return v.length > LIMITS.otherSport ? bad(`Keep this under ${LIMITS.otherSport} characters.`) : ok(v); } },
  team: { key: 'team', label: 'Your team', help: 'Not a fan? Write Neutral.', type: 'text', inputmode: 'text', maxlength: LIMITS.team, placeholder: 'e.g. Neutral',
    validate(v) { v = text(v); if (!v) return bad('Add your team. Neutral is fine.'); return v.length > LIMITS.team ? bad(`Keep this under ${LIMITS.team} characters.`) : ok(v); } },
  inviteChannel: { key: 'inviteChannel', label: 'Where should I send the details?', type: 'choice', options: [{ value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' }], init: 'email',
    validate(v) { return v === 'email' || v === 'whatsapp' ? ok(v) : bad('Pick Email or WhatsApp.'); } },
  whatsapp: { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: LIMITS.whatsapp, placeholder: '082 123 4567', showIf: (v) => v.inviteChannel === 'whatsapp',
    validate(v) { v = text(v, { joiners: false }); if (!v) return bad('Add your WhatsApp number.'); if (v.length > LIMITS.whatsapp) return bad(`Keep this under ${LIMITS.whatsapp} characters.`); return normalizeWhatsapp(v) ? ok(v) : bad('Use a number like 082 123 4567 or +27 82 123 4567.'); } },
  plusOne: { key: 'plusOne', label: 'Bringing someone?', type: 'choice', options: [{ value: 'no', label: 'Just me' }, { value: 'yes', label: 'Plus one' }], init: 'no',
    validate(v) { return v === 'yes' || v === 'no' ? ok(v) : bad('Pick Just me or Plus one.'); } },
  plusOneName: { key: 'plusOneName', label: 'Their name (optional)', type: 'text', inputmode: 'text', maxlength: LIMITS.name, placeholder: 'e.g. Sam Morgan', showIf: (v) => v.plusOne === 'yes',
    validate(v) { v = text(v); return v.length > LIMITS.name ? bad(`Keep this under ${LIMITS.name} characters.`) : ok(v); } },
};

// What each station asks (keys in FIELD). Station ids as in stations.js ('1:home', '1:away', '2'..'4').
export const GROUPS = {
  '1:home': ['firstName', 'surname', 'preferredName', 'attending'],
  '1:away': ['firstName', 'surname', 'email'],
  2: ['email', 'sport', 'otherSport', 'team'],
  3: ['inviteChannel', 'whatsapp'],
  4: ['plusOne', 'plusOneName'],
};
// Fast lane: every field, in the order a guest reads them. Stranger fields appear only when their answer asks for them.
export const FAST_KEYS = ['attendingFast', 'firstName', 'surname', 'preferredName', 'email', 'sport', 'otherSport', 'team', 'inviteChannel', 'whatsapp', 'plusOne', 'plusOneName'];
const NO_KEYS = new Set(['attendingFast', 'firstName', 'surname', 'email']);
// The fast lane shows only the first question until it is answered, then everything that answer needs.
export function keysFor(keys, values) {
  const fast = keys.includes('attendingFast');
  return keys.filter((k) => {
    if (fast) { if (!values.attending) return k === 'attendingFast'; if (values.attending === 'no') return NO_KEYS.has(k); }
    return FIELD[k].showIf?.(values) ?? true;
  });
}
const valueKey = (k) => (k === 'attendingFast' ? 'attending' : k);
export const valueOf = (values, k) => values[valueKey(k)];

// Validates `keys` against flat `values`: { ok, values (cleaned, by value key), errors (by field key) }.
export function validateKeys(keys, values) {
  const out = {}, errors = {};
  for (const k of keysFor(keys, values)) {
    const f = FIELD[k], r = f.validate(valueOf(values, k) ?? '');
    if (r.ok) out[valueKey(k)] = r.value; else errors[k] = r.error;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values: out };
}

// The exact payload keys the server accepts (rsvpPayloadValidator); a stray key makes Convex throw. `side` 'home'|'away'; values are flat. Returns { email, payload } or throws.
export function buildPayload(side, values) {
  const attending = side === 'away' ? 'no' : values.attending === 'maybe' ? 'maybe' : 'yes';
  const all = { ...values, attending };
  const r = validateKeys(attending === 'no' ? ['firstName', 'surname', 'email'] : ['firstName', 'surname', 'preferredName', 'email', 'sport', 'otherSport', 'team', 'inviteChannel', 'whatsapp', 'plusOne', 'plusOneName'], all);
  if (!r.ok) throw new Error('invalid answers');
  const v = r.values, payload = { firstName: v.firstName, surname: v.surname, attending, noticeVersion: NOTICE_VERSION };
  if (attending !== 'no') {
    if (v.preferredName) payload.preferredName = v.preferredName;
    payload.plusOne = v.plusOne === 'yes';
    if (payload.plusOne && v.plusOneName) payload.plusOneName = v.plusOneName;
    payload.sport = v.sport; payload.team = v.team;
    if (v.sport === 'other') payload.otherSport = v.otherSport;
    payload.inviteChannel = v.inviteChannel;
    if (v.inviteChannel === 'whatsapp') payload.whatsapp = v.whatsapp;
  }
  return { email: v.email, payload };
}

// Server field errors (invalid_payload.errors, keyed by payload key) onto field keys here. Keys with no field here come back under '_'.
export function mapServerErrors(errors, attendingFast = false) {
  const out = {};
  for (const [k, msg] of Object.entries(errors || {})) out[k === 'attending' && attendingFast ? 'attendingFast' : FIELD[k] ? k : '_'] = String(msg);
  return out;
}
export { normalizeEmail };
