// matchday-rsvp CONFIG: the one place an organiser edits. EVENT = every event fact + kit colour; FIELDS = the RSVP questions.
// No imports, so every module (scene, flow, CSS) can read it without circular-import trouble.
// Kit colours are CSS hex strings; KIT_HEX holds the same values as 0xRRGGBB numbers for three.js.
export const EVENT = {
  title: 'Save the Date: Matchday', date: 'Saturday 12 December 2026', kickoff: '18:00', venue: 'Kick-Off Arena', host: 'The Organising Committee',
  shortDate: '12.12',   // the LED board's "RSVP • 12.12"
  // ✎ REQUIRED before go-live: the POPIA short notice shown before any personal field. Placeholders in [brackets] are NOT real values; replace every one.
  privacy: {
    responsibleParty: '[Organiser legal name]',                              // ✎ REQUIRED before go-live: who is the "responsible party" under POPIA
    contact: '[contact email]',                                              // ✎ REQUIRED before go-live: where guests ask to see, correct or delete their details
    retention: '[retention period, e.g. 30 days after the event]',           // ✎ REQUIRED before go-live: when the details are deleted
    policyUrl: '[https://privacy policy URL]',                               // ✎ REQUIRED before go-live: full notice; shown as a link only once it starts with https://
  },
  kits: { home: '#C8102E', homeDark: '#7a0a1c', homeLight: '#ff5a6e', away: '#1B2A4A', awayLight: '#6f94ff', awayTint: '#28468c' },
};
// ✎ Organiser: where the RSVP is POSTed as JSON. A PUBLIC https:// URL only, never a key, token or secret, and nothing in a VITE_* variable (those are baked into the page for everyone).
// Blank = no network at all: the reply is accepted on the page and only the `rsvp:submit` event fires.
export const RSVP_ENDPOINT = '';   // this URL is public and unauthenticated: anyone can read it and POST to it, so the server must validate and rate-limit.
// ✎ Organiser: leave '' (the default) for a production page that must collect RSVPs: with a blank RSVP_ENDPOINT it then shows "RSVPs open soon" and sends nothing.
// 'event-only' = the page accepts the reply and only fires `rsvp:submit`; use it only if the host page listens for rsvp:submit and stores it.
export const RSVP_MODE = '';
// Version string sent with every RSVP so the server can tell which privacy notice the guest saw. Bump it whenever EVENT.privacy or the notice wording changes.
export const NOTICE_VERSION = 'popia-short-2026-10';
const num = (hex) => parseInt(hex.slice(1), 16);
export const KIT_HEX = Object.fromEntries(Object.entries(EVENT.kits).map(([k, v]) => [k, num(v)]));
export const VENUE_UC = EVENT.venue.toUpperCase();

// ---- THEME (design contract: .specno-design/tokens.md). Tier-1/2 tokens; the CSS side gets them as --* custom properties below, canvases read the JS constants.
// accent / accentAway / scoreboardAccentGoal derive from EVENT.kits so the kit stays the one colour source.
export const THEME = {
  color: {
    ink950: '#0B0D12', ink900: '#0E121C', ink800: '#161B27', ink700: '#232A3A',
    fog100: '#F2F4F8', fog300: '#A9B2C3', fog500: '#6B7487',
    paper100: '#EFE9DB', paper300: '#D8CFBA', paperInk: '#14171F', paperMuted: '#4A4F5C', paperRule: '#8A8576',
    danger300: '#ff9a9a',
    surface: 'rgba(14,18,28,.82)', surfaceSolid: '#0E121C', surfaceRaised: '#161B27',
    text: '#F2F4F8', textMuted: '#A9B2C3',
    ruleHairline: 'rgba(242,244,248,.14)', ruleControl: '#6B7487',
    focusOuter: '#F2F4F8', focusInner: '#0B0D12', focusOnPaper: '#14171F',
    scoreboardText: '#F2F4F8', scoreboardDim: '#9fb4c9', scoreboardAccent: '#F2F4F8',
    accent: EVENT.kits.homeLight, accentAway: EVENT.kits.awayLight, scoreboardAccentGoal: EVENT.kits.homeLight,
  },
  radius: { 0: 0, 1: 4, 2: 8, 3: 12, pill: 999 },
  font: { family: '"Inter Tight"', fallback: '"Segoe UI", system-ui, -apple-system, Arial, sans-serif', weightMin: 400, weightMax: 800, file: '/world/fonts/InterTight-var-latin.woff2' },
  type: { caption: [11, 16, 600], bodySm: [13, 18, 500], body: [15, 22, 450], label: [15, 20, 600], input: [16, 22, 500], title: [20, 26, 700], display: [28, 32, 800] },   // [px, line px, weight]
  motion: {
    ms: { instant: 0, fast: 120, base: 200, settle: 240, flip: 360 },
    reduced: { instant: 0, fast: 0, base: 0, settle: 0, flip: 0 },
    ease: { out: 'cubic-bezier(.2,0,0,1)', inout: 'cubic-bezier(.4,0,.2,1)', flip: 'cubic-bezier(.3,0,.1,1)' },
  },
  focus: { width: 2, offset: 2 },
  rule: { controlWidth: 1.5 },   // px: the border on inputs, .opt and .choice
  scene: { backgroundIntensity: 0.5, environmentIntensity: 0.7, fogDensity: 0.0016, fogInkMix: 0.5, horizon: { radius: 900, height: 60 },
           sky: { zenith: '#1a2140', mid: '#4a3a55', horizon: '#d98a5f' },   // warm dusk gradient dome; fog and the horizon band derive from sky.horizon
           bloom: { intensity: 0.55, threshold: 0.85, radius: 0.7 }, n8ao: { intensity: 2.2, aoRadius: 1.4 }, toneMapping: 'AGX' },
};
export const FONT_STACK = THEME.font.family + ', ' + THEME.font.fallback;
export const fontCss = (weight, px) => `${weight} ${px}px ${FONT_STACK}`;   // canvas font shorthand: always the theme face

const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()).replace(/([a-z])(\d)/g, '$1-$2');
const setVar = (name, v) => document.documentElement.style.setProperty('--' + name, String(v));
// Motion durations are set by applyMotion(reduced) (flow.js calls it) so reduced motion can zero them; everything else is static.
export function applyMotion(reduced) {
  if (typeof document === 'undefined') return;
  for (const [k, v] of Object.entries(reduced ? THEME.motion.reduced : THEME.motion.ms)) setVar('dur-' + k, v + 'ms');
}
// CSS side: index.html carries matching fallbacks in :root; these override them at startup (--kit-home, --ink-950, --text, --radius-2, ...).
if (typeof document !== 'undefined') {
  for (const [k, v] of Object.entries(EVENT.kits)) setVar('kit-' + kebab(k), v);
  for (const [k, v] of Object.entries(THEME.color)) setVar(kebab(k), v);
  for (const [k, v] of Object.entries(THEME.radius)) setVar('radius-' + k, v + 'px');
  for (const [k, [px, lh, w]] of Object.entries(THEME.type)) { setVar('fs-' + kebab(k), px + 'px'); setVar('lh-' + kebab(k), lh + 'px'); setVar('fw-' + kebab(k), w); }
  setVar('font', FONT_STACK);
  for (const [k, v] of Object.entries(THEME.motion.ease)) setVar('ease-' + k, v);
  setVar('rule-control-width', THEME.rule.controlWidth + 'px'); setVar('focus-ring-width', THEME.focus.width + 'px'); setVar('focus-ring-offset', THEME.focus.offset + 'px');
  applyMotion(false);
}

// Canvases (ticket, scoreboard, LED boards, plaza sign) must not bake the fallback face: await this before the first draw. Resolves even if the font fails (fallback stack).
export const FONT = { loadedAt: null };
export const fontsReady = typeof document === 'undefined' ? Promise.resolve() :
  Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 16px ${THEME.font.family}`))).catch(() => {}).then(() => { FONT.loadedAt = performance.now(); if (import.meta.env.DEV) window.__fontLoadedAt = FONT.loadedAt; });

// ---- validation ----------------------------------------------------------------------------------------------------------
// Strips controls (Cc), format characters (Cf), lone surrogates (Cs), default-ignorable code points (soft hyphen, fillers, variation selectors, tags, ALM, WJ, BOM...) and U+2028/2029, then NFC-normalises.
// ZWNJ/ZWJ (U+200C/U+200D) survive only with { joiners: true } AND between two letters/marks (Persian, Hindi, ...); everywhere else they go. Callback form, not lookbehind: a SyntaxError here would also break the fallback page.
const STRIP = /(?![\u200C\u200D])[\p{Cc}\p{Cf}\p{Cs}\p{Default_Ignorable_Code_Point}\u2028\u2029]/gu;
const LETTER_MARK = /[\p{L}\p{M}]/u, JOINER = /[\u200C\u200D]/g, LAST_CP = /[\s\S]$/u, FIRST_CP = /^[\s\S]/u;
export const clean = (s, { joiners = false } = {}) => String(s ?? '').replace(STRIP, '')
  .replace(JOINER, (m, i, t) => (joiners && LETTER_MARK.test(t.slice(0, i).match(LAST_CP)?.[0] ?? '') && LETTER_MARK.test(t.slice(i + 1).match(FIRST_CP)?.[0] ?? '') ? m : ''))
  .normalize('NFC').trim();
const ok = (value) => ({ ok: true, value });
const bad = (error) => ({ ok: false, error });
export const FIELDS = [
  { key: 'name', label: 'Full name', short: 'Name', type: 'text', inputmode: 'text', autocomplete: 'name', maxlength: 80, placeholder: 'e.g. Alex Morgan',
    validate(v) { v = clean(v, { joiners: true }); if (!v || !/\p{L}/u.test(v)) return bad('Please enter your full name.'); if (v.length > 80) return bad('That is a little long: 80 characters or fewer, please.'); return ok(v); } },
  { key: 'email', label: 'Email', short: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: 254, placeholder: 'you@example.com',
    validate(v) { v = clean(v); if (!v) return bad('Please enter your email address.'); if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return bad('That email does not look right. Try name@example.com.'); return ok(v); } },
  { key: 'mobile', label: 'Mobile number', short: 'Mobile', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: 20, placeholder: '+27 82 123 4567',
    validate(v) { v = clean(v); const digits = v.replace(/\D/g, '').length; if (v.length > 20 || !/^\+?[\d\s-]+$/.test(v) || digits < 7 || digits > 15) return bad('Use 7 to 15 digits; spaces, dashes and a leading + are fine.'); return ok(v); } },
  { key: 'guests', label: 'Guests joining you (0-3)', short: 'Guests', type: 'choice', options: [0, 1, 2, 3], inputmode: 'numeric', autocomplete: 'off',
    validate(v) { v = clean(v); if (!/^\d+$/.test(v) || Number(v) > 3) return bad('Please choose a number from 0 to 3.'); return ok(Number(v)); } },
];
