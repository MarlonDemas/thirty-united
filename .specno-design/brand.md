---
name: brand
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
direction: A
lastUpdated: "2026-10-14"
---

# Brand: Thirty United

## Direction

- **Chosen:** Direction A, Matchday Programme (owner, 2026-10-14).
- **Signature:** a ruled, programme-cover landscape ticket with a punched perforation that the guest tears along the stub line to open the page, and a returned stub in a ruled table with name, team and seat number in tabular mono numerals, stamped ADMIT ONE · 21 DEC 2026 in a single red rubber stamp.
- **Rejected (hard constraints):** B Terrace Ticket (letterpress rendering, one question per screen) and C Scoreboard Broadcast (ink broadcast strips, ticker, wipes). Do not drift back into either.

## What this is

A personal invite for Marlon "Makes" Demas's 30th birthday, Monday 21 December 2026, venue to be announced. The host is a person, not a company. There is no logo; the ticket is the mark.

## Voice and tone

- Editorial, confident and dry, like a club programme's editor's letter. Warm, short, a little playful. Written by Makes in first person, signed "Makes".
- Football is a nod, never a requirement: a guest who has never watched a match must understand every word. Gentle, family-safe banter only.
- One serif standfirst line per view, no more. Opening line is chosen by the owner from the options in the brief.
- Words only where no icon, type, colour, position or motion can carry the meaning (`copy-rules.md`). Control labels are short and literal ("Tear open", "Continue", "Send my code").
- Errors say what to do, not what went wrong with the system. Never blame the guest. No exclamation marks, no emoji, no "Oops".
- Specno writing rules apply to all copy: no inflated vocabulary (seamless, elevate, delve and the like), no filler openers, commas instead of drama dashes.
- Dates read "21 DEC 2026" on the ticket and stamp, "Monday 21 December 2026" in sentences.

## Marks and imagery

- No official club crest, wordmark or kit, ever (trademark). The United nod is the red, the condensed and serif type and programme print culture.
- No confetti, balloons, gold foil, "30" clip-art, stock photography or illustration.
- No ball glyph, no stadium photo. The ticket is the only illustration.
- Open Graph image: the sealed ticket artwork with "Thirty United, 21 Dec 2026". `noindex`.

## Accessibility floor

- WCAG 2.2 AA on every view; text 4.5:1, control borders and focus 3:1 (values in `tokens.md`).
- Keyboard completion of every step, visible focus ring, focus moves to the new view's heading, live-region announcement of the tear result and of every status.
- `prefers-reduced-motion`: instant reveal, no tear, "Tear open" button only. `forced-colors` and 200% text supported. Light theme only.
- Minimum text 14px, inputs 16px, targets 48px.

## Prohibited patterns

Shadowed cards (except the ticket, which may carry one soft contact shadow); gradients (except one light-driven sheen on the ticket and stamp); red fills beyond the primary button and stamp; pill buttons; toasts; dark theme; autoplay or looping motion (except the ticket and stamp: the 3D ticket answers the guest's hand and settles under damping to rest, it never loops or moves on its own after its entrance; no other surface gets a shadow, gradient or motion); placeholder-only labels; red asterisks for required fields (optional fields carry a muted "optional" tag instead); any official club imagery.

Amended 2026-10-14 by owner decision (`lux-notes/save-the-date-2026-10-14-r2.md`). The exceptions are scoped to the ticket and its stamp only. Sound is opt-in, off by default, behind a "Sound" tab on the ticket.
