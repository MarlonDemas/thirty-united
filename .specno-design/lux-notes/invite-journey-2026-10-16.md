# Lux Consultation, invite journey as built (phase 8 re-run)

**Date:** 2026-10-16
**Surface:** the whole journey at branch `feature/3d-ticket`, HEAD 0f204c9: sealed cover with the lanyard pass, Chapter 1 (attendance), details, code, finale / stub with the stamp, the saved poster and the OG image.
**Brief texture:** premium-consumer
**Direction:** D, "Matchday: The Signing". Signature unchanged.
**Read:** `briefs/save-the-date-brief.md`, `direction.md` (headings and D), `brand.md`, `tokens.md` (Motion, Haptics, Sound), `components.md`, `DESIGN.md` (headings), `lux-notes/save-the-date-2026-10-15.md`, `audits/phase8-verify-2026-10-16.md`, today's verify screenshots, `scratchpad/poster-yes-plus.jpg`, `poster-maybe.jpg`, `og-check.jpg`, and source for the poster, stamp, sound, haptics, chips and pass.
**Not done:** no app was run, nothing was heard or felt on a device, and no pixels were sampled. Labels: [T] looked at in a screenshot or read in source this session, [A] asserted by a project doc, [I] inferred.

This note extends `save-the-date-2026-10-15.md`. Where they disagree, this one wins for the phases built since (4 to 7). It does not repeat the verify report: the brand-rule conflict at the tear exit, the forced-colours items and the 200% text items are the verify report's, and are only pointed at below where they also have a craft angle.

## What changed since the last pass, in one paragraph

The 2026-10-15 commits were promises: "the shirt lettering sits in the folds", "the moon is drawn at its real phase", "the stamp is built". Phases 4 to 7 built them. The live finale now mostly keeps them [T: `mobile-T3-yes-stub-yes.png`, speckled stamp with contact shadow, lettering on the held shirt, a hanging shirt with a ghost number box at `mobile-T3-yes-details.png`]. The gap that opened is between the live world and the thing the guest carries away. The saved poster and the OG are drawn by a separate 2D path (`src/poster/scene.ts`, `compositor.ts`, `og.ts`), and that path is a notch plainer than the world on every material the 10-15 note committed to.

## Committed properties (and what this pass adds)

- **Material truth, the keepsake.** Held. Moves below bring the poster up to the world's standard: the stamp's wear, the lettering taking the cloth, the moon's halo.
- **Time visible in detail.** Held. A few corners a rushed team would have left: the orphaned date dot, long names shrinking to nothing, a Sound toggle that confirms nothing.
- **Specificity.** Held. The poster is the one object only this product has, and it is what leaves on WhatsApp. The finale panel does not yet show it.
- **Multi-sensory.** Held, but sound is invisible to nearly every guest, so it is being spent on nobody. Moves below make the opt-in legible without making it louder.
- **Quiet by default (UI layer).** Held, and the strongest thing in the build. The panel is one solid surface, one red button, no ornament, in every screenshot [T]. WebGL and the lanyard added nothing to the UI layer. Do not add to it.
- **Inevitability through restraint.** Held as refusals. One drift to watch: the 3D lanyard strap adds an object between the guest and the host's face on the cover (move 2).

## Not committing

- **Patina-aware.** Unchanged: one-visit page, nothing to deepen.
- **New in this pass, deliberately set aside:** no new world effects. The world is dense enough; every move below is either in the lazy poster chunk, in the build-time OG script, or a correction to something already there.

## Specific moves, ranked by impact against effort

Rank 1 is the best return. "First-paint JS" is judged against the 158.90 of 160 kB gz budget (1.10 kB of headroom, [A] from the brief of the task).

### 1. Make the saved poster as well-made as the live finale (Material truth, Specificity). High impact, low to medium effort

The poster is what a guest posts and what Makes sees come back. On it:
- **Stamp is flat.** The live stamp has `stamp-worn` speckle and a contact shadow [T: `src/components/Stamp.tsx`, live frame]; the poster stamp is a clean solid rectangle [T: `poster-yes-plus.jpg`, `compositor.ts` `stamp()` draws fillRect and strokeRect only]. Give it the same wear: punch a fixed-seed noise mask out of the fill (`destination-out`) and add a soft contact shadow under it. The poster is the copy that lasts.
- **Lettering is pasted on.** Name and number are flat white, warped by the quad but not by the cloth [T: `poster-yes-plus.jpg`, the "THANDI 17" has no fold response; `compositor.ts` `shirt()` calls `drawWarped` only]. Draw the lettering, then multiply it by the shirt plate's own luminance (or blend it `overlay` over the shirt region) so the folds and shadow cross the letters, and drop the alpha to about 0.92. This is the "sits in the folds" promise of 2026-10-15, kept on the artifact.
- **Moon is a hard flat disc.** On the poster the moon has a dark crescent and no halo [T: `poster-yes-plus.jpg`, upper right]. The live moon has a halo, limb darkening and surface noise [T: `src/world/Moon.tsx`]. Two radial gradients on the 2D canvas (halo, limb) bring it level. No texture needed at poster scale.
- **Foot slab.** The 88 percent panel scrim is a hard-edged strip across the foot [T]. The contrast maths (7.66:1 worst case, tokens.md) is why. Keep the alpha, feather only the top 24 px so the slab reads as part of the poster. Check the fixture line's worst pixel again after, since the verify report measured 13.81:1.

Files: `src/poster/compositor.ts` (`stamp()`, `shirt()`, `drawPoster()`), `src/poster/scene.ts` (moon), `src/poster/layout.ts` (scrim constants). **First-paint JS: none.** All of it is in the lazy poster chunk, which the entry never imports (comment at the top of `SavePoster.tsx`, [T]).

### 2. Move the strap off Makes's face on the T3 cover (Inevitability, Specificity). High impact, low to medium effort

On the T3 cover the strap runs from the top of the frame straight through his eyes and forehead, and the pass sits across his chest [T: `verify/axe/mobile-T3-yes-cover.png`]. The T1 cover keeps his face clear, with the pass low [T: `verify/shots/tear-strip.png`]. The whole Signature is "his face, your shirt"; the first screen should not cover the face with the invite's own hardware. One frame only, so the sway may move it: treat as [T] for that frame, [I] that the anchor is fixed (the host box spans "from the top of the frame to the bottom of the pass zone", `src/world/pass.ts`).

Options, simplest first: hang the strap from a point left of the face and let it lean in (change the anchor x); or draw the strap behind the Makes plate above shoulder height (a depth order change in the world canvas); or lower the card so the strap clears the chin and the eye line. Keep the existing hand-off to the DOM pass. Match T1's framing where he reads best.

Files: `src/components/three/LanyardTicket.tsx` (anchor, strap length around lines 109 and 299), `src/world/WorldCanvas.tsx`, possibly `src/world/shots.ts` (cover framing). **First-paint JS: none expected.** `LanyardTicket` and the canvas are the lazy world chunk; an anchor constant in `pass.ts` is the only entry-chunk file and costs bytes only if code is added, not if a number changes. Confirm with a build.

### 3. Long names: wrap, do not shrink (Time visible in detail, Specificity). Medium impact, low effort

"MAXIMILIANO JOSÉ" is set at about half the cap height of "THANDI" on the same shirt [T: `poster-maybe.jpg` vs `poster-yes-plus.jpg`; `src/world/lettering.ts` `nameFont` scales the size down to 80 percent of the shirt width]. The guest list is mostly South African, with many two-part and long names. At the size a WhatsApp status shows, a half-size name is not readable, and it is the one word the guest cares about. Break at the space into two lines at a slightly reduced size, and only shrink after wrapping. Keep the first-word-only rule until Surname is typed (owner decision 2026-10-15). Check the ghost number box is not crowded, since the number sits at 60 percent of the shirt height.

Files: `src/world/lettering.ts` (`nameFont`, `NAME_Y`), and the two callers: the poster `shirt()` in `compositor.ts` and the live shirt in `src/world/ShirtLettering.tsx`. **First-paint JS: possible, small.** `lettering.ts` is shared by the live shirt and the lazy poster. Whether it sits in the entry chunk depends on how `ShirtLettering` is split; a wrapping helper is about 0.1 to 0.2 kB gz if it does. Measure with the build before and after; there is 1.10 kB of room, so this is fine, but it is not provably zero [I].

### 4. Make the Sound opt-in legible (Multi-sensory, Time visible in detail). Medium impact, low effort

Sound is the most considered layer in phase 7 (clunk, hum, hush, drum, swell, with a 100 Hz floor, `src/lib/synth.ts`, [T]) and the least findable. The chip is an unlabeled speaker icon; its `title` tooltip does not show on touch [T: `WorldChips.tsx`, `mobile-T3-yes-cover.png`]. Turning sound on plays nothing, so the guest cannot tell whether it worked on a silent-switch phone [T: `toggleSound` calls `unlockAudio` only]. And a flat 1800 Hz sine for each code digit (`synth.ts` "tick") is a beep, not a lamp [I: not heard].

- On turning Sound on, play one soft cue once the synth chunk is loaded (the existing `clunk` at low level, or a short `hum`). It confirms the state, as a physical switch does. Await `loadCues()` first; do not queue a late cue, as the file already says.
- Swap the digit `tick` for a filtered noise click with a tiny pitch drop, so a digit sounds like a relay, not an alert. Keep it at its current level.
- Do not auto-enable sound, add a label to the chip or add a prompt line to the panel. The opt-in stays off by default (owner decision, 2026-10-15). If the owner wants more discoverability, the lowest-cost option is a visible "Sound on" state on the chip's `data-on`, which already exists.

Files: `src/world/WorldChips.tsx`, `src/lib/sound.ts`, `src/lib/synth.ts`. **First-paint JS: the confirmation adds a few lines to `WorldChips.tsx` / `sound.ts`, about 0.05 to 0.1 kB gz, if they are in the entry chunk [I].** The click change is in `synth.ts`, which is its own lazy chunk (comment at the top of the file, [T]): none.

### 5. The orphaned dot in the date line (Time visible in detail). Low impact, trivial effort

At 390 px the cover reads "Monday 21 December 2026 ·" with the dot stranded at the end of the first line and the venue on the next [T: `mobile-T3-yes-cover.png`; also visible at 200% text]. A rushed team would not catch it. Hide the separator when the row wraps (put the dot inside the venue's span so it travels with it, or use a container query), or drop the dot and let the two items stack with the icons already carrying the difference.

File: `src/components/SealedView.tsx` (`DateVenue`, lines 47 to 62). **First-paint JS: none, and it may save bytes.** It is markup in the entry chunk, so change it without adding code.

### 6. Show the guest what they are about to save (Specificity, Material truth). Medium to high impact, medium effort

On a phone the stage is the top 57 percent of the poster crop. The guest never sees the full poster (the ball, the boot, the crowd, the smoke) unless they tap Save, and then only in a bare dialog [T: `mobile-T3-yes-stub-yes.png` vs `mobile-T3-yes-poster-viewer.png`]. The poster is already rendered during the stamp [T: `SavePoster.tsx`, `DRAW_AT_MS`], so a small keepsake thumbnail on the panel, next to "Save your poster", costs nothing to draw. It is the On Running receipt: the one thing carried away, shown as an object before it is handed over. Keep it 9:16, about 72 px wide, no frame, and `aria-hidden` (the button already carries the label and the viewer carries the alt text). Do not add motion.

This competes with panel height (362 px of 844 on phones, and the verify report's note 5 on 200% text). If it does not fit, make the thumbnail the Save button's leading visual instead of adding a row.

Separate, small, and the owner's call, not a move: "Seat 017 · Shirt 17" says the same number twice [T: `mobile-T3-yes-stub-yes.png`]. Draft copy is Makes's to rewrite; flagged only.

Files: `src/poster/SavePoster.tsx` (inside the lazy boundary; the thumbnail is the same data URL as the viewer's), and the stub layout in `src/components/StubView.tsx` only if a row is added. **First-paint JS: none**, provided the thumbnail stays inside `SavePoster.tsx`. Do not import it from `StubView`; the bundle note in `SavePoster.tsx` records that adding shared imports there moved code into the entry (about +1 kB).

### 7. Give the OG its hot colour (Material truth, Specificity). Medium impact, low effort

The OG is the first thing every guest sees, in WhatsApp, before the page loads. It is blue-black with a red shirt and no red smoke [T: `og-check.jpg`, `public/og.jpg` is the same file]. The brief asks for "red smoke low in the frame" and the Signature leans on the hot colour. The current band (poster y 282 to 849, `og.ts` `ogBand`) stops above the smoke. Either move the band down far enough to bring the smoke into the lower edge (then re-check the head and "THIRTY" do not clip), or set "21 DEC 2026" in `poster-red` (contrast on the dark sky is high; recheck). Keep "no AI credit line" and "never a guest's poster" as is. Check it at the 300 px thumbnail size WhatsApp uses.

Files: `src/poster/og.ts` (`ogBand`, `OG_TITLE`), then re-run `scripts/render-og.mjs` to write `public/og.jpg`. **First-paint JS: none.** The file is build-time only [T: header comment of `og.ts`]; the JPEG is a static asset and is not part of the JS budget.

### 8. The tear's exit (Time visible in detail). Craft angle on a verify finding, medium impact, medium effort

The verify report's issue 1 shows the bright pass vanishing in about 34 ms, against the 300 ms rule. Fixing the rule and the craft in one move: let the torn pass fall or lift away over 300 ms or more with the embers the tear already releases (`tear-embers`), then strike bank one. The cover is the guest's first and only gesture on the pass. A cut there is the one hard edge in an otherwise soft journey. The fix is the verify report's; this note adds that it is also the place the pass should say goodbye, in the same register as the stamp's landing.

Files: `src/components/SealedView.tsx` (around line 264, `.then(() => onTorn())`), `src/components/three/LanyardTicket.tsx`. **First-paint JS: some.** `SealedView.tsx` is in the entry chunk; a fade is a few lines of motion values already imported (about 0.1 to 0.2 kB gz [I]). Measure it.

## First-paint JS summary

| Move | JS in first paint | Basis |
|---|---|---|
| 1 Poster keepsake | none | lazy poster chunk [T] |
| 2 Strap off the face | none expected | lazy world chunk; `pass.ts` constant only [I] |
| 3 Long names wrap | possibly 0.1 to 0.2 kB gz | `lettering.ts` is shared with the live shirt [I] |
| 4 Sound confirm | about 0.05 to 0.1 kB gz; click swap none | `WorldChips`/`sound.ts` may be entry; `synth.ts` lazy [I] |
| 5 Date dot | none, or negative | markup only |
| 6 Poster thumbnail | none if kept inside `SavePoster.tsx` | [T] bundle note |
| 7 OG | none | build-time only [T] |
| 8 Tear exit | about 0.1 to 0.2 kB gz | `SealedView.tsx` is entry [I] |

Moves 3, 4 and 8 together could use up to about 0.5 kB of the 1.10 kB headroom. Do all three only with a build check after each; none needs a new dependency. No move needs `three`, a new font or a new image in the entry chunk.

## Calibration references

- **Apple Wallet.** Boarding passes have a tear edge; the pass is a physical object with its own tint. Steal the exit: the pass leaves with physics, not with a cut (move 8), and the issuer-colour idea applies to the poster, where the guest's own name drives the surface.
- **On Running (run summary).** The typeset card as a printed receipt of a personal accomplishment, shown before it is saved. Steal the object-first presentation for the poster thumbnail (move 6).
- **Aman Resorts.** The silence of the chrome. Already the panel's model and still correct; steal the refusal to add anything when a move is tempting. Every move above is in the picture or its keepsake, never in the panel.

## Open questions for the owner

- Whether Sound should be discoverable beyond the chip (a one-line hint is the only option that adds text; this note does not recommend it).
- "Seat 017 · Shirt 17": keep both, or one.
- The OG: whether to bring the red in (move 7) or keep it cold so the poster's heat is a surprise on arrival. Either is defensible; this note leans to a small amount of red.
- Whether iOS (no web vibration) should get a haptic through any other route. Not assessed: some Safari versions are known to buzz on a native switch input, but this was not tested here and should not be relied on [I].

## What this pass could not judge

Real-device light, real audio (including the clunk, hum and tick levels on a phone speaker) and Android haptic feel. These are in the verify report's "needs the real-device run" list. Moves 2, 4 and 8 should be judged on a phone before the owner signs them off.
