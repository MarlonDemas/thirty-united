---
name: feedback
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
lastUpdated: "2026-10-14"
---

# Feedback log: Thirty United

Append-only. Tags: `INSIGHT`, `ACCEPTED`, `REJECTED`, `CORRECTION`, `AESTHETIC`, `LUX`. `AESTHETIC` and `LUX` entries are hard constraints for future sessions, same force as `REJECTED`.

## 2026-10-14

- AESTHETIC: Chosen A, Matchday Programme. Ruled boxes, condensed caps, serif standfirst, red only on the stamp and the next action. (Owner decision, direction gate.)
- AESTHETIC: Rejected B, Terrace Ticket. Letterpress rendering with ink bleed, deckled edge and shadowed perforation; one-question-per-screen sequence. Do not propose UI that drifts into it. (Owner decision; reason not given.)
- AESTHETIC: Rejected C, Scoreboard Broadcast. Solid ink strips, scrolling ticker, wipes, shirt-number rows. Do not propose UI that drifts into it. (Owner decision; reason not given.)
- INSIGHT: Palette A's `#D9D0BE` is 1.31:1 on paper, so it is decorative only; control borders use ink. `#B3261E` is also Material 3's stock error colour, so errors use `#7F1D17` to keep red meaning "stamp and next action" only.
- ACCEPTED: Light theme only (`color-scheme: light`), with AA contrast, `forced-colors` and 200% text support. (Owner decision.)
- ACCEPTED: Seat numbers are sequential in RSVP order; the backend assigns `ticketNo` and keeps it when the guest updates their RSVP. (Owner decision.)
- LUX: Commits are material truth, quiet by default, specificity, time visible in detail and inevitability through restraint. Not committing to multi-sensory or patina-aware. See `lux-notes/save-the-date-2026-10-14.md`.

## 2026-10-14

### Context
Save-the-date page built and verified (web-vite, Direction A). Verify: 0 axe violations in 26 states, 0 console errors, no anti-slop or Signature blocker.

### Decisions
- AESTHETIC: Chosen. Direction A "Matchday Programme". Signature: a ruled, programme-cover landscape ticket with a punched perforation that the guest tears along the stub line, and a returned stub in a ruled table with name, team and seat number in tabular mono numerals, stamped ADMIT ONE · 21 DEC 2026 in a single red rubber stamp. Held through build and verify: red appears only on primary buttons, the stamp and the focus ring (computed-style audit across states).
- AESTHETIC: Rejected. Direction B "Terrace Ticket". Signature: a letterpress match ticket with a punched, shadowed perforation, a typewriter-numbered seat and off-register red ink. Still rejected: the perforation is a flat mask with no shadow and no ink bleed.
- AESTHETIC: Rejected. Direction C "Scoreboard Broadcast". Signature: a scoreboard-built ticket with a red broadcast tag. Still rejected: no ink strips, ticker or wipes.
- LUX: Committed. Material truth. The perforation is a CSS mask, so the page colour shows through the punches at any viewport, with a 4% static grain on ticket and stub only. No shadow, curl or fold gradient.
- LUX: Committed. Quiet by default. The only red is the stamp, the primary action and the focus ring; a view with none of those has no red.
- LUX: Committed. Time visible in detail. Each code-step state has its own icon, line and next action; Maybe is an outlined stamp with a MAYBE tag, No is a void diagonal in its own strip below the name.
- LUX: Not committing. Multi-sensory and patina-aware, unchanged from the lux note. No haptics or sound.
- INSIGHT: Never put `outline-none` on shadcn controls in this project. It hid focus everywhere and the Direction A focus ring (3px `#B3261E`, offset 2px) is set once on base `:focus-visible`; per-component outline utilities override it.
- INSIGHT: Focus goes to the view's h1, not the first input, on every view change, including the code view. This is deliberate (one pattern for screen readers); do not "fix" it to focus the code field.
- INSIGHT: Validate on change, not on blur, once a form has failed. Error messages mounting under `onBlur` revalidation moved the layout and swallowed the first click on the next radio. Clear radio-group errors when a choice is made.
- INSIGHT: The reduced-motion path is an instant reveal (68ms measured, against 823ms for the tear). Keep the visible "Tear open" button as the equal path for pointer drag.
- INSIGHT: After the 5-attempt lockout, resend stays disabled until the 60s cooldown ends. The backend enforces that cooldown, so enabling the button would only produce an error line.
- INSIGHT: "How do you know Makes?" is a native `<select>` with a muted "Choose one" placeholder (6.48:1 on `paper-raised`); the details and code views are lazy-loaded (entry about 156 kB gzip, down from 232).
- INSIGHT: Very long single words wider than the name column still break mid-word at 390px. Accepted: Chrome does not hyphenate all-caps.
- INSIGHT: Production CSP lives in `netlify.toml` with a `style-src` hash for input-otp's empty `<style>`. If `input-otp` is upgraded, recompute the hash.

## 2026-10-14 (invite key)

- INSIGHT: The invite key stays in the URL (`?k=...`) and is not stripped after load. Stripping it broke WhatsApp hand-offs ("open in browser", copy-link), and the history and log exposure exists either way. A `sessionStorage` copy is only the fallback.

## 2026-10-14 (round 2, 3D ticket)

### Context
Owner answered the round-2 lux note: reverse two round-1 commits, amend brand.md scoped to the ticket and stamp, build option C (R3F lanyard), opt-in sound. See `lux-notes/save-the-date-2026-10-14-r2.md`.

### Decisions
- LUX: Reversed. Round-1 "Not committing. Multi-sensory ... No haptics or sound". Haptics via `navigator.vibrate` where supported are committed; sound is opt-in behind a "Sound" tab on the ticket, off by default, synthesized only. (Owner: yes.)
- LUX: Reversed. Round-1 "Material truth ... No shadow, curl or fold gradient". The ticket and stamp may carry one soft contact shadow and one light-driven sheen; curl and fold gradients stay out, and no other surface gets a shadow or gradient. Direction B's ink bleed, letterpress text-shadow, random deckled edge and shadowed perforation stay rejected.
- LUX: Committed. The ticket is a 3D object on a lanyard (option C, R3F/three) that answers the hand and settles under damping; nothing loops. The environment is pending the owner's phone test in WhatsApp's in-app browser. The DOM ticket is the fallback. Spec: `lux-notes/save-the-date-3d-lanyard-spec.md`.
- CORRECTION: The round-1 entry "the perforation is a CSS mask, so the page colour shows through the punches" is inaccurate. The perforation is a dotted right border with four corner notches (`src/components/Ticket.tsx:55`, `index.css:242-261`); there are no punches. Treat the dotted seam as the built state, not a mask.

