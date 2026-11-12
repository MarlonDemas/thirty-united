---
name: direction-supplement
schemaVersion: "1.0"
clientName: thirty-united
surface: plain-invitation
extends: direction.md
chosenDirection: D
decidedAt: 2026-11-05
decidedBy: owner (final)
referenceSet: .specno-design/references/plain-invitation-2026-11-05.md
---

# Direction supplement: the plain invitation

Adds one surface to Direction D. It does not change D, the tokens or the binding REJECTED and CORRECTION entries in `feedback.md`. Where this file is silent, D and `src/matchday/config.js` apply. Event facts come only from `EVENT` in `config.js`: title "Makes turns 30", date "Monday 21 December 2026", venue "Venue TBA", host "Makes". No time, address or club name is added.

## What changes

Every guest, on every device, lands on this page first. The 3D game no longer loads on arrival; it loads only when the guest presses "Play the match". "Just reply" opens the existing `fallback.js` form. The old top-left "Just reply" chip (`#fastlink`) is not used on this page.

## Signatures (owner picked three, nothing else)

1. **The first screen** is a small spaced-caps date and venue line above one large "Makes turns 30". Nothing else is on it.
2. **The matchday card** carries the facts as labelled rows (who, what, when, where) before any button.
3. **The capsule** holds two equal halves, "Play the match" and "Just reply": same size, same fill, split by a hairline.

Not adopted: a pinned bottom bar, a bordered "Your reply" box, a cover image, add-to-calendar, share, emoji.

## Layout and scroll order

One centred column, no second column at any width. The page is `#inv`, `position:fixed; inset:0; overflow:auto`, on `ink-950` (the same pattern as `#fb`). Padding is 24px (20px at 360px or less) plus the safe-area insets, 48px at the bottom. The column is `min(480px, 100%)`.

Order, top to bottom:

1. **Hero** (`min-height:56svh` on phones, `40svh` from 1024px; content centred both ways).
   - Date line: `DATE_LINE` ("Monday 21 December 2026 · Venue TBA"), `caption` style, uppercase, tracking .14em, `fog-300`. It may wrap.
   - `<h1>` `EVENT.title`, centred, weight 800, tracking -.02em, `text-wrap:balance`. Size 32/34 on phones and 44/46 from 768px.
2. **Card** (`<section>` with a visually hidden `<h2>` "The details", then a `<dl>`). 24px below the hero.
3. **Reply group**: `<h2>` "Your reply" as a kicker (`caption`, uppercase, `fog-300`), 24px below the card, then the capsule 8px under it.

At 390x844 the first screen shows the date line and the title, with the top edge of the card peeking in, which is the cue to scroll. At 1440x900 the card and capsule also fit on the first screen. Nothing is fixed or sticky.

## Tokens (existing only)

Spacing is the 4, 8, 12, 16, 24, 32, 48 scale. Colour, type, radius and motion are read from `THEME` as the `--*` variables.

| Part | Tokens |
|---|---|
| Page | `ink-950`, `text`, `text-muted` (`fog-300`) |
| Card | fill `paper-100`, values `paper-ink`, labels `paper-muted`, row rules 1px `paper-rule`, `radius-2`, no shadow, straight edges (no deckle, no perforation) |
| Card type | labels `bodySm` 13/18/500; values `label` 15/20/600 |
| Capsule | fill `primary`, hover `primary-hover`, pressed `primary-pressed`, 2px `fog-300` outer ring, 1px `fog-300` divider, `radius-pill`, label `label` 15/20/600 in `#fff` |
| Focus | `focus-outer` outline 2px, offset 2px, `focus-inner` halo (the global `:focus-visible` rule) |
| Motion | `--dur-fast` and `--ease-out` for the colour changes only |

## Card copy

| Label | Value |
|---|---|
| Who | `EVENT.host` ("Makes") |
| What | `EVENT.tagline` ("Thirty feels like half time. Come for the oranges.") |
| When | `EVENT.date` ("Monday 21 December 2026") |
| Where | `EVENT.venue` ("Venue TBA") |

Labels are literally "Who", "What", "When", "Where". Each row is a `dt` (88px column) and a `dd`, 12px vertical padding. No kick-off time row until `EVENT` has one.

## Venue TBA

It must read as a settled line, not a hole. The Where row uses the same type, weight and `paper-ink` colour as the other values, never muted, italic or in brackets, and has no question mark or note. A dashed `map-pin` (lucide, 20px, stroke 1.5, `aria-hidden`) sits before the text, the alias already in DESIGN.md section 8. The dashed pin shows only while `EVENT.venue === 'Venue TBA'`; a real venue gets the solid pin and the same row. The date line above the title repeats "Venue TBA" so the fact is never missing from the first screen.

## The capsule

Markup: `<div role="group" aria-labelledby="inv-reply">` holding two real `<button type="button">` elements, in this order: "Play the match", "Just reply". The group's `<h2>` is the label; there is no ARIA tab, radio or toolbar role. Both halves are `flex:1`, `min-height:56px`, full capsule width (about 171px each at 390). Left half radii `pill 0 0 pill`, right half `0 pill pill 0`. The divider is the right half's 1px left border; the focused half gets `z-index:1`.

| State | Play the match | Just reply |
|---|---|---|
| Default | `primary` fill, white label | identical |
| Hover | `primary-hover` | same |
| Focus-visible | global focus ring, outside the half, clearly drawn over the divider | same |
| Pressed | `primary-pressed` | same |
| Loading (after the press, while three.js downloads) | label becomes "Opening the gates…" (the existing boot string), `aria-disabled="true"`, `aria-busy="true"`, presses ignored, focus stays on it; a `role="status"` live region carries the same text | stays enabled |
| Failed (load error or the 20 s limit) | not shown: the page hands over to the form (below) | n/a |

The halves never differ in size or fill, in any state. "Disabled while the game loads" is applied to the Play half only, because the guest must always be able to change their mind and reply. Use `aria-disabled`, not `disabled`, so focus is not lost. There is no progress bar: the dynamic import gives no progress, so the loading state is the label alone.

Narrow or zoomed (below 360 CSS px, or 200% text making a label wrap to three lines): the halves stack, each full width, `radius-3`, the divider becomes a horizontal 1px `fog-300` line. Labels wrap; heights grow with `min-height`, never `height`.

## Reduced motion

This page has no entrance animation, parallax, loop or transition beyond the colour change on hover and press. Under `prefers-reduced-motion: reduce`, `--dur-fast` is 0, so that change is instant. The loading state is text only and needs no change. The handover is already instant (below). Under forced colours the capsule keeps its borders in `ButtonText`, the fill is dropped, and the card uses system colours.

## Accessibility

- Targets: both halves are 56px tall, far above 44px, and at least 8px from anything else tappable.
- Text: 200% zoom reflows with no horizontal scroll and no clipped text; the hero grows, the card rows wrap, the capsule stacks as above. Holds at 320 CSS px.
- Contrast (re-measure in verify): white on `primary` about 8.3:1; `paper-ink` on `paper-100` about 15:1; `paper-muted` on `paper-100` about 6.9:1; `fog-300` on `ink-950` well above 4.5:1; the capsule's `fog-300` edge on `primary` and on `ink-950` is above 3:1.
- Headings: `h1` title, `h2` "The details" (hidden), `h2` "Your reply". One `h1`, no skipped level. `<main>` wraps all three. `lang="en"` is already set.
- The page is operable by Tab, Enter and Space alone. It has no dialog, cookie banner or privacy notice; the privacy notice stays in the form, before any personal field.

## Handover to the game

On "Play the match": set the loading state, then `import('./game.js')` with the same 20 s limit and WebGL2 check that `main.js` has today, moved from page load to this press. When the import resolves, remove `#inv` in the same frame. No fade or wipe: the game's own 400ms `world-reveal` runs on top of the same `ink-950`, and DESIGN.md forbids page fades between beats. Focus and the live region follow the game's existing behaviour.

## Handover to the reply

On "Just reply": call `showFallback('plain')`. It stops anything running, clears `#ui` and shows the existing card with the form, with focus on the card heading. The swap is instant. If the game is still downloading, the existing guard in `main.js` stops it drawing over the form. If the game fails (no WebGL2, load error, 20 s limit), the same call runs with `'load-failed'` and the form appears with one status line above it: "The game didn't load. You can reply here instead." The form, the code card, the closed message and the confirmation are untouched.

Because the invite's `<h1>` is gone after the swap, the fallback card heading must become an `<h1>` so the page still has one.

## A guest who has already replied

They see the same invitation, with no change to the card or capsule. "Just reply" shows their existing confirmation, as `fallback.js` does through `getSent()`. If replies are closed or the link has no key, "Just reply" shows `closedText()` in the existing closed card. Note: `sent` lives in memory only, so this holds within one visit; after a reload the guest sees the invitation and a fresh form.

## Never

A pinned or floating bar over the facts, a hero reveal that holds the date back, a cover image with text baked in, a dialog on arrival, emoji in the capsule, any visual difference between the two halves, a deckled or torn card edge, and any fact not in `EVENT`.
