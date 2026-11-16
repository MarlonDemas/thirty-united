// matchday-rsvp: the plain invitation, the first thing every guest sees (.specno-design/direction-plain-invitation.md). Three-free: imports config.js, ui.js and ornament.js only.
// Facts come from EVENT in config.js; the look is L2 (ornament.js + world.css). The capsule has two equal halves: "Play the match" (onPlay) and "Just reply" (onReply).
import { EVENT } from './config.js';
import { h } from './ui.js';
import { corners, roundel, nameHeading, dateLockup, venueLine } from './ornament.js';

// Returns { el, setLoading() }. The caller appends el to #ui.
export function createInvite({ onPlay, onReply }) {
  const playBtn = h('button', { type: 'button', class: 'inv-half', text: 'Play the match', onclick: () => { if (playBtn.getAttribute('aria-disabled') !== 'true') onPlay(); } });
  const replyBtn = h('button', { type: 'button', class: 'inv-half', text: 'Just reply', onclick: () => onReply() });
  const live = h('p', { class: 'sr', role: 'status' });
  // L2 "Ivory and crimson" (plate L2-invitation.png): a framed sheet, the roundel, the name, the date lockup, the tagline and the venue; the two halves at the foot.
  const el = h('main', { id: 'inv' },
    h('div', { class: 'inv-col l2 sheet' }, ...corners(),
      h('div', { class: 'top' }, roundel(), h('p', { class: 'caps kick', text: "You've been called up" }), nameHeading(), dateLockup(), h('p', { class: 'tg', text: EVENT.tagline }), venueLine()),
      h('div', { class: 'bot' },
        h('h2', { id: 'inv-reply', class: 'caps kick reply', text: 'Your reply' }),
        h('div', { class: 'inv-capw' }, h('div', { class: 'inv-cap', role: 'group', 'aria-labelledby': 'inv-reply' }, playBtn, replyBtn)),   // .inv-capw is the size container: the halves stack when the label text outgrows it
        live)));
  return {
    el,
    setLoading() {
      playBtn.textContent = 'Opening the gates…';
      playBtn.setAttribute('aria-disabled', 'true'); playBtn.setAttribute('aria-busy', 'true');
      live.textContent = 'Opening the gates…';
    },
  };
}
