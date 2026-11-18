// matchday-rsvp CONFIG: the one place an organiser edits. EVENT = every event fact + kit colour; FIELDS = the RSVP questions (fields.js).
// No imports, so every module (scene, flow, CSS) can read it without circular-import trouble.
// Kit colours are CSS hex strings; KIT_HEX holds the same values as 0xRRGGBB numbers for three.js.
// Makes's 30th (DESIGN.md sections 2 and 3). No kick-off time until there is one; no club, crest or stadium names anywhere.
export const EVENT = {
  title: 'Makes turns 30', date: 'Monday 21 December 2026', venue: 'Venue TBA', host: 'Makes',
  tagline: '30 years in. Still playing to win.',
  dressCode: 'Semi-casual, in your jersey. Any club, any sport, any era. No jersey? Wear red.',
  shortDate: '21 DEC 2026',   // the stub, the LED boards and the scoreboard
  brand: 'THIRTY',            // the one word on the signage
  led: 'MAKES \u00b7 30',
  // The POPIA short notice shown before any personal field. Placeholders in [brackets] are NOT real values.
  privacy: {
    responsibleParty: 'Marlon Demas',                                        // who is the "responsible party" under POPIA
    contact: 'demasmarlon@gmail.com',                                        // where guests ask to see, correct or delete their details
    retention: 'within 30 days after the event, by 20 January 2027',         // when the details are deleted; read as "I delete your details <retention>."
    policyUrl: 'https://thirty-united.netlify.app/privacy/',                 // full notice; shown as a link only once it starts with https://
  },
  // Brand kits (DESIGN.md section 4): HOME = shirt-red with white; AWAY = a dark neutral (void / panel) with moonlight trim. No club cues.
  // homeLight is the scene's poster-red (decoration and signage only, never on the UI layer); awayLight is moonlight.
  kits: { home: '#9F0B19', homeDark: '#850914', homeLight: '#F81E24', away: '#18131F', awayLight: '#B7D3FA', awayTint: '#241D2E' },
};
// The invite key travels in the link (?k=). Same text for a missing key and for the server's invalid_link.
export const MISSING_KEY_MESSAGE = 'This link is missing its invite key. Ask Makes to send you the full link.';
// Version string sent with every RSVP so the server can tell which privacy notice the guest saw. Bump it whenever EVENT.privacy or the notice wording changes (convex/lib/declineValidation.ts allow-lists the exact string, so bump both together). Must match /^[a-z0-9.-]{1,32}$/.
export const NOTICE_VERSION = 'popia-2026-11-v3';
const num = (hex) => parseInt(hex.slice(1), 16);
export const KIT_HEX = Object.fromEntries(Object.entries(EVENT.kits).map(([k, v]) => [k, num(v)]));
export const TITLE_UC = EVENT.brand;
export const DATE_LINE = `${EVENT.date} \u00b7 ${EVENT.venue}`;

// ---- THEME (design contract: .specno-design/tokens.md). Tier-1/2 tokens; the CSS side gets them as --* custom properties below, canvases read the JS constants.
// accent / accentAway / scoreboardAccentGoal derive from EVENT.kits so the kit stays the one colour source.
export const THEME = {
  // DESIGN.md section 4: void #0E0B13, panel #18131F, panel-raised #241D2E, moonlight #B7D3FA, line #8A8FB0, text #FFFFFF, error #FF9E8F. Paper tokens are the invitation ticket's stock only.
  color: {
    ink950: '#0E0B13', ink900: '#18131F', ink800: '#241D2E', ink700: '#2F2740', fog100: '#F4F1EA', fog300: '#B8B3A9', fog500: '#8E8A83',
    paper100: '#EFE9DB', paper300: '#D8CFBA', paperInk: '#14171F', paperMuted: '#5B564D', paperRule: '#CBC3AE',
    danger300: '#FF9E8F', success300: '#8EDDA9', warning300: '#FFC978', primary: '#8A1F2D', primaryHover: '#9A2536', primaryPressed: '#6A1622',
    surface: 'rgba(24,19,31,.94)', surfaceSolid: '#18131F', surfaceRaised: '#241D2E',
    text: '#F4F1EA', textMuted: '#B8B3A9',
    ruleHairline: 'rgba(244,241,234,.14)', ruleControl: '#8E8A83',
    focusOuter: '#F4F1EA', focusInner: '#0E0B13', focusOnPaper: '#14171F',
    scoreboardText: '#F4F1EA', scoreboardDim: '#B8B3A9', scoreboardAccent: '#F4F1EA',
    accentUi: '#D9505C',   // the UI's own rose (side stripes); `accent` below stays the kit's loud red for the 3D scene (beacons, station boards)
    accent: EVENT.kits.homeLight, accentAway: EVENT.kits.awayLight, scoreboardAccentGoal: EVENT.kits.homeLight,
  },
  // L2 "Red Room" (approved 2026-11-18): the invitation (#inv) and the reply page (#fb) ONLY. CSS gets these as --l-*; world.css remaps the shared tokens inside those two roots, so the game's own cards stay dark.
  // Key names are the ivory set's (light, ink = the cream text, crimson = the red, field = the card, selected = the chosen fill). Text colours are at least 4.5:1 on ground, field and selected; ctrl, crimson and the status colours are at least 3:1 as edges and icons.
  light: {
    ground: '#0B0A0A', ink: '#F3EDE2', muted: '#B9AFA2', rule: 'rgba(201,164,92,.35)', crimson: '#C8102E', ctrl: '#6E6458', field: '#141111', placeholder: '#9A8E80', selected: '#2A0B12', onInk: '#FFFFFF',
    danger: '#FF8A7A', success: '#8EDDA9', warning: '#FFC978',   // status text, icons and edges on the dark ground
    gold: '#C9A45C', goldLight: '#D9BC7E', redHover: '#D9183A', numeral: '#E0243F',   // hairlines and arcs, kicker and label gold, the button hover, the date numeral
  },
  view: { light: '#0B0A0A', dark: '#0E0B13' },   // page and theme-color per view: the Red Room ground on the invitation and reply page, dark in the game (setView)
  radius: { 0: 0, 1: 4, 2: 8, 3: 12, pill: 999 },
  font: { family: '"Inter Tight"', fallback: '"Segoe UI", system-ui, -apple-system, Arial, sans-serif', weightMin: 400, weightMax: 800, file: '/world/fonts/InterTight-var-latin.woff2',
         serif: '"Bodoni Moda", "Didot", "Bodoni 72", Georgia, serif', sans: '"Jost", "Josefin Sans", "Avenir Next", Futura, "Segoe UI", sans-serif' },   // L2 only: Didone name and numerals, tracked caps
  type: { caption: [12, 16, 600], bodySm: [13, 18, 500], body: [15, 22, 450], label: [15, 20, 600], input: [16, 22, 500], title: [20, 26, 700], display: [28, 32, 800], hero: [34, 38, 700], heroWide: [44, 48, 700], cardLabel: [14, 20, 500], cardValue: [16, 22, 600] },   // [px, line px, weight]
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
  for (const [k, v] of Object.entries(THEME.light)) setVar('l-' + kebab(k), v);
  setVar('font', FONT_STACK); setVar('serif', THEME.font.serif); setVar('sans', THEME.font.sans);
  for (const [k, v] of Object.entries(THEME.motion.ease)) setVar('ease-' + k, v);
  setVar('rule-control-width', THEME.rule.controlWidth + 'px'); setVar('focus-ring-width', THEME.focus.width + 'px'); setVar('focus-ring-offset', THEME.focus.offset + 'px');
  applyMotion(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);   // the start page and the fallback form honour the preference too; flow.js keeps it in sync once the game runs
}

// Which page colour the browser shows: 'light' (invitation, reply page) or 'dark' (the game). Sets data-view on <html> (world.css paints html, body and #boot from it) and the theme-color meta. CSP-clean: an attribute and a meta, no inline style.
export function setView(view) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.view = view;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME.view[view]);
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
