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
| Theme | Light and dark | Light only, `color-scheme: light`; the `.dark` block in `src/index.css` is removed | Paper is the material of the Signature; owner decision 2026-10-14 |
| Radius | `--radius: 0.625rem` | `--radius: 0` plus a 2px `radius-mark` for stamp and tags | Print is square |
| Shadows and cards | `Card` with border and shadow | No `Card`, no shadows. A `RuledBox` (1px ink rule, label tab) does the grouping | Direction A |
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

## Bespoke components (no shadcn equivalent)

`Ticket` (sealed and filled states), `TearHandle`, `Stub`, `Stamp`, `RuledBox`, `StatusLine`, `AttendanceChoice`, `OtpField` with `ResendTimer`. The breakdown and props are in `.specno-design/edge-cases/save-the-date.md`.

## Never

Official club crest, wordmark or kit; confetti, balloons or gold foil; shadowed cards; red fills beyond the primary button; toasts; a dark theme.
