---
name: cinematic-recommendation
date: 2026-10-15
clientName: thirty-united
phase: 2 of 2
author: Pixel
directionGate: closed 2026-10-15 on Direction D (owner reply "defaults"); when written this was a recommendation, not a pick
inputs:
  - .specno-design/audits/cinematic-audit-2026-10-15.md (phase 1)
  - atlas: render budget and architecture (.specno-design/audits/consults/atlas-render-budget.md, copied from the scratchpad 2026-10-15)
  - R3F technique catalogue (.specno-design/audits/consults/r3f-technique-catalogue.md, copied from the scratchpad 2026-10-15)
  - radar: docs/research/cinematic-web-2026-10-15.md
  - src/ at 29aeb01 (feature/3d-ticket)
---

# Thirty United: the cinematic recommendation

**How to read the numbers.** A number tagged **(meas.)** was measured or computed from a file, a build or the WCAG formula. Every other number in this document, including every duration, size, frame time, memory figure and day count, is an **estimate** to be confirmed on a real phone or in the build, whether or not it carries an **(est.)** tag. Pixel sizes for assets are targets we choose, so they're specifications, but the file sizes they produce are estimates.

**Corrections to phase 1.**
- "Image 6" was the AI poster of Makes (`owner-gameday/04-makes-08-moonlit-poster-ai.png`), not the back-view photo. Phase 1's open question 2 is withdrawn as written.
- Both personal photos (front, smiling; back view in a red "MAKES 08" shirt) are still not on disk. The likeness source for every hero plate is therefore a dependency on Makes, and it sits on the critical path (section 4).
- The AI poster carries a club crest on the shirt, the flags, the ball and the corner of the frame, kit-maker shoulder stripes and logo, a shirt sponsor, a trident, and the club name on the stand fascia. None of it can ship (`brand.md:35`). It may serve only as a cropped likeness reference (head and neck), never as a base image.
- Phase 1's S1 put a back-view guest figure in the second slot. I replace that figure with a shirt (section 1). A shirt reads as "mine" to every guest aged 20 to 70, whatever they look like.

---

## 1. The recommendation

### Build a deliberate hybrid: "Matchday: The Signing"

> The invite is Makes's own living matchday poster, dark before kick-off. Each answer switches on another bank of the ground's floodlights. When you confirm, Makes holds up your shirt, with your name and your number, as his new signing, and the title becomes THIRTY UNITED. You keep the poster.

It takes from three of the five concepts:

| Taken from | What it contributes | What it leaves behind |
|---|---|---|
| **S1 Matchday living poster** (the spine) | One 9:16 poster in depth layers, alive in parallax; Makes as the hero; title type depth-sorted between the stadium and him; the poster as the reward | The guest's back-view figure (replaced by the shirt) |
| **S3 Power-Up** (the progress meter) | Progress is light: four floodlight banks strike one per beat, so you can count how far you've come without a stepper. In 2D the strike is an opacity switch, so the fallback rungs keep the meter | The "nearly black" opening (the cover is moonlit, not black, so the first frame still reads in two seconds) |
| **S2 Call-Up** (the story frame) | You aren't filling in a form, you're being signed. The finale is a shirt presentation, which every football culture knows and non-fans recognise from the news | The four painted sets, the tunnel dolly and the white-out |

### Why this wins

Judged against what Makes asked for, then against phones, his effort and reversibility.

- **Cinematic, "don't hold back".** It is his own reference (image 4) brought to life: low-angle hero, moonlight, red smoke, embers on every plane, giant type with him standing in front of it. The poster gets brighter with every answer and ends on one ignition beat with a stamp. From the catalogue it uses depth parallax, faked floodlight cones, smoke, GPU embers, a moonlit sky, scripted camera shots, in-scene type with a brush reveal, the poster compositor and adaptive quality. It drops halftone, bloom and panel wipes.
- **A story people want to finish.** The finale is withheld until the code is right: your number exists only after verification (`ticketNo`), so the shirt carries your name from the Details step but the number appears only in the last scene. The lights also count down to it. Those are two hooks to finish, and neither is a game.
- **His anime matchday references.** It keeps their grammar (low-angle hero, one cold key light and one hot colour, type depth-sorted in the picture, a fixture line, embers on every plane) and leaves out their marks and franchise motifs.
- **Himself as the hero.** Makes is in every frame, smiling, and the guest joins *his* team. He stays the hero, and the guest is the signing.
- **Phones.** It is atlas's recommended path (A1 painted layers, C2 ambient at 30 Hz, D1 client-side JPEG poster) with no CSP change. A 2D layered picture is the cheapest rich world there is: about 8 alpha layers, one particle draw and a few additive cards (catalogue, est.). The T1 and T0 rungs are the same layers, so a low-end Android guest sees the same poster and the same light count.
- **His asset effort.** Five generations from one master image plus one standalone shirt (about 6 images, est.), against S1's 8 to 10, S2's 20 to 25 and S4's 6 to 8 (phase 1, est.). Makes's hands-on time is a few hours of prompting and review (est.). Everything after generation (cut-outs, depth, splits, masks, compression, lettering, poster, OG image) is Claude's.
- **Reversibility.** The one hard-to-reverse commitment is the plate set, and it's gated: the master image is generated and approved for likeness and cleanliness before any other plate exists. After that, every rung builds on the same files, and the WebGL layer is an enhancement that can be switched off without losing the journey. The lanyard has a cut line (B3). Nothing touches Convex.

### Runner-up: S2 The Call-Up

S2 has the strongest film grammar (you walk from the street to the touchline), and on "cinematic" alone it beats the hybrid. It loses on the other three tests:

- **Asset effort:** 20 to 25 plates in one consistent style (phase 1, est.), four sets each needing its own depth layers. That's the effort Makes would carry, and style drift across 20 generations is likely.
- **Phones and comfort:** forward camera travel is the one motion-sickness risk in the set, and each set is a separate texture load while the guest may be switching to their email app.
- **Fallback:** its 2D rung is weaker (a cross-fade instead of a walk).

Its best idea, being called up, survives as the story frame of the hybrid.

### Why not the others

- **S3 Power-Up alone:** the cheapest, but the camera barely moves; it's the hybrid's meter, not its film.
- **S4 Chapter 30:** a page, not a world. The brief asks for a world that persists behind every step, and manga literacy can't be assumed for guests aged 20 to 70. Its transition grammar (panel wipes) also sits close to rejected C's "wipes".
- **S5 Tifo:** it centres the stadium instead of Makes, it's the heaviest GPU load (5,000 to 20,000 instanced cards, est.), its 2D rung is weak, and a crowd raising your name suggests other guests.

### Where I disagree with a consultant

| Topic | Consultant said | I decided | Why |
|---|---|---|---|
| Display type | Atlas: huge type is DOM text, never a texture | The decorative in-scene title ("THIRTY", later "THIRTY UNITED") is a canvas texture in the WebGL tiers and a DOM layer between image layers in T1/T0. It is `aria-hidden`. All readable text, including the real heading, date and venue, is DOM on the solid panel (atlas's rule, kept) | Depth-sorting the title between the stadium and Makes is the signature of reference image 3, and DOM text can't sit between two layers of one canvas |
| Smoke | Catalogue: 10–30 soft sprite planes | 2–3 scrolling-noise quads (atlas) | Sprite overdraw is what kills a Mali GPU (atlas, est. 4–8 ms) |
| Tier promotion | Catalogue: step quality up again "cautiously" | Never promote within a session (atlas) | Promotion oscillates |
| Parallax input | Catalogue: `DeviceOrientationEvent` on phones | Touch-drag and scripted camera shots only; no gyro by default (atlas) | iOS needs a permission prompt that may not appear in a WebView (radar), and gyro parallax adds involuntary motion |
| Post-processing | Catalogue: a combined bloom, grain, grade and chromatic aberration pass; halftone and posterize | No post pass in v1. Glow comes from the "lights on" plate plus additive sprites; grain and vignette are a static CSS overlay. Halftone and posterize are out | Bloom is the costliest item on mobile (both consultants), and halftone fights the painted look. Half-resolution bloom is a T3-only experiment after the device test, not part of the plan |
| Chapter transitions | Catalogue: DOM clip-path panel wipes | No wipes. Beat changes are camera shots and light changes in one continuous world | Rejected C bans wipes, and the brief says view changes are camera or light moves |
| Poster format | Atlas: 1080×1350 (4:5) may be friendlier for WhatsApp | 1080×1920 (9:16) only | Matches the art, WhatsApp Status and Instagram Stories; one format halves the testing |
| Poster encoding | Catalogue: `toBlob('image/png')` | JPEG at about q0.88 (atlas) | 250–600 kB against 3–5 MB (atlas, est.), and WhatsApp re-encodes anyway |
| Video loop | Atlas: optional cinemagraph on T3 | No video in v1 | Autoplay risk in WebViews (atlas, radar), and the commercial terms for Veo, Kling, Runway and Luma are unverified (radar). Embers and smoke are code |
| Layer split | Catalogue and radar: Qwen-Image-Layered | Make the clean background with the image tool's edit mode, then split it by depth bands in Claude's offline script. Qwen-Image-Layered is optional | It needs CUDA (radar) and this machine is a Mac; a hosted run means reading the host's terms |
| Brush script for guest names | Phase 1 and catalogue: a self-hosted brush font | Guest names in Barlow Condensed 700 (already self-hosted). Brush only for fixed lockups, turned into SVG paths at build time so no font ships | Radar didn't confirm accent coverage for any brush font; Barlow is already on the page |

---

## 2. The experience, beat by beat

### The frame

- **Phone (portrait):** the poster fills the screen behind everything. A solid **step panel** docks at the bottom, about 40–45 percent of the height (est.). Each beat has its own camera shot that keeps Makes's face and the shirt above the panel. When the keyboard opens, the shot reframes to a strip on the shirt (the `visualViewport` height drives it).
- **Desktop:** the poster stands as a tall 9:16 frame centre-left in a dark void, and the panel is a 420 px column on the right.
- **Solid text surfaces, all of them:**
  1. the step panel (solid night `#18131F`, square corners, a single 1 px moonlight rule on its top edge; no torn or deckled edge, because that was rejected B);
  2. the two chips (Sound, Still), each on its own solid night chip;
  3. the poster's printed line and title, which are *art*, `aria-hidden`, over a painted band of empty night sky that no cloud or ember crosses.

  Every word a guest must read (headings, the date and venue, labels, errors, buttons) is DOM text on the panel. Nothing readable sits on the moving scene.
- **Colour on the panel** (contrast measured with the WCAG formula, against the colours sampled in phase 1):

  | Use | Pair | Ratio |
  |---|---|---|
  | Body and heading text | `#FFFFFF` on `#18131F` | 18.23:1 (meas.) |
  | Muted text, focus ring | moonlight `#B7D3FA` on `#18131F` | 11.90:1 (meas.) |
  | Primary button | `#FFFFFF` on shirt red `#9F0B19` | 8.28:1 (meas.) |
  | Primary button edge | `#9F0B19` on `#18131F` | 2.20:1 (meas.), fails 3:1, so the button carries a 2 px moonlight ring: `#B7D3FA` against `#9F0B19` is 5.41:1 and against the panel 11.90:1 (meas.) |
  | Poster red | `#F81E24` on `#18131F` | 4.52:1 (meas.): large display type and decoration only, never a button fill (white on it is 4.04:1, meas., which fails AA for normal text) |
  | Error text (candidate) | `#FF9E8F` on `#18131F` | 9.15:1 (meas.), always with an icon so red isn't the only signal |

  These are candidates for the design-system step, not tokens. Tokens are written only after the pick.

### Before the page: the link preview

The WhatsApp preview is the true first frame. It's a teaser, never a guest's poster: Makes from the chest up, lit by the moon, looking up at four dark floodlight towers, red smoke low in the frame, "THIRTY" in the sky and "21 DEC 2026" small beneath it. Claude composites it from the layers at 1200×630 (spec) as a JPEG. The title and description stay as built ("Thirty United"; "Thirty feels like half time. Come for the oranges. RSVP for Makes' 30th, 21 December 2026."). WhatsApp's size and format limits for preview images are unverified, so it gets tested in the phase-0 device test.

### The opening sequence (Sealed, the cover)

The cover is never a gate: the "Tear open" button and the tear handle work from the first paint, and the sequence plays around them. Timings are estimates for T3/T2 on 4G, to tune on a device.

| Time | What the guest sees | Sound (opt-in) | Haptics |
|---|---|---|---|
| 0 to about 1.2 s | First paint: one flattened still of the poster in its pre-match state (moonlit, floodlights dark, Makes rim-lit by the moon, smoke low). "THIRTY" is painted across the empty sky band. The panel shows the h1 "You've been called up" (draft copy, Makes to approve), the standfirst "Thirty feels like half time. Come for the oranges.", "Monday 21 December 2026 · Venue TBA", and the pass with "Tear open". Usable now | None: audio can only start inside a tap | None: `navigator.vibrate` refuses before the first tap (`haptics.ts`) and doesn't exist on iPhone (radar) |
| +300 ms | Tier picked (idle). World chunk requested on T2/T3 | | |
| about 1–2 s | The world canvas cross-fades over the identical still in 400 ms, so it looks like the picture coming alive. Ambient starts at 30 Hz: clouds slide across the moon, smoke rolls along the ground, about 300 embers rise slowly (T3; fewer on T2). The lanyard pass drops in from the top of the frame and settles on its rope (as built) | | |
| 2.5 s, if untouched | The existing 4 px nudge on the tear handle | | |
| Tear (about 0.8 s, 823 ms measured for the built tear) | Drag down the perforation or press "Tear open". The pass rips; embers spill from the tear line (a one-shot burst, about 600 ms) | Band-passed rip that follows drag speed (as built) | Android only, from the first activated tap: 4 ms ticks every 40 px, then [10, 30, 18] at separation (built values) |
| tear + 0 to 400 ms | **Bank one strikes**: the left floodlight tower's lamps come on (a small-area strike), and the stand under it lifts from dark to lit over 600 ms, one way | Floodlight clunk and a 120 Hz hum swell (synthesised; nothing below 100 Hz, which phone speakers can't play) | 12 ms |
| tear + 400 to 1,600 ms | The camera pushes in about 3 percent and eases out. The pass, torn, falls out of frame | Low drum hit when the push begins | |
| tear + about 1.2 s | The panel's content changes to Chapter 1; focus moves to its heading (project rule) | | |

Reduced motion (T0): the still, in its pre-match state; "Tear open" only; on press, the poster swaps instantly to bank one lit and the panel changes. Forced colours: no poster, the panel in system colours, the same words.

### Chapter 1: "Are you in?" (Attendance)

The panel holds one radio group (Yes / Maybe / No) and Continue, as built. The world answers the *chosen* option on Continue, not on selection, so nobody sees a reaction they didn't commit to.

| Answer | What moves | Sound | Haptics | Announced |
|---|---|---|---|---|
| **Yes** | **Bank two strikes.** The crowd's flags lift about 6 px over 400 ms; an ember swirl rises past Makes; he stays smiling down at the camera | Crowd swell, 1.2 s, shaped noise | 12 ms | "You're in. The lights are coming on." (draft) |
| **Maybe** | Bank two strikes at half brightness and holds there; the moon's halo dims by half | A softer swell | 8 ms | "Maybe. We'll keep a light on." (draft) |
| **No** | No bank strikes. Makes's plate cross-fades (250 ms) to the waving pose. One ember drifts across the frame | One quiet crackle | 8 ms | "Sorry you'll miss it." (draft) |

### Chapter 2: "Your shirt" (Details, Yes and Maybe)

- **Panel:** the grouped fields exactly as built (You, Plus one, Your team, A bit more, Contact), one beat, never one question per screen.
- **World:** a plain red shirt on a hanger swings in from the right and hangs in the slot beside Makes (600 ms, eased, no overshoot). The camera shot moves to frame both.
- **As the guest types their preferred name** (or first name if that's empty), it's lettered across the back of the shirt in Barlow Condensed 700, white, warped to the cloth's perspective. Each new letter paints in over 150 ms after a 120 ms pause in typing. The number area stays empty, with a faint ghost outline, because the number only exists after the code.
- **Bringing someone** adds "+ [their name]" to the poster's credit line, not a second figure.
- **Team** is collected as today. It appears as text on the poster's credit line, never as a badge.
- On Continue ("Send my code"): **bank three strikes.** 12 ms haptic, clunk and hum.

Keyboard open: the shot reframes to the shirt so the guest watches the name land while typing.

**No path, Details:** "Just your name" and email, as built. Makes keeps waving and no shirt appears. On "Send my code", no bank strikes.

### Chapter 3: "Seal it" (Code)

- **Panel:** "Check your email" with the address, the six-cell input, resend with its cooldown, tries left, as built. New copy, recommended: "Keep this page open. If it closes, open the link again and your answers will be waiting." (That promise needs the code-step persistence fix in section 5.)
- **World: the ground holds its breath.** Ambient motion stops (atlas's code-step pause, turned into a story beat): the embers hang, the smoke stops. The only motion is the guest's own: six small lamps on the right-hand floodlight head light one per digit typed. They are lamps, never numerals, so this doesn't drift toward rejected C's scoreboard digits.
- Each digit: a lamp lights in 80 ms, a 4 ms haptic, a soft tick sound.
- **Wrong code:** the six lamps go out together over 200 ms, the error shows on the panel, haptic [10, 30, 10].
- **Right code:** the six lamps flare, **bank four strikes**, and the finale begins.
- Leaving for the email app: on `visibilitychange` (hidden), the canvas stops and drops its big textures; on return, the still layer (same composition) is already showing and the canvas rebuilds behind it.

### The finale: "Signed" (Stub, Yes and Maybe)

About 3.2 s in all (est.). Every large-area brightness change is one-way and lasts at least 300 ms, so nothing flashes (WCAG 2.3.1: at most three flashes in any second, with the red-flash threshold counted separately).

| Time | What moves | Sound | Haptics |
|---|---|---|---|
| 0 | Verified. The panel content drops away (250 ms) | | |
| 250 ms | The whole poster dims about 20 percent over 300 ms: a held breath | Crowd hush | |
| 550 ms | Makes's plate cross-fades (350 ms) to the signing pose: he holds the shirt up by the shoulders, back to camera, your name across it. The camera pushes in 4 percent | | |
| 900 ms | **Your number** appears on the shirt, set in Barlow Condensed 700, scaling from 1.15 to 1.0 in 220 ms | Drum hit | 22 ms |
| 1,100 ms | "UNITED" paints in under "THIRTY" with a brush-stroke reveal (500 ms): the title is now THIRTY UNITED | | |
| 1,400 ms | Full ignition: all banks to full (one-way, 600 ms), an ember burst from the ground (one-shot, 1.2 s) | Crowd swell | |
| 1,800 ms | The stamp lands on the poster's lower corner with the built spring (contact at 90 ms) and the 1.5 px recoil. Yes: solid "SIGNED · 21 DEC 2026". Maybe: outlined, with the pencil icon and "PENCILLED IN" (draft copy) | Stamp: 140 Hz sine plus a click (as built) | 22 ms (Yes), 12 ms (Maybe) |
| 2,200 ms | The panel returns: "You're on the list" or "We've held your seat" (as built), "Seat 017 · Shirt 17", and two buttons: **Save your poster** and **Share**. The poster `File` was rendered during the stamp, so Share is ready (atlas) | | |

**Saving and sharing.**
- **Share** calls `navigator.share({ files })` synchronously in the tap, with the pre-rendered JPEG, and only shows where `navigator.canShare({ files })` is true.
- **Save your poster** opens the poster as a full-screen `<img>` from a `data:` URL with "Press and hold the poster to save it". This is a co-primary path, not a fallback: Android System WebView has no `navigator.share` at all (radar, MDN BCD).
- Under both buttons: "Save it now. We don't keep a copy." (draft). It's true: the poster is made on the phone and never uploaded.

**What's on the poster** (1080×1920, JPEG):
- Makes holding up the guest's shirt, with their name and number on it.
- THIRTY UNITED.
- "MON 21 DEC 2026 · VENUE TBA" (see decision 8).
- The credit line: team, and "+ name" for a plus-one.

It never carries a surname, email, WhatsApp number, fun fact or anything about other guests.

Reduced motion: the final composition appears at once, with the stamp in place. Forced colours: no live scene, but Save your poster and Share still work, and the `<img>` alt text names what's on it ("Poster: Makes holds up a red shirt reading THANDI 17. THIRTY UNITED, Monday 21 December 2026").

### The finale for No: "Sorry you'll miss it"

The lights stay at their pre-match level, apart from bank one from the tear. Makes is still waving. One ember drifts up past the moon. The panel shows "Sorry you'll miss it, [first name]" (as built), the HeartHandshake icon and "Changed your mind?". There's no stamp and no poster (decision 3).

### When the guest comes back

The page stores nothing across sessions and reads nothing about the guest from the server, so this is plain:

- **After finishing, opening the link again:** the cover, exactly as a first visit. To change an answer they go through again, re-verify the same email, and the stub says "Your answer is updated" (as built). They get a new poster with the same number, because `ticketNo` is kept on update.
- **Mid-flow, same tab:** answers come back from `sessionStorage` and they land on Details, as built. With the persistence fix in section 5, a guest who left on the code step lands back on the code step.
- That's why the stub says "Save it now": the poster can always be regenerated by re-verifying, but it isn't kept anywhere.

### World chrome

- **Sound** (as built: a tab, off by default, opt-in) and a new **Still** chip, which stops all ambient loops for the session without needing an OS setting. Both are real buttons with `aria-pressed`.
- A **Lite** setting is folded into Still: Still also drops the guest to T1.

---

## 3. How it's made

### Technique stack per tier

Tiers and demotion follow atlas section 4 (T3 Cinematic, T2 Lit, T1 Poster, T0 Still, forced colours). The stage sits at InvitePage level as a sibling of `<main>`, with one lazy world chunk inside one ErrorBoundary, as atlas drew it.

| | T3 Cinematic | T2 Lit | T1 Poster (DOM) | T0 Still (reduced motion) | Forced colours |
|---|---|---|---|---|---|
| Layers | 8 WebGL planes, depth-UV parallax on the hero and stadium | Same, parallax on the hero only | 8 DOM WebP layers, touch-drag parallax up to 8 px | Same layers, static | Hidden |
| Floodlight banks | Lights-on plate revealed through 4 bank masks by a uniform, plus additive glow sprites and beam cards | Mask reveal and glow sprites; no beam cards | 4 opacity-switched DOM layers (lights-on plate cut by bank) | Same, instant | Hidden |
| Embers | Up to 1,500 GPU points (start at about 300) | Up to 500 | Up to 20 CSS embers, or none | None | None |
| Smoke | 2–3 scrolling-noise quads | 1 quad | Painted into the plate | Painted | Hidden |
| Ambient | 30 Hz on demand (atlas C2); paused when hidden and on the code step | Same | Compositor only | None | None |
| Camera | Scripted shots per beat (`shots.ts`, `motion`) | Same | CSS transforms on the layer stack | Cuts | n/a |
| Title | Canvas texture between the stadium and hero planes | Same | DOM element between layer divs | Same, static | Hidden (the h1 carries it) |
| Shirt name and number | Canvas texture warped to the shirt quad | Same | Canvas-drawn image placed on the shirt quad | Same | n/a |
| DPR | Up to 2 on iOS, 1.5 on Android | 1–1.25 | n/a | n/a | n/a |
| Poster | Same 2D compositor on every tier | | | | Still offered |

**What Claude writes in code** (all of it; none of this needs an external asset):
- `TierProvider` with a home-grown 10-line heuristic (WebGL2, `MAX_TEXTURE_SIZE`, renderer string, `deviceMemory`, `hardwareConcurrency`, `saveData`, the media queries), demotion on slow frames, never promoting, context loss to T1. No `detect-gpu` (it would need a CSP change).
- `WorldStage` with `StillLayer` (the DOM layers, always rendered) and the lazy `WorldCanvas`.
- One layer shader (colour, depth, UV offset), the bank-mask reveal, grade uniforms, glow sprites, beam cards, ember points, noise smoke, the moon disc and halo.
- `shots.ts` (one camera shot per beat), the 30 Hz ambient scheduler, visibility and context-loss handling.
- The lanyard as a node in the world canvas (B2, decision 6).
- Shirt lettering: text drawn to a canvas, then warped onto a four-corner quad per plate, with a slight displacement from the shirt's depth map so it follows the folds.
- The poster compositor (a pure function from layers and guest fields to a JPEG `File`), Share and long-press Save.
- The OG image compositor and the offline asset scripts (depth, masks, splits, compression, contrast checks). These run on the Mac and never ship.
- Synthesised sound additions (clunk, hum, swell, hush, drum, crackle), all Web Audio and no files; the haptic additions; the `?debug=1` additions (tier, reason, demotions, fps, user agent, `canShare({files})`, `vibrate`, WebGL2).
- Code-step persistence (section 5).

Download and memory budgets are atlas's (section 6 of its report): entry at most 160 kB gz, T2 about 2 MB over the journey, T3 about 3.5 MB, decoded memory up to 60 / 120 / 200 MB for T1 / T2 / T3 (all est.). Eight full-frame 1080×1920 layers would decode to about 66 MB (8 × 8.3 MB, est.), which is over the T1 budget. So the alpha layers are cropped to their bounding boxes, the wave and signing plates load only when needed (the signing plate is fetched during the code step), and T1 uses 720-wide files.

### What must come from AI tools

Six generations. **G1 is the gate:** nothing else is generated until Makes approves G1 for likeness and cleanliness. G2 to G5 are edits of G1, so they share its light, colour and framing. G6 is a new image with G1 as the style reference.

| # | Generation | Made by | Size to generate | Becomes |
|---|---|---|---|---|
| G1 | Master key art: Makes, foot on ball, hands in pockets, smiling down; moonlight from out of frame; stadium with dark floodlights; crowd, flags, smoke, rubble, embers | Image tool, from Makes's likeness photo | 9:16, as large as the tool allows; at least 1080×1920, ideally 1440×2560 | The hero plate L5 (cut out) and the reference for everything else |
| G2 | Clean background: G1 with Makes and the ball removed | Edit of G1 | Same as G1 | Split into L1 sky and moon, L2 stadium (lights off), L3 crowd, flags and mid smoke, L4 foreground rubble |
| G3 | Lights on: G2 with all four floodlight towers at full | Edit of G2 | Same as G1 | L2b stadium lit, cut into 4 bank regions by masks |
| G4 | Wave: G1 with Makes waving | Edit of G1 | Same as G1 | L6 (cut out) |
| G5 | Signing: G1 with Makes holding up a blank red shirt, back to camera | Edit of G1 | Same as G1 | L7 (cut out); shirt quad measured |
| G6 | Shirt on a hanger, back view, blank, on black | New image, G1 as style reference | 1:1, at least 1024×1024 | L8 (cut out); shirt quad measured |

**Shipped files** (Claude produces them all from G1–G6; sizes in kB are estimates):

| File | Content | Pixel size | Format | Alpha | Target size |
|---|---|---|---|---|---|
| `l1-sky` | Sky and clouds, with the empty top band and the clear patch for the code-drawn moon | 1080×1920 and 720×1280 | WebP | No | 120–200 kB at 1080 |
| `l2-stadium-off`, `l2b-stadium-on` | Stand and four floodlight towers | Cropped to the stadium band | WebP | Yes | 60–120 kB each |
| `l3-crowd` | Crowd silhouettes, plain flags, mid smoke | Cropped band | WebP | Yes | 60–120 kB |
| `l4-foreground` | Rubble and ground embers | Cropped band | WebP | Yes | 40–80 kB |
| `l5-makes`, `l6-makes-wave`, `l7-makes-signing` | Makes in three poses, ball included in L5 and L6 | Cropped to the figure | WebP | Yes | 80–150 kB each |
| `l8-shirt` | The hanging shirt | Cropped | WebP | Yes | 30–60 kB |
| `depth-*` | One depth map per layer | Half the layer's size | Lossless WebP, greyscale | No | 10–30 kB each |
| `banks` | Four bank masks in one RGBA image (one per channel) | 540×960 | Lossless WebP | n/a | 10–20 kB |
| `quads.json` | Shirt corner points for L7 and L8, title band rectangle | n/a | JSON | n/a | under 1 kB |
| `cover-still` | The flattened pre-match poster for first paint | 720×1280 | WebP, `fetchpriority=high` | No | 120 kB or less (atlas) |
| `og.jpg` | Link preview | 1200×630 | JPEG | No | under 300 kB (WhatsApp limit unverified) |
| Lockups `thirty.svg`, `united.svg` | Title words, from an OFL font, outlined to paths | Vector | SVG | n/a | under 10 kB |

### Generation prompts (ready to paste)

Paste the **style lock** at the start of every prompt. Give the tool Makes's front-facing photo (Photo 1) as the likeness reference. If that isn't to hand, use a crop of his own AI poster showing **only his head and neck**, so no crest or stripe comes along with it. Never use the three Ballotaku images as an input, and never name an artist or studio.

Image models often follow a "no" badly, and naming a thing can invite it. So each prompt describes what *is* there in plain, positive terms, then closes with an exclusion line. **Check every output against the checklist below before accepting it.**

**Style lock (start of every prompt):**

```
Vertical 9:16 movie-poster illustration. Painted semi-realistic style with anime key-visual lighting: crisp cel-shaded edges on the figure, a softly painted background, deep blacks, fine film grain. Night. One cold key light: blue-white moonlight from the upper right. One hot colour, red, in the smoke and the shirt. Small white points of light. No text anywhere.
```

G6 is square, so for G6 replace the first sentence of the lock with "Square 1:1 illustration."

The moon itself is **not** generated. Claude draws it in code (a disc with its halo, at its real phase for 21 December), in a clear patch of sky the prompts leave for it. That keeps the title band free of bright pixels and lets the moon react to the guest's answers.

**G1, master key art (new image, with the likeness reference):**

```
[style lock]

The man in the reference photo, about 30, with long dark locs past his shoulders, a wide warm smile and a small goatee. Keep his face, skin tone, hair and smile exactly as in the reference. Low camera angle looking up at him. He stands in the centre of the frame, one foot resting on a football, both hands in his pockets, smiling down at the camera, relaxed and happy.

He wears a completely plain, solid red crew-neck football shirt with no markings of any kind, plain black trousers and plain black trainers. The football is plain black with plain red panels and no markings.

Behind him, at about waist height, a generic modern football stadium stand with four tall floodlight towers. The floodlights are dark, with only a faint warm glow, the moment before they switch on. A dark crowd in silhouette waves plain solid red flags. Thick red smoke rolls in from both sides at ground level. Glowing embers drift upward. In the foreground, dark broken rubble with small glowing embers.

The moon is just out of frame; its cold blue-white light falls from the upper right and rims his hair and shoulders. Thin dark clouds drift across the sky.

Composition: his head sits about 28 percent down from the top of the image; his feet and the ball sit about 85 percent down. The top 20 percent of the image is empty, plain dark night sky, with no moon, no bright light and no cloud edges, left clear for a title. Just below that, in the upper right, leave a clear patch of dark sky with nothing in it. Keep smoke away from the edges of his figure so it can be cut out cleanly.

Exclude: any text, letters, numbers or words; any logo, crest, badge, emblem or symbol; any sponsor; stripes on the shirt, sleeves or shoulders; any devil or trident; any star pattern on the ball or in the sky; any club name or signage on the stadium; any watermark.
```

**G2, clean background (edit of G1):**

```
Edit this image. Remove the man and the football completely, and fill the space where they were with the same stadium, crowd, red smoke, rubble and sky, as if he had never been there. Change nothing else: same framing, same light, same colours, same empty sky at the top and the same clear patch of sky in the upper right. Keep everything free of text, logos, crests, emblems, stripes, devils, tridents and star patterns.
```

**G3, lights on (edit of G2):**

```
Edit this image. Switch on all four floodlight towers at full power: bright warm-white lamps, soft beams angled down onto the stand and through the smoke, the crowd and flags lit from above. Change nothing else: same framing, same sky (still empty at the top), same smoke shapes. No text, logos, crests, emblems, stripes, devils, tridents or star patterns.
```

**G4, the wave (edit of G1):**

```
Edit this image. The man now raises his right hand in a friendly wave at the camera, palm open, five fingers. His face, smile, locs, clothes and stance stay exactly the same, with his other hand in his pocket and his foot still on the ball. Change nothing else. No text, logos, crests, emblems, stripes, devils, tridents or star patterns.
```

**G5, the signing (edit of G1):**

```
Edit this image. The man now holds up a plain red football shirt in front of his chest with both hands, by its shoulders, presenting it to the camera the way a club presents a new signing. We see the back of the shirt, and the back is completely blank: no name, no number, no marks. Hold the shirt flat and square to the camera so the blank back is clearly visible. His face, smile, locs, trousers and stance stay the same, with his foot still on the ball. Change nothing else. No text, logos, crests, emblems, stripes, devils, tridents or star patterns.
```

**G6, the hanging shirt (new image, G1 as style reference):**

```
[style lock, with its first sentence replaced by "Square 1:1 illustration."]

A completely plain red football shirt on a dark wooden hanger, seen from the back, hanging straight and flat. The back is blank: no name, no number, no marks. Light it like the reference image: cold moonlight from the upper right, a warm red glow from below. Plain pure black background, the whole shirt in frame with space around it.

Exclude: any text, letters or numbers; any logo, crest, badge or emblem; any sponsor; stripes on the sleeves or shoulders; any devil or trident.
```

**Checklist for every output** (reject on any yes):
1. A crest, badge or emblem anywhere: shirt, ball, flags, sky, stand?
2. A sponsor or brand mark, or three stripes on the shoulders or sleeves?
3. A star-pattern ball or star shapes in the sky?
4. A club name, stadium name or any signage?
5. A devil or a trident?
6. Any text, letter or number at all?
7. Is it him? Face, locs, smile and skin tone, checked by Makes.
8. Five fingers on each visible hand?
9. G1 to G5: is the top 20 percent still plain empty sky, with no moon, bright light or cloud edge, and is the upper-right patch still clear?

### The tool chain after generation

Commercial-safe licences only. Each tool's output never ships with the tool itself; only the processed images ship.

| Step | Tool | Licence | Who runs it | Notes |
|---|---|---|---|---|
| Generate G1–G6 | Makes's own image tool (decision 7) | **Unverified**: the tool isn't named, so its terms haven't been read | Makes | It needs an edit mode that keeps the composition. If it has none, Gemini's image models (Nano Banana family) do edits; their API terms are unverified too (radar) |
| Cut out the figures and the shirt | BiRefNet | Repo MIT; **the weight terms aren't stated separately (unverified)** | Claude, offline on the Mac | Not RMBG-2.0, which is CC BY-NC 4.0. Fallback: manual masks in Krita |
| Depth maps | Depth Anything V2 **Small** or Depth Anything 3 **Small/Base** | Apache-2.0 | Claude, offline | Not V2 Base/Large or DA3 Large/Giant/Nested, which are non-commercial |
| Split G2 into L1–L4 | Depth bands from the depth map plus feathered hand-tuned masks, in a Python script | n/a (own script) | Claude, offline | Qwen-Image-Layered (Apache-2.0) is optional for cleaner splits; it needs CUDA, so it would run on a hosted service whose terms would need reading |
| Bank masks, shirt quads, title band | Own scripts and a manual check | n/a | Claude | |
| Compression | `cwebp` or Sharp, and the OG compositor | BSD-3 / Apache-2.0 (from memory; unverified) | Claude | |
| Title lockups | An OFL display font, outlined to SVG paths at build time | OFL (font to be picked) | Claude | The font file never ships, so accent coverage doesn't matter for fixed words |
| Video (optional, not in v1) | Veo 3.1, Kling 3.0 | **Commercial terms unverified** (radar) | n/a | Only after reading the terms; one loop on black, screen-blended, T3 only |
| Audio | Web Audio synthesis in code | n/a | Claude | No files. A recorded crowd would be the first media file (ElevenLabs paid plans allow commercial use; the free plan needs attribution, per radar) |

**Asset effort.** Atlas estimated 1–2 days of asset prep and the catalogue 2–4. The gap is two things: how many tries G1 takes to hold the likeness, and how clean the layer split comes out. With the edit-based plan above and Claude doing all processing, I estimate:
- Makes: 2–5 hours of prompting and review spread over 1–2 days, most of it on G1;
- Claude: about 1 day of processing.

If G1 takes many rounds, the whole plan waits, which is why it's the first gate.

---

## 4. Plan and effort

All day counts are estimates for one Claude Code builder with Makes reviewing. They assume decisions arrive within a day and the device test passes on at least one of the two branches (system browser or WebView).

| Phase | What | Who | Days (est.) | Depends on |
|---|---|---|---|---|
| 0a | **Device test first:** send the current build's link from a personal WhatsApp account to an iPhone and a low-end Android, open with `?debug=1`, and record the user agent (system browser or WebView), `canShare({files})`, `vibrate`, WebGL2, the preview image, and long-press save on an image. **Don't submit the RSVP during the test**: it writes to the production database | Makes with Claude (the `?debug=1` probe additions are a small change, made after the pick) | 0.5 | Nothing |
| 0b | Owner decisions (section 6); the pick written into `direction.md` as a new direction; `brand.md` amended (illustration on every view, red in the scene, his likeness, ambient motion), all owner-approved | Pixel, Makes | 0.5 | Nothing |
| 1 | **G1 gate:** likeness photo on disk, G1 generated and approved | Makes | 0.5–1 | 0b |
| 2 | G2–G6 generated; Claude cuts, depth-maps, splits, masks, compresses and measures contrast | Makes, then Claude | 1–1.5 | 1 |
| 3 | Stage foundations: `TierProvider`, `WorldStage` at page level, `StillLayer`, `manualChunks`, cache headers; then the **whole journey on T1/T0** with real layers, including bank switches, lettering and reduced motion | Claude | 2–3 | Greybox from day 1; real layers from 2 |
| 4 | WebGL world for T2/T3: layer shader, banks, glows, embers, smoke, shots, 30 Hz ambient, demotion, context loss, visibility | Claude | 3–4 | 3 |
| 5 | Lanyard as a node in the world canvas (B2) | Claude (nova lane for the refactor) | 1–1.5 | 3; cut line B3 |
| 6 | Poster compositor, Save and Share, OG image | Claude | 1.5–2 | 2 |
| 7 | Sound and haptics additions; code-step persistence fix | Claude (nova lane for persistence) | 1 | 3 |
| 8 | Verify: device tuning in WhatsApp on both phones, axe, reduced motion, forced colours, 200 percent text, a flash check, contrast; then lux re-run | Claude, Makes | 1.5–2 | 4–7 |

- **Total:** about 12–16 days of build work plus 1.5–2.5 days of asset work (est.). The catalogue's 7–10 days covered code only, without the lanyard refactor, persistence, the contract changes or device tuning.
- **Elapsed:** about 3 weeks with the parallel tracks below (est.).
- **Critical path:** device test → G1 approved → G2–G6 and processing → T1 journey on real art → WebGL world → poster → device verify.
- **In parallel:**
  - phase 3 foundations on greybox placeholders while the art is made (never on the crested poster, even locally);
  - the lanyard refactor, sound, haptics and persistence once phase 3 exists;
  - the poster compositor as soon as the layers are final.
- **An early ship point:** after phase 3 (about day 5–7, est.) the T1 journey is a complete, shippable invite on every phone. WebGL then arrives as an upgrade behind the same files, which also means it can be withdrawn without losing the invite.

---

## 5. Risks and mitigations

| Risk | Likelihood and impact | Mitigation |
|---|---|---|
| **WhatsApp opens a WebView, not the system browser.** Radar found that personal-chat links likely open the default browser (Krause 2022; vendor notes on the 2025 business-only in-app browser), but nothing confirms current iOS or Android. In an Android WebView there's no Web Share at all | Unknown until tested; it decides how Save and Share look and how hard to push the tiers | Phase 0a settles it in minutes with `?debug=1` on two real phones, before any tier tuning. The design already treats long-press Save as co-primary, and nothing requires a download. If the WebView branch is real, Share hides itself (`canShare` false) and the tiers start one rung lower on Android |
| **Trademark on shared posters.** Every guest is invited to post the poster publicly, and once posted it can't be recalled | High impact, low likelihood if the checklist holds | No crest, sponsor, kit stripes, starball, club name, devil or trident in any plate (`brand.md:35`); the review checklist on every generation; Claude runs a second visual check on every shipped layer and on a sample poster before launch. Guests' team names appear only as plain text on the credit line, never as badges |
| **Likeness and consent.** Makes's face goes out on every shared poster; an AI likeness can look "nearly him", which is worse than not him | Medium | He approves G1 as the gate (checklist item 7) and confirms he's comfortable with his likeness travelling (decision 1). Guests have no likeness on the poster at all: they're a shirt with a name. If G1 can't hold his likeness, stop there and decide; don't build on a weak plate |
| **AI image tool terms.** His tool is unnamed, so whether its outputs may be used and shared isn't known | Low for a personal invite, but unverified | Makes checks his tool's terms before G1 |
| **Contrast.** White on poster red is 4.04:1 (meas.), which fails AA for normal text; shirt red on the night panel is 2.20:1 (meas.), which fails 3:1 as a control edge | Certain if ignored | Poster red is decoration and large display type only. The only button fill is shirt red `#9F0B19` with white (8.28:1, meas.) and a 2 px moonlight ring (5.41:1 against the fill, 11.90:1 against the panel, meas.). All readable text sits on the solid panel. The decorative title sits in a painted empty-sky band; Claude measures its contrast against the brightest pixel in that band on every plate |
| **Leaving for the email code** (atlas): context loss or a discarded tab while the guest is in their email app, and today a discarded tab returns to the form, not the code step, so the guest asks for a new code and may hit the rate limit | Medium on 4 GB Android | (1) On hidden during the code step, stop the canvas and release big textures; on context loss show the identical still. (2) The fix (a frontend change, nova's lane, Convex untouched): persist `{ view: "code", sentAt }` in `sessionStorage` next to the answers, never the code, so a reload lands on the code step with the cooldown intact. (3) The code-step copy says to keep the page open. Whether a WhatsApp WebView keeps `sessionStorage` after its process is killed is unverified, so phase 0a checks it |
| **Motion sickness and reduced motion** | Low with this design | No forward camera travel; push-ins of 3–4 percent at most; parallax only on touch, up to 8 px (T1) or a few pixels of depth offset (T3); no gyro; no idle camera drift. `prefers-reduced-motion` means T0: no parallax, particles, push-ins or loops, and every beat swaps to its final state instantly. The **Still** chip gives the same calm without an OS setting. Flashes: every large-area brightness change is one-way and lasts 300 ms or more, the floodlight strikes are small areas, there's no white-out, and nothing strobes |
| **Sound turned off by reduced motion** (`sound.ts:47`, atlas) | Low | Default: sound follows only its own opt-in (a nova change). A guest who asks for less motion may still want the crowd |
| **Plate style drift between G1 and the edits** | Medium | All edits come from G1, and G1 to G5 are checked for the empty top band and the clear moon patch (checklist item 9). If an edit drifts, redo that edit, not G1 |
| **Decoded memory on low-end Android** | Medium | Cropped alpha layers, lazy pose plates, 720-wide files on T1, at most 3 beats' textures resident (atlas) |
| **Scope against the date** | Medium | The T1 ship point after phase 3; the lanyard cut line (B3); video and bloom out of v1 |
| **Drift into rejected C** | Low | The poster's printed line is art, static and never scrolling; there's no solid ink strip; the code beat uses lamps, not digits; there are no wipes; the shirt number is a reward on the poster, never a form row |

---

## 6. Decisions for Marlon

Reply "defaults" to take all eight, or name the ones you want changed. One question sits outside the defaults because only you can answer it:

> **Your likeness:** your face will be on every poster guests save and post. Reply "yes, my likeness may appear on every shared poster", or tell me the limit you want.

| # | Decision | Default |
|---|---|---|
| 1 | **Crests and club marks** | None, anywhere, ever (`brand.md:35`). You generate a new crest-free master (G1) with the prompts above. Your AI poster is used only as a head-and-neck likeness reference |
| 2 | **The guest's shirt number** (a: `ticketNo`; b: guest picks, not saved; c: guest picks, saved) | **(a) `ticketNo`.** No backend change, always unique, and revealed only in the finale, which is the reason to finish. (c) is out twice over: Convex is frozen, and enforcing uniqueness would tell one guest another's pick. Shown as "17" on the shirt and "017" as the seat |
| 3 | **Does a No guest get a poster?** | No. They get your wave, a warm line and "Changed your mind?". A poster saying you're not coming isn't something people share, and it saves a design |
| 4 | **Name on the poster** | Preferred name if given, otherwise first name. Never the surname |
| 5 | **"Nothing loops" or "go all out"** | Go all out, within limits: ambient embers, smoke and cloud at 30 Hz on T3/T2, paused when the page is hidden and during the code step; a Still chip for anyone; nothing loops under reduced motion |
| 6 | **The lanyard** | Keep it on the cover, as one object inside the world canvas (atlas B2). If it threatens the schedule, retire it (B3) and keep the DOM tear, which already exists |
| 7 | **Who generates the plates** | You, with your own tool and the prompts in section 3, because you hold the likeness and your tool already made a version you liked. Claude does all the processing after that. Needs your front-facing photo on disk and a tool with an edit mode |
| 8 | **The date and venue line while the venue is TBA** | Panel: "Monday 21 December 2026 · Venue TBA". Poster: "MON 21 DEC 2026 · VENUE TBA". No kick-off time until you have one. When the venue is set, it's one config change, and posters made after that carry it |

**Defaults I'm taking unless you object:**
- **Art style:** your AI poster's painted semi-real style with anime key-visual lighting, because it already held your likeness. The anime references set the composition and effects, not the drawing style.
- **Tone:** the ball is the power object, nothing is pointed at the camera, and you smile.
- **Title:** "THIRTY" on the cover, becoming "THIRTY UNITED" at the signing.
- **Copy:** the draft lines in section 2 ("You've been called up", "Your shirt", "Seal it", "SIGNED", "PENCILLED IN", "Save it now. We don't keep a copy.") are drafts for you to rewrite in your voice.
- **Sound:** stays on when reduced motion is on, if you opted in. No recorded audio; everything is synthesised.
- **Haptics:** the built values (4 ms, [10, 30, 18], 22 ms, 12 ms) stand, not the ones in `direction.md`, plus 8 ms and 12 ms strikes and [10, 30, 10] for a wrong code. Android only; iPhones don't support web vibration.
- **Plus-one:** appears as "+ name" on the poster's credit line.
- **Out of v1:** video and bloom. A 1080×1920 poster only.
- **The moon:** drawn at its phase on 21 December 2026, about 93 percent waxing gibbous (assumed — confirm).

---

## 7. Appendix

### The five concepts on one line each

| Concept | One line | Plates (est.) | GPU (est.) | 2D rung | Verdict |
|---|---|---|---|---|---|
| S1 Matchday living poster | Makes's poster, alive in layers; your poster at the end | 8–10 | Low to medium | Strong | The spine of the pick |
| S2 Call-Up | Walk from the street to the touchline through painted sets | 20–25 | Medium | Medium | Runner-up; its story frame is kept |
| S3 Power-Up | One poster that lights up with each answer | 4–6 | Low | Strongest | Its light meter is kept |
| S4 Chapter 30 | A manga chapter read panel by panel | 6–8 | Low | Strong | Dropped: a page, not a world; wipes sit near rejected C |
| S5 Tifo | The stand raises your name in a card mosaic | 0–2 | Medium to high | Weak | Dropped: centres the stadium, implies other guests |
| **Hybrid: The Signing** | S1's poster, S3's lights, S2's call-up; Makes holds up your shirt | 6 generations | Low to medium | Strong (same layers) | **Recommended** |

### Unverified

- Whether a link sent from a personal WhatsApp chat opens the system browser or a WebView, on current iOS and Android. Phase 0a settles it.
- `navigator.share` with files, long-press save on an image, `navigator.vibrate` and `sessionStorage` survival inside WhatsApp on real devices.
- WhatsApp's size and format limits for link-preview images (the 300 kB target above is a guess).
- Every frame time, download size, memory figure and day count in this document (estimates from atlas, the catalogue or me).
- Makes's image tool: its name, its edit mode, its terms, and whether it can hold his likeness across G1 to G5.
- Gemini image model API terms; Veo, Kling, Runway and Luma commercial terms (radar).
- BiRefNet's weight licence (the repo is MIT; the weights aren't stated separately).
- The licences of `cwebp` and Sharp (from memory).
- Accent coverage of any brush font (avoided by using Barlow Condensed for names, and SVG lockups for fixed words).
- When touch input counts as a first tap for `navigator.vibrate` on Android. Per the HTML user-activation rules, as I remember them, a touch activates on finger-up, so the first drag's tear ticks may be silent. Check on a device.
- The moon phase on 21 December 2026 (a mean-synodic estimate, not an ephemeris).
- Whether a club-presentation pose (holding up a shirt) comes out cleanly from Makes's tool on the first try (G5); the fallback is compositing L8 into his hands in code.
- The audience reading of the signing metaphor for guests who aren't football fans (I judge it widely understood; not tested).
