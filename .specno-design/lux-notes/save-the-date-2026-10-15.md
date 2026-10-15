# Lux Consultation, save-the-date (Direction D)

**Date:** 2026-10-15
**Brief texture:** premium-consumer
**Direction.md chosen:** D, "Matchday: The Signing" (owner reply "defaults", 2026-10-15)
**Signature:** "The thing that makes this unmistakable in a screenshot is that the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing." (Pixel's wording, accepted through "defaults".)

Lux consultation for the save-the-date journey, all beats. Direction D chosen; brief texture premium-consumer; past `LUX:` entries: 15 (round 1, build, round 2, stadium A, owner decisions), with two left "in question" by the 2026-10-14 owner override. Read: `briefs/save-the-date-brief.md`, `direction.md`, `references/immersive-night-world-rsvp-2026-10-15.md`, `feedback.md`, `audits/cinematic-recommendation-2026-10-15.md`, and the plugin's `lux-principles.md` and `lux-references.md`.

This note replaces round 1 (`save-the-date-2026-10-14.md`) and round 2 (`save-the-date-2026-10-14-r2.md`) for Direction D. Those two stay as history; where they disagree with this note, this note wins.

## The three open questions, settled against decision 5

Decision 5 (owner, through "defaults"): go all out, within limits. Ambient embers, smoke and cloud at 30 Hz on T3 and T2, paused when the page is hidden and during the code beat; a Still chip for anyone; nothing loops under reduced motion.

| Commit in question | Ruling | Where it binds | Where it does not |
|---|---|---|---|
| **Quiet by default, voice when chosen** | Kept, recast by layer | The UI layer: one solid panel, two small chips, one primary button per beat, red on that button only, no motion on the panel beyond its content change. Chrome stays under about 45 percent of a phone's height and carries no decoration | The world. "Go all out" is the owner's instruction for the picture, and the picture is the content, the way photography is the content in Aman's app. The brand's full voice is chosen once: the finale's ignition, number and stamp. Every beat before it is a step up in light, not a new effect |
| **Inevitability through restraint** | Kept, as refusals | Every cut in the recommendation's "where I disagree with a consultant" table: no bloom or post pass, no halftone, no wipes, no gyro, no video, no forward camera travel, no promotion between tiers, one 9:16 poster format, lamps not digits on the code beat, no poster for a No, no second figure for a plus-one. "Go all out" sets the ambition of the picture; restraint sets how few effects carry it | It does not mean a sparse world. The poster is dense by design (eight planes, embers on every plane), because the reference set is |
| **Nothing loops** (round 2) | Reversed in part | Still binds under reduced motion (T0), on the UI layer (panel and chips never loop), for the whole code beat (the ground holds its breath), when the tab is hidden, and for anyone who presses Still | Reversed for ambient motion on T3 and T2: clouds, smoke and embers at 30 Hz. Owner decision 5 decides it, and the round-2 rule was written for a ticket on a page, not a world |

## Committed Properties (and why)

- **Material truth**: the materials here are paint and light, and the poster must obey its own light. One cold key from the upper right, one hot colour, floodlights that light what is under them, a moon drawn at its real phase over the party. Faked or inconsistent light is what makes AI key art look cheap.
- **Specificity over generality**: the product is his face and your shirt. Nothing in it could be another party's invite: Makes in every frame, your name lettered as you type, your number (`ticketNo`) revealed only after the code, his date and his (still TBA) venue on the poster.
- **Time visible in detail**: a cinematic journey is usually one hero beat and neglected edges. Here every beat has its T1, T0, forced-colours and No variant designed, and the code beat (the dullest step) gets the most care.
- **Multi-sensory**: sound and haptics are already built and owner-approved (round 2). Each beat now has one considered pairing of light, sound and haptic; none is "added later".
- **Quiet by default** (recast, above): for the UI layer only.
- **Inevitability through restraint** (above): as refusals.

## Not Committing (and why)

- **Patina-aware**: the page lives for a few weeks and each guest visits once or twice. There is nothing to deepen with use. The poster the guest keeps is the only thing that ages, and it should look like the night, not age with them.

## Calibration References

- **Aman Resorts (iOS app)**: the silence of the chrome. The picture does the work and the interface almost disappears. Steal it for the panel: solid, square, one rule, no ornament, nothing that competes with the poster.
- **Tesla (iOS app)**: the user's own object as the hero image, rendered with their configuration. Here that object is the guest's shirt with their name and number, held up by Makes.
- **On Running (iOS app)**: the run-summary card as "a printed receipt of a personal accomplishment". The saved poster is that receipt: set once, carried away, never uploaded.

## Specific Moves for the Build

### Quiet by default (UI layer)
- One primary button per beat, the only `shirt-red` on the panel; everything else on the panel is white, moonlight or `line`.
- The panel never animates as a surface (no slide, no bounce, no wipe); only its content changes (`panel-change`, 250 ms), and focus moves to the new heading.
- The chips are icon plus one word, solid `panel`, top right, and nothing else floats over the scene: no progress dots, no stepper, no badge.

### Inevitability through restraint
- Glow comes from the lights-on plate and additive sprites, never a bloom pass; grain and vignette are one static CSS overlay.
- Each beat is one shot and one light change. If a beat seems to need a second effect, cut the effect, not the beat.
- The code beat is the quietest moment on purpose: ambient off, six lamps, nothing else moves.

### Material truth
- Bank strikes reveal the lights-on plate through its own masks, so lit areas match the painted lamps; glow sprites sit on the lamp heads, never in empty sky.
- The moon is drawn in code at its 21 December 2026 phase (about 93 percent waxing gibbous; default accepted, the phase itself is still an estimate), and the moonlight rim on Makes comes from the same upper right.
- The shirt lettering is warped to the shirt quad and displaced by the shirt's depth map, so the name sits in the folds instead of floating on top.
- The title sits in a painted band of empty sky and is depth-sorted behind Makes, as in the MATCHDAY reference; Claude measures it against that band's brightest pixel on every plate.

### Specificity
- The number area on the shirt stays empty, with a faint ghost outline, until the code is right: the number is the reward.
- "Bringing someone" adds "+ name" to the poster's credit line, not a second figure; the team is plain text on the same line, never a badge.
- The No path keeps Makes waving with the lights at their pre-match level: a warm ending, not a punished one.

### Time visible in detail
- T1 keeps the light meter: four opacity-switched bank layers, so a guest without WebGL still counts the lights.
- Leaving for the email app: the canvas stops and releases its textures; on return the identical still is already showing while the canvas rebuilds.
- Wrong code: the six lamps go out together over 200 ms, the error sits on the panel with its icon, haptic [10, 30, 10]; nothing shakes.
- Save your poster has alt text naming what is on it, and "Save it now. We don't keep a copy." is true because the poster never leaves the phone.

### Multi-sensory
- Each strike pairs light (600 ms, one way), a floodlight clunk with a 120 Hz hum swell (nothing below 100 Hz, which phone speakers can't play) and a 12 ms haptic.
- The finale is the one moment where all channels land together: hush on the dim, drum and 22 ms on the number, crowd swell on ignition, the built stamp thump.
- Sound follows only its own opt-in, so a guest who asks for less motion can still hear the crowd.

## Open Questions

- Makes's likeness on every shared poster: answered "likeness yes" (2026-10-15). His photo arrived on 2026-10-15; the first G1 attempt is in review, not approved.
- Whether the Still chip should also mute sound (current answer: no; Still is about motion, Sound has its own chip).
- Whether the cover's draft h1 "You've been called up" survives his rewrite; the beat names (Chapter 1, Chapter 2, Seal it) are drafts too.
