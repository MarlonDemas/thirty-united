---
name: tokens
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
direction: A
lastUpdated: "2026-10-14"
---

# Tokens: Thirty United (Direction A, Matchday Programme)

Projected from `direction.md` (typographic identity, color thesis, motion philosophy). One light theme only, except the sealed screen's night stage (scene tokens below, sealed state only): set `color-scheme: light` on `:root`, remove the `.dark` block from `src/index.css` at build. Contrast ratios below were computed (WCAG relative luminance), not estimated.

## Color

### Palette roles

| Token | Hex | Role | Notes |
|---|---|---|---|
| `paper` | `#F3EDE1` | Ticket stock, ruled-box surface | The material of the Signature |
| `page` | `#E8E0CF` | Page background behind the ticket | |
| `paper-raised` | `#FBF8F1` | Input fill, select popup, text on red | Lighter than paper so fields read as fields |
| `ink` | `#1B1A17` | Text, 1px rules, input borders, icons | 14.93:1 on paper, 13.25:1 on page |
| `ink-2` | `#4A463D` | Secondary text, labels | 8.06:1 on paper, 7.16:1 on page |
| `muted` | `#5E5A50` | Helper text, "optional" tags, disabled-but-readable text | 5.90:1 on paper, 5.24:1 on page, 6.48:1 on paper-raised |
| `rule-soft` | `#D9D0BE` | Decorative hairlines inside a box only | 1.31:1 on paper: never a control border, never text |
| `red` | `#B3261E` | The ADMIT ONE stamp, the primary action, the focus ring. Nothing else. | 5.61:1 on paper, 4.98:1 on page |
| `red-pressed` | `#8F1D17` | Primary action hover and active fill | 8.40:1 with `paper-raised` text |

Rules of use:
- Text on a red fill is `paper-raised` (6.16:1). Never put ink on red (2.66:1).
- Red is never a block fill other than the primary button and the stamp's outline and text. Direction A: no red fills, no red text blocks.
- Never use `muted` below 14px, never use anything lighter than `muted` for text. `#7A7468` (3.98:1) and `#8C8472` (3.18:1) fail AA and are banned.

### Status colours (deliberately not stock Material)

Material 3's baseline error is `#B3261E`, the same hex as our red. Using it for errors would blur the one-meaning rule for red, so errors use a darker oxblood that reads as ink with a red cast.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `status-error` | `#7F1D17` | Error text, alert icon, 2px error rule on the field. Never a fill. | 8.62:1 paper, 7.65:1 page, 9.47:1 paper-raised |
| `status-success` | `#2F5D3A` | Check icon and short status line ("saved", "updated", "new code sent") | 6.56:1 paper, 5.82:1 page, 7.21:1 paper-raised |
| `status-warning` | `#8A5A00` | Cooldown and "attempts left" lines, on paper or paper-raised only | 5.08:1 paper, 5.59:1 paper-raised, 4.51:1 page (use on page only for 18px+ bold) |

State is never colour alone: every status pairs an icon, a short line and (for errors) the 2px rule.

### Focus

| Token | Value |
|---|---|
| `focus-ring` | 3px `red`, offset 2px, on every interactive element (`:focus-visible`). 4.98:1 on page, 5.61:1 on paper |
| `focus-rule` | The owning ruled box thickens to 2px (inset shadow, no layout shift) while a field inside it has focus |

### Scene tokens: the sealed screen's night stage (stadium A, owner decision 2026-10-14)

Used only by the sealed screen's backdrop and the 3D scene lights. No form, code or stub view uses them; the `.dark` block stays removed and `:root` stays `color-scheme: light` (the stage is a painted layer, not a theme). Define as CSS custom properties in `src/index.css`. Contrast ratios computed (WCAG relative luminance).

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `scene-night-deep` | `#0B1411` | Page edge, sky | paper on it 16.05:1 |
| `scene-night-mid` | `#16231E` | Terrace body, footer scrim | paper 13.93:1 |
| `scene-night-lift` | `#22342D` | Bowl centre, behind the ticket (keeps the contact shadow visible) | paper 11.28:1 |
| `scene-floodlight` | `#FFF6DC` | Floodlight glow and key light colour | 17.34:1 on night-deep |
| `scene-pitch` | `#2F5D3A` | Pitch glow, mowing stripes at lower opacity | paper 6.56:1 |
| `scene-pitch-lit` | `#2A4A31` | Pitch band under the footer | paper 8.49:1 (footer text passes) |
| `scene-ambient` | `#9FB4AA` | Cool green ambient light colour in three (not a CSS paint) | n/a |

Required fixes on the stage (without them the Direction A parts fail):

| Element | Problem | Fix | Result |
|---|---|---|---|
| "Tear open" button edge | `red` on `scene-night-deep` 2.86:1, on `night-lift` 2.01:1, on `pitch-lit` 1.51:1 (needs 3:1) | 2px `paper` outer ring around the red button (`box-shadow: 0 0 0 2px var(--paper)`, not a layout change). Label stays `paper-raised` on red, 6.16:1 | ring 16.05:1 on deep, 11.28:1 on lift, 8.49:1 on pitch-lit |
| Focus ring on the stage | 3px `red` alone is 2.86:1 or less on night | Two-tone: 3px `red` ring (offset 2px) plus a 2px `paper` ring outside it. The paper edge carries the 3:1. Off the stage, `focus-ring` is unchanged | 16.05:1 on deep |
| Strap (ink cloth) | `ink` on `scene-night-deep` 1.08:1, on `night-lift` 1.32:1 | 1.5px stitched edge lines in `paper`, and "THIRTY UNITED" caps in `paper` at about 55% (about 5.3:1 on the ink cloth); key light catches the upper-left edge. If it still reads weak, lift the strap fill to `ink-2` `#4A463D` (1.99:1 on night; the stitching does the work) | stitching 16.05:1 on deep, 11.28:1 on lift |
| Footer text on the stage | n/a | `paper` on `scene-pitch-lit` or `scene-night-mid` | 8.49:1 / 13.93:1 |
| Ticket edge vs stage | n/a | paper ticket on night, no change | 16.05:1 |

Forced colors: the backdrop layer is `display: none`; the ticket, button and focus ring use their forced-colour borders and `Highlight`, as today. The scene tokens are ignored.

### shadcn variable mapping (for the build, `src/index.css`)

| shadcn variable | Value |
|---|---|
| `--background` | `#E8E0CF` (page) |
| `--foreground` | `#1B1A17` |
| `--card`, `--popover` | `#F3EDE1`, `#FBF8F1` |
| `--card-foreground`, `--popover-foreground` | `#1B1A17` |
| `--primary` / `--primary-foreground` | `#B3261E` / `#FBF8F1` |
| `--secondary` / `--secondary-foreground` | `#F3EDE1` / `#1B1A17` |
| `--muted` / `--muted-foreground` | `#E8E0CF` / `#5E5A50` |
| `--accent` / `--accent-foreground` | `#1B1A17` / `#F3EDE1` (hover: ink fill, paper text) |
| `--destructive` | `#7F1D17` (used for errors; there is no destructive action) |
| `--border`, `--input` | `#1B1A17` (a visible control border needs 3:1, so it is ink, not `rule-soft`) |
| `--ring` | `#B3261E` |
| `--radius` | `0` |
| Extra tokens | `--paper-raised`, `--ink-2`, `--rule-soft`, `--status-success`, `--status-warning`, `--red-pressed` |

### Forced colors

Under `@media (forced-colors: active)`: ink maps to `CanvasText`, paper and page to `Canvas`, focus ring to `Highlight`. The stamp keeps its 1px inner rule and text in `CanvasText` with a 2px `CanvasText` border; Yes, Maybe and No stay distinguishable by wording and icon, not colour. The perforation is drawn with borders or SVG strokes in `currentColor`, never a background-image. The paper grain is removed.

## Typography

All sizes are authored in `rem` (16px root) so 200% text works. The ticket and boxes size by content (`min-height`, no fixed aspect ratio), so enlarged text grows the object instead of clipping it.

### Faces (build dependency, none are installed yet; the repo has Geist only)

| Role | Face | Weight and style | Use |
|---|---|---|---|
| Display | Barlow Condensed | 700, caps, tracking +2% | Ticket title, view headings, label tabs |
| Standfirst | Source Serif 4 | 400 italic | One line per view ("a note from Makes") |
| Body | Inter | 400 and 500 | Everything else, all inputs and buttons |
| Data | JetBrains Mono | 500, `font-variant-numeric: tabular-nums` | Seat, date, email address, code boxes, countdown |

Five font files in total (Barlow Condensed 700, Source Serif 4 italic, Inter 400/500, JetBrains Mono 500). Latin subset, `woff2`, `font-display: swap` with size-adjusted fallbacks (Arial Narrow for Barlow Condensed, Georgia for Source Serif 4, system-ui for Inter, ui-monospace for JetBrains Mono) so the ticket does not jump when fonts arrive.

### Scale

| Token | Desktop (px / line) | Mobile (px / line) | rem (desktop / mobile) | Face |
|---|---|---|---|---|
| `display-ticket` | 120 / 104 | 64 / 60 | 7.5 / 6.5 and 4 / 3.75 | Barlow Condensed 700 caps. Mobile wraps to two lines (THIRTY / UNITED) |
| `heading-view` | 56 / 56 | 36 / 38 | 3.5 / 3.5 and 2.25 / 2.375 | Barlow Condensed 700 caps |
| `standfirst` | 24 / 32 | 20 / 28 | 1.5 / 2 and 1.25 / 1.75 | Source Serif 4 italic 400 |
| `body` | 17 / 26 | 16 / 24 | 1.0625 / 1.625 and 1 / 1.5 | Inter 400 |
| `body-strong` | 17 / 26 | 16 / 24 | same | Inter 500 (field labels, buttons) |
| `input` | 16 / 24 | 16 / 24 | 1 / 1.5 | Inter 400. Never below 16px (stops iOS zoom on focus) |
| `helper` | 14 / 20 | 14 / 20 | 0.875 / 1.25 | Inter 400, `muted` |
| `label-tab` | 14 / 16 | 14 / 16 | 0.875 / 1 | Barlow Condensed 700 caps, tracking +6% |
| `data-stub` | 20 / 28 | 20 / 28 | 1.25 / 1.75 | JetBrains Mono 500 tabular |
| `data-label` | 14 / 20 | 14 / 20 | 0.875 / 1.25 | JetBrains Mono 500 tabular |
| `data-code` | 32 / 40 | 28 / 36 | 2 / 2.5 and 1.75 / 2.25 | JetBrains Mono 500, one digit per cell |

Minimum text size anywhere is 14px. Measure for any paragraph is 66 characters at most.

## Spacing and layout

- Base unit 4px. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Grid: 4 columns on mobile (page margin 16px, gap 16px), 12 columns from 768px (page margin 32px, gap 24px). Content width caps at 1200px; the sealed ticket caps at 960px wide; form boxes sit in a 6-column (about 560px) centred column.
- Inside a ruled box: 24px padding (20px at 360px wide), 16px between fields, 24px between a field group and the box's action row.
- Touch targets: 48px minimum height for inputs and buttons, 56px for the Yes / Maybe / No tiles and the code cells, 8px minimum between targets (WCAG 2.2 target size minimum is 24px; we exceed it).
- Breakpoints (Tailwind defaults): 640, 768, 1024, 1280. Design holds at 360, 390, 768 and 1440.

## Rules, borders, radius, shadow

| Token | Value |
|---|---|
| `rule` | 1px solid `ink`: every ruled box, input, tile and the ticket frame |
| `rule-active` | 2px (inset shadow, no layout shift): focused box, selected tile, hovered tab |
| `radius-0` | 0: ticket, boxes, inputs, buttons, tiles, tabs (print is square) |
| `radius-mark` | 2px: the stamp, the "optional" and "MAYBE" tags |
| `radius-full` | 50%: only the perforation punches and the radio dot |
| `shadow` | None. Cards with shadows are rejected; rules do the grouping |
| `grain` | Static SVG noise at 4% opacity, on the ticket and stub only; removed under `forced-colors` |
| `stamp` | Rotated -4deg, 2px `red` border plus a 1px inner rule, `data-stub` caps text in red on transparent; the stamp is the only rotated element |

Hierarchy: ticket (largest, framed) > ruled boxes (1px) > fields inside boxes (1px, smaller) > tags (2px radius). No other nesting.

## Motion

Budget: signature (the tear), instant for everyone who asks for reduced motion. Use the `motion` library for the tear and the stamp, CSS for fades and colour. Animate transform and opacity only (never width, height or border-width).

| Token | Duration | Easing | Used for |
|---|---|---|---|
| `fade-view` | 160ms | `cubic-bezier(0.2, 0, 0, 1)` | Crossfade between views |
| `tear-drag` | follows pointer | none (1:1) | Drag along the stub line |
| `tear-finish` | 700ms | `cubic-bezier(0.33, 1, 0.68, 1)` (ease-out cubic, no overshoot) | Completing the tear, from drag or button |
| `tear-cancel` | 200ms | same ease-out | Release before the 35% threshold: stub returns |
| `stamp-land` | 180ms | `cubic-bezier(0.22, 1, 0.36, 1)` (no bounce) | Stamp scales 1.15 to 1 and fades in at -4deg |
| `hint-nudge` | 600ms | `ease-in-out` | One 4px lift of the stub edge after 3s idle, twice at most, then still |
| `tab-fill` | 120ms | `ease-out` | Label tab fill on hover (colour only) |
| `lights-on` | 600ms | `cubic-bezier(0.2, 0, 0, 1)` | One-shot floodlight glow opacity fade-in during the ticket's drop entrance; settles, never loops. Off under reduced motion (glow simply present) |
| `stage-fade` | 160ms | same as `fade-view` | After "Tear open" settles, the night stage cross-fades to `page`; instant under reduced motion |

Decisions that tighten the brief to the direction's "one clean tear, then still":
- Wrong code: no shake. The field rule goes to 2px `status-error` with the alert icon and message (a shake is the one extra movement the direction does not allow, and it is hard on vestibular conditions).
- Verified success: the stamp lands (`stamp-land`) and the stub fades in (`fade-view`). It does not drop in.
- Nothing loops. The resend countdown changes text, not position.

Reduced motion (`prefers-reduced-motion: reduce`): the tear and the hint are removed; a visible "Tear open" button swaps ticket and stub instantly; the stamp appears in place; view changes are instant; focus still moves to the new heading and a live region announces the result. Colour changes (hover fill) stay instant, not animated.

## Z-index and layering

Only two layers: base, and the select popup (`z-10`). No modals, no toasts (status lives inline, where it can be announced and found again).
