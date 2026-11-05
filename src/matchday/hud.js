// matchday-rsvp: the overlay. The primary card is centred; a challenge shows a slim top-centre chip (instruction + a real Skip button);
// the guide is the centred "Walk to next station" button; corners hold only secondary controls (mute top-right, "Just reply" top-left).
// User text only ever goes in through h() (textContent / text nodes). Timers run on the sim clock (timeline.js).
import { h, svgIcon } from './ui.js';

export const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

export function createHud({ audio, tl }) {
  const ui = document.getElementById('ui');
  const card = h('section', { id: 'card', class: 'glass', role: 'group', tabindex: '-1', hidden: true });
  const toastEl = h('div', { id: 'toast', class: 'glass', role: 'status', 'aria-live': 'polite' });
  const hintEl = h('div', { id: 'hint', class: 'chip glass', role: 'status', hidden: true });
  const chipText = h('span', {}), chipSkip = h('button', { class: 'btn', type: 'button' });
  const chal = h('div', { id: 'chal', class: 'chip glass', role: 'group', 'aria-label': 'Challenge', hidden: true }, chipText, chipSkip);
  const walkTitle = h('b', {}), walkSub = h('small', {});
  const walk = h('button', { id: 'walk', class: 'glass', type: 'button', hidden: true }, walkTitle, walkSub);
  const skipEl = h('div', { id: 'skip', class: 'chip glass', 'aria-hidden': 'true', hidden: true, text: 'Tap to skip' });
  const liveEl = h('div', { id: 'live', class: 'sr', role: 'status', 'aria-live': 'polite' });   // polite announcements: aim, camera moves, skips
  const fast = h('button', { id: 'fastlink', class: 'glass', type: 'button', hidden: true, text: 'Just reply' });
  const muteBtn = h('button', { id: 'mute', class: 'glass', type: 'button', 'aria-label': 'Mute sound', 'aria-pressed': 'false', onclick: () => { audio.unlock(); audio.toggleMute(); } }, svgIcon(false));
  audio.onMute((m) => { muteBtn.setAttribute('aria-pressed', String(m)); muteBtn.replaceChildren(svgIcon(m)); });   // one fixed label; aria-pressed carries the state
  // the floating stick (roam.js sends 'stick' events): a ring where the thumb landed and a knob that follows it; drawn only. The first push ends the walking hint.
  const knob = h('i', {}), stickEl = h('div', { id: 'stick', 'aria-hidden': 'true', hidden: true }, knob);
  ui.append(card, toastEl, hintEl, chal, walk, skipEl, liveEl, fast, muteBtn, stickEl);
  ui.addEventListener('stick', (ev) => {
    const d = ev.detail; stickEl.hidden = !d.on; if (!d.on) return;
    stickEl.style.transform = `translate(${d.ox}px, ${d.oy}px)`; knob.style.transform = `translate(${d.kx}px, ${d.ky}px)`;
    if (!hintEl.hidden) hud.hideHint();
  });

  let toastTimer = null, hintTimer = null, onSkip = null, onWalk = null, onFast = null;
  chipSkip.addEventListener('click', () => onSkip?.());
  walk.addEventListener('click', () => onWalk?.());
  fast.addEventListener('click', () => onFast?.());

  const hud = {
    card, isTouch,
    say(text) { liveEl.textContent = text; },
    heading: (id, text, cls) => h('h2', { id, class: cls, tabindex: '-1', text }),
    cardOpen: () => !card.hidden,
    hideCard() { card.hidden = true; card.replaceChildren(); card.dataset.kind = ''; },
    // kind: what the card is for ('station:2', 'intro', 'fast', ...), read by the flow state and tests
    showCard(children, { wide = false, instant = false, labelledBy, focus = true, head = false, cls = '', kind = '' } = {}) {
      card.className = 'glass' + (wide ? ' wide' : '') + (instant ? ' instant' : '') + (cls ? ' ' + cls : '');
      card.hidden = false; card.replaceChildren(...children); card.dataset.kind = kind; card.scrollTop = 0;
      if (labelledBy) card.setAttribute('aria-labelledby', labelledBy); else card.removeAttribute('aria-labelledby');
      if (!instant) { card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }   // restart the entrance animation
      if (focus) {   // touch devices: never focus a text input (it would open the keyboard over the scene); focus the card instead
        let t = (head ? card.querySelector('h2') : null) || card.querySelector('input, [role=radio][tabindex="0"], button:not([role=radio])');
        if (t && t.tagName === 'INPUT' && isTouch()) t = card;
        (t || card).focus({ preventScroll: true });
      }
    },
    toast(text, seconds = 1.6) {
      toastEl.textContent = text; toastEl.classList.add('show'); tl.cancel(toastTimer); toastTimer = tl.after(seconds, () => toastEl.classList.remove('show'));
      if (getComputedStyle(toastEl).display === 'none') hud.say(text);   // phones hide the toast while a card is up; keep it audible
    },
    hideToast() { tl.cancel(toastTimer); toastEl.classList.remove('show'); },
    toastText: () => (toastEl.classList.contains('show') ? toastEl.textContent : ''),
    hint(text, seconds = 6) { hintEl.textContent = text; hintEl.hidden = false; tl.cancel(hintTimer); hintTimer = tl.after(seconds, hud.hideHint); },
    hideHint() { hintEl.hidden = true; tl.cancel(hintTimer); },
    // the challenge chip: instruction + visible Skip (a real button: keyboard and screen readers reach it)
    chip(text, skipLabel, skip) { chipText.textContent = text; chipSkip.textContent = skipLabel; onSkip = skip; chal.hidden = false; hud.hideHint(); hud.say(text); },
    hideChip() { chal.hidden = true; onSkip = null; },
    chipText: () => (chal.hidden ? '' : chipText.textContent),
    chipBox: () => (chal.hidden ? null : chal.getBoundingClientRect()),
    setChipTop(px) { chal.style.top = px == null ? '' : px + 'px'; },   // the flow drops the chip under the scoreboard when the board sits behind it
    focusChipSkip() { chipSkip.focus({ preventScroll: true }); },
    walk(title, sub, fn) { walkTitle.textContent = title; walkSub.textContent = sub || ''; walkSub.hidden = !sub; walk.setAttribute('aria-label', sub ? `${title}: ${sub}` : title); onWalk = fn; walk.hidden = false; },
    hideWalk() { walk.hidden = true; onWalk = null; },
    walkText: () => (walk.hidden ? '' : walk.getAttribute('aria-label')),
    fastLink(show, fn) { fast.hidden = !show; if (fn) onFast = fn; },
    setSkipVisible(v) { skipEl.hidden = !v; if (v && !hintEl.hidden) hud.hideHint(); },   // the skip chip and the hint are never up together
    reset() { hud.hideCard(); hud.hideToast(); hud.hideHint(); hud.hideChip(); hud.hideWalk(); hud.setSkipVisible(false); },
  };
  return hud;
}
