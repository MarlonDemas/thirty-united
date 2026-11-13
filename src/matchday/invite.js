// matchday-rsvp: the plain invitation, the first thing every guest sees (.specno-design/direction-plain-invitation.md). Three-free: imports config.js and ui.js only.
// Facts come from EVENT in config.js. The capsule has two equal halves: "Play the match" (onPlay) and "Just reply" (onReply).
import { EVENT, DATE_LINE } from './config.js';
import { h } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
// lucide map-pin, dashed while the venue is still TBA (DESIGN.md section 8); aria-hidden, the row text carries the fact.
const pin = (dashed) => {
  const s = document.createElementNS(NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'pin' })) s.setAttribute(k, v);
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0');
  const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', 12); c.setAttribute('cy', 10); c.setAttribute('r', 3);
  if (dashed) p.setAttribute('stroke-dasharray', '3 3');
  s.append(p, c); return s;
};

// Returns { el, setLoading() }. The caller appends el to #ui.
export function createInvite({ onPlay, onReply }) {
  const row = (label, ...value) => [h('dt', { text: label }), h('dd', {}, ...value)];
  const card = h('section', { class: 'inv-card' },
    h('h2', { class: 'sr', text: 'The details' }),
    h('dl', {}, ...row('Who', EVENT.host), ...row('What', EVENT.tagline), ...row('When', EVENT.date), ...row('Where', pin(EVENT.venue === 'Venue TBA'), h('span', { text: EVENT.venue }))));
  const playBtn = h('button', { type: 'button', class: 'inv-half', text: 'Play the match', onclick: () => { if (playBtn.getAttribute('aria-disabled') !== 'true') onPlay(); } });
  const replyBtn = h('button', { type: 'button', class: 'inv-half', text: 'Just reply', onclick: () => onReply() });
  const live = h('p', { class: 'sr', role: 'status' });
  const el = h('main', { id: 'inv' },
    h('div', { class: 'inv-col' },
      h('header', { class: 'inv-hero' }, h('p', { class: 'inv-date', text: DATE_LINE }), h('h1', { text: EVENT.title })),
      card,
      h('h2', { id: 'inv-reply', class: 'inv-kicker', text: 'Your reply' }),
      h('div', { class: 'inv-capw' }, h('div', { class: 'inv-cap', role: 'group', 'aria-labelledby': 'inv-reply' }, playBtn, replyBtn)),   // .inv-capw is the size container: the halves stack when the label text outgrows it
      live));
  return {
    el,
    setLoading() {
      playBtn.textContent = 'Opening the gates…';
      playBtn.setAttribute('aria-disabled', 'true'); playBtn.setAttribute('aria-busy', 'true');
      live.textContent = 'Opening the gates…';
    },
  };
}
