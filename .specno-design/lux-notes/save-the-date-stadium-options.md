# Stadium environment options: save-the-date 3D lanyard ticket

**Date:** 2026-10-14. **Status:** DECIDED 2026-10-14: owner chose **Treatment A, Floodlit Night Stand**. B and C are not built. He first answered only the stadium question; the other two were taken as defaults. **Both confirmed by the owner on 2026-10-14 (decided):** (1) after "Tear open" the stadium fades to the paper page and the RSVP form, code and stub views stay light and AA-verified; (2) the returned stub sits on the paper page, not the stadium. Recorded in `direction.md`, `brand.md`, `tokens.md` and `feedback.md`; build brief in `save-the-date-stadium-build.md`.
**Trigger:** the owner tested the lanyard spike in WhatsApp ("it works smooth, go with stadium background"). This closes the deferred environment decision in `save-the-date-3d-lanyard-spec.md` section 9 as "a stadium"; which stadium is open.
**Honest limits:** the stills are rough HTML/CSS/SVG mocks (drawn ticket, approximate glow positions, Big Shoulders not loaded), kept outside the repo in the scratchpad `stadium/` folder. Download figures are **estimates**, not measurements. Light numbers are starting values to tune on the phone. Contrast ratios are computed (WCAG relative luminance).

## Standing constraints (all three)

- The ticket stays Direction A: paper `#F3EDE1`, ink `#1B1A17`, red only on the stamp and the next action. The stadium is the stage and never gets red.
- No club crest, wordmark or kit; no club-merch look; no betting-app look (no neon, gold, glow-borders, odds-style chips). All three are empty, quiet, unbranded places.
- **Contract collisions the pick must amend (owner decision, then `/specno-design:improve`, not an edit here):** `brand.md` says "No ball glyph, no stadium photo" and lists "dark theme" as prohibited; `direction.md` says single light theme (`color-scheme: light`). A procedural scene is not a photo, but the dark stage is a scoped exception to the light theme. Scope it to the sealed state only (see "After Tear open").
- Round-2 `LUX:` rule still holds: nothing loops, nothing moves on its own after the entrance.

## Build idea shared by all three (the recommendation on how)

**The backdrop is a DOM layer, not WebGL.** A fixed `<div>` painted by the stylesheet (CSS gradients plus one small SVG file for seat rows) sits behind a **transparent** R3F canvas. The same layer is the static fallback, so there is one source of truth and the stadium costs the GPU nothing. three then does only two things for the scene: a key light and a tinted ambient on the ticket that match the backdrop's floodlight, and the baked soft contact-shadow plane offset away from that light. Consequences for the live CSP (`style-src 'self' 'sha256-...'`, `img-src 'self' data:`, no `unsafe-inline`):

- **Corrected 2026-10-14:** React and `motion` set styles through the CSSOM (`element.style`), which a `style-src` CSP without `'unsafe-inline'` does not block; only literal `style="..."` attributes in static HTML are blocked. The app already animates with `motion` under this CSP. So "the scene must live in the CSS file" applies only to static markup (the `index.html` shell). Static scene styling still lives in `index.css` by preference; runtime-driven values (fade opacity, light intensity) may use the CSSOM.
- Seat-row pattern: one self-hosted `.svg` file (about 1 to 2 kB), referenced from CSS. No CDN, no HDRI, no drei `<Environment>`, no troika or drei `<Text>`, no blob workers, no wasm. Glow sprites, if wanted inside the canvas, are drawn to a `CanvasTexture` at runtime (0 kB download).
- Backdrop parallax: none. The backdrop never moves; only the ticket answers the hand.

## Treatment A: Floodlit Night Stand (CHOSEN 2026-10-14)

Still: `/private/tmp/claude-501/-Users-makes-Documents-proj/27e5ff09-dff7-4334-ae7d-5ebd54ee89be/scratchpad/stadium/mock-A-390x844.png` (HTML: `mock-A.html`).

**What the guest sees.** A dark green-black night. Two floodlight banks glow at the top corners (the left one large and bright, the right one smaller and further away), and two curved terraces of faint seat dots sweep behind the ticket like a bowl. A lit pitch glows green along the bottom edge with mowing stripes. The ticket hangs in the empty middle of the bowl.
- **Phone 390x844:** floodlights cropped at the top corners, terraces behind the ticket, pitch band behind the button and footer. The ticket is the brightest object on the screen by a wide margin.
- **Desktop 1440x900:** same composition widened; the pylons sit further apart (left and right thirds), the terrace arcs fill the width, the ticket stays centred at its phone-scaled size capped at about 560 px wide.
- **How the ticket reads.** Paper on `scene-night-deep` is 16.05:1, so the paper is unmistakably the focal point. The red strap button is the only warm saturated shape, which keeps red meaning "next action".
- **The strap problem.** The ink strap vanishes on night: ink `#1B1A17` on `#0B1411` is **1.08:1**. Fix (already in the mock): 1.5 px stitched edge lines and the "THIRTY UNITED" caps in paper at about 55% (the spec already calls for paper caps on the strap), plus the key light catching the strap's upper-left edge. Alternative if it still reads weak: lift the strap fill to `ink-2` `#4A463D` (1.99:1 on night; the stitching does the real work).

**Light.** Key = the left floodlight bank, upper left, slightly in front: warm white `#FFF6DC`, direction about `[-4, 6, 5]`, intensity about 1.0 (spike is 0.8 at `[-3, 5, 7]`). Fill = the pitch and terraces, cool green ambient `#9FB4AA`, lower than the spike's 2.2 so the paper does not wash out (start about 1.4, tune on the phone). The right bank is a small rim hint only, no second shadow.
- **Contact shadow:** falls down and to the right, offset (14, 22) px at 390 wide, blur 16 px, black at 55% on a transparent plane (a dark ticket shadow reads on a dark backdrop only if the backdrop behind it is lifted; keep the terrace behind the ticket at `scene-night-lift` so the shadow still shows).
- **Sheen:** a linear highlight from the upper left, about 115 degrees, white at 28% fading to 0 by 40% of the ticket's width; it moves with the swing.

**Palette additions (scene tokens, sealed state only; not used by any form view).**

| Token | Hex | Role |
|---|---|---|
| `scene-night-deep` | `#0B1411` | Page edge, sky |
| `scene-night-mid` | `#16231E` | Terrace body, footer scrim |
| `scene-night-lift` | `#22342D` | Bowl centre, behind the ticket |
| `scene-floodlight` | `#FFF6DC` | Floodlight and key colour |
| `scene-pitch` | `#2F5D3A` | Pitch glow (also stripes at lower opacity) |
| `scene-pitch-lit` | `#2A4A31` | Pitch band under the footer |

**UI contrast on the scene.**

| Element | Pair | Ratio | Need | Result |
|---|---|---|---|---|
| Footer "Makes, 21 DEC 2026" (16 px) | paper on `scene-pitch-lit` | 8.49:1 | 4.5 | pass |
| Footer, if on `scene-night-mid` | paper on `#16231E` | 13.93:1 | 4.5 | pass |
| Any overlay text | paper on `scene-night-deep` | 16.05:1 | 4.5 | pass |
| "Tear open" label | paper-raised on red `#B3261E` | 6.16:1 | 4.5 | pass (unchanged) |
| "Tear open" edge vs scene | red on `#0B1411` | 2.86:1 | 3 | **fail**: add a 2 px `paper` outer ring (16.05:1), as in the mock |
| Focus ring (3 px red) vs scene | red on `#0B1411` | 2.86:1 | 3 | **fail**: on the scene use a two-tone ring, 3 px red plus 2 px paper outside; the paper edge carries the 3:1 |
| Ticket edge vs scene | paper on night | 16.05:1 | 3 | pass |

**Download (estimate).** CSS gradients about 1 kB gzip; seat-row SVG about 1 to 2 kB; extra scene code (two lights, shadow plane) about 2 to 4 kB gzip inside the existing lazy chunk. **Total about 4 to 7 kB.** Entry chunk unchanged.
**Phone performance risk:** low. The backdrop is DOM paint, drawn once; the canvas is transparent (alpha blending of one canvas over a static layer, already the case in the spike). No extra draw calls beyond the shadow plane.

**Motion.** Recommend none ambient. One justified one-shot: the floodlight glow layer fades in over 600 ms during the ticket's drop entrance ("lights on"), a CSS opacity transition that settles and then never moves. Off under reduced motion (the glow is simply present). No flicker, no crowd, no haze.

**Fallback.** WebGL unavailable or slow: the same DOM backdrop stays (it is the fallback), and the flat DOM ticket (option A of the ladder) sits on it with a CSS box-shadow equivalent of the contact shadow, scoped to the ticket. Reduced motion: backdrop static (it is not motion), flat DOM ticket, instant reveal, no glow fade. Forced colours: hide the backdrop layer (`display: none`), plain Canvas background, ticket and button with their forced-colour borders.

## Treatment B: Tunnel Mouth

Still: `.../scratchpad/stadium/mock-B-390x844.png` (HTML: `mock-B.html`).

**What the guest sees.** The ticket hangs inside a dark players' tunnel, an arched opening framing a bright daylight pitch with a faint far stand. Strap emerges from the dark arch top into the light.
- **Phone:** a tall arch fills the width; pale sky in the upper half, a grey stand band, green mown pitch below; dark concrete floor holds the footer. **Desktop:** the arch becomes a wide proscenium (the tunnel mouth about 60% of the width), with dark side walls.
- **How the ticket reads.** Weakest of the three. Ticket against the pale sky is only **1.39:1** (paper `#F3EDE1` on `#B9D0CF`); it holds only through its 1px ink frame and the contact shadow, and against the pitch band paper reaches 3.55:1. The strap reads well against the pale sky (ink on sky 10.76:1), but in the dark arch itself it disappears (ink on `#1A1917` is 1.01:1).

**Light.** Key = the bright pitch behind, so the ticket is back-lit and its face is fill-lit by a tunnel strip light above and in front (cool-white `#F2F6F5`, direction `[0, 6, 6]`, intensity about 0.9). Contact shadow: short, almost straight down (offset (6, 26) px, blur 16, 50%), cast onto the pitch haze. Sheen: vertical, white 22% at the top fading by 35%. Rim highlight along the ticket's lower edges from the pitch bounce.

**Tokens.** `scene-tunnel` `#1A1917`, `scene-tunnel-floor` `#24221F`, `scene-tunnel-rim` `#34312B`, `scene-sky` `#B9D0CF`, `scene-sky-top` `#DDE8E6`, `scene-pitch-day` `#4F8A4B`.
**Contrast.** Footer paper on `scene-tunnel-floor` 13.61:1; paper on `scene-tunnel` 15.07:1; "Tear open" edge red on `scene-tunnel` 2.69:1 (fails 3:1, same paper ring fix); button sits partly over bright pitch, where the paper ring is invisible, so it needs its own dark ring too (a 2 px ring in `ink` plus the paper ring).

**Download (estimate).** CSS about 1 kB, arch SVG about 2 kB, code about 4 to 6 kB gzip. **Total about 5 to 9 kB.** Performance: low, same architecture.
**Motion:** none ambient. Optional one-shot: the arch "opens" from darkness (a vignette fades from 70% to 55% over 600 ms). Not recommended; not needed.
**Fallback / reduced / forced:** as A (DOM backdrop stays; hidden under forced colours). A daylight pitch with a dark frame is also the most photographic-looking of the three and the closest to a "stadium photo", which `brand.md` bans.
**Why not first:** brightest scene means the paper ticket loses its figure/ground, and it asks the most of a hand-drawn arch.

## Treatment C: Stand at Dusk

Still: `.../scratchpad/stadium/mock-C-390x844.png` (HTML: `mock-C.html`).

**What the guest sees.** A blue-hour sky fading down to an amber horizon, a dark terraced stand and roof line cutting across the lower third, a single floodlight pylon lit on the right. The ticket hangs against the sky; the button and footer sit on the dark stand.
- **Phone:** the stand takes the lower 40%; the ticket sits right at the sky-to-stand join, where the warm glow lights its left edge. **Desktop:** the roof line runs the full width with a longer sky; one pylon right, none left.
- **How the ticket reads.** Paper on mid sky `#3A4668` is 7.98:1, good. The warm amber near the horizon gives the most atmosphere, but it is also the treatment most likely to drift toward a stock sunset gradient, and the strap on mid sky is only 1.87:1 (stitching still needed).

**Light.** Key = the single floodlight at upper right, warm `#FFF1CF`, direction `[4, 5, 5]`, intensity about 0.8; fill = the cool sky, ambient `#9AA8C8` about 1.3; warm kicker from the horizon at lower left. Contact shadow falls down and to the **left** (offset (-16, 22), blur 16, 50% `rgba(20,24,40)`). Sheen: from the lower left warm horizon, about 60 degrees, `#FFD6AA` at 35% fading by 45%.

**Tokens.** `scene-dusk-top` `#1E2A44`, `scene-dusk-mid` `#3A4668`, `scene-horizon` `#C9774A`, `scene-horizon-lit` `#E7A872`, `scene-stand` `#1B2130`, `scene-floodlight` `#FFF1CF`.
**Contrast.** Footer paper on `scene-stand` 13.78:1; "Tear open" edge red on `scene-stand` 2.46:1 and on dusk-mid 1.42:1 (fails; paper ring fix, which gives 13.78:1 against the stand); ticket on mid sky 7.98:1.
**Download (estimate):** CSS about 1 to 2 kB, stand and pylon SVG about 2 to 3 kB, code about 3 to 5 kB gzip. **Total about 6 to 10 kB.** Performance: low.
**Motion:** none ambient; optional one-shot floodlight fade-in, same as A. Fallback / reduced / forced: as A.
**Why not first:** the warm gradient is the most "brand-colour-like" and the nearest to a generic sunset wallpaper; its reading as a stadium rests on one pylon.

## After "Tear open": recommendation

Three options: (a) the stadium stays behind every screen; (b) it fades to the paper page at tear; (c) a hybrid.

**Recommend (b), with the stadium returning only if the owner later asks for it on the stub.** The stadium is the stage for the sealed object, and the tear is the doorway. At the end of the 400 ms settle (spec section 4) the backdrop cross-fades to `page` `#E8E0CF` over 160 ms (the existing fade token) while the DOM ticket takes over, then the form, code and stub views are exactly the 26 AA-verified light states from the last verify pass. Reason: the form is the part guests aged up to 70 must complete in under a minute, and the contract's light-theme AA work, ruled boxes and focus ring were validated on paper; a dark stage behind them would re-open every contrast and `forced-colors` check and break "light theme only". Keeping the stadium only on the sealed screen also bounds the `brand.md` exception to the one screen where the ticket is the whole product. Under (a), the ruled boxes would sit as paper islands on night, which is readable but doubles the verify surface and still looks like a dark UI.

## Phone performance and the motion budget (all three)

- **Continuous animation needed by the stadium: none.** The backdrop is static DOM paint; the lanyard keeps `frameloop="demand"`, renders only while moving and stops at rest. Recommend no ambient loop. No opt-in is proposed.
- **One-shot only:** floodlights fade in with the drop entrance (600 ms opacity, A and C only, optional). It must settle, and is off under reduced motion.
- Not proposed because they cost battery and break "quiet by default": floodlight flicker, crowd movement, haze or fog, flying birds or lens flares.
- Risk to watch on the real phone: alpha-blended canvas over a large gradient layer on a low-end Android (overdraw). Mitigation if frames drop: the spec's existing slow-frame step-down (cross-fade to the DOM ticket on the same static backdrop), so a slow phone still sees the stadium.

## Recommendation

**Treatment A, Floodlit Night Stand.** Strongest figure/ground for the paper ticket (16.05:1), the lowest added weight (about 4 to 7 kB, estimate), a single clear light direction that matches the ticket's shadow and sheen, and the least risk of drifting into betting-app glow or a stock sunset. It also gives the red button its place as the one warm object. B has the weakest ticket legibility; C is the closest second if the owner wants warmth.

## Open questions for the owner (max 3)

1. Which stadium: A, B or C? **Decided 2026-10-14: A.**
2. **Decided 2026-10-14: yes.** Is a dark stage on the sealed screen only, fading to the paper page when he taps "Tear open", right? (This amends the "no dark theme" and "no stadium photo" lines in `brand.md`.)
3. **Decided 2026-10-14: stays on the paper page.** Should the returned stub also sit on the stadium, or stay on the paper page?

## Files

- Stills: `/private/tmp/claude-501/-Users-makes-Documents-proj/27e5ff09-dff7-4334-ae7d-5ebd54ee89be/scratchpad/stadium/mock-A-390x844.png`, `mock-B-390x844.png`, `mock-C-390x844.png` (HTML next to them, outside the repo).
