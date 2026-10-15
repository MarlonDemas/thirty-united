---
name: tokens
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
direction: D
lastUpdated: "2026-10-15"
---

# Tokens: Thirty United (Direction D, Matchday: The Signing)

Projected from `direction.md` Direction D (typographic identity, colour thesis, motion philosophy) and the owner decisions of 2026-10-15. One dark scheme: set `color-scheme: dark` on `:root`. There is no light theme.

**Build status.** `src/index.css` still carries the Direction A values. Migrating it to these tokens is nova's lane; this file is the source of truth it migrates to. Contrast ratios below were computed with the WCAG relative-luminance formula on 2026-10-15, not estimated.

## Color

### Where each value comes from

- **Sampled** from the owner's reference image 4 (median of a named region, Pillow, `audits/cinematic-audit-2026-10-15.md` section 1) and proposed in the recommendation: `panel`, `moonlight`, `shirt-red`, `poster-red`.
- **Re-sampled from the approved plates** (2026-10-15, owner "defaults", decision 3): `scene-floodlight`, `scene-smoke-red`, `scene-ember`. Region and method are in "Scene token provenance" below. The owner's image 4 values they replace were `#FEFCFB`, `#DB312B` and `#F03F36`.
- **Candidate from the recommendation** (picked, not sampled): `status-error`.
- **Derived for this contract** (picked on 2026-10-15 to fill the roles the recommendation left open, then measured): `void`, `panel-raised`, `line`, `shirt-red-hover`, `shirt-red-pressed`, `status-success`, `status-warning`, `scene-moon-core` (sampled from image 1's moon, not image 4).

`scene-floodlight`, `scene-smoke-red` and `scene-ember` were re-sampled from the approved, processed plates on 2026-10-15 (see "Scene token provenance"). Re-measure the title band against its brightest pixel on every plate.

### Palette roles (UI layer)

| Token | Hex | Role | Source |
|---|---|---|---|
| `void` | `#0E0B13` | Page background on desktop around the poster frame; `html` background before the cover still paints | Derived |
| `panel` | `#18131F` | The step panel and the two chips (Sound, Still). Every readable word sits on this or on `panel-raised` | Sampled (image 4 night sky) |
| `panel-raised` | `#241D2E` | Input fill, attendance tile fill, disabled button fill | Derived |
| `text` | `#FFFFFF` | Headings, body, labels, button labels | n/a |
| `moonlight` | `#B7D3FA` | Muted and helper text, "optional" tags, the focus ring, the primary button's ring, the panel's top rule, the selected tile's border | Sampled (image 4 moon) |
| `line` | `#8A8FB0` | Control edges: inputs, tiles, checkboxes, the code cells, group rules; disabled button label | Derived |
| `shirt-red` | `#9F0B19` | Primary button fill. Nothing else on the UI layer | Sampled (image 4 shirt) |
| `shirt-red-hover` | `#B3101F` | Primary button hover | Derived |
| `shirt-red-pressed` | `#850914` | Primary button active | Derived |
| `poster-red` | `#F81E24` | In the scene only: the "UNITED" lockup, the Yes stamp, decoration. Large display type and decoration only, never a button fill, never body text | Sampled (image 4 "08" script) |

### Status colours

| Token | Hex | Use |
|---|---|---|
| `status-error` | `#FF9E8F` | Error text, the alert icon, the 2 px error rule on a field. Always with `circle-alert`, so red-ish colour is never the only signal |
| `status-success` | `#8EDDA9` | Check icon and short status line ("Saved", "Your answer is updated", "New code sent") |
| `status-warning` | `#FFC978` | Cooldown and "tries left" lines, with `timer` or `circle-alert`. Status lines only, never a fill or a border (keeps it away from dark-plus-gold) |

### Scene tokens (code-drawn parts of the world; not UI paints)

Used by the shaders, glow sprites, ember points and the poster compositor. No readable text uses them.

| Token | Hex | Drawn for |
|---|---|---|
| `scene-moon-core` | `#E8F5FD` | The moon disc (drawn at its 21 December 2026 phase, about 93 percent waxing gibbous; default accepted, the phase itself is still an estimate) |
| `scene-moon-halo` | `#B7D3FA` | The moon's halo (same value as `moonlight`, on purpose: the UI's cold colour is the moon's) |
| `scene-floodlight` | `#F1C7A0` | Lamp heads, glow sprites, beam cards, the T1 CSS glow per bank. Warm, because the lit plate's lamps are warm, not white. Was `#FEFCFB` |
| `scene-smoke-red` | `#B22C28` | Smoke tint for the noise quads and the T1 CSS layer. The lit part of the smoke, not the shadowed median. Was `#DB312B` |
| `scene-ember` | `#E03D2B` | Ember points: a saturated glowing red-orange, not the blown core. Was `#F03F36` |

**Scene token provenance** (re-sampled 2026-10-15, owner decision 3; sRGB medians of named regions on the processed 1080 x 1920 plates in `plates/work/`; script and values in the session notes, not in the repo):

| Token | Plate and region (poster px) | Method | Result |
|---|---|---|---|
| `scene-floodlight` | `g1-on` lamp-core pixels in an 80 x 80 window around each tower head: (69,591), (212,735), (872,810), (1010,680) | Median of pixels that are bright and brighter than the same pixel in `g1-off` (the processing report's own selection, n=275, gave `#F1C7A0`). Kept as the report measured it. A re-run with luminance above 0.3 and lit-versus-off above 0.2 gave `#EDC09A` (n=314), within 4 levels per channel | `#F1C7A0` |
| `scene-smoke-red` | `g2-bg` right bank x800 to 1000, y1290 to 1440, plus centre bank x430 to 650, y1330 to 1450 | Median of the top quartile by luminance of the two regions pooled (n=14,104). Right bank alone `#BA2A26`, centre bank alone `#A62D2A`, shadow-inclusive medians `#881F1C` and `#7A2321` | `#B22C28` |
| `scene-ember` | `g2-bg` foreground rubble x100 to 500, y1750 to 1920, around the defocused ember (x290 to 312, y1874 to 1896, `#BB2B1F`) and the blown core (x165 to 200, y1810 to 1850, `#FA8E62` in g2, `#FCCFA0` in the report) | Median of saturated glowing pixels: saturation above 0.6, red at least 190, red at least 1.8 times green (n=870). The ring of saturated pixels just outside the blown core gives `#E8402D`, so the value sits between the dim defocused embers and the ring | `#E03D2B` |

These tint effects drawn over the plates, so they must sit inside the plates' own colours. Additive glow brightens them on screen; the token is the base colour, not the peak.

### Contrast, every pair (measured 2026-10-15)

Text and control pairs on the UI layer:

| Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|
| `text` `#FFFFFF` | `panel` `#18131F` | 18.23:1 | 4.5 | Pass |
| `text` | `panel-raised` `#241D2E` | 16.28:1 | 4.5 | Pass |
| `text` | `void` `#0E0B13` | 19.52:1 | 4.5 | Pass |
| `moonlight` `#B7D3FA` | `panel` | 11.90:1 | 4.5 | Pass |
| `moonlight` | `panel-raised` | 10.63:1 | 4.5 | Pass |
| `moonlight` | `void` | 12.74:1 | 4.5 | Pass |
| `line` `#8A8FB0` | `panel` | 5.76:1 | 3 (control edge) | Pass |
| `line` | `panel-raised` | 5.14:1 | 3 (control edge); 4.5 as disabled label | Pass |
| `text` | `shirt-red` `#9F0B19` | 8.28:1 | 4.5 | Pass |
| `text` | `shirt-red-hover` `#B3101F` | 6.98:1 | 4.5 | Pass |
| `text` | `shirt-red-pressed` `#850914` | 10.26:1 | 4.5 | Pass |
| `moonlight` ring | `shirt-red` | 5.41:1 | 3 | Pass |
| `moonlight` ring | `shirt-red-hover` | 4.55:1 | 3 | Pass |
| `moonlight` ring | `shirt-red-pressed` | 6.70:1 | 3 | Pass |
| `status-error` `#FF9E8F` | `panel` | 9.15:1 | 4.5 | Pass |
| `status-error` | `panel-raised` | 8.17:1 | 4.5 | Pass |
| `status-success` `#8EDDA9` | `panel` | 11.34:1 | 4.5 | Pass |
| `status-success` | `panel-raised` | 10.13:1 | 4.5 | Pass |
| `status-warning` `#FFC978` | `panel` | 12.05:1 | 4.5 | Pass |
| `status-warning` | `panel-raised` | 10.76:1 | 4.5 | Pass |
| `poster-red` `#F81E24` | `panel` | 4.52:1 | 3 (large display) | Pass, large display only. The same pair is the Yes stamp: `panel` text on `poster-red`, 4.52:1 (passes 4.5:1) |
| `poster-red` | `void` | 4.84:1 | 3 (large display) | Pass, large display only |

Pairs that fail, and why the design still holds:

| Pair | Ratio | Fails | What carries it |
|---|---|---|---|
| `shirt-red` on `panel` (the button's edge) | 2.20:1 | 3:1 for a control edge | The 2 px `moonlight` ring on every primary button (11.90:1 against the panel, 5.41:1 against the fill). Required, not decoration |
| `text` on `poster-red` | 4.04:1 | 4.5:1 for normal text | Not used. The Yes stamp sets `panel` text on `poster-red` instead (4.52:1, passes). `poster-red` is never a button fill or a text background on the UI layer; the stamp is in the scene, `aria-hidden`, and its meaning is on the panel |
| `moonlight` on `scene-floodlight` `#F1C7A0` | 1.02:1 (was 1.50:1 on `#FEFCFB`) | 3:1 for focus and control edges over the scene | Controls that sit over the scene (the Sound and Still chips) are solid `panel` chips, and their focus ring gets a 2 px `panel` halo outside it (`panel` on floodlight 11.65:1, was 17.83:1; still passes 3:1 by a wide margin). The halo is now more clearly required, not less: without it the ring is invisible over a lit lamp |
| `moonlight` on `scene-moon-core` `#E8F5FD` | 1.38:1 | same | Same fix as above. No control is placed over the moon's patch of sky |
| `moonlight` on `scene-smoke-red` `#B22C28` | 4.18:1 (was 3.06:1) | 3:1 | Passes with more margin than before; the same `panel` halo still covers it |
| `panel-raised` on `panel` | 1.12:1 | n/a (fills are not the boundary) | Inputs and tiles are identified by their 1 px `line` edge (5.76:1), not by the fill |
| `panel` on `void` | 1.07:1 | n/a (decorative) | On desktop the panel column is separated from the void by its 1 px `moonlight` rule |

Decorative art over the scene (not text, `aria-hidden`, so no WCAG requirement, measured for legibility): white on `scene-smoke-red` `#B22C28` 6.39:1 (was 4.68:1); white on `scene-ember` `#E03D2B` 4.31:1 (was 3.84:1); `panel` on `scene-smoke-red` 2.85:1 (was 3.90:1, now below 3:1: acceptable only because nothing readable sits on smoke; do not set `panel` text or a `panel` mark on smoke and expect it to read); `poster-red` on `scene-smoke-red` 1.58:1 (was 1.16:1), so "UNITED" never sits on smoke: it sits in the empty sky band, measured against that band's brightest pixel on every plate.

### Rules of use

- Every word a guest must read is DOM text on `panel` or `panel-raised`. Nothing readable sits on the moving scene.
- `shirt-red` is a fill for the primary button only, always with its 2 px `moonlight` ring. There is one primary button per beat.
- `poster-red` never appears on the UI layer as a fill, a border or body text. It lives in the scene.
- Red in the UI layer is limited to the primary button. Errors use `status-error`, a pale coral, with an icon.
- Never use anything dimmer than `moonlight` for text, except the disabled button label (`line`, 5.14:1 on `panel-raised`).
- State is never colour alone: each status pairs an icon and a line; errors add the 2 px rule; the selected tile adds a 2 px `moonlight` border and a filled icon.

### Focus

| Token | Value |
|---|---|
| `focus-ring` | 3 px `moonlight`, offset 2 px, on every interactive element (`:focus-visible`). 11.90:1 on `panel` |
| `focus-halo` | Over the scene only (the chips): a 2 px `panel` ring outside the focus ring, so the indicator holds against floodlight glare (11.65:1 against `scene-floodlight`, was 17.83:1) |
| `focus-group` | The owning group's top rule thickens from 1 px `line` to 2 px `moonlight` while a field inside it has focus (inset shadow, no layout shift) |

The primary button wears a 2 px `moonlight` ring at rest. Focus adds the 3 px ring 2 px outside it, so the focused state differs from rest by a band of `panel` turning `moonlight` (11.90:1 change).

### shadcn variable mapping (for nova, `src/index.css`)

| shadcn variable | Value |
|---|---|
| `color-scheme` | `dark` on `:root` |
| `--background` | `#0E0B13` (void) |
| `--foreground` | `#FFFFFF` |
| `--card`, `--popover` | `#18131F`, `#241D2E` |
| `--card-foreground`, `--popover-foreground` | `#FFFFFF` |
| `--primary` / `--primary-foreground` | `#9F0B19` / `#FFFFFF` |
| `--secondary` / `--secondary-foreground` | `#241D2E` / `#FFFFFF` |
| `--muted` / `--muted-foreground` | `#241D2E` / `#B7D3FA` |
| `--accent` / `--accent-foreground` | `#241D2E` / `#FFFFFF` (hover on secondary controls: raised fill, `moonlight` edge) |
| `--destructive` | `#FF9E8F` (used for errors; there is no destructive action) |
| `--border`, `--input` | `#8A8FB0` (a control edge needs 3:1) |
| `--ring` | `#B7D3FA` |
| `--radius` | `0` |
| Extra tokens | `--panel`, `--panel-raised`, `--moonlight`, `--line`, `--shirt-red-hover`, `--shirt-red-pressed`, `--poster-red`, `--status-success`, `--status-warning`, and the `--scene-*` set |

### Forced colors

Under `@media (forced-colors: active)`: the world stage is `display: none` (no poster, no canvas, no still); the panel uses `Canvas` and `CanvasText`; the focus ring maps to `Highlight`; the primary button uses `ButtonText` and `ButtonFace` with its border; Yes, Maybe and No stay distinct by wording and icon. Save your poster and Share still work, and the poster image keeps its alt text. The grain and vignette overlay is removed.

## Typography

All sizes are authored in `rem` (16 px root) so 200 percent text works. The panel sizes by content up to its cap and then scrolls inside itself; it never clips.

### Faces (all four already self-hosted; no new font file for them, owner accepted; the brush font for the SVG lockups is picked in the asset phase)

| Role | Face | Weight and style | Use |
|---|---|---|---|
| Display | Barlow Condensed | 700, caps, tracking +2% | Panel headings, chip labels, group labels; in the scene, the guest's name and number on the shirt, the poster's fixture and credit lines |
| Title lockups | An OFL brush display font, outlined to SVG paths at build time | n/a | "THIRTY" and "UNITED" only. No font file ships. Font to be picked in the asset phase; until then Barlow Condensed 700 stands in on greybox |
| Standfirst | Source Serif 4 | 400 italic | One line per beat at most, as built |
| Body | Inter | 400 and 500 | Everything else on the panel, all inputs and buttons |
| Data | JetBrains Mono | 500, `tabular-nums` | Seat ("017"), the code cells, the email address, the cooldown |

Fallbacks stay size-adjusted (Arial Narrow, Georgia, system-ui, ui-monospace), `font-display: swap`.

### Scale (panel)

| Token | Desktop (px / line) | Mobile (px / line) | Face |
|---|---|---|---|
| `heading-panel` | 44 / 46 | 32 / 34 | Barlow Condensed 700 caps |
| `standfirst` | 20 / 28 | 18 / 26 | Source Serif 4 italic 400 |
| `body` | 17 / 26 | 16 / 24 | Inter 400 |
| `body-strong` | 17 / 26 | 16 / 24 | Inter 500 (labels, buttons) |
| `input` | 16 / 24 | 16 / 24 | Inter 400, never below 16 px (stops iOS zoom on focus) |
| `helper` | 14 / 20 | 14 / 20 | Inter 400, `moonlight` |
| `label-group` | 14 / 16 | 14 / 16 | Barlow Condensed 700 caps, tracking +6%, `moonlight` |
| `chip` | 14 / 16 | 14 / 16 | Barlow Condensed 700 caps, tracking +6%, `text` |
| `data-stub` | 20 / 28 | 20 / 28 | JetBrains Mono 500 tabular ("Seat 017 · Shirt 17" line) |
| `data-code` | 32 / 40 | 28 / 36 | JetBrains Mono 500, one digit per cell |

`heading-panel` steps down from the old 56 / 36 px so the heading, the controls and the action fit the 40 to 45 percent panel on a 390 × 844 phone. Minimum text anywhere is 14 px.

### Scene type (art, `aria-hidden`; sizes on the 1080 × 1920 poster)

| Element | Face | Starting size | Colour |
|---|---|---|---|
| "THIRTY" lockup | SVG brush lockup | About 80 percent of the poster width, inside the empty sky band (top 20 percent), set at about poster y 50 to 180 so the whole word sits above Makes's hairline (poster y about 315) on every beat (owner decision 2026-10-15, "defaults", decision 1; was about y 160 and below). Open check for nova on a device: the solid chips (top right, safe-area top + 12 px) now overlap the top-right of the word at the cover shot; the older wireframe note kept the word clear of them (`wireframes/save-the-date-signing-2026-10-15/variant-C.md`, history) | `text` |
| "UNITED" lockup | SVG brush lockup | Under "THIRTY" at about poster y 196 to 276, also fully above Makes's hairline (poster y about 315) | `poster-red` |
| Shirt name | Barlow Condensed 700 caps | Fits 80 percent of the shirt quad's width, never above 22 percent of its height | `text` on the shirt |
| Shirt number | Barlow Condensed 700 | About 40 percent of the shirt quad's height | `text` |
| Fixture line | Barlow Condensed 700 caps, tracking +6% | 44 px | `text` ("MON 21 DEC 2026 · VENUE TBA") |
| Credit line | Barlow Condensed 700 caps | 32 px | `moonlight` ("+ name" only; no team, owner decision 2026-10-15) |
| AI credit line | Barlow Condensed 700 caps | 24 px, tracking +6% | `moonlight` ("POSTER ART MADE WITH AI"; saved poster only, owner decision 2026-10-15). Sits on its own centred line directly under the credit line (16 px gap), or alone in that slot when there is no plus-one |
| Stamp | Barlow Condensed 700 caps | 28 px or more | Yes: `panel` on `poster-red` (4.52:1). Maybe: `text` on `panel` with a 2 px `text` border |

Scene sizes are starting values to tune on G5 and G6 once the shirt quads are measured.

**AI credit line contrast.** The area behind the credit lines is plate art, not a token, so no fixed ratio can be promised for the art alone. The compositor must draw a `panel` (`#18131F`) scrim behind the credit block at 85 percent opacity or more, full poster width, about 24 px of padding above and below the text. Measured: `moonlight` on a solid `panel` is 11.90:1. With the scrim at 85 percent over the worst case, pure white art, the backdrop blends to `#3B3641` and the line measures 7.66:1 (AA for normal text needs 4.5:1). Over `poster-red` art it is 10.48:1. The scrim is part of the saved poster only.

## Spacing and layout

- Base unit 4 px. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Phone (portrait):** the world stage is fixed and fills the layout viewport behind everything. The panel docks at the bottom: height from 40 to 45 percent of the layout viewport, sized by content inside that range; content that needs more (Chapter 2) scrolls inside the panel. Padding 24 px (20 px at 360 px wide), plus `env(safe-area-inset-bottom)`. 16 px between fields, 24 px between a group and the action row.
- **Keyboard open:** `visualViewport.height` drives the shot. The shirt strip takes the top of the visual viewport (at least 120 px (est.)); the panel fills the rest and scrolls the focused field into view. `scroll-padding-block: 6rem` stays.
- **Desktop (from 1024 px):** the poster stands as a 9:16 frame, its height `100dvh` minus 64 px, centred in the left part of the `void`; the panel is a 420 px column on the right, full height, with its 1 px `moonlight` rule on the left edge.
- **Chips:** Sound and Still sit top right inside the safe area, 48 px tall, 8 px apart.
- Targets: 48 px minimum height for inputs, buttons and chips; 56 px for the Yes / Maybe / No tiles and the code cells; 8 px minimum between targets.
- Breakpoints (Tailwind defaults): 640, 768, 1024, 1280. Design holds at 360, 390, 768 and 1440, and at 200 percent text.

## Rules, borders, radius, shadow

| Token | Value |
|---|---|
| `rule-panel` | 1 px solid `moonlight` on the panel's top edge (left edge on desktop). The only edge the panel has. Straight, never torn or deckled (rejected B) |
| `rule` | 1 px solid `line`: inputs, tiles, checkboxes, code cells, and the top rule of each field group |
| `rule-active` | 2 px (inset shadow, no layout shift): selected tile (`moonlight`), focused group (`moonlight`), field in error (`status-error`) |
| `ring-primary` | 2 px solid `moonlight` around the primary button, at rest and in every state |
| `radius-0` | 0: panel, chips, inputs, buttons, tiles |
| `radius-full` | 50 percent: the radio dot and the code-step lamps only |
| `shadow` | None on the UI layer. Depth lives in the poster |
| `overlay-grain` | Static CSS grain and vignette over the poster (not the panel); removed under `forced-colors` |
| `stamp` | Rotated -4deg. Yes: solid `poster-red` with `panel` text (4.52:1). Maybe: `panel` fill, 2 px `text` border, `pencil` icon, "PENCILLED IN" |

Hierarchy: the poster (everything) > the panel (one surface) > field groups (top rule only, no four-sided box inside the panel) > fields (1 px `line`).

## Motion

Budget: signature. The `motion` library drives the DOM (panel content, stamp), R3F drives the world canvas on T3 and T2, CSS transforms drive the T1 layer stack. In the DOM, animate transform and opacity only.

### Beat tokens (all durations estimates for T3 and T2, to tune on a device)

| Token | Duration | Easing | Used for |
|---|---|---|---|
| `world-reveal` | 400 ms | `cubic-bezier(0.2, 0, 0, 1)` | The canvas cross-fades over the identical cover still |
| `tear-drag` | follows pointer | none (1:1) | Drag down the perforation (as built) |
| `tear-finish` | about 800 ms (823 ms measured on the built tear) | `cubic-bezier(0.33, 1, 0.68, 1)` | Completing the tear (as built) |
| `tear-cancel` | 200 ms | same | Release before the threshold (as built) |
| `hint-nudge` | 600 ms | `ease-in-out` | One 4 px nudge of the tear handle at 2.5 s if untouched (as built) |
| `tear-embers` | 600 ms | one-shot | Embers spill from the tear line |
| `bank-strike` | 600 ms | `cubic-bezier(0.2, 0, 0, 1)`, one way | A bank's lamps come on (small area) and the stand under it lifts from dark to lit |
| `push-in` | 1,200 ms | `cubic-bezier(0.33, 1, 0.68, 1)` | 3 percent push and ease out after the tear; 4 percent at the signing. Never more |
| `panel-change` | 250 ms | `cubic-bezier(0.2, 0, 0, 1)` | Panel content out and in between beats; focus moves to the new heading |
| `flags-lift` | 400 ms | same | Yes: the crowd's flags lift about 6 px |
| `pose-swap` | 250 ms (wave), 350 ms (signing) | linear cross-fade | Makes's plate changes pose |
| `shirt-swing` | 600 ms | ease-out, no overshoot | The hanging shirt swings in beside Makes |
| `letter-paint` | 150 ms per letter, after a 120 ms pause in typing | ease-out | The guest's name lettered onto the shirt |
| `lamp-on` | 80 ms | ease-out | One code lamp per digit |
| `lamps-out` | 200 ms | ease-in | Wrong code: all six lamps together |
| `finale-dim` | 300 ms | ease-in-out, one way | The poster dims about 20 percent (held breath) |
| `number-land` | 220 ms | `cubic-bezier(0.22, 1, 0.36, 1)` | The shirt number scales 1.15 to 1.0 |
| `brush-reveal` | 500 ms | linear along the stroke | "UNITED" paints in |
| `ignition` | 600 ms | `cubic-bezier(0.2, 0, 0, 1)`, one way | All banks to full |
| `ember-burst` | 1,200 ms | one-shot | Finale burst from the ground |
| `stamp-land` | spring, contact at 90 ms, 1.5 px recoil | as built | The stamp |

### Ambient

- 30 Hz on demand on T3 and T2: clouds slide across the moon, smoke rolls along the ground, embers rise (about 300 at start on T3, up to 1,500; up to 500 on T2). T1: up to 20 CSS embers or none. T0: none.
- Paused on `visibilitychange` (hidden) and for the whole code beat. The canvas releases its big textures when hidden; the still layer covers the rebuild.
- The **Still** chip stops every ambient loop for the session and drops the guest to T1, without an OS setting.

### Rules

- Every large-area brightness change is one-way and lasts 300 ms or more. At most three flashes in any second, with red flashes counted separately (WCAG 2.3.1). Floodlight strikes are small areas; there is no white-out and nothing strobes.
- No forward camera travel, no gyro, no idle camera drift. Touch-drag parallax up to 8 px (T1) or a few pixels of depth offset (T3).
- No wipes and no page fades between beats: beat changes are camera shots and light changes in one continuous world.
- Wrong code does not shake anything.

### Haptics (Android only; iPhones have no web vibration)

| Moment | Pattern |
|---|---|
| Tear tick | 4 ms every 40 px (as built) |
| Tear separation | [10, 30, 18] (as built) |
| Bank strike (Yes, Chapter 2, bank four) | 12 ms |
| Maybe, No | 8 ms |
| Code digit | 4 ms |
| Wrong code | [10, 30, 10] |
| Number lands | 22 ms |
| Stamp | 22 ms (Yes), 12 ms (Maybe), as built |

Fires only after the first user activation, never under reduced motion.

### Sound (opt-in, off by default, synthesised, no files)

Kept as built (tear ticks, rip, stamp) and extended: floodlight clunk with a 120 Hz hum swell (nothing below 100 Hz), crowd swell (shaped noise, 1.2 s), a softer swell for Maybe, a quiet crackle for No, a soft tick per code digit, crowd hush, drum hit. Sound follows only its own opt-in: it stays available under reduced motion if the guest turned it on (a change from the build, where reduced motion silences it).

### Reduced motion (`prefers-reduced-motion: reduce`) = T0

No parallax, particles, push-ins or loops. The cover is the still in its pre-match state with "Tear open" only; on press the poster swaps instantly to bank one lit. Every beat swaps to its final state at once; the finale appears with the stamp in place. Focus still moves to the new heading and the live region still announces.

## Z-index and layering

| Layer | z | Contents |
|---|---|---|
| World stage | 0 | `StillLayer` (always rendered) and the lazy world canvas; `aria-hidden`, a sibling of `<main>`, never in the tab order |
| Panel | 10 | `<main>`: the step panel and everything readable |
| Chips | 20 | Sound and Still |
| Poster viewer | 30 | Save your poster: the poster full screen as an `<img>`, "Press and hold the poster to save it", and a close button. Modal (`role="dialog"`, focus moved in and returned, Esc closes). The one overlay in the product; still no toasts and no other dialogs |
