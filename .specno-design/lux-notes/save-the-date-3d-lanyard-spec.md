# Build spec: 3D lanyard ticket (option C), save-the-date

**Date:** 2026-10-14. **Status:** prototype spec; environment and gyro deferred. Numbers marked (target) are starting values to tune on a real phone, not measurements.
**Authority:** owner decisions in `save-the-date-2026-10-14-r2.md` (Owner answers). Exceptions to `brand.md` apply to the ticket and stamp only.

## 1. Lanyard behaviour

Scene: three + @react-three-fiber, lazy-loaded. Ticket is a rigid plane (thin box, rounded corners) hanging from a strap modelled as a chain of verlet or cannon-es rope segments. The DOM owns all text; the scene owns the object.

| State | Behaviour |
|---|---|
| Idle hang | Ticket enters with a one-shot drop from above and a short swing, then rests. Rests still; no idle sway, no breathing. |
| Grab | Pointer down on the ticket picks it up (pointer capture). Ticket tilts toward the hand; strap goes taut. Tap without move is a grab-and-release (small nudge). |
| Drag | Ticket follows the pointer through a spring (stiffness (target) 120, so it lags a little). Max drag radius is clamped to the strap length. Vertical drag below the anchor only, no pulling it off the strap. |
| Fling | On release, pointer velocity (last 80 ms) is passed to the ticket, clamped to 1.4 m/s. |
| Settle | Rope damping (target) 0.96 per step plus 0.5 angular drag. Must be at rest within 2.5 s of a hard fling (target), 1.2 s of a nudge. Max swing (target): 55 degrees off vertical, ticket rotation about the strap axis up to 180 degrees (it may show its back during a fling, and returns to face-front). |

Rope: 5 segments (target), fixed timestep 1/60 with a max of 3 substeps per frame. Rest test: total kinetic energy under epsilon for 20 frames, then stop the physics step and the render loop (section 8). Any pointer or key input wakes it.

## 2. Ticket face as texture

- Draw the ticket to a `CanvasTexture` (2x ticket size, at most 2048 px on the long side, `colorSpace = SRGBColorSpace`, anisotropy 4).
- Draw only after `await document.fonts.ready`, with the same families and tokens as the DOM ticket (read from CSS variables via `getComputedStyle`, not duplicated hex). If a font fails to load, draw with the fallback stack and still proceed; do not block the scene.
- No troika, no drei `<Text>`, no drei `Html`-for-text: troika spins up a `blob:` worker that the CSP blocks. No font files fetched by three (no `FontLoader`, no SDF).
- The grain, 1px ink frame, dotted perforation and four corner notches of the DOM ticket (`Ticket.tsx:55`) are redrawn on the canvas. Same Direction A look, no ink bleed, no letterpress shadow, no random deckled edge.
- Back face: plain paper with the stub rule, so a flung ticket never shows an empty plane.
- Accessibility: the face text exists in the DOM as visually hidden content (the DOM ticket stays mounted, hidden from sight, under the canvas). Screen readers read the DOM, never the canvas.

## 3. The strap

A flat woven strap, no red (red stays on the stamp and the next action only). Ink-black (`ink` token) cloth 18 mm wide, with "THIRTY UNITED" repeated in paper-coloured condensed caps along it (canvas texture, tiled), a metal-grey clasp (flat colour, one specular highlight), and a bulldog clip at the ticket. No logo, no club crest. One soft contact shadow under the ticket on the page (brand exception); no shadow on the strap.

## 4. Hand-off to "Tear open"

- The 3D object is a presentation layer for the sealed state only. The "Tear open" button stays a real DOM button below the canvas, always visible, always the equal path.
- Tearing: when the guest presses "Tear open" (or drags the stub), the scene settles the ticket face-front (about 400 ms ease to rest, input locked), then cross-fades (160 ms) to the existing DOM ticket in the exact same position and size, and the existing tear animation and stamp run there. The scene is then unmounted and its chunk's GPU resources are disposed (`renderer.dispose()`, textures, geometries).
- The stub returns in the DOM, as today. 3D is not used for the returned stub or any later view.
- If the cross-fade cannot align (resize mid-handoff), skip it and swap instantly.

## 5. Fallback ladder

C (WebGL lanyard) -> A (DOM ticket, light-driven tilt and tear) -> reduced-motion / forced-colors (flat DOM, instant reveal, no tear).

| Step down | Trigger |
|---|---|
| C -> A | No WebGL2 (`getContext` fails), `webglcontextlost` event not restored within 2 s, chunk load error or 5 s load timeout, frame-time budget missed (below), `navigator.deviceMemory` of 2 or less where reported (target). The DOM ticket is the default render; the canvas fades in over it only when it is ready. |
| Slow frames | Median frame time over a 1 s window above 33 ms (under 30 fps) for 2 consecutive windows after the first second, or 3 dropped windows total: stop the scene, settle by cross-fade to the DOM ticket, never offer it again this session. |
| Any -> flat | `prefers-reduced-motion: reduce` or `forced-colors: active`: never load the 3D chunk (check before the dynamic import), no physics, no tilt, no tear, "Tear open" button only, no sound or haptics. |

Fallbacks are silent: no error message to the guest. Log one console `debug` line for the owner to see on the phone test.

## 6. Sound tab (opt-in)

- Placement: a small "Sound" label tab on the top rule of the ticket frame, in the same condensed caps as the other label tabs. It is a real `<button aria-pressed>`; the state reads "Sound off" / "Sound on". Default off, every visit, not persisted.
- The first tap on the tab is the unlock gesture: create or resume the `AudioContext` inside that handler. No audio before it. No autoplay, no music.
- Synthesized only with WebAudio (oscillator and filtered noise bursts): a short cloth-and-clip click on grab, a low soft thud on rest, a paper rip on tear (noise through a bandpass sweep, about 250 ms), a stamp thump (60 Hz sine plus a 20 ms noise burst). No media files, no `<audio>`, no `fetch`, so the CSP needs no change. Master gain (target) 0.25.
- iOS silent switch mutes WebAudio. Document it in a one-line help (title attribute and the build notes), not a bug. No UI warning.
- Sound is skipped entirely under reduced-motion.

## 7. Haptics

`navigator.vibrate` where it exists (Android Chrome and most Android webviews; not iOS Safari), feature-detected, never required. Patterns: grab 8 ms, rest 12 ms, tear 25-15-35 ms, stamp 40 ms. Fire only after a user gesture, and not when reduced-motion is on. Independent of the Sound tab (haptics are not sound).

## 8. Performance budgets

- Lazy 3D chunk (three, R3F, rope code): at most 260 kB gzip total, never in the entry chunk; entry stays at about 156 kB. Prefer importing from `three` by name to allow tree-shaking; no drei (or only single named helpers), no postprocessing, no HDRI. Rope physics hand-rolled verlet is preferred to cannon-es (about 25 kB) unless the prototype needs more.
- Fps floor: 30 fps on a mid-range Android (target); aim for 60.
- DPR cap: `Math.min(devicePixelRatio, 1.5)`; 1 on first frame, upgrade after the first settle.
- `frameloop="demand"`: render only while moving; once at rest, no render loop and no physics step (CPU idle). Resume on input.
- Pause when `document.hidden`. Cap physics at 3 substeps. No shadow maps: the contact shadow is a baked soft texture on a plane. Textures at most 2048 px.
- Self-host everything; no CDN origins; no wasm, so no CSP change.

## 9. Deferred until after the phone test

- Environment: paper-coloured page (as today) or floodlit stadium night. A dark stadium would collide with "light theme only" and needs its own owner decision.
- Gyro / device-orientation tilt (iOS needs a permission prompt; behaviour in the WhatsApp webview is unverified).
- Whether the returned stub should also be 3D.

## Open questions for after the phone test

1. Does WebGL context creation and touch drag (no scroll hijack, `touch-action: none` on the canvas only) work in the WhatsApp in-app browser on iOS and Android? Unverified here.
2. Is verlet rope enough, or does the swing need cannon-es?
3. Do the frame-time and 260 kB targets hold on his phone and on a mid-range Android?
4. Is the strap text legible and tasteful at phone size, or should the strap be plain?
