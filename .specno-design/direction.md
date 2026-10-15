---
name: direction
schemaVersion: "1.0"
clientName: thirty-united
chosenDirection: D
chosenDirectionName: "Matchday: The Signing"
briefTexture: premium-consumer
luxNoteRef: .specno-design/lux-notes/save-the-date-2026-10-15.md
proposedAt: 2026-10-15
chosenAt: 2026-10-15
referenceSet: .specno-design/references/immersive-night-world-rsvp-2026-10-15.md
profileVersion: "1.0.0"
---

# Direction: Thirty United (redesign: the world and the journey)

**Chosen: Direction D, "Matchday: The Signing"** (owner, 2026-10-15). Makes replied "defaults" to `audits/cinematic-recommendation-2026-10-15.md`, which accepts the recommended hybrid and all eight decisions with their defaults. He did not write the Signature or the Distinctiveness Sentence himself; both are Pixel's wording, accepted through "defaults". The likeness question is answered ("likeness yes"), and on 2026-10-15 the owner kept the photo-real render for the plates (see Plate style below).

## History

- **2026-10-14, superseded.** Direction A "Matchday Programme" was chosen with Palette A (paper `#F3EDE1`, ink `#1B1A17`, terrace red `#B3261E`), built, verified and amended with a 3D lanyard ticket and a floodlit night stage on the sealed screen only. That gate is preserved unchanged at `.specno-design/direction-archive/2026-10-14.md`.
- **2026-10-14, owner override.** "I still don't like the color or theme currently and I feel like we still being safe! … go all out … Don't hold back at all", and "the second part felt too much like a boring form that people might get tired of filling in, it also needs to feel like a story or journey." Logged in `feedback.md` (2026-10-14, owner override). The gate is closed, pending the owner's pick (`chosenDirection: null`).
- **Still binding from 2026-10-14:** rejected B "Terrace Ticket" (letterpress ink bleed, deckled edge, off-register stamp, one question per screen) and rejected C "Scoreboard Broadcast" (solid ink strips, scrolling ticker, wipes, shirt-number form rows, scoreboard digits). None of the four directions below uses any of these.
- **2026-10-15, owner gameday set.** Makes sent four images (three anime matchday graphics and his own AI poster, "MAKES 08"), which moved the brief toward cinematic matchday key art with him as the hero. Pixel's phase 1 audit (`audits/cinematic-audit-2026-10-15.md`) drew five concepts (S1 to S5) from them; phase 2 (`audits/cinematic-recommendation-2026-10-15.md`) recommended a hybrid of S1, S2 and S3, recorded below as Direction D. Directions A, B and C predate the gameday set.
- **2026-10-15, owner decisions after the first G1 attempt.** (1) Plates stay photo-real: the earlier painted, anime-lit style is dropped; palette, light logic and composition rules are unchanged. (2) The footer line "Makes, 21 DEC 2026" is removed; the date is on the cover. (3) The team or "NEUTRAL" line and the sport are not shown after saving or on the poster; the data is still collected for the host. (4) The draft copy and timing stay as built: the panel shows straight away, the No ending has no warm closing line, and Chapter 2's standfirst is "Your name goes on the back. A few lines so I can seat you properly." (5) Until Surname has a value, the shirt shows only the first word of the name. Logged in `feedback.md` (2026-10-15, owner decisions after the first G1 attempt).
- **2026-10-15, gate closed.** Owner reply: "defaults". Direction D chosen; A, B and C are recorded as considered and not chosen (see Decision).

## Brief Summary

**Thirty United**: a one-link RSVP for Makes's 30th (Monday 21 December 2026), opened by friends and family aged 20 to 70 on phones, many on low-end Android in WhatsApp's in-app browser, many not football fans. The guest opens Makes's own matchday poster, alive in depth layers, and moves through it to RSVP, verify an email code and get a poster of their own signing. The stakes are personal: the page must make people want to finish. Full brief: `.specno-design/briefs/save-the-date-brief.md`.

**Shared by A, B and C as proposed** (D keeps the journey rules, the frozen backend, the CSP note and the crest ban below, but its world is Makes's poster rather than a miniature ground, and its ladder is the T3 to T0 tier set in its own block):

- **World:** a stylised miniature night football ground the guest is inside, with floodlights through haze, a glowing pitch and the ticket living in it. It persists behind every step: sealed ticket, attendance (Yes / Maybe / No and plus-one), details, code, stub. No crest, wordmark, kit or real ground.
- **Journey rules** (brief): every step is a place or moment, and every answer gets a reaction in the world. A plain labelled DOM control completes each step with one tap, Enter or Space, so the world never has to be played. Details stays one grouped beat, never one question per screen. Text never sits on the moving scene; it sits on the direction's solid step surface. Answers persist in `sessionStorage` as today.
- **Fallback ladder, three rungs, all in the same world:** (1) WebGL world; (2) a 2D version of the same world (baked stills or layered illustration, same palette, same beats) on no WebGL2, context loss, slow frames, `deviceMemory` of 2 or less, or a chunk failure; (3) reduced motion and forced colours: rung 2 with instant swaps and no particles, and in forced colours the scene is hidden and the UI uses system colours. The old paper flow is not a rung.
- **Frozen:** Convex and the RSVP logic. Nothing may show other guests' data. The guest's own `ticketNo` may drive "your seat lights up".
- **CSP:** no `unsafe-inline`, no wasm today. Draco, Meshopt and KTX2/Basis decoders need a CSP change, so render-cost notes assume plain glTF with quantised attributes and WebP textures unless the architecture pass changes that. Download figures below are estimates for that pass to size, not measurements.
- **Palette:** Palette A and the old scene tokens (`#0B1411`, `#16231E`, `#22342D`, `#FFF6DC`, `#2F5D3A`, `#2A4A31`) are out. Each direction has a new palette with computed contrast (WCAG formula, 2026-10-15).
- **Lux (as proposed):** "quiet by default" and "inevitability through restraint" were in question against "go all out", and so was the round-2 rule "nothing loops". Settled on 2026-10-15 for Direction D in `lux-notes/save-the-date-2026-10-15.md`: quiet by default holds for the UI layer, restraint holds as a list of refusals, and "nothing loops" is reversed for ambient motion on T3 and T2 but kept under reduced motion, in the UI layer and on the code beat.

## Direction A, Tabletop Ground

**Reference category:** a collector's model of a small floodlit football ground, at table-football scale, on a dark lacquered turntable. You travel through it at the height of a figure on its base, and only at the end does the camera pull back to show that the whole night was a model built for you.

**Competitor / inspiration references** (5, captioned):
- ![flxrnc contact sheet: a lamp-lit cottage on a lacquered turntable, dusk haze, orbiting camera](.specno-design/references/immersive-night-world-rsvp/owner-calibration/flxrnc-sheet.jpg), a whole world as one object, lit from inside by its own lamps, with haze spilling off the plinth rim. Our ground replaces the cottage.
- ![flxrnc frame: window and door light pooling on a stone path](.specno-design/references/immersive-night-world-rsvp/owner-calibration/flxrnc-02.jpg), light pools on the ground from sources inside the model; our floodlights pool on the pitch the same way.
- [external reference: https://en.wikipedia.org/wiki/Subbuteo], table football's figures on round weighted bases and its floodlight and stand accessories give the scale, and give the guest's name a home (the base).
- ![Messenger desktop: one tiny world centred in a flat void](.specno-design/references/immersive-night-world-rsvp/abeto-messenger-1-desktop.png), a bounded world framed alone in a calm void reads instantly on a portrait phone.
- ![Guronnimo Night frame: moon, fireflies, a world relit by one chip](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-05.jpg), the end-state relight chip and the motes drifting in the light.

**Tone:** affectionate and a little magical; a model someone built for you and lit for one night.

**The world:** a round lacquered plinth with a high-gloss rim. On it, a compact ground: a mown pitch with chalk lines, four lattice pylons with sodium lamp heads, two low stands of tiny seats, a turnstile hut at one corner with three lanes, and a tunnel mouth with a gate. Haze pools round the pylons and spills over the rim into a dark violet room. The guest's figure is a small plain figure on a round base: no number, no crest, kit in lacquer and chalk.

**Typographic identity:**
- Display: Archivo Expanded (variable, `wdth` 125) 800, sentence case. Desktop step headings 64/68 px, mobile 36/40 px; ticket title 56/56 px on mobile. Wide letterforms read like the box art of a model kit and the signage on a small ground.
- Body: Atkinson Hyperlegible Next 400/600, 17/26 px desktop, 16/24 px mobile (inputs 16 px). Drawn for legibility, which matters for guests up to 70 reading light text on a dark surface.
- Numeric / data: Atkinson Hyperlegible Mono 500 with tabular figures; seat number 28 px, code cells 28 px.

**Color thesis:**
- Lighting story: the four sodium lamps are the only light. They pour amber pools onto an emerald pitch and catch the plinth's gloss rim; everything off the plinth falls into violet haze.
- Primary: sodium amber `#FFB547`, the lamp colour. In the UI it is the next action and nothing else (10.65:1 against its lacquer label; 9.02:1 against the haze scene).
- Surface family: warm-dark. Lacquer `#1A0F14` (step surface), night haze `#231E3D` (room), chalk `#EDE9F5` for text (15.66:1 on lacquer) and pitch lines, muted `#B9B2C9` (9.15:1), input borders `#8C84A3` (5.30:1). In-scene only: lit pitch `#2E7D52`.
- The one signature move: the step surface is the front face of the lacquer plinth, so the only amber in the interface is the next action, the same colour as the lamps that answer it.
- Cliché guard: amber on dark sits near "dark plus gold". Here the amber is the lamps' real light, there is no serif display, no metallic finish and no gold foil.

**Layout primitive:** the plinth label. On a phone the model fills the top 55 percent of the screen and the step surface below it is a solid lacquer panel that continues the plinth's front face, like the label on a museum model's base. On desktop the model takes the left 60 percent and the plinth label is a 420 px column on the right. With the on-screen keyboard open, the camera reframes tight on the current station in the strip that remains.

**Motion philosophy:** "A model on a turntable: it turns to bring the next station to you, settles, and its lamps answer you." The turntable turns 900 to 1,200 ms, critically damped with no overshoot; the camera stays low at figure height. The guest may drag to turn it with inertia; the next step brings it back to the station. Lamps strike with a short sodium warm-up (dim red to amber, 600 ms). Ambient: haze motes drift in the lamp beams. Reduced motion: each station is a cut, lamps appear lit, no motes.

**Density:** sparse world, medium label. One group of controls per beat on the label; the model carries the rest.

**Hover / focus identity:** hover lifts a choice's matching object in the model (the turnstile lane lamp brightens). Focus is a 3 px chalk ring offset 2 px (13.27:1 against the scene) with a 2 px lacquer inner ring, so it holds 3:1 against lamp glare too. Actions carry a 2 px lacquer ring for the same reason.

**Journey model** (each beat completes with its plain control; the model only answers):
- **Sealed:** the model in near-dark, only the turnstile hut's lamp lit. The ticket hangs on its lanyard from the crossbar of the nearest pylon, in the foreground. Tear along the stub line or press "Tear open": the stub tears and the four pylons strike one after another.
- **1. Attendance, the turnstile:** the turntable brings the turnstile hut round. Yes / Maybe / No is a radio group on the label. Yes: your figure clicks through the Yes lane and the arm turns. Maybe: the figure waits at the lane and its lamp holds half-lit. No: the figure stays outside and the hut lamp stays on for you.
- **2. Plus-one, at the turnstile:** "Bringing someone?" sets a second figure on a shared base beside yours, and their name appears on that base as you type it.
- **3. Details, the stand:** the turntable turns to the stand and your figure walks to an empty row. Your name is painted round the figure's base as you type. Fields stay grouped on one label: you (names), reaching you (email, Email or WhatsApp, WhatsApp number), and for the day (team, fun fact, how you know Makes, all optional). The channel choice lights an envelope or chat icon on the hut. "Send my code" completes it.
- **4. Code, the tunnel:** the turntable brings the tunnel gate round. Six small lamps on the tunnel arch light one per digit typed; the digits themselves stay in the input cells. A wrong code puts the lamps out and the error shows on the label. The right code swings the gate open and your figure walks out to the centre circle.
- **5. Stub, the reveal:** the camera rises and pulls back for the first time, showing the whole ground on its lacquered turntable. Your seat (from your `ticketNo`) lights with a small amber lamp. The stub flips up beside the model, stamped ADMIT ONE · 21 DEC 2026. A small chip appears: Dusk / Floodlit / Full time. No path: the gate stays shut, the hut lamp stays on, the stub is void and "Changed your mind?" sits on the label.

**Render cost (honest):**
- Geometry: one glTF of roughly 25,000 to 40,000 triangles (plinth, pitch, pylons, stands, hut, tunnel). Seats are one instanced mesh (400 to 800). Two figures of about 800 triangles each.
- Baked: lamp pools, seat occlusion and contact shadows live in a lightmap. Lamps on and off are two baked lightmaps blended by one uniform, so striking the lamps costs nothing extra at runtime.
- Runtime: lamp heads as emissive materials, four additive beam cards, fog plus soft haze cards at the rim, motes as one points draw (300 or fewer), the name on the base as a canvas texture. No shadow maps, no post-processing; glows are sprites. Target under 40 draw calls.
- Download estimate: model 300 to 600 kB plus two 2048 lightmaps 300 to 500 kB (WebP), about 0.7 to 1.1 MB beyond today's lazy chunk, streamed while the sealed beat is already usable.
- Weak GPU: motes and beam cards drop first, then DPR 1 and 1024 lightmaps, then rung 2.
- Asset cost: the largest build item is modelling the ground and baking the lightmaps in Blender, roughly 2 to 4 days of 3D work.

**Fallback:**
- Rung 2 (2D): six stills rendered from the same Blender scene (sealed in near-dark, turnstile, stand, tunnel, the whole-ground reveal, and No), WebP at 1x and 2x for phones, about 60 to 120 kB each. Lamp strikes are a cross-fade between an "off" and an "on" still; the name on the base and your lit seat are positioned DOM overlays. No turntable drag.
- Rung 3: the same stills with instant swaps and no cross-fades. Forced colours: stills hidden, label in system colours, beats unchanged.

**Existing craft:** tear gesture kept (it now strikes the lamps). Lanyard physics kept, reworked: the anchor moves to the pylon crossbar and the strap takes the new palette, "THIRTY UNITED" kept. Stamp kept, reworked in amber on the returned stub. Haptics kept (turnstile 8 ms, lamp strike 12 ms, tear 25-15-35 ms, stamp 40 ms). Opt-in sound kept and extended (lamp ignition hum, turnstile ratchet, a distant crowd at the walk-out).

**Drift check:** no ink, letterpress, deckled edge or off-register stamp (B). No strips, ticker, wipes, numbered form rows or scoreboard digits (C); the code lamps carry no numerals.

**The Signature**: The thing that makes this unmistakable in a screenshot is a floodlit miniature football ground on a dark lacquered turntable, lit only by its own four sodium lamps, which turns to each station as you answer until your own seat lights up in the stand.

## Direction B, The Walk-Out

**Reference category:** the walk from turnstile to pitch on a match night, seen first person through a low camera inside a stylised toy-scale ground, the way the Guronnimo meadow puts the camera in the grass.

**Competitor / inspiration references** (4, captioned):
- ![Guronnimo contact sheet: first-person camera inside the grass, relit by one chip](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-sheet.jpg), the camera is inside the world, and the world answers the hand.
- ![Guronnimo Night frame: haze, moon, motes in the dark](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-05.jpg), the night state's haze and points of light become the tunnel lamps and floodlight flare.
- ![Bruno Simon desktop: intro floor before the miniature world loads](.specno-design/references/immersive-night-world-rsvp/bruno-simon-1-desktop.png), a world you move through, with a Quality control and a "stuck" escape we borrow; its drive-to-reach content is the anti-pattern.
- ![Messenger mobile: a world with a delivery story](.specno-design/references/immersive-night-world-rsvp/abeto-messenger-1-mobile.png), the world has a job to do, the way the walk-out delivers you to your seat.

**Tone:** anticipation; the minutes before kick-off, a little theatrical.

**The world:** five small sets on one route: the street outside the turnstile, the turnstile, a dressing room with one peg, the tunnel with caged lamps, and the touchline under the floodlights facing a stand.

**Typographic identity:**
- Display: Overpass 800, sentence case. Desktop step headings 64/68 px, mobile 36/40 px. Overpass descends from US highway signage, so the interface speaks in the ground's own wayfinding voice.
- Body: Overpass 400/600, 17/26 px desktop, 16/24 px mobile. One family, so the signs and the controls are the same voice.
- Numeric / data: Overpass Mono 600 with tabular figures; seat number 28 px, code cells 28 px.

**Color thesis:**
- Lighting story: caged bulkhead lamps light a cold blue-grey concrete tunnel in pools; ahead, the tunnel mouth is a rectangle of white floodlight haze. The only warm saturated object in the world is the orange corner flag.
- Primary: corner-flag orange `#FF6A2B`, used for the corner flags and the next action only (6.11:1 against its concrete label; 4.85:1 against the tunnel scene).
- Surface family: cool. Concrete `#151A22` (step surface), tunnel scene `#252D3A`, floodlight white `#EEF3F8` for text (15.64:1), muted `#A9B4C2` (8.31:1), input borders `#7D8899` (4.87:1).
- The one signature move: the world gets brighter the closer you get to the pitch. Each beat is one place further down the walk, and the stub is set in full floodlight.

**Layout primitive:** in your hands. The world is ahead of you; the step surface is your pass, held at the bottom of the frame and turned over to write on. It is a solid concrete-coloured panel with a lanyard slot at the top, bottom-docked on a phone and held at bottom centre (520 px wide) on desktop with the world full-bleed around it.

**Motion philosophy:** "Walk, stop, look up." The camera dollies forward between places in 1.2 to 1.6 s with a fixed eye height, no head bob, no roll and no field-of-view change over 5 degrees. At each place it stops and only light moves. An optional finger drag looks around by up to 6 degrees. Reduced motion: every move is a cut.

**Density:** sparse. One place, one group of controls.

**Hover / focus identity:** hover brightens the object a choice belongs to (the turnstile lane, the shirt peg). Focus is a 3 px floodlight-white ring (12.42:1 against the tunnel) with a 2 px concrete inner ring.

**Journey model** (each beat completes with its plain control):
- **Sealed:** outside the turnstile in the dark street, floodlight glow over the stand roof, the ticket hanging in front of you on its lanyard. You tear it at the turnstile, the way a steward tears a stub.
- **1. Attendance, the turnstile:** Yes / Maybe / No on the pass. Yes: the arm clicks and the camera moves through. Maybe: the arm half-turns and holds. No: you stay outside and the camera turns to the street lamp.
- **2. Plus-one, at the turnstile:** a second ticket fans out behind yours in hand, and their name appears on it as you type.
- **3. Details, the dressing room:** a plain shirt on the peg, no number. Your name prints across its back as you type. The same grouping as the brief (you, reaching you, for the day); your team appears on the kit-bag tag. "Send my code" completes it.
- **4. Code, the tunnel:** six caged lamps along the ceiling; each digit lights the next one and the camera edges a step forward. A wrong code puts them out and the camera holds. The right code is the walk-out: the one long move (2.4 s) out of the tunnel under the floodlights.
- **5. Stub, the touchline:** you look up at the stand; your seat lights in floodlight white. The stub is held up in your hand, stamped. Chip: Warm-up / Kick-off / Full time. No path: you stay outside under the street lamp; the stub is void.

**Render cost (honest):**
- Geometry: five small sets of about 10,000 to 20,000 triangles each, swapped behind a light flash so only one or two are in memory. Seats instanced in the last set.
- Baked: one lightmap per set. Runtime: tunnel lamps as emissive toggles, the shirt name and pass text as canvas textures, flare sprites, fog. No shadow maps or post-processing.
- Download estimate: 1.2 to 2 MB in total, streamed per set.
- Weak GPU: look-around and haze cards drop first, then DPR 1, then rung 2.
- Asset cost: the highest of the three. Five interiors to model and bake, roughly 4 to 7 days. First-person travel also carries a motion-sickness risk, kept low by the fixed eye height and slow dollies.

**Fallback:**
- Rung 2 (2D): five painted plates, one per place, each in three layers with up to 8 px of pointer parallax. The name on the shirt and the tunnel lamps are DOM overlays; the walk-out is a cross-fade.
- Rung 3: plates static, instant cuts. Forced colours: plates hidden, pass in system colours.

**Existing craft:** tear gesture kept (the turnstile is its natural home). Lanyard kept as the ticket hanging in front of you. Stamp kept, landing on the pass at the touchline. Haptics kept. Opt-in sound kept and extended (tunnel footsteps, crowd swell at the walk-out).

**Drift check:** the shirt carries a name and never a number, and fields are never laid out as numbered rows (C). The code is lit lamps, never scoreboard digits (C). No ink or letterpress (B).

**The Signature**: The thing that makes this unmistakable in a screenshot is a first-person walk from the turnstile through a cold concrete tunnel into white floodlight, with your name printed across the back of a shirt as you type it and one orange corner flag as the only warm colour.

## Direction C, Lights On

**Reference category:** the hour before an evening kick-off at a small ground, seen from your seat high in the stand, as dusk turns to night and the floodlights come on bank by bank.

**Competitor / inspiration references** (4, captioned):
- ![Guronnimo Golden frame: a world in late light, relit by one chip](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-01.jpg), light and time of day are the whole show; here the change of light is the progress.
- ![Guronnimo contact sheet: Golden to Night to Morning](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-sheet.jpg), one fixed world, several lightings, and grass that parts under the hand.
- [external reference: https://goodux.appcues.com/blog/duolingo-user-onboarding], visible progress and "registration as a small step inside a larger process" drive people to finish.
- [external reference: https://www.awwwards.com/sites/igloo-inc], a rich WebGL world held to a plain, two-colour interface.

**Tone:** a calm build-up to a moment; storybook.

**The world:** one fixed view from the upper tier of a small ground: the dark front rows of your stand in the foreground, the pitch below, four floodlight pylons, the far stand, and the last ember of sunset behind it.

**Typographic identity:**
- Display: Young Serif 400. Desktop step headings 60/66 px, mobile 34/40 px. A warm, chunky serif with a storybook feel for a dusk-to-night story. It is never paired with gold.
- Body: Figtree 400/600, 17/26 px desktop, 16/24 px mobile.
- Numeric / data: Spline Sans Mono 500 with tabular figures; seat number 28 px, code cells 28 px.

**Color thesis:**
- Lighting story: the sun has just set behind the far stand, leaving an ember band under an indigo sky, and the four pylons stand dark. Each answer strikes a bank of cold white floodlight; the pitch turns from dusk grey-green to lit green while the sky deepens. Finishing the RSVP is full floodlight.
- Primary: floodlight white `#EAF1FF`, used for the lamps and the next action (15.81:1 against its indigo label; 11.13:1 against the sky). It measures 3.41:1 against the ember band, so actions never sit over the horizon.
- Surface family: cool indigo. Stand shadow `#14152B` (step surface), sky `#2B2F5C`, text `#F3F5FB` (16.44:1), muted `#B6B9D3` (9.27:1), input borders `#7E82A8` (4.82:1). Sky only: ember `#C8663F`.
- The one signature move: the scene's light is the progress indicator. There is no stepper; you can see how far you have come by how many floodlights are on.

**Layout primitive:** the stand you sit in. The camera never travels. The step surface is the dark front rows of your own stand: a solid panel whose top edge is the silhouette of the seat row in front of you. On a phone the ground fills the top half and the panel the bottom half; on desktop the ground is a wide panorama and the panel sits bottom-left at 480 px.

**Motion philosophy:** "Only the light moves." A floodlight strike is a 120 ms flare and a 900 ms haze bloom; the sky deepens over 1.2 s per beat. The pitch grass sways only where a finger or cursor touches it. Reduced motion: lights appear lit, the sky swaps, no flare and no grass motion.

**Density:** sparse. One group of controls per beat; the panorama carries the story.

**Hover / focus identity:** hover pre-lights the next pylon at 20 percent. Focus is a 3 px white ring (11.58:1 against the sky) with a 2 px indigo inner ring.

**Journey model** (each beat completes with its plain control):
- **Sealed:** dusk, all four pylons dark, the ticket on its lanyard hanging from the roof edge above your row. The tear sets the last of the sun.
- **1. Attendance:** Yes / Maybe / No on the panel. Yes strikes pylon one in full. Maybe strikes it at half. No leaves one small light on over the gate.
- **2. Plus-one:** "Bringing someone?" lights the seat beside yours in your row; their name appears on its seat back as you type.
- **3. Details:** pylon two strikes and your name is mown into the centre circle letter by letter as you type, groundsman style. Fields stay grouped as in the brief. "Send my code" completes it.
- **4. Code:** pylon three's lamp head has six lamps; each digit lights one. A wrong code puts them out. The right code strikes the bank in full.
- **5. Stub:** pylon four strikes and the whole ground is floodlit. Your seat (from your `ticketNo`) glows. The stub drops from the roof edge, stamped. Chip: Dusk / Floodlit / Late. No path: the gate light stays on, the stub is void, "Changed your mind?" sits on the panel.

**Render cost (honest):**
- The lowest of the three. A fixed camera means almost everything is baked: four pylon "light pool" lightmaps blended by uniforms in one pitch material, a sky dome shaded by a uniform (a lit sky inside the scene, not a CSS mesh gradient), emissive lamp heads, four beam cards, haze cards.
- Instanced: pitch grass, 8,000 to 20,000 blades on capable phones and none on weak ones (a striped texture instead). The mown name is a canvas-texture mask read by the pitch shader.
- Download estimate: 0.4 to 0.8 MB.
- Weak GPU: grass and haze cards drop first, then DPR 1, then rung 2.
- Asset cost: one view to model and bake, roughly 1 to 2 days of 3D work.

**Fallback:**
- Rung 2 (2D): a layered still from the same scene: sky, ground, and four separate pylon-glow layers whose opacity switches as each beat completes, so the lights still come on one by one in 2D. The mown name is SVG text masked over the pitch. This is the strongest 2D rung of the three.
- Rung 3: lights appear lit instantly, the sky swaps, no flare. Forced colours: layers hidden, panel in system colours.

**Existing craft:** tear gesture kept. Lanyard kept, hung from the roof edge in the foreground. Stamp kept, in floodlight white on the stub. Haptics kept (a strike pulse per pylon). Opt-in sound kept and extended (a floodlight clunk and hum per bank).

**Drift check:** the code is six lamps in a lamp head, never digits on a board (C). No ticker, strips or wipes (C). No ink or letterpress (B).

**The Signature**: The thing that makes this unmistakable in a screenshot is a small football ground at dusk, seen from your seat in the stand, whose floodlights switch on bank by bank as you answer while your name is mown into the centre circle.

## Direction D, Matchday: The Signing (chosen)

Added 2026-10-15 as the owner's fourth option: a deliberate hybrid of the phase 1 concepts S1 "Matchday living poster" (the spine), S3 "Power-Up" (the floodlight meter) and S2 "The Call-Up" (the story frame). Full specification, timings, asset plan and risks: `audits/cinematic-recommendation-2026-10-15.md`. This block is the binding summary; where the two differ, this block and the eight owner decisions win.

**Reference category:** a football film's matchday key-art poster (the low-angle hero one-sheet), brought to life in depth layers, ending on a club's new-signing shirt presentation.

**Competitor / inspiration references** (5, captioned):
- Style note (2026-10-15): the three anime graphics below are composition and lighting references only. The shipped plates are photo-real, not anime-lit.
- ![Makes's own AI poster: low-angle hero, foot on the ball, smiling, moonlit, red smoke and embers](.specno-design/references/immersive-night-world-rsvp/owner-gameday/04-makes-08-moonlit-poster-ai.png), the spine: his pose, his smile, one cold moon against one hot red. Its crests, kit stripes, sponsor, trident and stand fascia never ship; it is a head-and-neck likeness reference only, never a base image.
- ![MATCHDAY title card: one huge condensed word with the hero cutting through it](.specno-design/references/immersive-night-world-rsvp/owner-gameday/03-anime-matchday-header-red-sword-embers.png), the title depth-sorted between the stadium and the hero, and embers on every plane.
- ![Anime hero on a toad under a moonlit dome, fixture block bottom left](.specno-design/references/immersive-night-world-rsvp/owner-gameday/01-anime-toad-moon-starball-dome-fixture.png), one motivated cold key light from the upper right, six separable depth planes, and a fixture block that is exactly an invite's content.
- ![Anime hero lunging, backlit by an explosion, the stadium a small bowl below](.specno-design/references/immersive-night-world-rsvp/owner-gameday/02-anime-explosion-gauntlet-aerial-ground-fixture.png), the impact beat: the finale's full ignition and ember burst borrow its timing, not its weapon.
- ![Vercel Ship badge: a personalised credential on a lanyard](.specno-design/references/immersive-night-world-rsvp/vercel-ship-badge-1-mobile.png), a personal object you handle and keep; here the lanyard pass opens the invite and the poster is what you keep.

**Tone:** a celebration with a film's sense of occasion. Makes smiles in every frame; nothing is pointed at the camera; the ball is the power object.

**The world:** one 9:16 cinematic, photo-real night poster in about eight depth layers (a generated image that reads as a film still; owner decision 2026-10-15): a sky with a code-drawn moon at its phase on 21 December 2026 (about 93 percent waxing gibbous; the owner accepted this default, but the phase itself is still an estimate), a stadium with four floodlight towers dark before kick-off, a crowd with plain red flags and mid smoke, foreground rubble with embers, Makes in three poses (hands in pockets with a foot on the ball, waving, holding up a shirt), and a plain red shirt on a hanger. "THIRTY" is set across an empty band of night sky, between the stadium and Makes. No crest, badge, sponsor, kit stripes, starball, club name, devil or trident, anywhere, ever.

**Typographic identity** (the recommendation does not set one; these keep the four faces already shipped, plus SVG title lockups, with the brush font picked in the asset phase (owner accepted)):
- Display: Barlow Condensed 700, caps. Panel headings, the guest's name and number on the shirt, the poster's fixture and credit lines. Close in spirit to the MATCHDAY header's heavy condensed grotesque, already self-hosted, and it carries accented names.
- Title lockups: "THIRTY" and "UNITED" as brush lettering from an OFL display font, outlined to SVG paths at build time, so no font file ships (font to be picked in the asset phase). Fixed words only; guest names never use it.
- Body: Inter 400 and 500. Labels, inputs, buttons, helpers.
- Standfirst: Source Serif 4 italic 400, one line per beat at most, as built ("Thirty feels like half time. Come for the oranges.").
- Numeric / data: JetBrains Mono 500 with tabular figures. Seat "017", the code cells, the email address.

**Color thesis:**
- Lighting story: one cold key light, moonlight from the upper right, and one hot colour, red, in the smoke, the shirt and the title. Before kick-off the floodlights are dark; each answer switches on another bank; the finale is full ignition.
- Primary: shirt red `#9F0B19`, the only button fill (white on it 8.28:1), always with a 2 px moonlight ring because shirt red on the panel is 2.20:1.
- Surface family: cool night. Panel `#18131F` (sampled from the night sky of image 4), moonlight `#B7D3FA` for muted text, rings and focus (11.90:1 on the panel), white for text (18.23:1).
- Poster red `#F81E24`: display type and decoration in the scene only, never a button fill (white on it is 4.04:1, so the Yes stamp uses `panel` text on it, 4.52:1).
- The one signature move: progress is light. Four floodlight banks strike, one per beat, so a guest counts how far they've come without a stepper.
- Cliché guard: dark plus red drifts toward a betting or gaming app. No neon, no glow borders, no gold, no chips that look like odds; red never glows on the UI layer.

**Layout primitive:** the poster and the step panel. On a phone the poster fills the screen behind everything and a solid step panel docks at the bottom, about 40 to 45 percent of the height, square corners, with one 1 px moonlight rule on its top edge. Each beat has its own camera shot that keeps Makes's face and the shirt above the panel; with the keyboard open, the shot reframes to a strip on the shirt (driven by `visualViewport`). On desktop the poster stands as a tall 9:16 frame centre-left in a dark void, and the panel is a 420 px column on the right. Every word a guest must read sits on the panel or on a solid chip; nothing readable sits on the moving scene.

**Motion philosophy:** "The lights answer you." The scene breathes at 30 Hz (clouds over the moon, smoke along the ground, embers rising) on the WebGL tiers, and stops when the tab is hidden and on the code beat. Every answer is a one-way floodlight strike. Camera moves are shots: push-ins of 3 to 4 percent at most, no forward travel, no gyro, no idle drift, no wipes. The finale runs about 3.2 s. Reduced motion: every beat swaps to its final state at once and nothing loops.

**Density:** sparse world, medium panel. One beat, one panel.

**Hover / focus identity:** focus is a 3 px moonlight ring offset 2 px; wherever a control sits over the scene (the Sound and Still chips), a 2 px night halo sits outside the ring so it holds 3:1 against floodlight glare too. The primary button wears its 2 px moonlight ring at rest; hover lifts its fill to `#B3101F`. The world carries no hover-only meaning.

**Journey model** (each beat completes with its plain control on the panel; the world only answers):
- **Cover (sealed):** the poster before kick-off, moonlit, floodlights dark, "THIRTY" in the sky; the lanyard pass hangs in the frame. "Tear open" works from the first paint. The tear strikes bank one.
- **Chapter 1, "Are you in?":** one radio group (Yes / Maybe / No) and Continue. On Continue: Yes strikes bank two and an ember swirl rises past Makes; Maybe strikes bank two at half and holds; No strikes nothing and Makes cross-fades to the wave.
- **Chapter 2, "Your shirt":** the grouped fields as built. The panel shows straight away, with no 2.2 s delay. Standfirst (draft): "Your name goes on the back. A few lines so I can seat you properly." A plain red shirt swings in beside Makes and the guest's preferred name (or first name) is lettered across its back as they type. Until Surname has a value, the shirt shows only the first word of the typed name, so a surname typed into First name never shows. The number area stays empty: the number exists only after the code. "Send my code" strikes bank three. No path: name and email only, no shirt, no strike.
- **Chapter 3, "Seal it":** the code beat. Ambient stops (the ground holds its breath). Six small lamps on the right floodlight head light one per digit; they are lamps, never numerals. A wrong code puts them out together; the right code flares them and strikes bank four.
- **Signed (Yes and Maybe):** Makes holds up the guest's shirt with their name and their number (`ticketNo`); "UNITED" paints in under "THIRTY"; full ignition; the stamp lands ("SIGNED · 21 DEC 2026" solid for Yes, "PENCILLED IN" outlined for Maybe). The saved poster carries a small AI credit line, "Poster art made with AI" (owner, 2026-10-15), next to the "+ name" credit line, in `moonlight` over a `panel` scrim; it is on the saved poster only, not in the live page and not on the OG image. The panel returns with the seat and shirt line, Save your poster and Share. The team or "NEUTRAL" line and the sport are not shown after saving, and the footer line "Makes, 21 DEC 2026" is gone; the date is on the cover.
- **No end:** the lights stay at their pre-match level apart from bank one; Makes keeps waving; one ember drifts past the moon. The panel shows the heading "Sorry you'll miss it, {firstName}" and the "Changed your mind?" button; there is no warm closing line below the heading (owner, 2026-10-15). No stamp, no poster.

**Render cost (honest; every figure an estimate from atlas and the catalogue):**
- Atlas's path: photo-real layers (A1), ambient on demand at 30 Hz (C2), a client-side JPEG poster (D1). No CSP change, no decoders.
- T3: about 8 WebGL planes with depth-UV parallax, the bank-mask reveal of a lights-on plate, additive glow sprites and beam cards, up to 1,500 GPU ember points (start about 300), 2 to 3 scrolling-noise smoke quads, no post-processing.
- Budgets: entry at most 160 kB gz; about 2 MB (T2) or 3.5 MB (T3) over the journey; decoded memory up to 60 / 120 / 200 MB for T1 / T2 / T3. Alpha layers are cropped, pose plates load when needed, T1 uses 720-wide files.
- Weak GPU: demote on slow frames, never promote within a session; context loss drops to T1 on the same files.
- Asset cost: six generations planned (G1 master, G2 to G5 edits of it, G6 the shirt); five were used, because the lights-on G1 replaced G3. Makes generates them; Claude does all processing.

**Fallback:**
- T2 Lit: the same layers, parallax on the hero only, fewer embers, one smoke quad, no beam cards.
- T1 Poster (DOM): the same layers as WebP in the DOM, touch-drag parallax up to 8 px, four opacity-switched bank layers, so the light meter survives without WebGL.
- T0 Still (reduced motion): the same layers, static; instant swaps; no particles, parallax, push-ins or loops.
- Forced colours: no poster; the panel in system colours with the same words. Save your poster and Share still work.

**Existing craft:** the tear is kept and now strikes bank one. The lanyard stays as one object inside the world canvas (B2), with retirement to the DOM tear as the cut line (B3). The stamp is kept with its built spring and recoil. Haptics keep the built values (4 ms ticks, [10, 30, 18], 22 ms, 12 ms) and add 8 ms and 12 ms strikes and [10, 30, 10] for a wrong code, Android only. Opt-in sound is kept and extended (clunk, hum, swell, hush, drum, crackle), all synthesised.

**Drift check:** no torn or deckled panel edge, no ink bleed, no one-question-per-screen (rejected B). No scrolling ticker, no solid ink strips, no wipes, lamps instead of digits on the code beat, and the shirt number is a reward on the poster, never a form row (rejected C).

**The Signature**: The thing that makes this unmistakable in a screenshot is that the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing. (Pixel's wording, accepted by the owner through "defaults" on 2026-10-15, not written by him.)

## Plate style: photo-real (owner decision, 2026-10-15)

The owner keeps the photo-real render. Direction D is a cinematic, photo-real night poster with the same palette, the same light logic (one cold moonlight key from the upper right, red as the one hot colour) and the same composition rules (title band of empty sky behind Makes, face and shirt above the panel, no crest or club mark). The earlier painted, anime-lit wording is superseded in every live line. Dated history in `audits/` and `direction-archive/` keeps the old wording on purpose.

**Plate status (owner, 2026-10-15): all approved.**
- G1 is approved. The lights-off edit is the base plate and the source of the hero cut-out (L5). The lights-on G1 is the source of the lit stadium (L2b). ChatGPT returns edits at 941 x 1672, so Claude scales every plate to 1080 x 1920 in processing, by one method for all of them.
- G2 (clean background) is approved and lines up with the base. Its upper-right clouds are brighter than G1's, so processing darkens the title band.
- G3 is dropped: the lights-on G1 replaces it.
- G4 (the wave) and G5 (the signing) are approved and line up with the base at the feet and the ball. Processing removes a faint oval under the G5 shirt collar.
- G6 (the shirt on a hanger, 1254 x 1254) is approved; its red matches the G5 shirt.

Accepted as is: Makes's head sits about 17% down the frame instead of 28%, because the title layer sits behind the figure.

**Style lock for G2 to G5 (9:16).** Paste this paragraph at the start of every generation prompt:

> STYLE LOCK. A cinematic photograph of a night football poster, portrait 9:16, shot low-angle on a 35 mm lens with shallow depth of field, fine film grain, real skin texture and real fabric detail, and a restrained filmic colour grade. It is night. One cold blue-white moonlight is the only key light, coming from the upper right, with a thin cold rim on hair, shoulders and ball. Red is the one hot colour, appearing in the low smoke, the plain flags, the ball's panels and the shirt. Small white points of light: a few drifting sparks and embers. They are the only other highlights. Everything else falls away into deep blue-black shadow. It must read as a photograph: no illustration, no painting, no anime, no cartoon shading, no plastic CGI gloss. No crest, badge, sponsor, stripes, star-pattern ball or signage. No text anywhere: no letters, numbers, logos or captions.

**Style lock for G6 (square 1:1).** Paste this paragraph at the start of the G6 prompt:

> STYLE LOCK, SQUARE. A cinematic product photograph, square 1:1, of a plain red football shirt on a hanger, centred and filling about 70% of the frame, shot at a slight low angle on a 35 mm lens with shallow depth of field, fine film grain, real fabric folds and stitching, and a restrained filmic colour grade. It is night. One cold blue-white moonlight is the only key light, coming from the upper right, with a thin cold rim along the shoulders and the hanger. Red is the one hot colour, and here it is the shirt itself. Small white points of light: a few drifting sparks and embers. They sit in the dark background and nowhere else. The back of the shirt is completely blank so the name and number can be added later. It must read as a photograph: no illustration, no painting, no anime, no cartoon shading, no plastic CGI gloss. No crest, badge, sponsor, stripes, star-pattern ball or signage. No text anywhere: no letters, numbers, logos or captions.

## Distinctiveness Test

> **If a stranger sees one screenshot of this product, what specifically tells them it is *not* a generic AI-generated SaaS template?**

…that the invite is Makes's own living matchday poster, where every answer switches on a bank of floodlights until he holds up your shirt, with your name and number, as his new signing.

The owner accepted this sentence through "defaults" on 2026-10-15; he did not write it. If he rewrites it, his words replace these here, in the brief and in the Direction D Signature.

## Decision

- **Chosen:** Direction D, Matchday: The Signing.
- **Date:** 2026-10-15.
- **How it was chosen:** Makes replied "defaults" to the phase 2 recommendation (`audits/cinematic-recommendation-2026-10-15.md`, section 6). That reply accepts the recommended hybrid, the eight decisions with their defaults, and the "defaults I'm taking unless you object" list. He did not write the Signature or the Distinctiveness Sentence.
- **Rationale:** D is his own reference (image 4) brought to life, so it meets "go all out" with the subject he chose, himself, smiling. It gives the guest two reasons to finish that are not a game: the lights count down to the end, and their shirt number exists only after the code. It is atlas's cheapest rich world: a layered 2D picture whose T1 and T0 rungs are the same files, so a low-end Android guest sees the same poster and the same light count. Makes's effort is about six generations from one master image, and the one hard-to-reverse commitment (the plate set) is gated by G1.
- **The eight owner decisions** (all defaults, 2026-10-15):
  1. No crests or club marks, anywhere, ever. G1 is generated crest-free; his AI poster is a head-and-neck likeness reference only.
  2. The shirt number is `ticketNo`: "17" on the shirt, "017" as the seat, revealed only in the finale.
  3. No poster for a No.
  4. Preferred name if given, otherwise first name. Never the surname.
  5. Go all out within limits: ambient embers, smoke and cloud at 30 Hz on T3 and T2, paused when hidden and on the code beat; a Still chip for anyone; nothing loops under reduced motion.
  6. The lanyard stays on the cover as one object inside the world canvas (B2); retire it (B3) if it threatens the schedule.
  7. Makes generates the plates with his own tool; Claude does all processing.
  8. Panel: "Monday 21 December 2026 · Venue TBA". Poster: "MON 21 DEC 2026 · VENUE TBA". No kick-off time until there is one.
- **Answered (2026-10-15):** the likeness question, "may my likeness appear on every shared poster". Owner: "likeness yes". G1 (the first image generation) is unblocked. His photo arrived on 2026-10-15 and the first G1 attempt is in review, not approved (see `feedback.md`). The owner then kept the photo-real render as the plate style; G1 is still not approved (two fixes outstanding, see Plate style below).
- **Considered, not chosen** (recorded, not hard constraints, because D reuses parts of B and C):
  - Direction A, Tabletop Ground. A miniature world with no Makes in it, and the largest 3D build (2 to 4 days of Blender modelling); it predates the gameday set that made Makes the subject.
  - Direction B, The Walk-Out. Its call-up story survives as D's story frame, but five interiors to model (4 to 7 days) and the only first-person travel make it the most expensive and the one motion-sickness risk.
  - Direction C, Lights On. Its bank-by-bank floodlights survive as D's progress meter; on its own it is a fixed camera with no hero.
- **Hard constraints that still bind:** rejected B "Terrace Ticket" and rejected C "Scoreboard Broadcast" of 2026-10-14 (see History).
- **Phase 0a, iPhone result (2026-10-15, owner's DEVICE PROBE screenshot):** a link from a personal WhatsApp chat opened in Safari, the system browser, not a WebView (iPhone OS 18_7, Version/18.7.7 Mobile Safari). `canShare(files)` true; `vibrate` undefined; WebGL2 yes, max texture 16384, 4 cores, dpr 3, `deviceMemory` n/a. `sessionStorage` survived a reload (a reload, not a process kill). The 3D chunk was ready at 1730 ms and the first frame came at 2131 ms. **Android is still untested**, so the WhatsApp in-app WebView risk stays open for Android.
- **Re-evaluation trigger:** after the rest of the phase 0a device test (the Android run: whether WhatsApp opens a WebView or the system browser, `canShare({ files })`, long-press save; the iPhone run is in), and at the G1 gate: if G1 cannot hold Makes's likeness, stop and re-decide before any other plate is made.

## Bindings

- Typography → `tokens.md` (canonical) from Direction D's typographic identity: the four shipped faces plus SVG title lockups, brush font picked in the asset phase (owner accepted).
- Color → `tokens.md`: dark scheme (`color-scheme: dark`), panel `#18131F`, moonlight `#B7D3FA`, shirt red `#9F0B19` for button fills only with its 2 px moonlight ring, poster red `#F81E24` for display and decoration only, error `#FF9E8F`; every pair re-measured.
- Motion → motion budget `signature`; `motion` for the DOM, R3F for the world canvas, CSS transforms for T1; ambient at 30 Hz on T3 and T2 only; the reduced-motion path in the Communication plan below.
- Component personality → `components.md` rewritten around the step panel and the world stage (StillLayer always rendered, the WebGL canvas as an enhancement).
- Brand → `brand.md` amended: illustration on every view, red in the scene, Makes's likeness (consent given), ambient motion; the crest ban kept.
- Verify → `verify` audits against the Direction D Signature at every tier (T3, T2, T1, T0, forced colours), on real phones inside WhatsApp.
- Design review → dimension F (Direction conformance) checks the build against Direction D's references.
- Lux → `lux-notes/save-the-date-2026-10-15.md`.
- Wireframe → `wireframes/save-the-date-signing-2026-10-15/` (the phone frame at each beat).
- Communication → the plan below.

## Communication plan

**Reading mode by view type:**

| View type | Mode | Why (one line) |
|---|---|---|
| Cover (sealed), Chapter 1 (attendance), Signed, No end | glance | One picture, one action or three choices, understood in about two seconds. |
| Chapter 2 (details), Chapter 3 (code) | scan | A few grouped fields and a status, read in about ten seconds. |
| Save your poster (full-screen image) | glance | One image and one instruction. |
| World chrome (Sound, Still) | glance | Small solid chips, icon plus short label. |

**Channel map** (project override):

| Meaning | Channel |
|---|---|
| Action | Icon plus short label on the panel; the world never carries a required action. |
| Progress | Light: the number of floodlight banks lit, mirrored by the panel heading for screen readers. |
| State | Colour plus an icon change plus an accessible name on the panel; the world reaction is a second channel, announced in a live region when it carries meaning. |
| Grouping | Position on the panel; one beat, one panel. |
| Cause and effect | The world answers from the object the answer belongs to (a bank, the shirt, the lamps), with a static lit equivalent for reduced motion. |

**Stranger sentence for glance views:** "A first-time user understands this view in two seconds without reading."

**Provenance (owner, 2026-10-15).** The plates are generated in ChatGPT. The original exports carry C2PA metadata, and the owner keeps them outside the repo as provenance. The processed layers (upscaled, split, compressed) will not carry that metadata. The visible "Poster art made with AI" line on the saved poster is the disclosure.
