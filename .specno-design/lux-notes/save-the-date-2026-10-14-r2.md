# Lux Consultation, save-the-date (round 2, post-build)

**Date:** 2026-10-14
**Brief texture:** premium-consumer (a personal invite, opened once on a phone from WhatsApp, with one object to get right)
**Direction.md chosen:** Direction A, Matchday Programme
**Signature:** "A ruled, programme-cover landscape ticket with a punched perforation that the guest tears along the stub line to open the page, and a returned stub in a ruled table with name, team and seat number in tabular mono numerals, stamped ADMIT ONE · 21 DEC 2026 in a single red rubber stamp."

Context: lux consultation for the built save-the-date page. Direction A was chosen and is kept. Brief texture is premium-consumer. Past `LUX:` entries: 4 in `feedback.md` (three commits, one "not committing"). Owner reaction after seeing the build: "this site does not look premium at all... the animation definitely does not meet my standards... I definitely like the concept and simplicity but believe the interactivity and detail can be improved 10 fold. Let's also look into 3D. This invitation needs to be out of this world."

## Verdict on direction: amplify, do not revisit

Marlon keeps the concept and the simplicity. The screenshots (390x844 and 1440x900, `scratchpad/r2/`) show an execution gap, not a wrong aesthetic: the ticket is a flat rectangle on a flat page, it tears as a rigid card, and the stamp fades in. Palette, type, ruled boxes, the ticket-and-stub idea and the red-only-on-stamp-and-action rule all stay. **But amplifying means reversing two round-1 hard `LUX:` commits and amending three `brand.md` prohibitions (see "Constraint collisions"). That is an owner decision, not a lux move, and it goes first in Open Questions.**

## What round 1 got wrong or under-reached

Round 1 (`save-the-date-2026-10-14.md`) was written before the build and read "material truth" as flatness. Against the built page:

- **It specified a row of punched semicircles; the build drew dotted ink.** `Ticket.tsx:55` uses `border-right-style: dotted`, and the only cut-outs are four corner notches (`index.css:242-261`). There are no holes. In the 1440 screenshot the seam is a dotted line, not a punch.
- **It never specified how the tear moves, and the build tears a rigid card.** `SealedView.tsx:51-53` rotates the whole stub -12 degrees about its top-left corner (`Ticket.tsx:65`, `transformOrigin: "0 0"`), slides it 16px and fades it out. Paper tears from the tip of the pull, so the hinge should move down with the handle, the torn part should lift off the page, and the held part should stay flat. The mid-tear screenshot shows a door swinging open, with a wedge of bare background where the seam should be.
- **"No shadow, no curl, no gradient" was applied to everything, including depth.** The result is a page with no light source. Nothing sits above the page, so nothing can be lifted, tilted or stamped.
- **It ruled out haptics and sound on the strength of iOS Safari alone.** `navigator.vibrate` works on Android Chrome, and Android is the likelier phone for a South African guest list (estimate, not measured). Round 1 set aside the property that makes a tear feel like a tear.
- **Its post-build entry in `feedback.md` is inaccurate.** The `LUX: Committed. Material truth` entry says "the perforation is a CSS mask, so the page colour shows through the punches". The code has a dotted border and four corner notches, no punches. Future sessions treat that entry as a hard constraint, so correct it through `reflect` (this consultation did not edit `feedback.md`).
- **It never looked at the stamp or the buttons.** `Stamp.tsx:19-21` is a 180 ms fade with a 1.15 to 1 scale, an inflate, not an impact. `button.tsx:7-12` has colour change and no press state.
- **It missed the empty mobile page.** At 390x844 the ticket and "Tear open" button fill about 57% of the screen and about 320 css px sit empty between the button and the footer line (`sealed-390.png`; `SealedView.tsx:124` has no height or centring).

## Constraint collisions (named, not slid past)

This note proposes work that collides with the contract in four places. Each needs the owner's yes before build, then a contract amendment through `/specno-design:improve` or the main flow (not by editing this note, and not by editing `DESIGN.md`).

1. **Round-1 `LUX:` "Not committing. Multi-sensory ... No haptics or sound" is reversed.** Haptics are committed; sound is opt-in and off by default.
2. **Round-1 `LUX:` "Material truth ... No shadow, curl or fold gradient" is reversed for the ticket only.** One soft contact shadow under the whole ticket and a light-driven sheen are committed. Curl and fold gradients stay out.
3. **`brand.md` prohibits "shadowed cards", "gradients" and "autoplay or looping motion".** Scope the exception to the ticket and its stamp: one contact shadow, one pointer or gyro driven sheen, one-shot entrance and tear motion. Nothing loops, nothing sweeps on its own, no other surface gets a shadow or gradient. If the owner refuses the gradient, the fallback is to express light by modulating grain contrast and edge highlight with no colour ramp (move M3.4); it is about half as convincing.
4. **`direction.md` motion philosophy ("one clean tear, then still ... nothing else moves except 160 ms fades") must be rewritten** to something like: "The ticket is a physical object: it answers the hand (tilt, press, tear) and lands (stamp); it never moves on its own after its entrance." `tokens.md` motion tokens gain the springs below.

**The Rejected Direction B line (hard constraint).** B is "letterpress rendering with ink bleed, deckled edge and shadowed perforation". Thickness, tilt, a tearing stub that bends, a contact shadow under the whole ticket and a stamp with an impact are not B. These would be B and are out: ink bleed or blur on any type or on the stamp edge, debossed or letterpress text-shadow, a random deckled or ragged edge, a shadow inside or under the perforation. The torn edge uses a regular scallop at the punch pitch (the shape of the holes), not random jitter.

## Committed Properties (and why)

- **Material truth (deepened).** Marlon's "not premium" is mostly this: the ticket has no stock, no thickness, no light, and the perforation is a printed dotted line. The ticket is the whole product, so the physics has to be right: paper fibre, a visible edge, punched holes, a light the paper answers.
- **Multi-sensory (new, reverses r1).** The tear and the stamp are the two moments the page exists for. Motion, haptic and (opt-in) sound are designed together so they land on the same frame.
- **Time visible in detail (extended).** Every state already has its own line and icon. Now every transition and press has a tuned spring, and the dead spots (empty mobile screen, a stub that only says "---") are designed.
- **Specificity.** The stub carries ADMIT ONE and a seat that counts up like a numbering machine; the ticket glides to the header and the stub returns to it. Only this event has that.
- **Quiet by default (kept).** Nothing moves until the guest touches the ticket, other than the one-shot entrance. Red stays on stamp, primary action and focus ring. Sound off. No ambient loops.
- **Inevitability through restraint (kept).** No confetti, particles, countdown or extra illustration. The depth work goes into one object.

## Not Committing (and why)

- **Patina-aware.** Unchanged from round 1: a page that lives for a few weeks and one night.
- **Sound by default.** Sound is opt-in (a "Sound" label tab, default off). A link opened in a meeting must stay silent.
- **Ambient motion** (floating ticket, looping sheen, lanyard sway, particles, confetti). Quiet by default, and `brand.md` prohibits looping motion. Everything moves in response to the hand.
- **Letterpress, ink bleed, deckled edge, a perforation shadow.** Rejected Direction B.
- **iOS gyro permission prompt.** See M2.3: on iOS the tilt follows the finger, with no "wants to access motion" dialog on a birthday invite for guests aged up to 70.
- **A flip-to-back ticket with extra copy, a stadium photo, an official crest.** New copy needs Makes's voice, and the brand rules still apply.

## Calibration References

- **Apple Wallet**: "card metaphor pushed to physics ... boarding passes have a tear edge." Steal the way the pass answers touch with tilt and parallax, and the tear edge as a real parting line.
- **Apple Books**: paper texture under the type. Steal the placement; this round deepens it from one 4% noise to fibre plus tooth that responds to light.
- **Tesla (iOS app)**: "the user's product as the content", rendered with real lighting. Steal the idea that the one object is lit like it exists; Marlon's ticket is the "car" here, and the stub with the guest's name is the personalised part.
- **Hermès (app)**: one object, one action. Steal the refusal: the 3D budget goes into one ticket, not into scenery.

## 3D options (ladder)

Numbers: bundle sizes were measured by bundling each package with esbuild (minify, ESM, `gzip -9`) in the scratchpad: three 0.186.1, @react-three/fiber 9.8.1 (React externalised), ogl 1.0.11, cannon-es 0.20.0. Vite/Rollup output will differ by a few percent. "Estimate" means not measured. The eager bundle today is 156.4 kB gzip (measured by the owner's team); everything below loads lazily after the sealed view is interactive, so none of it adds to first paint.

### Option A: DOM/CSS 3D, light-driven (recommended build)

A real-thickness ticket: `perspective: 1100px` on the stage, the ticket as a `transform-style: preserve-3d` stack (front face, two or three edge layers at `translateZ(-0.5px / -1px / -1.5px)`), tilt from pointer (desktop), finger drag (all touch) and gyro (Android). A light vector drives a contact shadow, a sheen layer, and a grain parallax. A physically ordered tear (M2.1). All text stays real DOM.
- **Guest, mid-range Android:** the ticket is dealt in, follows the thumb and the phone's tilt, glints, tears like paper, stamps with a vibration tick. 60 fps is plausible because only transforms and opacity change on one composited layer (estimate; verify on a real mid-range device).
- **Guest, desktop:** the ticket follows the cursor within +/-9 degrees, the shadow slides opposite, the sheen follows.
- **Bundle:** about +4 to 8 kB gzip for tilt, light, tear and audio (estimate; `motion` is already in the entry, the rest is a small light-vector hook, the gyro hook and the WebAudio synth). Caveat: `src/main.tsx:20` loads `LazyMotion` with `domAnimation` and `strict`, which does not include layout animation. The shared-element glide in M5.3 needs `domMax`, which is larger (estimate +10 to 15 kB gzip, not measured); either load `domMax` lazily with the sealed view, or build M5.3 with a FLIP transform by hand and keep `domAnimation`.
- **Performance and battery:** low. `will-change: transform` only while interacting; gyro listener attached only on the sealed view and removed on `visibilitychange: hidden` and on unmount; no rAF outside spring settling; the sheen is a pre-rendered oversized radial layer moved with `transform: translate3d`, so no per-frame gradient repaint. Cost to watch: a masked, 3D-transformed element can re-rasterise every frame, so keep the mask on the inner face, not the transformed wrapper.
- **Reduced motion and accessibility:** with `prefers-reduced-motion: reduce` there is no tilt, no gyro listener, no haptic, a fixed light at 30% / 20%, instant "Tear open" (`SealedView.tsx:92-95`, already built), stamp appears in place. `forced-colors`: drop 3D, shadow and sheen (extend the block at `index.css:221-228`). 200% text: the ticket is content-sized (`Ticket.tsx:26-29`) and the 3D layers inherit that size, so nothing clips. Max tilt 9 degrees keeps all text readable. During a drag the duplicate stub layer (M2.1) is `aria-hidden` and `inert`.
- **CSP:** no change. No scripts, wasm, fonts or external images added; WebAudio synthesis needs no media files.
- **Effort:** medium (about 3 to 4 days of focused build plus a device pass).

### Option B: A plus a lazy OGL "paper and light" canvas

A single OGL plane under the DOM ticket renders the card stock: a self-hosted tileable normal map for fibre and tooth, anisotropic specular driven by the same light vector, and a soft real-time contact shadow. The ink and all text stay DOM on top (unlit, which is how printed ink behaves), matched to the canvas by the same tilt matrix. A faint floodlight cone on the page ground moves with the light.
- **Guest, mid-range Android:** the same as A, with a visibly better paper: the tooth catches the light as the phone tilts. After a 20-frame probe (see below) a slow phone silently keeps option A's CSS layers.
- **Guest, desktop:** the same, with a floodlight pool and a shadow that softens as the ticket lifts.
- **Bundle:** ogl 15.2 kB gzip (measured) plus the shader and glue, about +5 to 8 kB (estimate), plus a 512x512 normal-map PNG of about 40 to 90 kB (estimate; it is an image, loaded lazily, not JS). Total about +25 to 40 kB gzip-equivalent, loaded on idle.
- **Performance and battery:** moderate. Render on demand only while the ticket is moving (no continuous rAF), DPR capped at 1.5, `webglcontextlost` falls back to A, pause on `visibilitychange`. Gate on a probe: run 20 frames after the first interaction; if the average frame is over 24 ms, tear down the canvas and keep the CSS layers.
- **Reduced motion and accessibility:** no canvas mounts under reduced motion or `forced-colors`; text is DOM so nothing is lost if WebGL is unavailable. The canvas is `aria-hidden`.
- **CSP:** no change. OGL is plain JS; shader compilation is not JS `eval`; a self-hosted texture is covered by `img-src 'self' data:` (netlify.toml CSP). Loading the texture with `ImageBitmapLoader` uses `fetch`, covered by `connect-src 'self'`. Do not use Draco, Basis or KTX2 (they need `'wasm-unsafe-eval'`).
- **Effort:** medium to large (about 1 to 1.5 weeks on top of A), mostly in syncing a canvas to a CSS 3D matrix and testing context loss on real devices.
- **Honest read:** a guest sees this as "the paper is nicer" more than "this is 3D". It is roughly a 15 to 20% perceptual gain over A (judgment, not measured) for about twice the work.

### Option C: R3F / three scene, optionally with a physics lanyard

A react-three-fiber scene: the ticket on a Vercel-Ship-style lanyard (cannon-es rope physics) or in a lit stadium scene, with the DOM ticket as the fallback.
- **Guest, mid-range Android:** a swaying lanyard ticket that you throw around; it is dramatic and a heavier experience that starts after a download and shader compile.
- **Guest, desktop:** the best looking of the three on a good GPU.
- **Bundle:** three 135.0 kB plus the R3F runtime for a total of 250.8 kB gzip (measured), plus cannon-es 24.9 kB (measured), plus drei if used (estimate +20 to 60 kB). That is more than the whole current eager bundle (156.4 kB). Rapier instead of cannon-es would be a WASM file (estimate several hundred kB) and needs the CSP change below.
- **Performance and battery:** high. A continuous physics loop and a continuous render loop on a phone (the lanyard never rests), shader compile cost on first frame, thermal throttling on a mid-range Android after a minute of play. A lanyard also violates the no-looping-motion rule, even more than M1 does.
- **Reduced motion and accessibility:** doable (DOM fallback) but the ticket's words would live in a texture or a drei `Html` overlay that fights perspective; a second full code path to keep complete.
- **CSP:** three, R3F and cannon-es are plain JS: no change. Rapier, Draco, Basis or KTX2 need `script-src ... 'wasm-unsafe-eval'`. An HDRI or textures from a CDN need that origin added to `img-src` and `connect-src`; self-hosting avoids it.
- **Effort:** large (2 to 3 weeks), and the DOM fallback path means building the ticket twice.
- **Also:** guests open the link from a WhatsApp in-app browser. Sensor events and WebGL behaviour in in-app webviews are not verified here; option C would stake the whole experience on them.

### Recommendation: build A now; decide on B after seeing A on a real phone; skip C

> **SUPERSEDED 2026-10-14 by the owner's choice of option C** (R3F/three scene, lanyard interaction, environment pending a phone test). The reasoning below is kept as written; it remains the risk register for C (bundle, battery, WebGL in in-app webviews, the DOM fallback). Build spec: `save-the-date-3d-lanyard-spec.md`.

Option A delivers what Marlon actually named: interactivity and detail, with 3D as depth, light and a physical tear, for about +4 to 8 kB and no CSP change, and it keeps the reduced-motion path complete. It is also the base that B needs, so nothing is wasted. B is a measured upgrade path (+25 to 40 kB estimate) that is worth deciding only once A is on his own phone. C turns a simple one-object invite into a WebGL product with a 250 kB cost, continuous battery load and the lanyard's loop, for guests who open a WhatsApp link once; it fails "quiet by default" and "inevitability through restraint", and the "out of this world" feeling comes from how the ticket answers the hand, not from a scene.

## Specific Moves for the Build

Springs are `motion` spring options (`type: "spring"`). Durations are the settle time to within 1%.

### Material truth

- **M3.1 Punch real holes.** Replace the dotted border (`Ticket.tsx:55`, `[border-right-style:dotted]`) with a row of punched circles cut with one `mask` that both halves share (extends `index.css:242-261`): 3px radius circles every 9px (every 12px at 768px and up), so the page ground shows through the holes at any viewport and in the tilted state. No shadow inside or under the perforation (Direction B line).
- **M3.2 Give the stock thickness.** Add two edge layers behind the ticket at `translateZ(-1px)` and `translateZ(-2px)` in `#CFC6B2` (a darker `paper`), visible as a 2px edge only when the ticket tilts. Keep the 1px ink outline. Add a 1px `paper-raised` highlight on the lit top and left edges and a 12% ink edge on the shaded edges, set by the light vector. Applies to `Ticket.tsx:53-71` and the same component in `HeaderTicket.tsx:16` and `StubView.tsx:51`.
- **M3.3 Replace the flat 4% noise with stock.** In `index.css:186-197`, use two layers: fibre (`feTurbulence`, `baseFrequency="0.012 0.9"` so the grain is directional) at 4%, and tooth (`baseFrequency="0.9"`) at 3%. Both are still ticket and stub only, never on boxes or buttons. Shift the tooth layer 2px opposite to the light so it parallaxes as the ticket tilts.
- **M3.4 Light, in two strengths.** (a) With the exception granted: one sheen layer, a 60%-radius radial white at 14% opacity fading to 0, on `mix-blend-mode: soft-light`, moved by `translate3d` from the light vector. It exists only while the pointer or gyro moves it (no load sweep). A soft contact shadow under the whole ticket: `0 14px 28px -12px rgb(27 26 23 / 0.28), 0 2px 3px rgb(27 26 23 / 0.18)`, offset opposite the light; on pick-up (pointer down or drag) scale to 1.03 and widen the shadow with spring `{ stiffness: 300, damping: 30 }` (about 260 ms). (b) Without the exception: no sheen or shadow; the same vector only modulates grain contrast (3% to 6%) and edge highlight.

### Multi-sensory

- **M4.1 Haptics (Android; iOS gets none).** Wrap `navigator.vibrate` in one `haptic(pattern)` helper that no-ops when unsupported or reduced motion is on. Tear: a 4 ms tick each time the tip passes 40 px of travel (roughly one per five punches), then `[10, 30, 18]` at the moment of separation. Stamp: a single 22 ms pulse on impact (M4.2). Radio tile select: 10 ms. Wrong code: `[30, 40, 30]`. Primary button pointer down: 8 ms.
- **M4.2 The stamp lands as an impact.** Replace `Stamp.tsx:19-21` (180 ms fade, scale 1.15 to 1) with: start at scale 1.7, opacity 0 and rotate -9 degrees; animate to scale 1, rotate -4 with spring `{ stiffness: 900, damping: 32, mass: 0.6 }` (about 200 ms). The ticket recoils 1.5px down and 0.4 degrees with spring `{ stiffness: 500, damping: 20 }` timed to the first contact (about 110 ms in), then settles. Fill uses an SVG mask with `feTurbulence` speckle at 90 to 100% coverage (worn rubber), with a crisp edge: no blur, no bleed. Maybe uses the same impact at 70% scale travel and a 12 ms haptic. Reduced motion: appears in place, no haptic.
- **M4.3 Opt-in sound, synthesised.** A "Sound" label tab (the existing `label-tab` style, `index.css:158-165`) on the sealed view only, default off, state kept in `sessionStorage`. With WebAudio and no asset files (media files would still be fine under `default-src 'self'`, but synthesis adds 0 kB): the tear is band-passed noise, 1.2 to 4 kHz, gain follows drag velocity, 60 to 140 ms; the stamp is a 140 Hz sine decay over 90 ms plus a 6 ms noise click, at -18 dB. Create the AudioContext on the tab's click, never earlier.
- **M4.4 Press states everywhere.** `button.tsx:7-12`: add `active:translate-y-px` and an 90 ms transform spring `{ stiffness: 700, damping: 40 }` on press and release, so a button has a down state that is not only a colour. Radio tiles (`AttendanceView.tsx:51-69`): the ink fill rises from the bottom edge in 140 ms (`scaleY`, origin bottom, transform only) and the check icon draws with `stroke-dashoffset` in 220 ms.

### Time visible in detail

- **M5.1 The tear is ordered, and it stays one clean tear.** Rebuild `SealedView.tsx:51-55` and `Ticket.tsx:63-66`. Render the stub twice while dragging: a held layer clipped to below the tip (flat, never moves) and a free layer clipped to above the tip (the second copy is `aria-hidden` and `inert`; the single DOM stub is the real text). The free layer pivots at the tip, `transform-origin: 0 {tipY}px`, rotating up to 14 degrees in the plane and `rotateY(-22deg)` out of it with `translateZ(24px)` under the same perspective, and the seam gap opens behind the tip. Each punch the tip passes disappears as it goes; the torn edge is a regular 6px scallop (M3.1 pitch), not random. The scissors handle (`SealedView.tsx:157-172`) keeps its place at the tip and turns to the drag direction.
- **M5.2 Finish with the hand's velocity, then let the stub go.** Replace the fixed 700 ms ease-out (`SealedView.tsx:13`) with `animate(progress, 1, { type: "spring", stiffness: 180, damping: 26, velocity: releaseVelocity })` (about 450 ms). The stub must not fade (`SealedView.tsx:53`); it flicks away: translate +180px, +60px, rotate 24 degrees, scale 0.96 over 420 ms `cubic-bezier(0.4, 0, 1, 1)`, with opacity falling only in the last 120 ms. The main half settles with spring `{ stiffness: 260, damping: 22 }` from scale 1.02. Cancel (`SealedView.tsx:14`) becomes spring `{ stiffness: 400, damping: 34 }` (about 180 ms) so the stub snaps back instead of easing.
- **M5.3 The ticket travels with you.** Today the sealed view fades out for 160 ms and the header ticket fades in (`InvitePage.tsx:133`, `index.css:208-210`). Give the main half a shared `layoutId` across `SealedView` and `HeaderTicket` (`HeaderTicket.tsx:16-47`) so it glides to its header position in about 520 ms (spring `{ stiffness: 220, damping: 30 }`), and the returned stub (`StubView.tsx:51-61`) slides in from the right and snaps onto the seam in 380 ms with a 6 ms haptic tick. Reduced motion keeps the instant swap.
- **M5.4 The seat is stamped on, like a numbering machine.** In `StubView.tsx:56`, when the saved result arrives, roll the seat digits (`SEAT 007`) from 000 to the real number with a 70 ms stagger per digit and a 600 ms ease-out (`cubic-bezier(0.33, 1, 0.68, 1)`), in the existing tabular mono. Reduced motion shows the number.
- **M5.5 Design the code step's feedback (`CodeView.tsx:283-286, 301`).** Each typed digit drops into its cell: 3px translateY to 0 and opacity, 90 ms. A correct code flips the six cells to ink in a left to right wave, 40 ms apart (240 ms total), before the view changes. A wrong code shakes the six cells +/-4px for three cycles over 260 ms with the `[30, 40, 30]` haptic; reduced motion keeps only the status line.
- **M5.6 Pending is a state, not a loop.** While the submit at `DetailsView.tsx:301` is pending, the sealed stub's three dashes ("---", `SealedView.tsx:152`, and the header stub in `HeaderTicket.tsx:22`) step one dash at a time every 400 ms, and stop when the request ends or after 8 seconds. This is feedback tied to a request, not ambient motion.
- **M5.7 Fill the empty phone.** `SealedView.tsx:124` is a plain flex column, so at 390x844 about 320 css px sits empty under the button. Make the section `min-h-[calc(100dvh-8rem)]` with `justify-center`, and scale the ticket up on phones (title 64/60 now, `index.css:123-134`) while it still fits the width. The footer line (`InvitePage.tsx:202`) stays.

### Specificity

- **M6.1 Give the sealed stub a job.** `SealedView.tsx:148-155` shows "SEAT ---" in a mostly empty half-ticket. Add a vertical "ADMIT ONE" in `data-label` (14px mono, rotated 90 degrees, `aria-hidden`) along the stub's right edge, and keep "SEAT ---" as the blank box that gets filled by M5.4.
- **M6.2 The entrance deals the ticket once.** On first load only, the ticket arrives with spring `{ stiffness: 120, damping: 18, mass: 0.9 }` from `translateY(36px) rotateX(14deg)` and opacity 0 (about 650 ms), after `document.fonts.ready` so the dealt ticket never changes its type mid-motion. One-shot and part of the amendment to the autoplay rule (collision 3). Reduced motion shows the ticket still.
- **M6.3 The pull tab announces itself on approach, not on a timer.** Replace the idle nudge (`SealedView.tsx:67-86`, a 600 ms 1.5 degree lift twice after 3 seconds) with a hover and focus response: the perforation holes brighten 120 ms and the handle lifts 2px on approach (pointer within 64px, or keyboard focus). On touch, the handle's own 48px target is the affordance; the nudge becomes a single one-shot 4px lift at 2.5 seconds if the guest has not touched the ticket (no repeat).

### Tilt and light (the M1 rig, serves all of the above)

- **M2.1 Pointer and finger tilt.** The stage carries `perspective: 1100px`. The ticket rotates `rotateX/rotateY` from the pointer offset to +/-9 degrees (desktop) and from touch position to +/-7 degrees on the main half while not dragging the handle, spring `{ stiffness: 140, damping: 18, mass: 0.8 }` (about 420 ms settle). On leave or touch end it returns to 0 with `{ stiffness: 90, damping: 20 }` (about 600 ms).
- **M2.2 Gyro on Android Chrome.** `deviceorientation` with a low-pass filter (alpha 0.12) and a +/-7 degree clamp, calibrated to the first reading so the phone can be held at any angle. Chrome Android needs no permission prompt on HTTPS; the `Permissions-Policy` in `netlify.toml` does not restrict it. Listener removed on `visibilitychange: hidden` and on leaving the sealed view.
- **M2.3 iOS: finger only.** `DeviceOrientationEvent.requestPermission()` needs a user gesture and shows a system dialog. On a birthday invite for guests aged up to 70 that is a trust cost; iOS tilts from the finger drag only, no prompt. Pointer and finger tilt (M2.1) must be complete on their own, because the WhatsApp in-app browser may not deliver sensor events at all (not verified).
- **M2.4 Light vector.** One shared motion value `(lx, ly)` in -1..1, set from the tilt, drives M3.2, M3.3 and M3.4 together, so the shadow, edge highlight, grain shift and sheen are never out of agreement.

### Quiet by default

- **M7.1 Nothing moves unprompted.** Besides the one-shot entrance (M6.2), the single one-shot tab lift (M6.3), and the request-bound dashes (M5.6), no element animates without a pointer or a state change.
- **M7.2 Red budget stays.** Stamp, primary action, focus ring. The sheen, shadow and floodlight are neutral ink and paper only.
- **M7.3 One input for sound.** The only new chrome is the "Sound" label tab on the sealed view, in `muted`, default off.

### Inevitability through restraint

- **M8.1 Keep the cuts.** No countdown, map, calendar button, share button, confetti, particles, lanyard or stadium scene (round 1 list, plus the 3D scenery in option C).
- **M8.2 One object gets the budget.** Tilt, light, shadow and tear apply to the ticket only. Ruled boxes, forms and buttons stay flat (Direction A's layout primitive; `components.md` "Shadows and cards").
- **M8.3 Every 3D flourish has a static twin.** Reduced motion and `forced-colors` render the flat ticket exactly as built today, and that path is tested as a first-class view.

## Open Questions

1. Do you approve reversing two round-1 `LUX:` commits (no haptics or sound; no shadow or gradient) and amending three `brand.md` prohibitions (shadowed cards, gradients, autoplay or looping) plus the motion-philosophy sentence in `direction.md`, scoped to the ticket and its stamp only? Yes means the full plan; No means grain-and-edge light with no depth, which I would not call a ten-fold change.
2. Build option A now and decide on option B (an OGL lit-paper canvas, about +25 to 40 kB estimate) only after you have seen A on your own phone? I recommend yes, and skipping option C.
3. Ship the opt-in "Sound" label tab (default off), or haptics only?

## Owner answers (2026-10-14, Marlon)

1. **Yes.** Reverse the two round-1 `LUX:` commits (no haptics or sound; no shadow or gradient) and amend the three `brand.md` prohibitions plus the `direction.md` motion sentence, scoped to the ticket and its stamp only. Done in the contract.
2. **Option C**, not A. An R3F/three 3D scene. Working assumption (stated to him, accepted): the object interaction is a **lanyard**, the ticket hangs on a strap the guest can grab, swing and fling, and it settles under damping instead of looping. The environment (paper-coloured page or floodlit stadium night) is deferred until he has tested a prototype in WhatsApp's in-app browser on his phone. Option B is moot.
3. **Yes, opt-in sound**, a "Sound" tab on the ticket, off by default.
