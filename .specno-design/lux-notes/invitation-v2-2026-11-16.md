> **Note, 2026-11-18.** The owner picked 2a, The Red Room, which replaces L2 "Ivory and crimson" and overturns three moves below: "No grain, no gradients, no shadow" under "Not committing" (the Red Room has gold hairlines, one shadow on the sheet and one on the stub, faint stripes and a red glow), the "one colour" and warm-neutral ground lines (the ground is now near-black `#0B0A0A`), and the cream-paper calibration. Still holding: no club names, crests or kits; no exclamation marks or emoji; text sizes and tap targets; a selected answer is never shown by colour alone; the game stays loud and separate; no haptics or sound on these pages. Not confirmed either way: "ornament is one hairline frame, corner marks, or one rule" and "equal fill on the capsule halves" (the build has a double frame with arcs and unequal halves). No new consultation ran on 18 November; see `feedback.md`, 2026-11-18.

# Lux Consultation, invitation v2 (guest-facing pages)

**Date:** 2026-11-16
**Surface:** the plain invitation (`#inv`), the "Just reply" page and its cards (`#fb`: form, code, decline, closed, confirmation), and `/privacy/`. The 3D game is out of scope and stays loud (owner decision).
**Brief texture:** hybrid. The audience is a mixed-age friends-and-family list (18 to 60) reading on a phone from WhatsApp, so the register is a personal printed invitation (premium-consumer: paper, one colour, quiet), not a product UI. It is not photography-led, so Material truth and Multi-sensory do not carry the weight they do for Aman or Hermès.
**Direction.md chosen:** Direction D "Matchday: The Signing", extended by `direction-plain-invitation.md` (2026-11-05). This consultation does not change D. It feeds the colour and type reopening in `direction-review-2026-11-16-v2.md`.
**Signature (plain invitation):** a small spaced-caps date and venue line above one large "Makes turns 30", the matchday card of labelled rows, and the two-equal-halves capsule.
**Context line:** Lux consultation for the guest-facing pages of Thirty United. Direction D plus the plain-invitation supplement. Texture is hybrid. Past `LUX:` entries in `feedback.md`: 4 (haptics and sound in the game, ticket shadow and sheen, the 3D lanyard ticket), all about the game and the ticket, none about these pages.
**Read:** the owner's three phone screenshots, `references/invitation-feel-2026-11-16.md`, `feedback.md`, `direction-plain-invitation.md`, `direction-review-2026-11-16.md` (v1), `src/matchday/{invite,fallback,ui,fields,world.css,config}.js`, `public/privacy/`, `lux-principles.md` and `lux-references.md` from the plugin.
**Not done:** nothing was seen on a real phone besides the owner's screenshots, and the mock-ups are static (no hover, no motion, no screen reader).

## What the owner's screenshots show

The pages are a near-black page with a near-black card, white text, a claret left rule, rose side stripes on the answer buttons, a dark purple selected fill and a block of claret as the main button. The only light thing is the cream facts card, so the eye lands on a bright rectangle inside a dark room. Two of the three screenshots are the reply form, and the form's first screen is a paragraph of grey caption text, then three full-width outlined bars. It reads as a form, not as a card someone wrote to you. (The stray `null` line under the facts card in the screenshots is a bug in that preview build, not a design item. The mock-ups do not reproduce it.)

## Rejected history to respect

October's `feedback.md` records the owner overriding "Palette A, Matchday Paper" (`#F3EDE1` paper, `#1B1A17` ink, `#B3261E` terrace red) as "still being safe", and rejecting letterpress ink bleed, deckled edges and off-register stamps (Directions B and C). Two of this round's palettes (A and C) are close cousins of that paper palette. That is not a block: the owner reopened the palette on 2026-11-16, and the October verdict was about the whole experience including the game, which stays loud. But he should pick A or C knowing it is the same family he once called safe, now limited to the two pages where a guest reads and answers. Every ornament in the mock-ups is clean-edged (hairline rules, corner brackets, one flat disc); none is textured.

## Committed properties (and why)

- **Quiet by default, voice when chosen.** The owner's complaint is volume. The invitation is where the guest reads, so the page is mostly ground and ink; colour is one small voice. The game is the place that speaks loudly, and it is a separate tap.
- **Inevitability through restraint.** Remove, do not add. No icons beyond the existing map pin, no second column, no illustration. Colour budget: one red, in small amounts, drawn as ink, a rule, a stamp or one button.
- **Specificity.** This is Makes's 30th, not a template. The facts, tone and the capsule that splits "Play the match" from "Just reply" already are the product's answer. The mock-ups keep the real copy ("Thirty feels like half time. Come for the oranges.") and the existing "You've been called up" kicker. No club name, crest or stadium.
- **Time visible in detail.** The form and the confirmation are where a guest's effort is. Each state gets the same paper, type and red: form, decline form, closed message, error line, confirmation, and (in the build) the code card. The reference set found no one who styled the confirmation as part of the invitation; that gap is the opportunity. The `Seat 007 · Shirt 7` line becomes a typeset receipt line, as On Running does for a run.

## Not committing (and why)

- **Material truth.** There is no photography and no physical object on these pages. Paper is suggested by flat tone and hairlines only. No grain, no gradients, no shadow (the October ruling allows one contact shadow on the ticket only, and the ticket is the game's).
- **Multi-sensory.** Haptics and sound belong to the game. The invitation page stays silent.
- **Patina-aware.** The page lives five weeks. No long-term aging moves.

## Calibration references

- **Auberge Resorts Collection:** cream, never white, with tracked small caps at about 0.12em for labels. Applied in A and C for the "When / Where / Host" labels and the date line.
- **Aman Resorts:** tonal silence and one deep wine micro-accent. The case for A's crimson as ink rather than fill, and for B's single brick stamp.
- **On Running:** one brand red on the CTA and one mark; the result is a printed receipt of a personal moment. The model for the confirmation card.
- **Hermès:** one colour as the whole colour story, and refusing the upsell. The case for cutting extras from the page (nothing added beyond what exists).

From the project's own reference set (`invitation-feel-2026-11-16.md`): Brasserie Zédel (crimson as reading colour on cream), Paperless Post Eats and Etiquette (red as the colour of the words, plus the lesson that the RSVP sheet must not drop the card's style), Dishoom (neutral black with cream serif, for B), Toffs (the ratio: mostly cream, one dark, a little brick).

## Specific moves for the build

### Quiet by default
- Red area on the invitation screen is at most about 10% of pixels in A, under 4% in B and C. A is the loudest of the three, because its two capsule halves are filled.
- No tinted black. If a page stays dark (B), the black is neutral `#151515` and the text is cream, not white, and there is no blue.
- The notice, the label rows and the helper text are muted warm grey, never blue-grey.

### Inevitability through restraint
- One serif for the display name at one size, plus the sans (Inter Tight, already loaded) for everything a guest has to read: labels, inputs, buttons, notice, errors. A thin serif is display only, 28 px and up, because Cormorant is fragile below that for older eyes.
- Ornament is one clean hairline frame, corner marks, or one rule. Not all three.
- The capsule's two halves keep equal size and equal fill (the owner's October signature); the option decides the fill (crimson, outlined cream, or ink), not the proportions.

### Specificity
- Keep "You've been called up" as the reply page's kicker, and "Play the match" and "Just reply" as written.
- The facts rows keep Who, What, When, Where on the invitation and When, Where, Host on the reply page, with the dashed pin for a TBA venue.

### Time visible in detail
- Selected answers carry a check mark as well as a border, so a selection never depends on colour alone.
- The privacy notice is styled (a ruled quiet block, or the existing collapsed variant), never hidden. Styling is free; its wording is not touched here.
- Error text keeps the existing icon and words rule and gets a palette-specific colour (see the proposal).
- The confirmation takes the same paper, serif name and one stamp as the invitation, so the guest's last screen matches the first.

## Open questions

- **Which of A, B or C?** The proposal recommends one; the owner chooses from the plates.
- **Candidate `LUX:` entries** (not written; the reflect step is the owner's call once he picks): (1) "Calm pages, loud game: the invitation and reply pages carry one red and a light or warm-neutral ground; the 3D game keeps the loud kit red." (2) "Serif for the display name only; sans for everything a guest must read." (3) "A selected answer is never shown by colour alone."
- **Two-ground journey.** A or C makes the invitation and the "Just reply" page light while the game's own cards stay dark. The confirmation after playing the game is the dark card. The proposal sets out what that costs.
