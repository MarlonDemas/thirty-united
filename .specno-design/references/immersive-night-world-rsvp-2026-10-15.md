---
name: references
schemaVersion: "1.0"
topic: immersive-night-world-rsvp
date: 2026-10-15
clientName: thirty-united
directCompetitors: 9
adjacentReferences: 4
totalReferences: 13
---

# References: immersive night world for an RSVP journey

**Date:** 2026-10-15 (owner calibration set received 2026-10-14; owner gameday set received 2026-10-15, logged under "Owner gameday set" below and torn down in `.specno-design/audits/cinematic-audit-2026-10-15.md`)
**Product context:** Thirty United, a one-link RSVP for Makes's 30th (Monday 21 December 2026), opened by friends and family on phones, often in WhatsApp's in-app browser on low-end Android. The guest RSVPs, verifies an email code and gets a personalised stub.
**Pattern under research:** a whole lit 3D world (a miniature night football ground) that persists behind every RSVP step, and a multi-step form that reads as a journey people want to finish.
**Why a new file:** the topic changed. `rsvp-save-the-date-sports-ticket-2026-10-14.md` researched a paper match ticket and print programmes; it is not a cache hit for immersive worlds, relighting or journey forms.

Screenshot notes: web captures were taken headless with the repo's Playwright on 2026-10-15 at 1440×900 and 390×844. Headless WebGL shows what loads without input, so captions say what the frame actually shows. Owner calibration frames are stills from the two videos he sent; the source videos stay outside the repo (about 22 MB).

## Direct Competitors

Here "direct" means the category the owner asked to compete with: whole lit 3D worlds on the web where the UI is small, plus the closest shipped 3D event ticket.

### @flxrnc autumn cottage diorama: owner calibration video 2

![Contact sheet: a cottage diorama on a dark lacquered turntable, lit windows and lamp post, dusk haze, orbiting camera](.specno-design/references/immersive-night-world-rsvp/owner-calibration/flxrnc-sheet.jpg)
![Frame: lit window and door spill warm light onto a stone path; red and gold trees; violet dusk; haze below the plinth](.specno-design/references/immersive-night-world-rsvp/owner-calibration/flxrnc-02.jpg)

**Source:** video sent by the owner, 2026-10-14 (post by @flxrnc; URL not supplied). Frames: `owner-calibration/flxrnc-01.jpg` to `flxrnc-08.jpg`.
**Pattern shown:** a bounded miniature world on a plinth, viewed by an orbiting camera.
**What's distinctive:** the whole world is one object on a dark lacquered turntable, lit from inside by its own windows and a single lamp post, with haze spilling off the plinth edge into a dusk void while the camera circles it.
**Steal-worthy:** a bounded world on a plinth (small enough to bake its lighting and frame on a portrait phone); light that comes from objects inside the world, not from the UI; the plinth's lacquered rim as the frame.
**Anti-pattern:** the autumn palette and falling leaves (21 December is midsummer in South Africa); a continuous auto-orbit, which would never let the scene rest.

### @Guronnimo meadow with a relight chip: owner calibration video 1

![Contact sheet: first-person grass meadow and lone tree, relit Golden, Night (moon and fireflies), Morning by a three-way chip](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-sheet.jpg)
![Frame: Night selected; moon, fireflies, white wildflower patches, grass parting around the hand cursor](.specno-design/references/immersive-night-world-rsvp/owner-calibration/guronnimo-05.jpg)

**Source:** video sent by the owner, 2026-10-14 (post by @Guronnimo, captioned "one shotted with Opus 5.5"; URL not supplied). Frames: `owner-calibration/guronnimo-01.jpg` to `guronnimo-08.jpg`.
**Pattern shown:** first-person world with one control that changes the time of day.
**What's distinctive:** the camera sits low inside thousands of grass blades that part around the cursor, and the only UI is a small Morning / Golden / Night chip at the top that relights sky, sun or moon and adds fireflies at night.
**Steal-worthy:** one small chip that relights the whole world; a world that answers the hand without being a game.
**Anti-pattern:** the generic lone-tree-on-a-hill composition; blade count is the expensive part and the first thing to drop on a weak phone.

### Messenger by abeto: a tiny planet where you make the deliveries

![Messenger desktop: a whole hand-drawn tiny planet centred in a flat teal void, specks drifting around it](.specno-design/references/immersive-night-world-rsvp/abeto-messenger-1-desktop.png)
![Messenger mobile: the same planet framed centrally on a portrait screen](.specno-design/references/immersive-night-world-rsvp/abeto-messenger-1-mobile.png)

**Source:** https://messenger.abeto.co/ and https://www.awwwards.com/sites/messenger (Site of the Day, 10 Nov 2025; Animations 9.00, WPO 8.80; tags Storytelling, Games & Entertainment; Three.js, WebSockets).
**Pattern shown:** a bounded world in a void, with a story job ("It's a small planet, but someone's gotta make the deliveries.").
**What's distinctive:** the entire world is one small planet floating centred in a flat teal void, shaded with hand-drawn outlines, and its story is delivering messages.
**Steal-worthy:** one centred world in a calm void frames well on a portrait phone; "deliver the message" is close to what an RSVP is.
**Anti-pattern:** multiplayer and live sockets (out of scope); the pastel teal void.

### Bruno Simon portfolio: drive a toy car through a miniature world

![Bruno Simon desktop: the headless capture shows only the intro floor, a glowing ring on a violet grid before the world loads](.specno-design/references/immersive-night-world-rsvp/bruno-simon-1-desktop.png)
![Bruno Simon mobile: the same intro grid on a portrait screen](.specno-design/references/immersive-night-world-rsvp/bruno-simon-1-mobile.png)

**Source:** https://bruno-simon.com/ (page text fetched 2026-10-15: Three.js with TSL for WebGL and WebGPU, Rapier physics, Howler audio, MIT-licensed source).
**Pattern shown:** a navigable miniature world; content reached by driving to it.
**What's distinctive:** the whole site is a toy car in a miniature world, and the menu exposes Quality, Audio, renderer choice and a "stuck" respawn button, so the world always has a way out.
**Steal-worthy:** an explicit quality control and an escape hatch inside an immersive world; content attached to places.
**Anti-pattern:** content you must drive to. Our journey rule 2 forbids requiring play to complete a step.

### Vercel Ship 2024 3D event badge: a personalised badge on a lanyard

![Vercel blog desktop: article "Building an interactive 3D event badge with React Three Fiber"](.specno-design/references/immersive-night-world-rsvp/vercel-ship-badge-1-desktop.png)
![Vercel blog mobile: the same article on a portrait screen](.specno-design/references/immersive-night-world-rsvp/vercel-ship-badge-1-mobile.png)

**Source:** https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber (17 Apr 2024; R3F, drei `RenderTexture`, react-three-rapier, MeshLine).
**Pattern shown:** a personalised event credential as a draggable 3D object.
**What's distinctive:** the attendee's name is rendered onto a badge that drops on a lanyard, can be dragged and flung, and always tilts back to face the viewer, which the authors call "not physically accurate" on purpose.
**Steal-worthy:** the ticket as a personal object you can handle; the face-front correction (the current build already does this).
**Anti-pattern:** it is a page with a 3D object on it, the exact gap the owner named tonight. The world is missing.

## Adjacent References

### Subbuteo: table football as a miniature (toy, not a website)

[external reference: https://en.wikipedia.org/wiki/Subbuteo]

**Source:** Wikipedia, fetched 2026-10-15: players "simulate association football by flicking miniature players with their fingers"; figures "stand on weighted bases"; accessories included floodlights, TV cameras, stands and crowds.
**Pattern shown:** a football ground you own, set up on a table, with toy floodlight pylons.
**What's distinctive:** football shrunk to a tabletop: figures on round weighted bases, a cloth pitch, and floodlights and stands sold as accessories you add one by one.
**Steal-worthy:** the scale and the round figure base (a natural place for a guest's name); the ritual of setting up the ground piece by piece; floodlights as objects, not effects.
**Anti-pattern:** the Subbuteo name and box branding, and any team kits (trademarks). We cite the category, never the mark.

### Duolingo onboarding: answers before sign-up

[external reference: https://goodux.appcues.com/blog/duolingo-user-onboarding]

**Source:** Appcues GoodUX teardown, fetched 2026-10-15.
**Pattern shown:** a multi-step intake people finish.
**What's distinctive:** new users set a goal and answer questions before any account exists, a character carries the flow, progress is shown as it fills, and "the actual registration feels like a small step within a larger process."
**Steal-worthy:** the email code as a small step inside the journey, not a gate in front of it; a visible sense of how far along you are.
**Anti-pattern:** a mascot and streak pressure. No mascot and no gamification here.

### Coastal World: a bank presented as a 3D world

[external reference: https://www.awwwards.com/sites/coastal-world]

**Source:** Awwwards Site of the Day, 24 Aug 2022: "A whole new world that connects neobanks together to serve communities." Three.js and Vue; highlights "3d game and marketplace for digital banking" and "Interactive menu navigation". Accessibility was its lowest dev score (7.20).
**Pattern shown:** a dry, practical task wrapped in a navigable world.
**What's distinctive:** banking, the least playful product there is, is presented as a 3D game world you move around in.
**Steal-worthy:** proof that a utilitarian flow can live inside a world.
**Anti-pattern:** accessibility as the weakest score. Our AA floor does not move.

### Igloo Inc: a heavy WebGL site with a two-colour palette

[external reference: https://www.awwwards.com/sites/igloo-inc]

**Source:** Awwwards Site of the Day, 23 Jul 2024, by abeto and Bureaux; palette `#b6bac5` and `#383e4e`; Animations/Transitions 9.60; accessibility and markup 6.40 to 6.60.
**Pattern shown:** an immersive scroll world with a restrained interface.
**What's distinctive:** a heavy WebGL experience held to two colours, so the world carries all the richness and the interface stays plain.
**Steal-worthy:** a rich world with a plain UI layer.
**Anti-pattern:** accessibility again the lowest score.

### Night-stadium and floodlight mood: stated gap

Awwwards searches for "stadium" and "football" (fetched 2026-10-15) surfaced no shipped site with a 3D night-ground scene; results were club sites, a production studio named Stadium and betting sites. The night-ground mood in the directions is therefore built from the toy floodlights (Subbuteo), the lamp-lit dusk of the flxrnc diorama, the Night state of the Guronnimo meadow (moon, fireflies) and the project's own floodlight work, not copied from a stadium site. No crest, wordmark, kit or real ground is referenced.

## Owner gameday set (addendum, 2026-10-15)

Four images the owner sent on 2026-10-15 that move the brief toward an anime matchday poster. They count as direct references in the frontmatter, the same way the two owner videos do: they set the bar he wants to compete with. Files are in `references/immersive-night-world-rsvp/owner-gameday/`. Images 1 to 3 are phone screenshots with a black border on the left and right edges; do not sample that border as "poster black". The full teardown, with sampled colours, is in `.specno-design/audits/cinematic-audit-2026-10-15.md`.

Two further owner photos were described in the dispatch but are not on disk, so they are recorded here only as descriptions: Photo 1, Makes facing camera with long dark locs, a wide smile, a small goatee, a sage short-sleeve shirt and black trousers against the Cape Winelands; Photo 2, Makes from behind at a floodlit five-a-side pitch at sunset in a red shirt reading "MAKES 08".

### 1. Anime player on a giant toad under a starball dome

![Anime (Naruto-style) player in a red training top crouched on a giant red toad; full moon; a glowing starball dome over a floodlit stadium; dirt path and haze; fixture block bottom left](.specno-design/references/immersive-night-world-rsvp/owner-gameday/01-anime-toad-moon-starball-dome-fixture.png)

**Source:** Instagram screenshot sent by the owner, 2026-10-15. Watermark "BALLOTAKU on Instagram": third-party art. Inspiration only, never an asset, never traced.
**Pattern shown:** matchday announcement poster: one hero figure, low angle, in front of a night stadium, with a fixture block.
**What's distinctive:** the stadium sits under a translucent glowing dome, and a winding dirt path leads the eye from the hero to the ground, so the image reads as a journey to the match.
**Steal-worthy:** the path as a composition line toward the stadium; moonlight as the only key light, with the stadium as a warm-white second source; a fixture block as plain set type at the bottom.
**Anti-pattern:** the UEFA starball, club crests and the stadium's sponsor name (trademarks); franchise motifs (the toad summon, the forehead protector) belong to someone else's IP.

### 2. Anime player firing an explosion gauntlet over the ground

![Anime (My Hero Academia-style) player in a red shirt firing a grenade gauntlet toward camera; fire, embers and smoke; the stadium seen from above at the bottom; fixture block](.specno-design/references/immersive-night-world-rsvp/owner-gameday/02-anime-explosion-gauntlet-aerial-ground-fixture.png)

**Source:** Instagram screenshot sent by the owner, 2026-10-15. Watermark "BALLOTAKU on Instagram": third-party art, inspiration only.
**Pattern shown:** the same poster format at full intensity: foreshortened action pose, explosion backlight, aerial stadium.
**What's distinctive:** extreme foreshortening (the gauntlet nearly touches the lens) against an explosion that backlights the whole figure, while the stadium shrinks to a small lit bowl far below.
**Steal-worthy:** scale contrast between a huge foreground figure and a tiny lit ground; embers as the cheapest element that makes a still feel alive.
**Anti-pattern:** a weapon pointed at the viewer (wrong for a family invite aged 20 to 70); the sponsor and kit-maker marks on the shirt; the franchise gauntlet design.

### 3. MATCHDAY header with a lightning-cracked red sword

![Giant white condensed MATCHDAY header over a top strip with time, crests and venue; a player in a long dark coat holding a red glowing sword; smoke, drifting red embers, starball and stadium](.specno-design/references/immersive-night-world-rsvp/owner-gameday/03-anime-matchday-header-red-sword-embers.png)

**Source:** Instagram screenshot sent by the owner, 2026-10-15. Watermark "BALLOTAKU on Instagram": third-party art, inspiration only.
**Pattern shown:** broadcast-style matchday title card: a top information strip, one giant word, the figure cutting through the word.
**What's distinctive:** the white condensed word MATCHDAY fills the width, and the sword's red glow passes in front of it, so the type sits inside the picture's depth rather than on top of it.
**Steal-worthy:** a top strip carrying time and venue in small caps; one huge condensed word; depth-sorting the type between the background and the hero; slow red embers through grey smoke.
**Anti-pattern:** the UEFA wordmark and starball, club crests, the shirt sponsor; a sword as the hero object for a birthday invite.

### 4. "MAKES 08" under a moonlit sky (owner's own AI poster)

![AI-generated poster of Makes with long locs and a big smile in a red football shirt, foot on a black-red ball; red smoke and embers; a floodlit stadium with flags and a crowd; full moon; brush-script MAKES 08; a back view of the same shirt top right](.specno-design/references/immersive-night-world-rsvp/owner-gameday/04-makes-08-moonlit-poster-ai.png)

**Source:** AI-generated image supplied by the owner, 2026-10-15 (file name "Red Devils Under Moonlit Sky"). Owner's likeness, used with his consent as the brief's subject.
**Pattern shown:** the owner as the hero of his own matchday poster.
**What's distinctive:** Makes appears three times (a huge smiling face top left, the full figure low angle centre, a back view top right reading "MAKES 08"), with the name and number in red and white brush script beside him.
**Steal-worthy:** the warmth: he is smiling, not posing as a fighter, which suits a birthday; the brush-script name and number as his signature; a foot on the ball as the hero pose; red smoke and embers on a black ground.
**Anti-pattern:** club crests on the shirt, ball and flags; kit-maker and sponsor marks; the club name on the stand fascia; AI artefacts in the crowd and lettering. It must be regenerated crest-free before any part of it ships (see the audit's open owner decisions).

## Cross-Reference Synthesis

### Patterns appearing in 3+ references (the category median: risk of slop)

- **One bounded world centred in a void:** flxrnc, Messenger, Bruno Simon (intro), Subbuteo (the table). **Decision:** follow for a miniature direction, because it frames well on a portrait phone and can be baked; diverge for a first-person direction.
- **Content reached by moving through the world:** Bruno Simon, Messenger, Coastal World. **Decision:** supplement. The world moves when the guest answers; the guest never has to move to answer.
- **Weak accessibility in immersive sites:** Coastal World 7.20, Igloo 6.40 to 6.60, Messenger 7.60. **Decision:** diverge. Text sits on solid surfaces, the canvas is out of the tab order, every step completes with one control.
- **Violet and indigo dusk skies:** flxrnc, Guronnimo Night, Bruno Simon intro. **Decision:** risk of convergence. Each direction owns a different lighting story so the three do not land on the same sky.

### Patterns appearing in 1 reference (potential signature moves)

- **One chip relights the world** (Guronnimo). **Decision:** Signature candidate; usable as the end-state toy in every direction.
- **A dark lacquered turntable plinth** (flxrnc). **Decision:** Signature candidate for a miniature direction.
- **Floodlights and stands as toy accessories you add** (Subbuteo). **Decision:** Signature candidate: the ground assembles as you answer.
- **A flung badge that always turns face-front** (Vercel). **Decision:** carry over as craft (already built), not a Signature.
- **Registration as a small step inside a larger process** (Duolingo). **Decision:** journey rule for the code beat.

### Aesthetic tone clusters

- **Collector's miniature:** flxrnc, Subbuteo, Messenger. Most likely fit: bounded, warm, readable by non-fans as "a little model of a football ground", and the cheapest world to make convincing on a weak phone.
- **Inside the world, first person:** Guronnimo, Bruno Simon. Possible if pivoting toward immersion over overview: the most cinematic, and the most expensive.
- **Time of day as the story:** Guronnimo's chip. Possible if pivoting toward light as progress: the cheapest to render and the simplest to read.

## Candidate Signatures

For the owner's Distinctiveness Sentence. He picks one, combines them, or writes his own; none is chosen.

1. "The thing that makes this unmistakable in a screenshot is a floodlit miniature football ground on a dark lacquered turntable, and your RSVP turns the model station by station until your own seat lights up in the stand." Anchored by flxrnc and Subbuteo.
2. "The thing that makes this unmistakable in a screenshot is that you walk out: turnstile, tunnel, dressing room and touchline, seen first-person through floodlit haze, with your name printed on the back of a shirt as you type it." Anchored by Guronnimo (first person) and Messenger (a world with a job).
3. "The thing that makes this unmistakable in a screenshot is a football ground at dusk whose floodlights switch on bank by bank as you answer, so finishing the RSVP is the moment the lights come on." Anchored by Guronnimo's relight chip and Duolingo's sense of progress.
4. "The thing that makes this unmistakable in a screenshot is that the ground assembles as you answer: pylons, stands and your own figure on its round base appear on the table, one answer at a time." Anchored by Subbuteo accessories and flxrnc.
5. "The thing that makes this unmistakable in a screenshot is a ticket you carry through a lit world and hand over at each step, which comes back torn, stamped and carrying your seat." Anchored by the Vercel badge and the current lanyard ticket.

## Candidate Palettes (owner overrode Palette A, so included)

The project has a `tokens.md`, which normally skips this section. The owner rejected the current palette tonight, so three palettes are proposed, one per direction in `direction.md`. Contrast figures were computed with the WCAG formula on 2026-10-15.

- **Lacquer and Sodium.** Anchored to flxrnc (lamp-lit object on a lacquered plinth) and Subbuteo (toy pylons). Surface: lacquer `#1A0F14`, night haze `#231E3D`. Foreground: haze-white `#EDE9F5` (15.66:1 on lacquer). Accent: sodium amber `#FFB547`, the lamp colour, used for lamps and the next action only (10.65:1 against its lacquer label). Neutrals warm-violet (`#B9B2C9` muted, 9.15:1). Type: Archivo Expanded / Atkinson Hyperlegible Next / Atkinson Hyperlegible Mono. Signals: a collector's model lit for one night.
- **Concrete and Corner Flag.** Anchored to Guronnimo (first person, haze) and Bruno Simon (a world with a way out). Surface: tunnel concrete `#151A22`, scene `#252D3A`. Foreground: `#EEF3F8` (15.64:1). Accent: corner-flag orange `#FF6A2B` (6.11:1 against its label, 4.85:1 against the tunnel scene). Neutrals cool blue-grey (`#A9B4C2`, 8.31:1). Type: Overpass / Overpass Mono. Signals: the walk from the cold tunnel into the light.
- **Dusk to Floodlight.** Anchored to Guronnimo's relight chip and Duolingo. Surface: stand shadow `#14152B`, sky `#2B2F5C`, ember horizon `#C8663F` (sky only). Foreground: `#F3F5FB` (16.44:1). Accent: floodlight white `#EAF1FF` as the action fill (15.81:1 against its indigo label; 3.41:1 against the ember band, so actions never sit over it). Neutrals cool indigo (`#B6B9D3`, 9.27:1). Type: Young Serif / Figtree / Spline Sans Mono. Signals: the evening getting ready for kick-off.

## Anti-Slop Audit

No Dribbble or Behance concept work was used; every web reference is a shipped site, and the two owner videos are working demos. Risks to watch in the directions:

- **F-57 aurora / mesh hero:** a dusk sky must be lit sky inside the 3D scene, never a decorative gradient behind UI.
- **F-2 glass with nothing under it:** a translucent chip or sheet is allowed only over the live scene (the Guronnimo chip sits over real content); over a flat colour it is banned.
- **Anti-lux "dark plus gold":** an amber accent on a dark world is close to this cliché. It is justified only when the amber is the actual lamp light in the scene, with no serif-and-gold pairing and no metallic finish.
- **frontend-design "near-black plus one bright accent":** each direction states its light source and what the light falls on, so the accent comes from the world rather than a dark theme.

## Sources

- Owner calibration videos (@Guronnimo, @flxrnc), 2026-10-14: frames in `owner-calibration/`. The ambition bar.
- [Messenger by abeto](https://messenger.abeto.co/) and [its Awwwards page](https://www.awwwards.com/sites/messenger): bounded world with a delivery story.
- [Bruno Simon](https://bruno-simon.com/): miniature world, quality options and an escape hatch.
- [Vercel, Building an interactive 3D event badge](https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber): personalised 3D credential.
- [Subbuteo (Wikipedia)](https://en.wikipedia.org/wiki/Subbuteo): table football, floodlight and stand accessories.
- [Duolingo onboarding teardown](https://goodux.appcues.com/blog/duolingo-user-onboarding): intake people finish.
- [Coastal World on Awwwards](https://www.awwwards.com/sites/coastal-world): a utilitarian task inside a 3D world.
- [Igloo Inc on Awwwards](https://www.awwwards.com/sites/igloo-inc): heavy WebGL, two-colour UI.
- Awwwards searches for [stadium](https://www.awwwards.com/websites/?text=stadium) and [football](https://www.awwwards.com/websites/?text=football): the night-stadium gap.
