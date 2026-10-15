---
name: feedback
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
lastUpdated: "2026-10-15"
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

## 2026-10-14 (stadium stage)

### Context
Owner tested the lanyard spike in WhatsApp and asked for a stadium background. He chose treatment A from `lux-notes/save-the-date-stadium-options.md`; he answered only that question, so the other two points are defaults he can override.

### Decisions
- LUX: Committed. Stadium A, "Floodlit Night Stand", is the stage for the sealed screen only: a drawn CSS/SVG night bowl behind a transparent R3F canvas, with the three key light matching the left floodlight. It is not a photo, carries no red, crest or kit, and never moves after the entrance. This amends brand.md's "no stadium photo" and "dark theme" lines for that stage alone. (Owner: chose A.)
- LUX: Committed (default, owner may override). After "Tear open" the stage fades to the paper `page`; the RSVP form, code and stub views stay light and AA-verified. A dark stage behind the form would re-open every contrast and forced-colors check.
- LUX: Committed (default, owner may override). The returned stub sits on the paper page, not the stadium.
- INSIGHT: On the night stage, red alone fails 3:1 (2.86:1 on deep, 1.51:1 on the pitch band) and the ink strap is 1.08:1. The "Tear open" button needs a 2px paper outer ring, the focus ring a paper outer ring, and the strap paper stitching and caps. Do not drop these as clutter.
- CORRECTION: The stadium note said the scene must live in the CSS file because the CSP blocks inline styles. CSSOM writes (React, `motion`) are not blocked; only literal `style="..."` attributes in static HTML are.

## 2026-10-14 (owner decisions, 3D ticket and stadium A)

### Context
Owner settled the four open points for the 3D ticket and stadium A. This section closes the two "Committed (default, owner may override)" lines in "2026-10-14 (stadium stage)" above.

### Decisions
- CORRECTION: Scene light values. Key light 1.0 and ambient 1.4 (brief, `lux-notes/save-the-date-stadium-build.md` section 2) → key 4.2 and ambient 1.6 as built (`src/components/three/LanyardTicket.tsx:16-17`). Owner-approved amendment: keep the built values. Reason: tuned on the built scene.
- LUX: Committed, now decided. After "Tear open" the stadium fades to the paper `page`; the RSVP form, code and stub views stay light and AA-verified. (Owner: yes. Was a default he could override.)
- LUX: Committed, now decided. The returned stub stays on paper, not the stadium. (Owner: yes. Was a default he could override.)
- ACCEPTED: Strap text is "THIRTY UNITED", repeated, as built. (Owner: confirmed. Closes open question 4 in `lux-notes/save-the-date-3d-lanyard-spec.md`.)
- ACCEPTED: The Netlify badge stays; its CSP console errors are accepted. (Owner: confirmed earlier.)

## 2026-10-14 (owner override, redesign: the world and the journey)

### Context
Owner reviewed the built page tonight and overrode the chosen direction. This section supersedes "AESTHETIC: Chosen A, Matchday Programme" and Palette A "Matchday Paper" above. Earlier entries stay as history. The direction gate is closed, pending the owner's pick (`direction.md`, `chosenDirection: null`); the previous gate is archived at `direction-archive/2026-10-14.md`.

### Decisions
- AESTHETIC: Overridden by the owner. Chosen A, Matchday Programme, and Palette A (`#F3EDE1` paper, `#1B1A17` ink, `#B3261E` terrace red). Owner: "I still don't like the color or theme currently and I feel like we still being safe! … go all out … Don't hold back at all". The paper palette, terrace red as the brand accent and the drawn CSS green night stand (stadium A scene tokens) are out. A new palette is required.
- REJECTED: The RSVP as a form. Owner: "the second part felt too much like a boring form that people might get tired of filling in, it also needs to feel like a story or journey. Just something interactive that makes you feel you want to finish the form." Every step becomes a moment in a journey with an interaction, and each input stays accessible, keyboard-operable and WCAG 2.2 AA over the scene.
- AESTHETIC: Rejected B "Terrace Ticket" and C "Scoreboard Broadcast" stay rejected. New directions must not drift into them: no letterpress ink bleed, deckled edge or off-register stamp (B); no solid ink strips, scrolling ticker, wipes, shirt-number form rows or scoreboard digits (C). B also carried "one question per screen"; the new journeys group fields into beats and keep that rejection.
- CORRECTION: World. Keep football. A stylised miniature night stadium the guest is inside: floodlights through haze, a glowing pitch, the ticket living in it. No club crest, wordmark or kit (trademark, unchanged).
- CORRECTION: Reach. The world persists behind every step: sealed ticket → attendance (Yes / Maybe / No and plus-one) → details (name, email, WhatsApp) → email code → returned stub. This reverses two commits marked decided earlier today: "after Tear open the stadium fades to the paper page; the RSVP form, code and stub views stay light" and "the returned stub stays on paper, not the stadium". Light-theme-only (`color-scheme: light`) is reversed with them (inferred from the reach decision; confirm); contrast, `forced-colors` and 200% text must be re-proven over the scene.
- INSIGHT: Ambition calibration. Two reference videos from the owner, copied to `references/immersive-night-world-rsvp/owner-calibration/`. @Guronnimo ("one shotted with Opus 5.5"): a first-person meadow of cursor-reactive grass, wildflowers and haze, with a Morning / Golden / Night chip that relights the world. @flxrnc: an autumn cottage diorama on a dark lacquered turntable, lit windows, lamp posts, chimney smoke, falling leaves, dusk haze and an orbiting camera. Both are whole lit worlds where the UI is one small chip; the current page is a page with a 3D object on it. That gap is the redesign.
- LUX: In question, not resolved. The commits "quiet by default" and "inevitability through restraint" (`lux-notes/save-the-date-2026-10-14.md`) sit against "go all out … Don't hold back at all". Lux is re-run after the owner picks a direction; until then neither commit binds the new directions.
- LUX: In question, not resolved. Round-2 "nothing loops" (`feedback.md`, 2026-10-14 round 2). All three proposed directions carry ambient haze and motes; decided in the lux re-run after the pick.

## 2026-10-15 (owner decision, direction gate: Matchday: The Signing)

### Context
Makes read `audits/cinematic-recommendation-2026-10-15.md` and replied "defaults". That accepts the recommended hybrid, all eight decisions with their defaults, and the "defaults I'm taking unless you object" list. The direction gate is closed on Direction D. This section supersedes the two "LUX: In question, not resolved" lines of 2026-10-14 (owner override) above.

### Decisions
- AESTHETIC: Chosen. Direction D "Matchday: The Signing" (owner: "defaults"). Signature: "The thing that makes this unmistakable in a screenshot is that the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing." Pixel's wording, accepted through "defaults"; the owner did not write it. A hybrid of phase 1 concepts S1 (living poster, the spine), S3 (floodlight meter) and S2 (call-up story frame).
- AESTHETIC: Considered, not chosen. Directions A "Tabletop Ground", B "The Walk-Out" and C "Lights On" of 2026-10-15. Not hard constraints: D keeps B's call-up story and C's bank-by-bank floodlights. Rejected B "Terrace Ticket" and C "Scoreboard Broadcast" of 2026-10-14 still bind.
- ACCEPTED: Decision 1, crests and club marks. None, anywhere, ever (`brand.md`, Marks and imagery). G1 is generated crest-free; his AI poster is a head-and-neck likeness reference only. (Owner: "defaults".)
- ACCEPTED: Decision 2, the guest's shirt number is `ticketNo`: "17" on the shirt, "017" as the seat, revealed only in the finale. No backend change. (Owner: "defaults".)
- ACCEPTED: Decision 3, no poster for a No. They get his wave, a warm line and "Changed your mind?". (Owner: "defaults".)
- ACCEPTED: Decision 4, preferred name if given, otherwise first name, on the shirt and poster. Never the surname. (Owner: "defaults".)
- ACCEPTED: Decision 5, go all out within limits: ambient embers, smoke and cloud at 30 Hz on T3 and T2, paused when hidden and on the code beat; a Still chip for anyone; nothing loops under reduced motion. (Owner: "defaults".)
- ACCEPTED: Decision 6, the lanyard stays on the cover as one object inside the world canvas (B2); B3 (retire it, keep the DOM tear) is the cut line. (Owner: "defaults".)
- ACCEPTED: Decision 7, Makes generates the plates with his own tool and the section 3 prompts; Claude does all processing. Needs his front-facing photo on disk and a tool with an edit mode. (Owner: "defaults".)
- ACCEPTED: Decision 8, "Monday 21 December 2026 · Venue TBA" on the panel, "MON 21 DEC 2026 · VENUE TBA" on the poster, no kick-off time until there is one. (Owner: "defaults".)
- ACCEPTED: The "defaults I'm taking unless you object" list: his AI poster's painted semi-real style with anime key-visual lighting; the ball as the power object, nothing pointed at the camera, Makes smiling; "THIRTY" on the cover becoming "THIRTY UNITED" at the signing; the section 2 copy as drafts for him to rewrite; sound stays on under reduced motion if opted in, synthesised only; the built haptic values plus 8 ms and 12 ms strikes and [10, 30, 10] for a wrong code, Android only; the plus-one as "+ name" on the credit line; no video, no bloom, a 1080 × 1920 poster only; the moon drawn at about 93 percent waxing gibbous (the phase itself is still an estimate). (Owner: "defaults".)
- CORRECTION: Colour scheme light → dark. `color-scheme: dark`, panel `#18131F`, moonlight `#B7D3FA`, shirt red `#9F0B19` (button fills only, with a 2 px moonlight ring), poster red `#F81E24` (display and decoration only), error `#FF9E8F`. Every pair re-measured in `tokens.md`.
- CORRECTION: `brand.md` amended. Illustration on every view (reverses "the ticket is the only illustration"); red in the scene (reverses "no red in the scene"); Makes's likeness as the hero (consent given, see 2026-10-15 follow-up); ambient motion within decision 5. The crest ban is kept unchanged.
- LUX: Committed, recast. Quiet by default holds for the UI layer only (one panel, two chips, one primary button per beat); the world is loud by design, and the brand speaks at full voice once, at the finale ignition. See `lux-notes/save-the-date-2026-10-15.md`.
- LUX: Committed, kept. Inevitability through restraint, held as a list of refusals: no bloom or post pass, no wipes, no gyro, no video, no forward camera travel, lamps instead of digits, one poster format, no poster for a No.
- LUX: Reversed in part. Round-2 "nothing loops": reversed for ambient motion on T3 and T2 (decision 5); kept under reduced motion, in the UI layer, on the code beat and for anyone who presses Still.
- LUX: Committed. Material truth (honest painted plates, a moon at its real phase, light that comes from the floodlights in the picture), specificity (his face, your shirt, your number), time visible in detail (every beat has its reduced-motion, forced-colours and No variant), multi-sensory (sound and haptics tuned per beat). Not committing: patina-aware.
- INSIGHT: Contrast pairs that fail and stay by design: shirt red on the panel 2.20:1 (the moonlight ring carries the edge), white on poster red 4.04:1 (poster red is never a fill on the UI layer), moonlight on floodlight white 1.50:1 and on the moon core 1.38:1 (chips over the scene are solid panel chips, and their focus ring gets a 2 px panel halo). Do not drop the ring or the halo as clutter.

### Pending (owner)
- The owner's decision on G1: keep the photo-real attempt, or have it repainted in the painted poster style. The photo and the likeness consent are no longer pending.

## 2026-10-15 (owner follow-up: likeness, wireframes, defaults)

### Decisions
- ACCEPTED: Likeness. Makes replied "likeness yes" to "may my likeness appear on every shared poster". His likeness may appear on every shared poster. G1 is unblocked; his photo arrived later the same day (see 2026-10-15 G1 attempt and phase 0a). (Owner: "likeness yes".)
- ACCEPTED: The nine wireframes in `wireframes/save-the-date-signing-2026-10-15/` (`variant-C-01` to `variant-C-09`). (Owner: "wireframes ok".) `wireframes/save-the-date-signing-2026-10-15/CHOSEN.md` is written from `variant-C.md` before the build.
- ACCEPTED: The moon drawn at about 93 percent waxing gibbous on 21 December 2026. The phase itself is still an estimate; the default is accepted, not verified.
- ACCEPTED: Typography stays the four shipped faces plus SVG title lockups. The brush font is picked in the asset phase.
- ACCEPTED: The draft copy ("You've been called up", "Your shirt", "Seal it", "SIGNED", "PENCILLED IN", "Save it now. We don't keep a copy.") stays as drafts until he rewrites it.

## 2026-10-15 (G1 first attempt, phase 0a iPhone result)

### Decisions
- INSIGHT: His front-facing smiling photo is now on the owner's machine, outside the repo and deliberately not committed. The first G1 attempt came back on 2026-10-15. It passed the no-trademark checklist: no crest, sponsor, stripes, star ball, text or signage.
- INSIGHT: **G1 in review, not approved.** It waits on the owner because: it is photo-real rather than the painted style; it is 941x1672, under the 1080x1920 minimum; the floodlights are already on; and the head sits about 17% down instead of 28%.
- INSIGHT: Phase 0a, iPhone (owner's DEVICE PROBE screenshot). A link from a personal WhatsApp chat opened in Safari, the system browser, not a WebView (iPhone OS 18_7, Version/18.7.7 Mobile Safari). `canShare(files)` true; `vibrate` undefined; WebGL2 yes, max texture 16384, 4 cores, dpr 3, `deviceMemory` n/a. `sessionStorage` survived a reload (not a process kill). 3D chunk ready at 1730 ms, first frame at 2131 ms. Android is still untested.
- CORRECTION: Stamp text colour. `tokens.md` said white on poster red, which measures 4.04:1 and fails 4.5:1. The build uses dark panel text (`panel` `#18131F`) on `#F81E24`, which measures 4.52:1. The contract now matches the build.

### Pending (owner)
- Keep the photo-real G1 attempt, or have it repainted in the painted poster style.
