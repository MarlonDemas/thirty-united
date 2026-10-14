---
name: components
schemaVersion: "1.0"
profileVersion: "1.0.0"
clientName: thirty-united
stack: web-vite
direction: A
lastUpdated: "2026-10-14"
---

# Components: Thirty United

Divergences only. The code is the source of truth for the components themselves; this file records what differs from the `web-vite` profile and from shadcn defaults.

## Layout primitive (from Direction A)

A ruled-box grid. The ticket sits in a 1px ink frame like a programme cover. Every later view is a stack of ruled boxes (one per question group) on a 4-column mobile / 12-column desktop grid, each with a small caps label tab on its top rule. Cards with shadows are rejected; rules group things.

## Divergences

| Area | Profile or shadcn default | This project | Why |
|---|---|---|---|
| Primitive library | shadcn/ui with Radix | shadcn `base-nova` style on Base UI (`@base-ui/react`, per `components.json`) | Already scaffolded. Use the Base UI idioms (`render` prop, no `asChild`) |
| Theme | Light and dark | Light only, `color-scheme: light`; the `.dark` block in `src/index.css` is removed. One scoped exception: the sealed screen has a night stage (see "Sealed-screen stage" below). It is a painted layer, not a theme, and no other view uses it | Paper is the material of the Signature; owner decision 2026-10-14. The stage is an owner-approved amendment of the same day |
| Radius | `--radius: 0.625rem` | `--radius: 0` plus a 2px `radius-mark` for stamp and tags | Print is square |
| Shadows and cards | `Card` with border and shadow | No `Card`, no shadows. A `RuledBox` (1px ink rule, label tab) does the grouping. One exception: the ticket and stamp may carry one soft contact shadow (down and to the right) and one light-driven sheen from the upper left. Curl and fold gradients stay out, and no other surface gets a shadow or gradient | Direction A. The exception is an owner amendment of 2026-10-14; Direction B's ink bleed, letterpress text-shadow, deckled edge and shadowed perforation stay rejected |
| Fonts | Geist Variable | Barlow Condensed, Source Serif 4, Inter, JetBrains Mono | `tokens.md` typography. Packages are a build dependency |
| Colour use | `primary` anywhere | Red only on the stamp, the primary action and the focus ring | Direction A colour thesis |
| Icons | lucide | lucide (`icons.md`) | Already set in `components.json`; stroke 1.5px at 20px and 24px to match the 1px rules |
| Plus-one toggle | `Switch` | `Checkbox` (square) with a user-plus icon | A pill switch breaks the "no pills" print language |
| Attendance | `RadioGroup` default dots | `RadioGroup` styled as three equal 56px ruled tiles (icon, word); selected tile gets ink fill, paper text and a filled icon | Brief: three equal choices, not colour alone |
| Code entry | One input per digit | One real input (`autocomplete="one-time-code"`, `inputmode="numeric"`, 6 chars) with six visual cells (`input-otp`, via the shadcn `input-otp` component; needs a package add) | Paste, autofill and screen readers work on one input |
| Feedback | Toast (`sonner`) | No toasts. Inline status line in a live region | Toasts vanish before a screen reader or slow reader finds them |
| Focus | Thin ring, `ring-ring/50` | 3px red ring, offset 2px, plus the owning box thickening to 2px | Direction A hover and focus identity |
| Hover | Subtle background | Label tab fills ink, text flips to paper; controls fill ink on hover where they are secondary | Direction A |
| Forms | Any | `react-hook-form` with `Controller` and shadcn `Field`, `FieldLabel`, `FieldError`; `zod` resolver (already installed) | shadcn guidance for the installed stack |

## Sealed-screen stage

The sealed screen only. The guest sees the ticket hanging on a lanyard they can grab, swing and fling, in front of a drawn night stadium ("Floodlit Night Stand"). After "Tear open" the stage fades to the `page` paper colour and the DOM ticket takes over. The attendance, details, code and stub views stay on light paper, and the returned stub stays on paper.

- **Scope:** the scene tokens (`scene-*` in `tokens.md`) apply to the sealed state only. Every other surface keeps the light theme and the no-shadow rule.
- **Contents:** the backdrop carries no photo, crest, wordmark, kit or red.
- **Button and focus on the stage:** "Tear open" carries a 2px `paper` outer ring. The focus ring is 3px red, offset 2px, plus a 2px `paper` ring outside it, scoped to a `.stage` ancestor. The strap has paper stitching and paper caps. These are contrast fixes (red alone is 2.86:1 on the night), not clutter.
- **Fallbacks:** if WebGL is unavailable, the context is lost, frames are slow or the 3D load fails, the drawn backdrop stays and the flat DOM ticket shows with a CSS contact shadow and sheen. Under `prefers-reduced-motion` the 3D chunk never loads and the backdrop stays static. Under `forced-colors` the 3D chunk never loads and the backdrop is hidden.
- **Spec:** `lux-notes/save-the-date-3d-lanyard-spec.md` and `lux-notes/save-the-date-stadium-build.md`.

## Bespoke components (no shadcn equivalent)

`Ticket` (sealed and filled states), `LanyardTicket`, stage backdrop, Sound tab, `TearHandle`, `Stub`, `Stamp`, `RuledBox`, `StatusLine`, `AttendanceChoice`, `OtpField` with `ResendTimer`. The breakdown and props are in `.specno-design/edge-cases/save-the-date.md`.

- **`LanyardTicket`** (`src/components/three/LanyardTicket.tsx`): the 3D ticket, strap and lights on the sealed screen. It is a lazy chunk, loaded after first paint and never for reduced motion or forced colors. The DOM `Ticket` stays mounted underneath for screen readers and is the fallback. The ticket and stamp contact shadow and sheen apply here and on the DOM fallback only.
- **Stage backdrop** (`.stage-backdrop` in `src/index.css`): the drawn night stadium, `aria-hidden`, on the sealed state only, removed after the fade to paper.
- **Sound tab** (`SealedView.tsx`): an opt-in `button` with `aria-pressed` on the ticket's top rule, "Sound off" by default. It is not rendered under reduced motion and is hidden under forced colors.

## Never

Official club crest, wordmark or kit; confetti, balloons or gold foil; shadowed cards (the ticket and stamp contact shadow is the only shadow); red fills beyond the primary button; toasts; a dark theme (the sealed screen's night stage is the one scoped exception, and it carries no red).
