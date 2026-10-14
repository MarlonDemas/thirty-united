# Lux Consultation, save-the-date

**Date:** 2026-10-14
**Brief texture:** premium-consumer
**Direction.md chosen:** Direction A, Matchday Programme
**Signature:** "A ruled, programme-cover landscape ticket with a punched perforation that the guest tears along the stub line to open the page, and a returned stub in a ruled table with name, team and seat number in tabular mono numerals, stamped ADMIT ONE · 21 DEC 2026 in a single red rubber stamp."

Context: the brief is a one-page RSVP for a personal 30th birthday, light theme only, with a signature tear. `feedback.md` held no earlier `LUX:` entries, so nothing here contradicts a past decision. The default premium-consumer slate (material truth, multi-sensory, quiet, patina-aware) was checked against this brief rather than copied.

## Committed Properties (and why)
- **Material truth**: the ticket is the whole product and a paper object has to behave like one. The punched holes are real cut-outs that show the page colour through them, and the grain sits under the type, not over it.
- **Quiet by default, voice when chosen**: the page chrome stays silent so the ticket and the stub can speak. Red appears only on the stamp and the next action, which is how the Signature stays unmistakable.
- **Specificity over generality**: this page does one thing, a ticket that becomes your stub. Seat number, team and the ADMIT ONE stamp could only belong to this event. Refuse the generic invite furniture (countdown, map, gift list, share rail).
- **Time visible in detail**: guests who are not comfortable with forms meet every edge state: wrong code, expired code, cooldown, a 40-character surname. Each is designed on purpose, not templated.
- **Inevitability through restraint**: no cards, no shadows, no gradients, no confetti. Ruled boxes do all the grouping, so nothing on the page looks added.

## Not Committing (and why)
- **Multi-sensory**: haptics and sound are out. A web page on a shared WhatsApp link cannot rely on vibration APIs (not supported on iOS Safari), and sound would surprise people opening the link at work. Type, motion and the stamp carry the moment.
- **Patina-aware**: the page lives for a few weeks and one night. There is no long-term product for design moves to age into. Revisit only if the page is reused for another event.

## Calibration References
- **Apple Wallet**: boarding passes have a tear edge and the card metaphor is taken to physics. Steal the tear edge as a real parting line along the punches, not a decorative zigzag.
- **Aman Resorts**: tonal silence on warm greys with one micro-accent. Steal the confidence to remove, so red on roughly 3% of the screen holds the eye.
- **Apple Books**: paper texture under the type. Steal the placement and the restraint (4% grain, ticket and stub only), not the skeuomorphic page curl.
- **Hermès (app)**: one image, one product, one price, no upsell. Steal the refusal: one ticket, one action per view.

## Specific Moves for the Build

### Material truth
- Draw the perforation as a row of semicircular cut-outs along the stub line using a mask, so `page` shows through the holes at any viewport.
- Keep the grain a static SVG noise at 4% opacity under the type on the ticket and stub only. Never on boxes, buttons or the page. Remove it under `forced-colors`.
- The torn stub keeps the matching scalloped edge on both halves. Both halves share one mask so the edges still fit when the stub returns.
- Guard against skeuomorphism: no drop shadow under the ticket, no curl, no paper-fold gradient. Material truth stays at stock, grain and cut-outs.

### Quiet by default
- Red at the stamp, the primary button and the focus ring only. A view with no primary action and no stamp has no red.
- No site header, no footer links, no social icons. The only furniture is the host's line at the foot ("Makes, 21 DEC 2026").
- Inputs have no placeholder text beyond format hints; labels live above the field in `body-strong`.

### Specificity
- Seat numbers in `data-stub` with leading zeros ("SEAT 007") so the numeral reads as a stamped serial.
- The serif standfirst is signed by Makes. One line per view, none on the code view where it would compete with the six digits.
- The team line on the stub is the guest's own words in condensed caps (or "OTHER SPORT: <their sport>"). No team given shows "NEUTRAL" in `muted`, not an empty row.
- Maybe is an outlined stamp with a `circle-help` icon and the word MAYBE; No is a void diagonal rule in ink with no red at all.

### Time visible in detail
- Design each OTP state as its own piece (sending, sent, cooldown, wrong code with attempts left, expired, too many attempts, rate-limited, service unavailable, saved, updated). Each has a different icon, line and next action.
- A 40-character surname wraps inside the stub's name row and never shrinks below `data-stub` 20px; the ticket grows in height instead.
- Focus moves to the view heading after each step, with a live-region announcement ("Ticket opened", "Code sent to ...", "Saved").
- Open Graph image is the sealed ticket artwork, so the link preview already looks like the object.

### Inevitability through restraint
- Cut: countdown, venue map, add-to-calendar button, share button. All out of scope or tier 3.
- One ruled box per question group; no box inside a box.
- No illustration beyond the ticket.

## Open Questions
- Opening line: owner to pick one of the three drafts in the brief.
- Whether the footer carries the host's line at all, or the ticket alone ends the page. Lean: a single quiet line.
