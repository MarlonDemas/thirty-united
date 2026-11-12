// matchday-rsvp CONFIG: the one place an organiser edits. EVENT = every event fact + kit colour; FIELDS = the RSVP questions (fields.js).
// No imports, so every module (scene, flow, CSS) can read it without circular-import trouble.
// Kit colours are CSS hex strings; KIT_HEX holds the same values as 0xRRGGBB numbers for three.js.
// Makes's 30th (DESIGN.md sections 2 and 3). No kick-off time until there is one; no club, crest or stadium names anywhere.
export const EVENT = {
  title: 'Makes turns 30', date: 'Monday 21 December 2026', venue: 'Venue TBA', host: 'Makes',
  tagline: 'Thirty feels like half time. Come for the oranges.',
  shortDate: '21 DEC 2026',   // the stub, the LED boards and the scoreboard
  brand: 'THIRTY',            // the one word on the signage
  led: 'MAKES \u00b7 30',
  // ✎ REQUIRED before go-live: the POPIA short notice shown before any personal field. Placeholders in [brackets] are NOT real values; replace every one.
  privacy: {
    responsibleParty: '[Organiser legal name]',                              // ✎ REQUIRED before go-live: who is the "responsible party" under POPIA
    contact: '[contact email]',                                              // ✎ REQUIRED before go-live: where guests ask to see, correct or delete their details
    retention: '[retention period, e.g. 30 days after the event]',           // ✎ REQUIRED before go-live: when the details are deleted
    policyUrl: '[https://privacy policy URL]',                               // ✎ REQUIRED before go-live: full notice; shown as a link only once it starts with https://
  },
  // Brand kits (DESIGN.md section 4): HOME = shirt-red with white; AWAY = a dark neutral (void / panel) with moonlight trim. No club cues.
  // homeLight is the scene's poster-red (decoration and signage only, never on the UI layer); awayLight is moonlight.
  kits: { home: '#9F0B19', homeDark: '#850914', homeLight: '#F81E24', away: '#18131F', awayLight: '#B7D3FA', awayTint: '#241D2E' },
};
// The invite key travels in the link (?k=). Same text for a missing key and for the server's invalid_link.
export const MISSING_KEY_MESSAGE = 'This link is missing its invite key. Ask Makes to send you the full link.';
// Version string sent with every RSVP so the server can tell which privacy notice the guest saw. Bump it whenever EVENT.privacy or the notice wording changes (convex/lib/declineValidation.ts allow-lists the exact string, so bump both together). Must match /^[a-z0-9.-]{1,32}$/.
export const NOTICE_VERSION = 'popia-2026-11-v2';
const num = (hex) => parseInt(hex.slice(1), 16);
export const KIT_HEX = Object.fromEntries(Object.entries(EVENT.kits).map(([k, v]) => [k, num(v)]));
export const TITLE_UC = EVENT.brand;
export const DATE_LINE = `${EVENT.date} \u00b7 ${EVENT.venue}`;

// ---- THEME (design contract: .specno-design/tokens.md). Tier-1/2 tokens; the CSS side gets them as --* custom properties below, canvases read the JS constants.
// accent / accentAway / scoreboardAccentGoal derive from EVENT.kits so the kit stays the one colour source.
export const THEME = {
  // DESIGN.md section 4: void #0E0B13, panel #18131F, panel-raised #241D2E, moonlight #B7D3FA, line #8A8FB0, text #FFFFFF, error #FF9E8F. Paper tokens are the invitation ticket's stock only.
  color: {
    ink950: '#0E0B13', ink900: '#18131F', ink800: '#241D2E', ink700: '#2F2740', fog100: '#FFFFFF', fog300: '#B7D3FA', fog500: '#8A8FB0',
    paper100: '#EFE9DB', paper300: '#D8CFBA', paperInk: '#14171F', paperMuted: '#4A4F5C', paperRule: '#8A8576',
    danger300: '#FF9E8F', success300: '#8EDDA9', warning300: '#FFC978', primary: '#9F0B19', primaryHover: '#B3101F', primaryPressed: '#850914',
    surface: 'rgba(24,19,31,.94)', surfaceSolid: '#18131F', surfaceRaised: '#241D2E',
    text: '#FFFFFF', textMuted: '#B7D3FA',
    ruleHairline: 'rgba(183,211,250,.22)', ruleControl: '#8A8FB0',
    focusOuter: '#FFFFFF', focusInner: '#0E0B13', focusOnPaper: '#14171F',
    scoreboardText: '#FFFFFF', scoreboardDim: '#B7D3FA', scoreboardAccent: '#FFFFFF',
    accent: EVENT.kits.homeLight, accentAway: EVENT.kits.awayLight, scoreboardAccentGoal: EVENT.kits.homeLight,
  },
  radius: { 0: 0, 1: 4, 2: 8, 3: 12, pill: 999 },
  font: { family: '"Inter Tight"', fallback: '"Segoe UI", system-ui, -apple-system, Arial, sans-serif', weightMin: 400, weightMax: 800, file: '/world/fonts/InterTight-var-latin.woff2' },
  type: { caption: [11, 16, 600], bodySm: [13, 18, 500], body: [15, 22, 450], label: [15, 20, 600], input: [16, 22, 500], title: [20, 26, 700], display: [28, 32, 800], hero: [32, 34, 800] },   // [px, line px, weight]
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
  applyMotion(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);   // the start page and the fallback form honour the preference too; flow.js keeps it in sync once the game runs
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
