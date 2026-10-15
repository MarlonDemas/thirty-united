---
name: cinematic-audit
date: 2026-10-15
clientName: thirty-united
phase: 1 of 2
author: Pixel
directionGate: unchanged (chosenDirection null)
referenceSet: .specno-design/references/immersive-night-world-rsvp-2026-10-15.md
inputs:
  - .specno-design/references/immersive-night-world-rsvp/owner-gameday/ (4 images, copied 2026-10-15)
  - .specno-design/direction.md (A Tabletop Ground, B Walk-Out, C Lights On)
  - .specno-design/briefs/save-the-date-brief.md
  - src/ at 29aeb01 (feature/3d-ticket), dist/ built 2026-10-14 23:40
---

# Cinematic audit: Thirty United, phase 1

This audit is input for the final recommendation, not the recommendation itself. It tears down the owner's new references, inventories what the current build already does, maps the concept space wider than directions A to D, fixes the constraints any concept must keep, and lists what only the owner can decide. Phase 2 adds radar's research, atlas's render budget and architecture report, and an R3F technique catalogue, then picks.

Nothing in `direction.md`, the tokens or `src/` was changed. The direction gate stays closed with `chosenDirection: null`.

**How the brief has moved.** Directions A to C answered the two owner videos: a whole lit world you are inside, with a small UI. The new references keep the night, the floodlights and the haze, but move the centre of the frame from a place to a person. Every one of them is a hero poster: one figure, low angle, in front of a floodlit stadium at night, with a fixture block. Image 4 makes the hero Makes himself. The question for phase 2 is no longer only "which world" but "whose story, and where does the guest stand in it".

## 1. Reference teardown

### Method

Colours were sampled from the copies in `owner-gameday/` with Pillow on 2026-10-15. Each value is the median of the pixels inside a named region that pass a colour test (for example "red-dominant pixels in the shirt region", or "pixels above 0.8 relative luminance in the moon region"), so they describe the feature, not one lucky pixel. Images 1 to 3 are phone screenshots with a black border down the left and right edges; those borders were excluded. Contrast figures use the WCAG relative-luminance formula.

All four frames are dark with small, very bright highlights. Median relative luminance is 0.026 (image 1), 0.043 (image 2), 0.054 (image 3) and 0.030 (image 4), while the brightest 1 percent of pixels sits at 0.87 to 1.0. That spread, a low-key frame with a few near-white sources, is most of what makes them read as night cinema rather than a dark theme.

### Image 1: anime player on a giant toad under a starball dome

`01-anime-toad-moon-starball-dome-fixture.png`, 1042 × 1812, watermark "BALLOTAKU on Instagram".

- **Composition.** Portrait, rule of thirds. The hero crouches on the toad's head in the right third, eyes on the upper third line. A dirt path snakes from the bottom left to the stadium in the middle distance, so the eye travels from the fixture block, up the path, to the ground, then to the hero. The moon sits top right, balancing the hero's mass. The camera is at the toad's eye level, so the hero is seen from slightly below.
- **Lighting model.** One cold key: the moon, upper right. A second, warmer source: the stadium's lights under the dome. The dome itself is an emissive rim, brightest at the top edge. The toad's back takes a weak warm rim from the stadium side; its front falls into near-black. No fill light, which is why the shadows read as night.
- **Depth layering.** Six planes are easy to separate: sky and clouds with the moon; the dome; the stadium and its light band; the grass, path and ground haze; the hero and the scroll; the toad filling the bottom third as foreground. Haze between the stadium and the grass gives atmospheric perspective.
- **Palette (sampled).** Night sky `#1A2239`; moon core `#E8F5FD`; moon halo `#556D98`; dome rim glow `#95B7E1`; stadium lights `#CEC9C5`; ground haze `#5A6984`; toad lit `#C57C52`, toad shadow `#471C27`; toad eye amber `#A47850`; training top red `#6E3035`. The frame is blue-black with one warm, desaturated red mass in the foreground.
- **Type.** The fixture block, bottom left: two square crest tiles, then three lines of plain uppercase sans in white, day and venue in a regular weight and the time in bold. It is credits, not decoration.
- **Motion implied.** The headband tails stream left, so there is wind; clouds drift; the dome pulses; the haze rolls across the path. The pose is a held breath before a jump.
- **Why it reads as cinematic.** A journey line (the path) leading to a lit destination, a single motivated key light, atmospheric depth and a foreground mass that frames the shot. It is a wide establishing shot with the hero in it.

### Image 2: anime player firing an explosion gauntlet

`02-anime-explosion-gauntlet-aerial-ground-fixture.png`, 1030 × 1804, watermark "BALLOTAKU on Instagram".

- **Composition.** Diagonal. The gauntlet thrusts at the lens from the top left, the figure recedes to the top right, the legs plant across the bottom. Extreme foreshortening: the near hand is larger than the head. The stadium is a small aerial bowl at the bottom, so the camera is above the ground and below the hero at once, which is impossible and therefore dramatic.
- **Lighting model.** The explosion behind the figure is the light. It backlights everything, rims the hair and shoulders, and leaves the front of the figure in deep shadow (`#131111` makes up a large share of the frame). The stadium is a second, small cool source far below.
- **Depth layering.** Explosion and fire; smoke banks left and right; the figure; the near gauntlet as an extreme foreground; the stadium as a distant inset at the bottom.
- **Palette (sampled).** Explosion core `#FEFCD1`; fire `#E88D4D`; embers in the lower half `#DC884C`; warm smoke `#3C4237`; shirt red `#9D2F2B`; deep shadow `#131111`; aerial pitch `#81915C`. This is the only warm-dominant frame of the four: orange fire, not red.
- **Type.** The same fixture block as image 1, set over the stadium inset.
- **Motion implied.** The blast is mid-bloom; embers fly outward; smoke rolls; the figure is mid-lunge. This frame is the "impact" beat, the loudest moment of a sequence.
- **Why it reads as cinematic.** Scale contrast (huge figure, tiny stadium), a backlit silhouette, and a foreground object breaking toward the lens. It is the shot a trailer cuts to on the drum hit.

### Image 3: MATCHDAY header with a lightning-cracked red sword

`03-anime-matchday-header-red-sword-embers.png`, 1036 × 1794, watermark "BALLOTAKU on Instagram".

- **Composition.** A title card. A thin top strip holds the time on the left, three marks in the centre and the venue on the right, ruled off by a white line. Under it, MATCHDAY runs the full width. The figure stands centre, full length, walking toward camera; the sword angles from his hand up through the word. The stadium and a giant starball sit behind the type.
- **Lighting model.** Two sources fight: the cold blue-white glow of the starball and moon behind, and the red glow of the sword in front. The figure's face is lit softly from the front; his coat edges pick up red from the sword. Smoke near the ground is lit from above.
- **Depth layering.** Starball and sky; the stadium; the MATCHDAY type; the figure and sword, which pass in front of the type; smoke and rubble in the foreground; embers on every plane. The type is depth-sorted inside the picture: the stadium is behind it, the hero in front.
- **Palette (sampled).** MATCHDAY `#FFFFFF`; strip ground `#010101`; starball and moon `#A1B2CB`; sword core `#F8D9DA`, sword glow `#E58084`; embers `#DD6756`; cool smoke `#555767`; shirt red `#5E1D28`; coat shadow `#101119`. A grey-blue frame with one red light source.
- **Type.** A very heavy condensed grotesque, all caps, tight tracking, cap height about 198 px, 11 percent of the frame height (measured from the white letter pixels, below the rule line). The strip uses a light condensed small-caps style with wide tracking. Two sizes and nothing between them.
- **Motion implied.** Embers drift upward and sideways, slowly; the smoke rolls along the ground; the sword crackles; the coat swings with the walk. It is a walk-out shot, the hero coming toward camera.
- **Why it reads as cinematic.** Type that lives inside the scene's depth, a hero walking into the frame, and particles that sit on every plane so the air itself has depth. It is the title card of a film.

### Image 4: "MAKES 08" under a moonlit sky

`04-makes-08-moonlit-poster-ai.png`, 941 × 1672, AI-generated, supplied by the owner.

- **Composition.** Low-angle hero shot. Makes stands centre, foot on a ball, hands in pockets, smiling down at the camera. A huge version of his smiling face fills the top left; a back view of him in a "MAKES 08" shirt fills the top right; brush-script "MAKES 08" sits beside him on the right. The stand and floodlights run behind his waist; flags and a crowd fill the lower middle; rubble and embers fill the foreground.
- **Lighting model.** A red world. Red smoke and red sky glow from below and behind; floodlights are pure white points; the moon, top right, is the only cold light. His face is lit warm from the front, so it stays friendly inside an intense frame.
- **Depth layering.** Sky, clouds and moon; the giant face and back view as a collage layer; the stand and floodlights; the crowd and flags; the hero; the ball; rubble and embers. Seven planes, more than any other reference.
- **Palette (sampled).** Night sky `#18131F`; moon `#B7D3FA`; MAKES brush white `#FDFDFD`; "08" script red `#F81E24`; shirt red `#9F0B19`; red smoke and sky `#DB312B`; embers on the ground `#F03F36`; floodlights `#FEFCFB`; blacks `#1A090B`; skin midtone `#D06D49`. The hottest and most saturated red of the set.
- **Type.** Hand-brushed lettering: "MAKES" in white dry-brush caps, "08" larger in red with drips. Printed shirt lettering on the back view in a plain sans. A small banner in the stand reads "SAME PASSION BIGGER STORIES" in a hand style; its origin is unknown and it is not usable copy until the owner says where it comes from.
- **Motion implied.** Embers rise from the ground; flags wave; red smoke rolls in from both sides; floodlights flare.
- **Why it reads as cinematic.** It is a film poster: a hero, a collage of his face and back, a name as a title, a world on fire behind him. And he is smiling, which is the key difference from images 1 to 3: it is a celebration, not a fight.

### Photos 1 and 2 (described, not on disk)

- **Photo 1:** Makes facing camera, long dark locs, a wide warm smile, a small goatee, sage short-sleeve shirt, black trousers, Cape Winelands behind him. This is the likeness source for any illustrated or AI figure of him.
- **Photo 2:** Makes from behind at a floodlit five-a-side pitch at sunset, in a red shirt reading "MAKES 08". This is the back-view pose in image 4, and it is the most natural "walk-out" frame in the whole set: he is walking toward the lights.

### What the set shares

| Element | Images | What it does |
|---|---|---|
| Low-angle hero in front of a floodlit night stadium | 1, 2, 3, 4 | The person is the subject; the stadium is the destination |
| A moon or moon-like glow as the cold key light | 1, 3, 4 (2 uses fire instead) | One motivated source; everything else falls to black |
| Smoke and haze in layers | all | Atmospheric depth; hides the edges of each layer |
| Embers on every plane | 2, 3, 4 | Cheapest way to make a still feel alive and deep |
| Red and black with moonlit blue-white | all | One hot colour against a cold, dark frame |
| Huge condensed type, or brush script | 3 (condensed), 4 (brush) | The title of the film |
| A fixture block: date, time, venue | 1, 2, 3 | Exactly the content of an invite |

**Composite palette observed** (for phase 2, not tokens): night `#18131F` / `#1A2239`; moonlight `#B7D3FA` to `#E8F5FD`; dome glow `#95B7E1`; poster red `#F81E24`; shirt red `#9F0B19`; red smoke `#DB312B`; embers `#DD6756` to `#F03F36`; fire `#E88D4D`; cool smoke `#555767`; white `#FFFFFF`.

**Take:** the low-angle hero; one cold key light and one hot colour; layered smoke with embers on every plane; type depth-sorted between the background and the hero; the fixture block as the invite's own content; Makes smiling.

**Leave:** every crest, the UEFA starball and wordmark, kit-maker stripes, shirt sponsors, the club name on the stand; franchise motifs (the toad summon, the forehead protector, the grenade gauntlet); weapons pointed at the viewer; the Ballotaku art itself, which is third-party work and is never shipped or traced.

**One real-world detail.** On Monday 21 December 2026 the moon is a waxing gibbous, about 93 percent lit, with full moon about two days later (assumed — confirm; a mean-synodic estimate, not an ephemeris). A poster that draws the moon as it will actually look over the party is a small true detail the references cannot have.

## 2. Inventory of the current build

Read from `src/` at commit `29aeb01` on `feature/3d-ticket`. Sizes are from `dist/` built on 2026-10-14 at 23:40, gzipped locally at level 9; Netlify's Brotli will be a little smaller.

### What exists

| Piece | Where | What it actually does |
|---|---|---|
| Page state machine | `InvitePage.tsx` | Five views: `sealed` → `attendance` → `form` → `code` → `stub`. Answers (never the code) persist in `sessionStorage` under `thirty-united:answers`. Each view moves focus to its own heading; a live region announces outcomes ("Ticket opened", "You're on the list. Seat 007"). Details and Code are lazy chunks, warmed 300 ms after load. |
| 3D lanyard ticket | `three/LanyardTicket.tsx`, `three/rope.ts` | A hand-rolled 2D Verlet rope (6 segments, no physics library, no drei) with a rigid card. Canvas-drawn ticket faces, a sheen texture, and a fake shadow plane instead of shadow maps. `frameloop="demand"`, DPR 1 to 1.5. Grab and fling by pointer; yaw follows sideways speed and relaxes face-front. On "Tear open" it eases in 400 ms onto the DOM ticket's rect and hands off. Loaded on idle after first paint; skipped under reduced motion, forced colours, no WebGL or a missing invite key; context loss or a chunk failure drops to the DOM ticket. `?debug=1` shows renderer, DPR and frame stats. |
| Tear | `SealedView.tsx` | DOM ticket. Drag the scissors handle down the perforation: past 35 percent, or a downward flick over 1.2 px/ms, it finishes with the hand's velocity; otherwise it springs back. Clip-path peel with in-plane and out-of-plane rotation. "Tear open" button gives the same finish. A one-time 4 px nudge of the handle at 2.5 s if untouched. |
| Stamp | `Stamp.tsx` | ADMIT ONE · 21 Dec 2026, rotated −4°. Spring impact with contact at 90 ms, a contact shadow, and a 1.5 px recoil of the ticket. Yes is solid; Maybe is outlined with an icon and a MAYBE tag, so they differ by shape and words, not colour alone. Reduced motion: appears in place. |
| Haptics | `lib/haptics.ts` | `navigator.vibrate`: tick 4 ms every 40 px of tear, separation [10, 30, 18], stamp 22 ms, soft stamp 12 ms. Off under reduced motion and before the first user tap. Works where the browser exposes `vibrate` (the code comment scopes this to Android Chrome and most webviews). Direction A in `direction.md` says "Haptics kept" and quotes 8, 12, 25-15-35 and 40 ms; the code has 4, [10, 30, 18], 22 and 12 ms. To reconcile in phase 2. |
| Sound | `lib/sound.ts` | Opt-in, off by default, choice kept in `sessionStorage`. Synthesised with Web Audio, no media files. The context is created only inside a tap. Tear ticks are band-passed noise whose pitch and level follow drag speed (1.2 to 4 kHz); separation is a 140 ms rip; the stamp is a 140 Hz sine plus a 6 ms click at −18 dB. Silent under reduced motion and forced colours. |
| Stadium stage | `index.css` (`.stage-backdrop`, `.stage-glow`) | Not 3D. CSS gradients for sky, two terrace bands, a pitch band and mowing stripes; an SVG mask for seat dots; two radial floodlight glows that fade in. Sealed view only; it fades out after the tear. Its tokens (`#0B1411` and family) are out per the brief. |
| Tilt | `hooks/useTilt.ts` | Pointer or finger tilt on the DOM ticket, up to 9° (mouse) or 7° (touch), with a contact shadow that shifts with the tilt. Used on the sealed and stub tickets. Off under forced colours and while the 3D layer is up. |
| Ticket, stub, header ticket | `Ticket.tsx`, `Stub.tsx`, `HeaderTicket.tsx`, `StubView.tsx` | The DOM ticket with punched notches and a stub column. The returned stub shows name, team line (or NEUTRAL), SEAT from `ticketNo` as three digits, DATE and REPLY. No path draws a void line and "Changed your mind?". |
| Fields | `DetailsView.tsx`, `AttendanceView.tsx` | Attendance is one radio group (Yes, Maybe, No) and Continue. Details for Yes and Maybe is one view with grouped boxes: You (first name, surname, preferred name), Plus one, Your team (football or other sport, team), A bit more (fun fact, how you know Makes), Contact (email, email or WhatsApp, WhatsApp number). Details for No is "Just your name" plus email. Plus-one lives in Details today, not in Attendance. |
| Code | `CodeView.tsx` | Six-digit OTP input, resend with a 60 s cooldown, tries left, expiry at 10 minutes, a 15 s timeout with no silent retry (a retry would send a second email). |
| Fonts | `index.css` | Barlow Condensed 700, Source Serif 4 italic 400, Inter 400 and 500, JetBrains Mono 500, all self-hosted. Barlow Condensed 700 is already close in spirit to the MATCHDAY header. There is no brush script. |
| Link preview | `public/og.png` (12 kB), `index.html` | The WhatsApp preview image and text ("Thirty feels like half time. Come for the oranges."). This is the first frame every guest sees, before the page opens. |

### Measured weight

| Chunk | Raw | Gzip −9 |
|---|---|---|
| Entry `index-*.js` (React, motion, Convex client, views) | 471 kB | 151 kB |
| `LanyardTicket-*.js` (three, R3F, the scene) | 924 kB | 243 kB |
| `DetailsView-*.js` | 130 kB | 40 kB |
| `CodeView-*.js` | 18 kB | 7 kB |
| CSS | 61 kB | 12 kB |

The brief quotes 246 kB for the 3D chunk; 243 kB is the figure from this build. The entry chunk is free of three, as the brief requires.

### What carries over

| Craft | Carry over? | How it maps to a poster-led concept |
|---|---|---|
| Lanyard ticket and rope | Yes, re-skinned | The matchday pass hanging in front of the poster on the sealed beat. The rope, fling and face-front correction are the owner-approved part; only the faces, strap and lighting change. The settle-and-hand-off pattern (3D object eases onto a DOM rect) is reusable for the final poster too. |
| Tear | Yes | The opening gesture of every concept: rip the pass, break the seal, or rip a card pack. The drag-plus-button pattern already meets the one-tap rule. |
| Stamp | Yes, reworked | The last impact: the stamp lands on the guest's poster, or becomes a brush-script signature hit. The yes/maybe shape difference stays. |
| Haptics | Yes, extended | Add an impact for the title slam and one per code digit; keep the gating. |
| Opt-in sound | Yes, extended | Synthesis covers embers (crackle from filtered noise), a low drum hit for the title slam, a crowd swell from shaped noise. A recorded chant or voice line would be the first media file. |
| Tilt | Yes | Becomes the poster's parallax on the 2D rung: tilt drives layer offsets instead of a card rotation. |
| Stadium stage (CSS) | Composition only | Its tokens are out and a CSS gradient will not reach the references. Its idea, a backdrop that fades to show progress, survives as a technique. |
| State machine, focus, live region, `sessionStorage` | Yes, unchanged | Every concept maps onto the same five views. |
| `ticketNo` | Yes | The only personal number the backend gives. It can be the seat, the squad number, or both (see section 5). |

## 3. Concept space

### The wide field

Fifteen starting points, including A to D, each judged against the new references and the brief. "Shortlist" means it survives as one of the five concepts below, alone or merged.

| # | Concept | One line | Verdict |
|---|---|---|---|
| 1 | D. Matchday (living poster) | The invite is Makes's anime matchday poster, alive in parallax; chapters for steps; your own poster at the end. | Shortlist (S1) |
| 2 | B. Walk-Out | First-person walk from turnstile to touchline. | Merged into S2 |
| 3 | C. Lights On | Floodlights strike bank by bank as you answer. | Merged into S3 |
| 4 | A. Tabletop Ground | A floodlit model on a lacquered turntable. | Dropped as a lead. The references moved from "small world" to "hero"; a miniature reads charming, not cinematic. The turntable pull-back survives as a possible finale move. |
| 5 | The call-up | Your invitation arrives as a squad call-up; you report for duty. | Merged into S2 as its story frame |
| 6 | Moonrise | The moon rises over the ground as you progress; finishing is full moon. | Merged into S3 |
| 7 | Ember trail | One continuous shot follows an ember from the moon down to the stadium; each answer adds embers. | Kept as a transition technique for S1 and S3 |
| 8 | Power-up | Each answer charges the hero's aura until the poster ignites. | Merged into S3, with the ball as the power object, not a weapon |
| 9 | Motion comic, "Chapter 30" | A manga chapter read panel by panel; the last page is the splash. | Shortlist (S4) |
| 10 | Drone descent | Broadcast opener: from the moon, through cloud, down into the tunnel. | Kept as an opening shot for S1 or S2 |
| 11 | Tifo | The stand raises a card mosaic, section by section, until it shows your name. | Shortlist (S5) |
| 12 | Pre-match show | A broadcast intro with a team sheet and line-up graphics. | Dropped. It lands on rejected C (strips, ticker, wipes, numbered rows). |
| 13 | Card pack | Rip a foil pack (the existing tear) and pull your own player card. | Kept as an alternative sealed beat and reward format for S1 |
| 14 | Trailer cold open | A 10 to 15 s letterboxed trailer before the RSVP. | Dropped as a gate in front of the content: it delays first use and costs finishes. Title-card grammar kept. |
| 15 | Pep talk | A short voice note from Makes plays at the stub. | Kept as an optional add-on to any concept; needs the owner to record it |

### Shortlist

Five concepts. S1 is direction D sharpened; S2, S3 and S5 are hybrids; S4 is new. All five share the same reward format (the guest's own poster, described once under S1) so the real choice is the journey, not the ending.

Each beat sheet maps to the existing views: **Sealed**, **Attendance**, **Details** (one grouped beat), **Code**, **Stub**, plus the **No** path. In every beat the plain DOM control on a solid panel completes the step; the world only answers.

#### S1. Matchday: the living poster

**Logline.** The invite is Makes's own anime matchday poster, alive in layered parallax; the RSVP is the chapters of the issue, and the last chapter re-composes the poster with you in it beside him.

**Signature moment.** At the stub the poster re-sets: Makes steps half a pace aside, an empty shirt in the second slot turns to show your name and number in brush script, the MATCHDAY header re-sets to THIRTY UNITED · 21 DEC 2026, embers burst and the stamp lands.

**World.** One 9:16 poster in seven or eight depth planes: sky and moon; a plain glowing dome over the stadium; haze; stand, flags and crowd (all plain); the title type; Makes; the second slot; rubble and embers in the foreground. On a phone it fills the screen above the step panel; on desktop it is a tall poster centred in a dark void.

**Beat sheet.**
- **Sealed, cover.** The poster at rest with slow embers and rolling smoke. The pass hangs on its lanyard in front (the current rope). Tear or "Tear open": embers burst from the tear line, MATCHDAY slams in behind Makes, the camera pushes in a few percent.
- **Attendance, "Chapter 1: Are you in?"** Yes: Makes turns from the stadium to smile at the camera (an expression swap), embers flare. Maybe: he glances over his shoulder, the moon's halo dims halfway. No: the poster holds, one ember drifts across.
- **Details, "Chapter 2: Your kit."** All fields on one panel, grouped as today. As the guest types their preferred name, it is lettered in brush script on the back of the empty shirt in the second slot; the team appears on a small tag. Bringing someone adds a third, smaller shirt.
- **Code, "Chapter 3: The seal."** Six embers in the top information line light one per digit (embers, never digits on a board). Wrong code: they go out and the error shows on the panel. Right code: they flare.
- **Stub, "Matchday."** The re-composition above, then the save and share controls.
- **No path.** Makes waves; the second slot stays empty; the panel says "Sorry you'll miss it" and offers "Changed your mind?". Whether a No guest also gets a poster (for example "Wish him luck") is an owner call.

**Reward.** A 1080 × 1920 poster (story format, so it fits WhatsApp Status and Instagram Stories): Makes and the guest's back-view figure with their name and number, THIRTY UNITED, MONDAY 21 DECEMBER 2026, and the venue line once there is one. It is drawn on a 2D canvas from the same layers. Saved by long-press on an `<img>` with a `data:` URL; shared with Web Share where it works (unverified in WhatsApp's in-app browser, see section 4). It carries only the guest's own preferred name (or first name), number and team. Never email, WhatsApp, surname by default, or anything about other guests.

**Assets.**
- *Code:* layer parallax driven by depth maps (a displacement shader on each plane); GPU ember particles; smoke as noise-shaded cards; moon halo and soft light shafts as additive cards; type set in the scene (canvas textures) with the hero depth-sorted in front; brush-script name rendering from a font; the poster compositor; synthesised crackle, drum hit and crowd swell; haptics.
- *AI or art tools:* a crest-free background plate (sky, moon, dome, stadium, crowd, flags); Makes as a cut-out in three expressions (looking at the stadium, smiling to camera, waving); a neutral back-view guest figure with a blank shirt; a smaller plus-one figure; a foreground rubble plate; a depth map per plate; hand-lettered SVG lockups for "MAKES 08" and "THIRTY UNITED". About eight to ten plates in one consistent style.

**Reduced motion and forced colours.** Reduced motion: the poster is still, expression swaps and the final re-composition are instant cuts, no embers, no parallax. Forced colours: the poster is hidden, the panels use system colours, the reward is still offered as an image with full alt text.

**Strengths and risks.** Closest to every reference and to what he asked for. The 2D rung is strong because the world is already a layered 2D picture. The risk is the art pipeline: the whole concept rests on eight to ten plates that must match in style, and on the guest figure reading as "me" to people aged 20 to 70, many of whom do not read anime.

#### S2. The Call-Up: walk out through the poster

**Logline.** You are called up to Makes's squad and walk from the street to the touchline through painted 2.5D sets; the last step out of the tunnel lands you on his poster.

**Signature moment.** The walk-out. After the right code, the camera runs down the tunnel for about 2.4 s, the tunnel mouth whites out with floodlight, and you come out into the S1 poster beside Makes under the moon.

**World.** Four painted sets, each a plate of three to five depth layers: the street outside the ground under the moon; the turnstile; the dressing room with your shirt on a peg; the tunnel with caged lamps. The camera dollies through layered planes rather than modelled interiors, which is what makes B affordable.

**Beat sheet.**
- **Sealed.** The call-up pass on its lanyard at the turnstile, the stadium glowing over the roofline. The tear is a steward tearing your stub.
- **Attendance, the turnstile.** Yes: the arm turns and the camera moves through. Maybe: the arm half-turns and holds. No: you stay in the street under a lamp.
- **Details, the dressing room.** One grouped panel. Your name is lettered on the shirt on the peg as you type; your team appears on the kit-bag tag; a plus-one hangs a second shirt.
- **Code, the tunnel.** Six caged lamps light one per digit. Wrong: they go out and the camera holds. Right: the walk-out.
- **Stub.** The poster finale and reward from S1.
- **No path.** The camera turns back to the street lamp; Makes's poster is a print on the wall outside.

**Reward.** The S1 poster.

**Assets.**
- *Code:* camera dolly through planes, layer parallax, lamp toggles, fog, a white-out flash transition, embers, footstep and crowd synthesis.
- *AI or art tools:* four sets of three to five layers plus the S1 finale, roughly 20 to 25 plates in one style; depth maps for each.

**Reduced motion and forced colours.** Every move is a cut; the walk-out is a single cross-fade; no flash. Forced colours as S1.

**Strengths and risks.** The strongest story ("you report for duty, you walk out") and the most film-like. Highest art cost by far, and forward camera travel carries a motion-sickness risk that the reduced-motion path and slow, fixed-height dollies only partly cover.

#### S3. Power-Up: the poster that ignites

**Logline.** One fixed poster, nearly dark at first; each answer powers it up (moon, floodlights, smoke, embers) until the last answer sets the whole poster alight with you in it.

**Signature moment.** The final ignition: every floodlight flares, the ball under Makes's foot catches with embers, MATCHDAY strikes white letter by letter, and your name appears beside his.

**World.** The S1 poster as one composition with separate light passes: a dark pass, a lit pass and emissive masks for the moon, each floodlight bank, the ball and the title. Progress is light, as in C: there is no stepper.

**Beat sheet.**
- **Sealed.** Near-dark poster, only the moon. The tear brightens the moon and wakes the first embers.
- **Attendance.** Yes: floodlight bank one strikes and Makes's face is lit. Maybe: bank one at half. No: one lamp over the gate.
- **Details.** Smoke rolls in and the flags lift; your name is lettered into the poster as you type.
- **Code.** Six embers along the ball's seam light one per digit. Right code: the ball glows.
- **Stub.** Full ignition and the reward.
- **No path.** The poster settles at its half-lit state with the gate lamp on.

**Reward.** The S1 poster.

**Assets.**
- *Code:* light-pass blending by uniforms (the same trick as A's two lightmaps, in 2D), flares, particles, title strike, the compositor, synthesised hum, clunk and crackle.
- *AI or art tools:* one poster with matching dark and lit passes and a handful of masks, plus the guest figure and lockups. The lowest art cost of the five.

**Reduced motion and forced colours.** Each beat swaps to its lit state instantly; no flare. This is the strongest 2D rung of the five because the 2D version is the same layers with their opacity switched.

**Strengths and risks.** Cheapest to make and to render, and the clearest progress signal. The weakest on "film": the camera barely moves, so it leans on push-ins, title slams and particles for drama.

#### S4. Chapter 30: the motion comic

**Logline.** The RSVP is a manga chapter titled "Chapter 30", read panel by panel; each answer fills a panel, and the last page is your poster as a full splash.

**Signature moment.** The page turn into the splash: speed lines, screentone, a hand-lettered sound effect, and the poster filling the whole spread.

**World.** One manga page of five panels. The camera moves from panel to panel with a slow push inside each and light parallax between inked layers. The step panel is a caption box. Solid caption boxes are how comics carry text, so the "text never on the moving scene" rule is native to the medium.

**Beat sheet.**
- **Sealed, the cover.** "Chapter 30" cover with the pass on its lanyard. Tear to open the chapter.
- **Attendance.** A panel of Makes asking "You coming?" in a speech bubble (the same words are the view's heading for screen readers). Yes: a reaction panel, a big grin and a sound effect. Maybe: a thinking panel. No: a quiet panel of an empty seat.
- **Details, "Player profile."** A character-sheet panel holding all the grouped fields; your name is lettered into the header as you type.
- **Code, "The seal."** Six ink seals stamp one per digit.
- **Stub.** The splash page and the reward.
- **No path.** A last small panel: "Next chapter, then."

**Reward.** The S1 poster, drawn as a splash page.

**Assets.**
- *Code:* panel layout, halftone and screentone shaders, speed lines, sound-effect lettering, page turn, camera moves; it does not need WebGL to look complete.
- *AI or art tools:* five to seven panel illustrations and the splash, in one style.

**Reduced motion and forced colours.** Panels cut instead of pan; no speed-line animation. Forced colours: the art is hidden and the captions remain.

**Strengths and risks.** The clearest "story you want to finish" and the cheapest to render. The furthest from the owner's whole-lit-world videos: it is a page, not a world, and the brief asks that the world persist behind every step.

#### S5. Tifo: the stand raises your name

**Logline.** You are in the stand under the moon; each answer makes the crowd opposite raise another section of a card mosaic, until the whole stand shows your name and number beside MAKES 08.

**Signature moment.** The full tifo: the last section flips, red smoke rises from the front rows, the floodlights flare, and your name runs the width of the stand.

**World.** A 3D stand opposite you (instanced cards, 5,000 to 20,000 depending on the device), the pitch, four floodlights and the moon. The mosaic is generated in code from the guest's own name and number, drawn to a canvas and sampled into card colours.

**Beat sheet.**
- **Sealed.** The stand is dark; the pass hangs from the roof edge above your row. The tear starts a ripple across the cards.
- **Attendance.** Yes: the first section flips to red. Maybe: half the section. No: a single small section shows a heart.
- **Details.** As you type, your name shows faintly across the stand, as if the crowd were practising.
- **Code.** Six blocks of cards flip one per digit.
- **Stub.** The full tifo, then the reward.
- **No path.** The stand shows "NEXT TIME" in one small section.

**Reward.** A photo-style frame of the tifo with your name, plus the S1 poster if the art exists.

**Assets.**
- *Code:* almost all of it. Instanced cards with a wave-flip shader, the procedural stand, floodlights, flare smoke, a synthesised crowd.
- *AI or art tools:* optional: one sky and moon plate; the S1 lockups if the poster reward is used.

**Reduced motion and forced colours.** Sections appear complete, no wave. Forced colours as S1.

**Strengths and risks.** The least dependent on AI art, and highly personal at the end. The risks: a crowd suggests other guests, so it must read as anonymous decoration with no counts; tens of thousands of instanced cards are the heaviest GPU load of the five; and it centres the stadium, not Makes.

### Side by side

Estimates for phase 2 to test, not measurements.

| | S1 Living poster | S2 Call-Up | S3 Power-Up | S4 Chapter 30 | S5 Tifo |
|---|---|---|---|---|---|
| Closest reference | 3, 4 | 1, 3 | 4 | 1 to 4 (format) | 4 (stadium, crowd) |
| Feels like a film opening | High | Highest | Medium | Medium | High at the end |
| AI or art plates | 8 to 10 | 20 to 25 | 4 to 6 | 6 to 8 | 0 to 2 |
| GPU load | Low to medium | Medium | Low | Low | Medium to high |
| 2D rung strength | Strong | Medium | Strongest | Strong | Weak (the cards are the show) |
| Drift risk | Top strip near rejected C | Low | Low | Low | Crowd implying other guests |
| Fit for non-fans aged 20 to 70 | Depends on the art style | Good (a walk is universal) | Good | Depends on manga literacy | Good |

## 4. Hard constraints any concept must keep

### Accessibility

- **Reduced motion.** No camera travel, parallax, particles or relight animation. Each beat swaps instantly to its final state, and every reaction has a static equivalent. This is the existing project rule; every concept above names its version.
- **Flashes.** Explosions, lightning cracks, floodlight flares and white-outs must stay within WCAG 2.3.1: no more than three flashes in any one second, and saturated red flashes count separately under the red-flash threshold. S1, S2 and S3 all carry this risk.
- **Forced colours.** The scene is hidden, panels use system colours, and the reward is still offered as an image with alt text that names what is on it.
- **Keyboard.** Every step completes with Tab, Enter or Space. The canvas is never in the tab order. Focus moves to the new step's heading (project rule). Every world reaction that carries meaning is announced in the live region.
- **Contrast on solid panels.** Text never sits on the moving scene. Computed against the sampled colours:

  | Pair | Ratio | Meaning |
  |---|---|---|
  | `#FFFFFF` on night `#18131F` | 18.23:1 | A near-black panel with white text is safe |
  | Moonlight `#B7D3FA` on `#18131F` | 11.90:1 | A good muted-text or focus colour |
  | `#FFFFFF` on shirt red `#9F0B19` | 8.28:1 | This red can be a button fill with white text |
  | Shirt red `#9F0B19` on `#18131F` | 2.20:1 | That button needs a light outline to meet 3:1 as a control edge |
  | `#FFFFFF` on poster red `#F81E24` | 4.04:1 | Fails AA for normal text; large text only |
  | Poster red `#F81E24` on `#18131F` | 4.52:1 | Only just AA as text |
  | Poster red `#F81E24` on red smoke `#DB312B` | 1.16:1 | Red on the red scene vanishes, so the panel rule matters |
  | `#FFFFFF` on fire `#E88D4D` | 2.52:1 | Never set text over fire or explosion light |

  Focus rings and control edges also need 3:1 against the brightest scene pixel behind them (floodlights reach `#FEFCFB`), as the brief already requires.
- **Size.** Minimum text 14 px, inputs 16 px, targets 48 px, 200 percent text supported. A brush-script name on the poster is decoration; the guest's name is always also in plain text on the panel.

### Privacy and data

- Nothing shows other guests' data: no "who else is coming", no counts, no lit seats beyond the guest's own, no "number taken". A crowd or tifo is anonymous decoration.
- The poster carries only the guest's own preferred or first name, number and team. Never email, WhatsApp number or fun fact. Surname only if the owner wants it and the guest sees it before saving.
- Convex and the RSVP logic are frozen. The only personal number the backend returns is `ticketNo`, after verification. There is no shirt-number field in `guestFields`.

### Interaction

- One tap or Enter completes each step with a plain, labelled DOM control. The world never has to be played, dragged or found.
- Details stays one grouped beat with its current groups. A shirt number, if added, sits inside that group, not on its own screen.
- The five views stay: sealed, attendance, details, code, stub. Answers persist in `sessionStorage` as today, never the code.
- Rejected-direction drift: no letterpress, deckled edge or off-register stamp (B); no solid ink strips, scrolling ticker, wipes, shirt-number form rows or scoreboard digits (C). The MATCHDAY top information line in image 3 sits close to C's strips, so it must read as a poster's printed line, never a broadcast bar, and it never scrolls. A number on a poster shirt is a reward, not a form row, but a "pick your number" control must not look like a numbered list of rows.

### WhatsApp in-app browser

What the repo shows: the owner has already tested the lanyard build inside WhatsApp (`feedback.md`, stadium stage entry), so WebGL ran on at least his device. Everything else below is a question for radar in phase 2, not a fact:

- Does Web Share with files (`navigator.share({ files })`) work inside WhatsApp's in-app browser on Android and iOS? If not, saving the poster depends on long-press on an `<img>`, which must be designed as the primary path.
- Does `<a download>` work there? Assume not until shown.
- WebGL 2 availability and frame times on low-end Android WebViews; `navigator.vibrate`; `AudioContext` unlock; muted inline video autoplay; viewport units and keyboard resize behaviour.
- Is an "Open in your browser" escape worth offering, and how does it behave per platform?

Design rules that hold either way: no hover-dependent meaning; layout on `svh`/`dvh`; the step panel stays usable with the keyboard open; nothing requires a download.

### Fast first paint

- The entry chunk stays free of three (today 151 kB gzip) and no world asset blocks first paint.
- The first frame should be the poster as one compressed still with real HTML text over a solid panel, so the invite is readable before any WebGL or plate streams in. The world then wakes up in place.
- Proposed budget for atlas to confirm or replace: a key-art still of 150 kB or less at phone size, with the full plate set streamed after first paint (assumed — confirm).
- The link preview (`public/og.png`) is the true first frame. It must be the crest-free poster too, and a teaser, not the guest's own poster.

### CSP and hosting

From `netlify.toml` today:

- `img-src 'self' data:`. A poster preview as a `data:` URL works; a `blob:` object URL does not, so blob previews need a CSP change.
- `media-src` is not set, so it falls back to `default-src 'self'`. A self-hosted video loop works; a CDN-hosted one does not.
- `script-src 'self'` with no `wasm-unsafe-eval`: Draco, Meshopt and KTX2/Basis decoders need a CSP change (already noted in `direction.md`).
- `style-src` allows one hash and no `unsafe-inline`.
- `font-src 'self'`: any brush or condensed display font must be self-hosted, which suits OFL fonts.

### Trademarks and third-party art

- No club crests, the club name, the devil or trident emblem, kit-maker marks, shirt sponsors, the UEFA starball or wordmark, or real stadium names. The brief already bans crests, wordmarks and kits; the references add the starball, sponsors and stadium names to that list.
- No franchise characters or signature motifs (the toad summon, the forehead protector, the grenade gauntlet, the sword style).
- The three Ballotaku images are third-party work: inspiration only, never shipped, traced or used as an image-to-image source.
- The link is semi-public (`noindex`, but shared on WhatsApp and likely to be screenshotted), and the reward is designed to be posted. Every exported poster must be clean.

### Audience

Friends and family aged 20 to 70, many not football fans and many not anime readers. The first frame must read as "Makes's 30th, 21 December" in about two seconds. Weapons and pointed blasts are out; Makes smiling, as in image 4, is the tone.

## 5. Open owner decisions

1. **Crests and trademarks.** Recommendation: avoid them entirely, and have him regenerate image 4 crest-free. For the regeneration: a plain red shirt with no crest, no sponsor and no kit-maker stripes, "MAKES 08" on the back; a plain black-and-red ball; flags plain red or with "30"; a stand with no fascia lettering; a plain glowing dome or just the moon, no starball; no devil or trident. Keep the locs, the smile, the foot-on-ball pose, the moon, the red smoke and the embers. The same applies to every layer and to the link preview.
2. **Image 6.** Reading "image 6" as Photo 2 (from behind, five-a-side, red "MAKES 08" shirt; confirm). Two questions: may it be the source for the back-view hero figure (it is the natural walk-out frame), and does the shirt in it carry a crest or sponsor? It is not on disk yet; if approved, it needs to be shared as a file.
3. **What 08 means, and what the guest's number means.** What does 08 mean to him, and may guests also take 08? Then one of:
   - **a. The number is `ticketNo`.** No backend change, always unique, revealed only at the stub ("You're number 17"). It is reply order, not chosen, and can pass 99.
   - **b. The guest picks, client-side only.** Lives on the poster and in `sessionStorage`, not saved. Duplicates are possible and harmless, but it is gone if they come back on another device.
   - **c. The guest picks and it is saved.** Needs a schema change while Convex is frozen, and uniqueness cannot be enforced without telling one guest another's pick, which the brief forbids. Atlas would size this in phase 2.
4. **Art style and pipeline.** Anime (images 1 to 3) or the painted, semi-real style of image 4? Every plate must match. Who generates the plates, with which tool, and can that tool hold Makes's likeness consistently across three expressions?
5. **Tone ceiling.** Recommendation: the ball is the power object, not a weapon, and Makes smiles. Confirm he agrees.
6. **The fixture block.** The invite's fixture block wants a date, time and venue. The date is MONDAY 21 DECEMBER 2026; the venue is TBA in the build. What does the block say until there is a venue and kick-off time?
7. **The No guest's reward.** Does a No guest get a poster too, and what does it say?
8. **Poster privacy.** First or preferred name only on the shareable poster (recommended), or the full name? And is he comfortable with his likeness on every guest's shared poster?
9. **"Nothing loops" and "quiet by default".** All five concepts carry ambient embers and smoke, which the round-2 lux rule forbids. Confirm "go all out" overrides it, so the lux re-run starts from that.
10. **Recorded media.** Is a recorded crowd sound, or a short voice note from Makes at the stub (wide-field idea 15), welcome? That would be the project's first audio file.
11. **Drift from rejected C.** He rejected "Scoreboard Broadcast". Confirm that a poster's printed top line with time and venue (image 3) is not that.

## Phase 2 inputs requested

- **Radar:** the WhatsApp in-app browser questions in section 4; shipped web examples of layered-plate parallax with depth maps; licensing for OFL brush and heavy condensed fonts that cover accented names.
- **Atlas:** the render and download budget per concept; the first-paint plan; the CSP changes each concept needs (`blob:`, decoders, media); whether option 3c is worth a schema change; the poster export path (canvas size, memory on low-end Android).
- **R3F technique catalogue:** depth-map parallax on planes; GPU embers; smoke cards; light-pass blending; instanced card flips; type depth-sorted in a scene; poster compositing; reduced-motion and context-loss fallbacks for each.
