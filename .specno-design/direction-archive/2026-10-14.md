---
name: direction
schemaVersion: "1.0"
clientName: thirty-united
chosenDirection: A
briefTexture: premium-consumer
proposedAt: 2026-10-14
chosenAt: 2026-10-14
referenceSet: .specno-design/references/rsvp-save-the-date-sports-ticket-2026-10-14.md
profileVersion: "1.0.0"
---

# Direction: Thirty United

## Brief Summary

**Thirty United**: a one-page RSVP save-the-date for Marlon "Makes" Demas's 30th birthday (Monday 21 December 2026, venue TBA), sent as one link to friends and family on their phones, many of them not football fans. The guest tears a match ticket open, RSVPs, verifies an email code and keeps a personalised stub; the stakes are personal rather than financial, so the page must feel warm, trustworthy and unmistakable. Full brief: `.specno-design/briefs/save-the-date-brief.md`.

**Owner constraints shared by all three directions:**

- Signature (owner): a landscape match ticket with a punched perforation that the guest tears along the stub line to open the page, and an RSVP that returns as a stub with name, team and seat number in tabular numerals, stamped ADMIT ONE · 21 DEC 2026.
- Palette logic (owner, Palette A): ticket stock `#F3EDE1`, ink `#1B1A17`, one terrace-red accent `#B3261E` used for the stamp and the primary action only. Warm neutrals `#5E5A50`, `#D9D0BE`, `#E8E0CF`.
- Motion budget: signature, with an instant-reveal reduced-motion path. Texture: premium-consumer. Single light theme, with one scoped exception: the sealed screen's night stage (see the 3D amendment below).
- No official club crest, wordmark or kit (trademark).
- Reference gap, stated plainly: no shipped ticket or stub reference exists in the set. The ticket and stub are therefore designed, not copied. The manutd and Premier League captures are partly hidden by cookie dialogs, so only their visible type and table layout are cited.

## Direction A, Matchday Programme

**Reference category:** a printed matchday programme from a football club: ruled boxes, a condensed headline, a serif standfirst, and a ticket tucked into the cover.

**Competitor / inspiration references** (4, captioned):
- ![Mundial desktop, 1px black rules box every module, tall condensed headline](.specno-design/references/rsvp-save-the-date-sports-ticket/mundial-1-desktop.png), 1px ruled boxes make the page read as a printed programme; football arrives through print culture, not a ball or crest.
- ![Man Utd desktop, serif headline over match photography with one red pill](.specno-design/references/rsvp-save-the-date-sports-ticket/manutd-1-desktop.png), a serif for headlines gives heritage; red is held for the single action. (Capture partly hidden by a cookie dialog.)
- ![Premier League desktop, league table with tabular numerals](.specno-design/references/rsvp-save-the-date-sports-ticket/premierleague-1-desktop.png), row-and-column match facts in tabular numerals, which is how the stub's data block reads. (Table visible; the rest is obscured.)
- ![Paperless Post desktop, invitation card as a physical object](.specno-design/references/rsvp-save-the-date-sports-ticket/paperlesspost-1-desktop.png), the invite is a tangible object and the page chrome stays quiet.

**Tone:** editorial, confident and dry, like a club programme's editor's letter; warm to non-fans because it reads as a magazine.

**Typographic identity:**
- Display: Barlow Condensed 700, all caps, tracking +2%. Desktop: ticket title 120/104 px, view headings 56/56 px. Mobile: ticket title 64/60 px, view headings 36/38 px. The owner's starting face; condensed caps are the language of fixture lists and kit numbers.
- Standfirst / pull lines: Source Serif 4 italic 400, 24/32 px desktop, 20/28 px mobile. The serif nod to Man Utd's headline voice, used for one line per view ("a note from Makes").
- Body: Inter 400/500, 17/26 px desktop, 16/24 px mobile (never below 16 px on inputs). Plain and legible for every age group.
- Numeric / data: JetBrains Mono 500 with tabular figures, 20 px on the stub, 14 px for the code boxes' labels. Fixed width makes the seat number and date line up like a programme's results table.

**Color thesis:**
- Primary: `#B3261E` terrace red, 5.6:1 on `#F3EDE1`. It is the stamp and the primary action only, and signals "this one matters".
- Surface family: warm. Ticket stock `#F3EDE1` on a page of `#E8E0CF`, ink rules and text `#1B1A17`.
- The one signature move: everything is ink on paper in 1px rules, and red appears only in the stamp and the next action; no red fills, no red text blocks.

**Layout primitive:** a ruled-box grid. The ticket sits inside a 1px ink frame like a programme cover, and every later view is a stack of ruled boxes on a 4-column mobile / 12-column desktop grid (one box per question group, each with a small caps label tab on the top rule). Cards with shadows are rejected; rules do the grouping. The stub returns as the same ticket, filled in, with the data block as a ruled table.

**Ticket material and rendering:** flat printed card stock, crisp vector perforation (a row of punched semicircles along the stub line), a 1px ink outline, a faint paper grain at 4% opacity. The ADMIT ONE stamp is a rotated -4 degree rubber stamp in red with a 1px inner rule.

**Motion philosophy:** "The ticket is a physical object: it answers the hand (grab, swing, tear) and lands (stamp); it settles under damping and never moves on its own after that." Amended 2026-10-14 by owner decision (supersedes "Printer's precision: one clean tear, then still"; see `lux-notes/save-the-date-2026-10-14-r2.md`). The tear still follows the pointer along the stub line and finishes with a 700 ms ease-out; the stamp lands in 180 ms with no bounce; nothing outside the ticket and its stamp moves except 160 ms fades between views. Reduced motion: the ticket and stub are swapped instantly, the tear is replaced by a "Tear open" button with no animation, and the stamp simply appears.

**Amendment, 3D ticket (owner decision 2026-10-14):** option C is chosen, an R3F/three 3D scene with the ticket hanging on a lanyard the guest can grab, swing and fling. The DOM ticket (option A) is the fallback. Build spec: `lux-notes/save-the-date-3d-lanyard-spec.md`.

**Amendment, sealed-screen stage (owner decision 2026-10-14, supersedes the "environment pending" note above):** stadium treatment A, "Floodlit Night Stand", is the stage for the sealed screen only. A dark green-black night with two floodlight banks at the top corners, two curved terraces of faint seat dots and a lit pitch band along the bottom, drawn in CSS and one small SVG behind a transparent R3F canvas; the key light in the scene matches the left floodlight. It is drawn, not photographed, and it carries no crest, wordmark, kit or red. Handoff: when the guest taps "Tear open" (or finishes the drag), the ticket settles face-front, then the backdrop fades to the `page` paper colour while the DOM ticket takes over (timings in `lux-notes/save-the-date-stadium-build.md`). Every later view (RSVP form, code, returned stub) stays on the light paper page exactly as verified (`color-scheme: light`, 26 AA-verified states). The returned stub sits on the paper page, not the stadium. The two handoff and stub points were owner defaults taken from the recommendation; both were confirmed by the owner on 2026-10-14 (decided, no longer open). Scene light values are an owner-approved amendment of 2026-10-14: key light 4.2 and ambient 1.6, tuned on the built scene, replacing the brief's 1.0 and 1.4 (see `lux-notes/save-the-date-stadium-build.md` section 2). The strap text "THIRTY UNITED", repeated, is confirmed. Record: `lux-notes/save-the-date-stadium-options.md`, build brief `lux-notes/save-the-date-stadium-build.md`.

**Density:** medium. One ruled box per question group; about 6 rows visible on a phone; generous 24 px gutters inside boxes.

**Hover / focus identity:** hover fills a ruled box's label tab with ink and flips its text to paper. Focus is a 3 px red outline offset 2 px (3:1 or better against paper) plus the box rule thickening to 2 px, so focus is never colour alone.

**The Signature**: The thing that makes this unmistakable in a screenshot is a ruled, programme-cover landscape ticket with a punched perforation that the guest tears along the stub line to open the page, and a returned stub in a ruled table with name, team and seat number in tabular mono numerals, stamped ADMIT ONE · 21 DEC 2026 in a single red rubber stamp.

## Direction B, Terrace Ticket

**Reference category:** a 1970s terrace turnstile ticket: letterpress-printed card, a slab headline, a numbering-machine seat number, a pressed ink stamp.

**Competitor / inspiration references** (4, captioned):
- ![Paperless Post mobile, invitation as a tangible card](.specno-design/references/rsvp-save-the-date-sports-ticket/paperlesspost-1-mobile.png), the object carries the emotion and the reveal is physical; we reinterpret its envelope liner as a ticket sleeve.
- ![Evite desktop, portrait cards leaning out of envelopes](.specno-design/references/rsvp-save-the-date-sports-ticket/evite-1-desktop.png), the card-in-envelope silhouette is read as "an invitation" at a glance, which the landscape ticket must match. Its confetti and gold foil are the anti-pattern.
- ![Posh desktop, one huge headline on an empty white page](.specno-design/references/rsvp-save-the-date-sports-ticket/posh-1-desktop.png), empty space and one object feel premium without decoration (this capture shows no hero image, so only the type and space are cited).
- ![Man Utd mobile, red used for one action](.specno-design/references/rsvp-save-the-date-sports-ticket/manutd-1-mobile.png), red held for the one action; the capture is mostly hidden by a cookie dialog, so only that colour discipline is cited.

**Tone:** nostalgic, tactile and warm, like a ticket saved in a coat pocket; terrace banter, gentle and family-safe.

**Typographic identity:**
- Display: Roboto Slab 800, all caps with a slightly negative tracking, 96/92 px desktop and 56/54 px mobile for the ticket title; view headings 44/48 px desktop and 30/34 px mobile. A heavy slab reads as letterpress wood type and signals "old ground", which a condensed grotesque would not.
- Body: Public Sans 400/500, 18/28 px desktop, 17/26 px mobile. Friendly, large and open for guests who rarely fill in forms.
- Numeric / data: Courier Prime Bold with tabular figures, 24 px on the stub and 28 px in the code boxes. A typewriter numbering machine gives the seat number the feel of a stamped, serial-numbered ticket.

**Color thesis:**
- Primary: `#B3261E` terrace red, 5.6:1 on `#F3EDE1`. It signals the ink of a pressed stamp, never a fill.
- Surface family: warm and slightly aged. Ticket stock `#F3EDE1` over a deeper page tone `#D9D0BE`; ink `#1B1A17` printed at 92% so it sits in the paper.
- The one signature move: the red stamp is printed slightly off-register against the ink text (1 to 2 px offset) and appears nowhere else in the interface except the primary action.

**Layout primitive:** one object, one question at a time. The ticket sits centred and large in an otherwise empty page; each later step is a single "window" on the ticket body (one question per screen, like a booking-office counter), with the stub strip on the right edge updating as the guest answers. No multi-field form wall; the form is a sequence.

**Ticket material and rendering:** letterpress. Ink gets a subtle bleed and slightly uneven coverage (an SVG turbulence filter, static, not animated), a 2% debossed type shadow, a deckled left edge, a punched perforation with real shadow in the holes and a soft contact shadow on the page. This is the richest rendering of the three, and the one with the most risk of looking skeuomorphic: keep the effects to the ticket and keep the UI around it flat.

**Motion philosophy:** "Weighty and tactile: a tear that snaps, a stamp that thunks." The tear has resistance, then a 120 ms snap and a small settle of the stub (a short spring, one overshoot); the ADMIT ONE stamp presses in with a 2 px push and a slight rotation settle. Reduced motion: instant reveal, no tear, no snap and no settle; the stamp appears in place and a static "pressed" shadow replaces the thunk.

**Density:** airy. One question per screen, a single column no wider than 480 px, large 56 px touch targets, and lots of paper.

**Hover / focus identity:** hover presses controls in (inner shadow, 1 px translate). Focus is a thick dashed 3 px red outline like a ticket-punch line, offset 3 px, so focus reads as part of the metaphor and is visible without colour alone.

**The Signature**: The thing that makes this unmistakable in a screenshot is a letterpress match ticket with a punched, shadowed perforation that the guest tears along the stub line to open the page, and a returned stub with name, team and a typewriter-numbered seat in tabular numerals, stamped ADMIT ONE · 21 DEC 2026 in off-register red ink.

## Direction C, Scoreboard Broadcast

**Reference category:** matchday TV graphics: the lower-third, the team-sheet line-up and the scoreboard strip, rendered in ink on newsprint.

**Competitor / inspiration references** (4, captioned):
- ![Copa90 desktop, BREAKING NEWS lower-third over a crowd](.specno-design/references/rsvp-save-the-date-sports-ticket/copa90-1-desktop.png), a tag chip plus a bar with a ticker line says "football" without a ball or crest. Its glitch intro and orange pixel face are the anti-pattern, and the capture shows only the intro splash.
- ![Premier League desktop, compact table rows with position and tabular numerals](.specno-design/references/rsvp-save-the-date-sports-ticket/premierleague-1-desktop.png), numbered rows with tabular numerals become the team-sheet form. (Cookie dialog covers the rest of the page.)
- ![Partiful desktop, one heavy all-caps headline on near-empty black](.specno-design/references/rsvp-save-the-date-sports-ticket/partiful-1-desktop.png), a single oversized display voice and chat-style bubbles; we keep the voice and drop the nightlife register.
- ![Mundial mobile, condensed headline with a black button, ruled sections](.specno-design/references/rsvp-save-the-date-sports-ticket/mundial-1-mobile.png), a condensed headline above hard-edged ink blocks.

**Tone:** loud, quick and playful like a match commentator, still kind to non-fans; short punchy status lines instead of paragraphs.

**Typographic identity:**
- Display: Big Shoulders Display 900, all caps, 132/110 px desktop and 72/64 px mobile for the ticket title; view headings 56/52 px desktop and 38/38 px mobile. Its tall, narrow, almost mechanical build looks like a stadium scoreboard and gives more impact per width than Barlow on a 360 px screen.
- Body: IBM Plex Sans 400/500, 16/24 px on both desktop and mobile (inputs 16 px). A neutral technical sans that stays out of the way of the display face.
- Numeric / data: IBM Plex Mono 600 with tabular figures, 22 px on the stub; shirt-number badges 28 px. Reads as a scoreboard digit and keeps the seat, date and countdown aligned.

**Color thesis:**
- Primary: `#B3261E` terrace red, 5.6:1 on `#F3EDE1`, used for the stamp, the primary action and the "LIVE" style status dot only.
- Surface family: neutral-warm with heavy ink. Paper `#F3EDE1` carries the ticket; solid ink `#1B1A17` bars (with paper-coloured text, 14.9:1) carry the broadcast strips and chips.
- The one signature move: solid ink strips with paper text are the only dark areas on the page, and they behave like lower-thirds; nothing else is dark, so the light theme stays intact.

**Layout primitive:** a team sheet. After the tear, the form is a numbered line-up: each field is a row with a shirt-number badge (1 to 11), a label on the left and the input on the right, grouped under ink "tag chips" (ATTENDANCE, YOU, YOUR TEAM, CONTACT). A persistent lower-third strip under the ticket carries status ("VENUE: TBA", "CODE SENT"). The stub returns as a match-card: name as the headline, team and seat in a scoreboard row.

**Ticket material and rendering:** printed programme newsprint with sharp, high-contrast edges: ink frame, punched perforation, a thin ink score line and a scoreboard-style data row. No texture beyond a faint halftone at the stub edge. The ADMIT ONE stamp is a hard-edged red label (a lower-third chip) rather than a rubber stamp.

**Motion philosophy:** "Broadcast cuts: fast wipes, a hard rip, no springs." The tear is a 500 ms rip with a linear wipe of the lower-third in from the tear origin (240 ms, linear); view changes are 200 ms horizontal wipes; the lower-third ticker scrolls slowly (a single status line, about 20 px/s), and it pauses on hover and focus. Reduced motion: instant reveal, no wipes, the ticker is a static line, and the stamp chip appears in place.

**Density:** compact. More rows per screen (about 8 on a phone), tighter 12 px row gaps, small chips; the team sheet reads like a list, so the whole RSVP can be scanned at once.

**Hover / focus identity:** hover swaps a row's shirt-number badge to ink-filled. Focus is a solid 3 px ink outline with a 2 px red inner ring (not colour alone), and the focused row's number badge inverts, like a player being highlighted on screen.

**The Signature**: The thing that makes this unmistakable in a screenshot is a scoreboard-built landscape ticket with a punched perforation that the guest tears along the stub line to open the page, and a returned team-sheet stub with name, team and seat number in tabular scoreboard digits, stamped ADMIT ONE · 21 DEC 2026 in a red broadcast tag.

## Distinctiveness Test

> **If a stranger sees one screenshot of this product, what specifically tells them it is *not* a generic AI-generated SaaS template?**

A paper landscape match ticket with a punched perforation, and a returned stub carrying the guest's own name, team and tabular seat number under a red ADMIT ONE · 21 DEC 2026 stamp, on a page with no cards, gradients or confetti. (Drawn from the owner's Distinctiveness Sentence; the three directions differ in how the ticket is printed, but all three pass this test.)

## Decision

- **Chosen:** Direction A, Matchday Programme
- **Date:** 2026-10-14
- **Rationale:** Chosen by the owner on 2026-10-14 (reasons not given, so the points below are the design case made at proposal). A reads as a printed club programme, which is how football reaches guests who do not follow it: ruled boxes, a condensed headline and a serif note from Makes feel like a magazine, not a fan page. The ticket sits inside a programme-cover frame, the form is a stack of ruled boxes with no cards or shadows, and red stays on the stamp and the next action only. That keeps the page calm for guests aged 20 to 70 who rarely fill in forms, and it makes the returned stub (name, team, tabular seat number, ADMIT ONE stamp) the one loud object. Light theme only (`color-scheme: light`), with AA contrast, `forced-colors` and 200% text support.
- **Rejected directions** (preserved as hard constraints for future sessions):
  - Direction B, Terrace Ticket. Why rejected: owner's call, no reason given. Risks noted at proposal: the letterpress rendering (ink bleed, deckled edge, shadowed perforation) risks looking skeuomorphic, and its one-question-per-screen sequence adds steps to a form that should take under a minute.
  - Direction C, Scoreboard Broadcast. Why rejected: owner's call, no reason given. Risks noted at proposal: the loud broadcast register (solid ink strips, scrolling ticker, wipes) pushes the page toward sports media and away from a warm personal invite for non-fans.
- **Re-evaluation trigger:** Never for the 21 December 2026 event. Revisit only if early guests report that the page is hard to read or complete.

## Bindings

- Typography → `tokens.md` (canonical) sourced from the chosen direction's typographic identity.
- Color → `tokens.md` primary + surface families sourced from the chosen direction's color thesis (all three share Palette A).
- Motion → `tokens.md` motion philosophy; motion budget is `signature`, so `animate` uses the `motion` library for the tear and the stamp, and always provides the reduced-motion path.
- Component personality → `components.md` written with the chosen direction's layout primitive as the structural constraint.
- Verify → `verify` skill's anti-slop check audits against the chosen direction's Signature sentence.
- Design review → dimension F (Direction conformance) checks the page against the chosen direction's references and reports the result as judgment, separately from the other dimensions.
- Communication → Section "Communication plan" below sets the reading mode per view and the channel map.

## Communication plan

**Reading mode by view type:**

| View type | Mode | Why (one line) |
|---|---|---|
| Sealed ticket, stub (Yes/Maybe/No) | glance | One object, understood in about two seconds. |
| Attendance, details form, No form, code entry | scan | Short forms, a few fields compared in about ten seconds. |
| Help, legal, article | read | Not present in this project. |

**Channel map** (project override of the defaults, from the brief):

| Meaning | Channel |
|---|---|
| Action | Icon plus short label; the tear is a real button with an accessible name. |
| Hierarchy | Type size and weight, position (the ticket is always the largest object). |
| State | Colour plus an icon state change plus an accessible name; Maybe is an outlined stamp, No is a void rule, Yes is the full red stamp. |
| Grouping | Position and shared surface (rules in A, one-question windows in B, tag chips in C). |
| Cause and effect | Motion from the tear origin, with a static equivalent for reduced motion. |

**Stranger sentence for glance views:** "A first-time user understands this view in two seconds without reading."
