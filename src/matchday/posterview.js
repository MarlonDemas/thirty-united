// matchday-rsvp: the keepsake poster viewer. LAZY: ui.js imports this only when the guest presses "View your poster", so the poster canvas code, its plates and this file stay out of the entry chunk.
// The poster is drawn on this device by src/poster/compositor.ts from { name, number, attending } (posterFieldsFor: preferred-or-first name, the seat, never a surname, email, WhatsApp, team, sport or fun fact) and is never uploaded.
// Viewer: a native <dialog> (focus trapped, Escape closes, focus returns to the button). The preview <img> is a data: URL (the CSP allows data: images, not blob:); the download link is a blob: URL (a link, not an image).
//   Save your poster = a download link. Share = navigator.share({ files }) only where navigator.canShare accepts the file. Touch screens get a press-and-hold hint (the image itself is the fallback where downloads are blocked).
import { renderPoster, POSTER_FILE_NAME } from '@/poster/compositor';
import { posterFieldsFor, posterAlt } from '@/poster/fields';
import { h } from './ui.js';

const touch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// Resolves once the dialog is open. Rejects (the caller shows the "couldn't be made" line) when the poster cannot be drawn.
export async function openPoster(r, opener) {
  const f = posterFieldsFor({ status: r.status, attending: r.attending, ticketNo: r.ticketNo, firstName: r.firstName, surname: r.answers?.surname ?? '' }, r.answers ?? {});
  if (!f) throw new Error('no poster for this reply');
  const { file, url } = await renderPoster(f);
  const blobUrl = URL.createObjectURL(file);
  const img = h('img', { class: 'poster-img', src: url, alt: posterAlt(f), width: '1080', height: '1920' });
  const save = h('a', { class: 'btn', href: blobUrl, download: POSTER_FILE_NAME, text: 'Save your poster' });
  const close = h('button', { class: 'btn ghost', type: 'button', text: 'Close' });
  const buttons = h('div', { class: 'row' }, save);
  const shareErr = h('p', { class: 'err', role: 'alert' });
  const canShare = typeof navigator.canShare === 'function' && typeof navigator.share === 'function' && navigator.canShare({ files: [file] });
  if (canShare) {
    const share = h('button', { class: 'btn ghost', type: 'button', text: 'Share' });
    share.addEventListener('click', async () => {
      shareErr.textContent = '';
      try { await navigator.share({ files: [file], title: 'Thirty United' }); } catch (e) { if (e?.name !== 'AbortError') shareErr.textContent = "I couldn't share the poster. Save it instead."; }
    });
    buttons.append(share);
  }
  buttons.append(close);
  const dlg = h('dialog', { class: 'poster', 'aria-labelledby': 'poster-h' },
    h('h2', { id: 'poster-h', class: 'display', text: 'Your poster' }),
    h('div', { class: 'poster-frame' }, img),
    touch() ? h('p', { class: 'hint-text', text: 'On a phone, press and hold the poster to save it.' }) : null,
    h('p', { class: 'note', text: "Save it now. We don't keep a copy." }),
    buttons, shareErr);
  const done = () => { URL.revokeObjectURL(blobUrl); dlg.remove(); (opener?.isConnected ? opener : null)?.focus({ preventScroll: true }); };
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', done, { once: true });
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });   // a tap on the backdrop
  document.body.append(dlg);
  dlg.showModal();
  close.focus({ preventScroll: true });
}
