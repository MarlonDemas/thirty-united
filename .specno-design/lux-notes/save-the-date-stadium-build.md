# Build brief for nova: sealed-screen stadium (treatment A, Floodlit Night Stand)

**Date:** 2026-10-14. **Authority:** `direction.md` (sealed-screen stage amendment), `brand.md` (scoped exception), `tokens.md` (scene tokens). Numbers marked (target) are starting values to tune on the phone. Look reference: `save-the-date-stadium-options.md`, treatment A. Lanyard behaviour stays per `save-the-date-3d-lanyard-spec.md`.

Scope: the sealed screen only. Form, code and stub views are untouched and stay on `page` paper.

## 1. Layers (back to front)

1. **Backdrop `<div>` (DOM, fixed, behind everything, `aria-hidden`).** Styled in `index.css` by class name (static markup must not carry `style=""`; the CSP blocks it). Contents, all drawn: `scene-night-deep` base; radial lift to `scene-night-lift` behind the ticket (bowl centre); two floodlight glows at the top corners in `scene-floodlight` (left large and bright, right smaller and further, about 40% and 25% peak opacity (target)); two curved terrace arcs of faint seat dots from one self-hosted `.svg` (1 to 2 kB, referenced from CSS, `scene-night-mid` body); a pitch band along the bottom in `scene-pitch` with mowing stripes at low opacity, and `scene-pitch-lit` under the footer. No photo, HDRI, CDN, wasm. The backdrop never moves (no parallax).
2. **Transparent R3F canvas** over the backdrop (`alpha: true`, no scene background, `touch-action: none` on the canvas only). Holds the ticket, strap, lights and the shadow plane.
3. **DOM ticket** stays mounted under the canvas as today (screen-reader text, fallback).
4. **"Tear open" button and footer** in the DOM above the canvas.

## 2. Lights and shadow plane (three)

- **Key:** `directionalLight`, colour `scene-floodlight` `#FFF6DC`, position `[-4, 6, 5]` (upper left, slightly in front, same side as the left floodlight), intensity **4.2**. No shadow map. **Owner-approved amendment, 2026-10-14:** keep the built value; it replaces the brief's 1.0 (target). Reason: tuned on the built scene (`src/components/three/LanyardTicket.tsx:16`).
- **Ambient:** `ambientLight`, colour `scene-ambient` `#9FB4AA`, intensity **1.6**. **Owner-approved amendment, 2026-10-14:** keep the built value; it replaces the brief's 1.4 (target). Reason: tuned on the built scene (`LanyardTicket.tsx:17`). The spike's 2.2 washed the paper out. Paper must stay the brightest object on screen.
- **Rim hint:** none required; the right floodlight is a backdrop glow only, no second light or shadow.
- **Shadow plane:** one baked soft-shadow texture on a transparent plane behind the ticket, offset away from the key: down and to the right. Plane lives in the canvas; no shadow maps.
- Read colours from the CSS variables (`getComputedStyle`), do not duplicate hex in JS.

## 3. Tokens (names and values; full table in `tokens.md`)

`scene-night-deep #0B1411`, `scene-night-mid #16231E`, `scene-night-lift #22342D`, `scene-floodlight #FFF6DC`, `scene-pitch #2F5D3A`, `scene-pitch-lit #2A4A31`, `scene-ambient #9FB4AA`. Existing tokens used on the stage: `paper #F3EDE1`, `paper-raised #FBF8F1`, `red #B3261E`, `ink #1B1A17`, `ink-2 #4A463D`, `page #E8E0CF`.

## 4. Contact shadow and sheen (same direction in both renders)

| | 3D ticket (canvas) | DOM fallback ticket |
|---|---|---|
| Contact shadow | Baked plane, falls down and right, offset about (14, 22) px at 390 wide, blur 16 px, black 55% | `box-shadow: 14px 22px 16px rgb(0 0 0 / 0.55)` on the ticket only, scaled with the ticket width |
| Sheen | Linear highlight from upper left at about 115deg, white 28% fading to 0 by 40% of the ticket width; follows the swing | The same gradient as a pseudo-element over the ticket face, clipped to it, static |

Keep the terrace behind the ticket at `scene-night-lift` so the shadow stays visible. Shadow and sheen belong to the ticket only; no other surface gets either.

## 5. Strap

Ink cloth stays (no red). Strap text "THIRTY UNITED", repeated, confirmed by the owner 2026-10-14 (decided). It vanishes on night (1.08:1), so: 1.5 px stitched edge lines in `paper`; "THIRTY UNITED" caps in `paper` at about 55% opacity, tiled along the strap; the key light catching the upper-left edge. If it still reads weak on the phone, lift the cloth fill to `ink-2` `#4A463D` (1.99:1 on night; stitching does the real work). Clasp and clip as in the lanyard spec. No shadow on the strap.

## 6. Button and focus ring on the stage (required, WCAG 3:1)

- **"Tear open":** fill `red`, label `paper-raised` (6.16:1), plus a 2px `paper` outer ring (`box-shadow: 0 0 0 2px var(--paper)`; no layout shift). Ring is 16.05:1 on `scene-night-deep`, 8.49:1 on `scene-pitch-lit`.
- **Focus ring while on the stage:** 3px `red`, offset 2px, plus a 2px `paper` ring outside it. The paper edge carries the 3:1. Off the stage `focus-ring` stays the base 3px red.
- Keep the base `:focus-visible` rule single-sourced; scope the extra ring to a `.stage` ancestor class. No `outline-none` on any control.

## 7. Fade to paper after tear

Decided 2026-10-14: the owner confirmed the stadium fades to paper after "Tear open" (yes) and that the returned stub stays on paper (yes). Both are no longer defaults.

1. "Tear open" pressed (or drag finished): input locked, ticket settles face-front, about 400 ms ease to rest (lanyard spec section 4).
2. Then, together: the backdrop and glow cross-fade to `page` `#E8E0CF` while the canvas cross-fades to the DOM ticket in the same position and size. Duration 160 ms (`stage-fade`, same as `fade-view`), easing `cubic-bezier(0.2, 0, 0, 1)`. Animate opacity only.
3. The existing 700 ms tear and the stamp then run on the DOM ticket, on paper. Unmount the scene, dispose renderer, textures and geometries; remove the backdrop node (or hide it) after the fade.
4. **Reduced motion:** swap instantly (no fade, no 400 ms settle). The page is paper from the moment "Tear open" is pressed. If the fade cannot align (resize mid-handoff), swap instantly.
5. After this point no view shows the stage. The returned stub sits on paper.

The entrance "lights on" glow fade (`lights-on`, 600 ms, same easing) runs once during the drop entrance, opacity only, then never moves. Under reduced motion the glow is simply present.

## 8. Fallback ladder

| Condition | Behaviour |
|---|---|
| WebGL unavailable, context lost, chunk error or slow frames (lanyard spec section 5) | Backdrop stays (it is DOM paint and is the fallback). Flat DOM ticket sits on it with the CSS contact shadow and sheen above. Silent. |
| `prefers-reduced-motion: reduce` | Do not load the 3D chunk. Backdrop static (it is not motion), glow present with no fade, flat DOM ticket, instant reveal, "Tear open" button only. |
| `forced-colors: active` | No 3D chunk. Backdrop layer `display: none`, plain `Canvas` background, ticket and button on their forced-colour borders, focus ring `Highlight`. Scene tokens and the paper rings are not applied. |

## 9. Budget and CSP

Added weight about 4 to 7 kB (estimate; CSS about 1 kB gzip, seat SVG 1 to 2 kB, lights and shadow plane 2 to 4 kB inside the lazy chunk); entry chunk unchanged. CSP is `style-src 'self' 'sha256-...'`, no `unsafe-inline`: CSSOM writes (React, `motion`, `element.style`) are fine; literal `style="..."` in static HTML is blocked, so keep static scene styling in `index.css`. No drei `<Environment>`, troika or `<Text>`, blob workers, wasm or CDN.

## 10. Verify when built

Axe on the sealed screen and a computed-contrast check of the ring, focus ring and strap stitching against the stated figures; phone check in WhatsApp's in-app browser for frame rate with the alpha canvas over the gradient (low-end Android overdraw is the risk); confirm the 26 light states are unchanged.
