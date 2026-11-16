// matchday-rsvp: the L2 "Ivory and crimson" ornaments shared by the invitation (invite.js) and the reply page (fallback.js): corner arcs, the centre-circle roundel, the name heading and the date lockup.
// Three-free. Facts come from EVENT (config.js); nothing here is typed text. SVG uses presentation attributes and classes only (CSP style-src 'self'); world.css colours and animates it.
import { EVENT } from './config.js';
import { h } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...kids); return e;
};
const draw = (tag, attrs) => svg(tag, { class: 'dr', pathLength: 1, ...attrs });   // pathLength 1 so the draw-in animation is one dash of length 1

// Four quarter-circle corner arcs (pitch corner arcs). CSS positions and mirrors them inside the sheet (.crn.tl / tr / bl / br).
export const corners = () => ['tl', 'tr', 'bl', 'br'].map((c) =>
  svg('svg', { class: 'crn ' + c, viewBox: '0 0 34 34', width: 34, height: 34, 'aria-hidden': 'true', focusable: 'false' },
    draw('path', { fill: 'none', 'stroke-width': 1.2, 'stroke-linecap': 'round', d: 'M34 0A34 34 0 0 1 0 34' })));

// The centre-circle roundel: halfway line, circle, centre spot. small = the compact one on the reply page.
export const roundel = (small = false) => h('div', { class: small ? 'mo sm' : 'mo' },
  svg('svg', { class: 'div', viewBox: '0 0 200 60', 'aria-hidden': 'true', focusable: 'false' },
    svg('g', { fill: 'none', 'stroke-width': 1.2, 'stroke-linecap': 'round' },
      draw('path', { d: 'M2 30H72' }), draw('path', { d: 'M128 30H198' }), draw('circle', { cx: 100, cy: 30, r: 26 }), draw('path', { d: 'M100 6V54' })),
    svg('circle', { class: 'spot', cx: 100, cy: 30, r: 3.2 })));

// The one h1 (accessible text is exactly EVENT.title: the split is two spans and a space). "Makes" is set in caps by CSS, the rest in italic.
export function nameHeading(attrs = {}, small = false) {
  const [first, ...rest] = EVENT.title.split(' ');
  return h('h1', { ...attrs, class: 'nameh' + (small ? ' sm' : '') }, h('span', { class: 'nm', text: first }), ' ', h('span', { class: 'it', text: rest.join(' ') }));
}

// MONDAY | 21 | DECEMBER 2026, taken apart from EVENT.date ("Monday 21 December 2026"). If the date ever stops fitting that shape, the whole string is shown as one line.
export function dateLockup(small = false) {
  const m = /^(\S+)\s+(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(EVENT.date.trim());
  const body = m ? [h('span', { class: 'dow', text: m[1] }), h('span', { class: 'day', text: m[2] }), h('span', { class: 'mon' }, m[3], h('br'), m[4])] : [h('span', { class: 'mon', text: EVENT.date })];
  return h('div', { class: 'lock' + (small ? ' sm' : ''), role: 'group', 'aria-label': EVENT.date }, ...body);
}

// ◆ VENUE TBA ◆
export const venueLine = () => h('p', { class: 'caps venue' }, h('span', { class: 'd', 'aria-hidden': 'true' }), h('span', { text: EVENT.venue }), h('span', { class: 'd', 'aria-hidden': 'true' }));
