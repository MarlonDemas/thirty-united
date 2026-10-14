# Chosen: save-the-date wireframes

Date: 2026-10-14. Approved by the owner: the single variant (C, direction-signature anchor) and the approach in `edge-cases/save-the-date.md`.

## Decisions made after the wireframes
- Opening line (serif standfirst on the sealed ticket): "Thirty feels like half time. Come for the oranges." (brief option 2).
- Required fix vs `variant-C-06`: on mobile (390) the ADMIT ONE stamp must not overlap the guest name or team. It sits below the name block instead. Overlapping the perforation on desktop is allowed as long as no text is covered.
- Seat number is reply order: the backend `ticketNo`, shown as three digits (007). The No stub shows no seat.
- Backend timings: code valid 10 minutes, 5 attempts, resend cooldown 60 seconds (use `retryAfterMs` when the backend returns it). The 30 second figure in the edge-case table is superseded.
- Light theme only (`color-scheme: light`); forced-colors and 200% text are supported.
