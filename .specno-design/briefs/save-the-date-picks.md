# Structured picks: save-the-date (Step 4)

Date: 2026-10-14
Stack: web-vite (family: web). Helper: project-local `ui-ux-pro-max` scripts, run directly, no `--persist`, no `--force`.
Queries run (typography, ux, style domains; `--stack react` and `--stack shadcn`) are summarised below. One query returned nothing and is logged.

## Palette (settled, not re-run)

Palette A "Matchday Paper" is already chosen by the owner and is Direction A's colour thesis: paper `#F3EDE1`, ink `#1B1A17`, red `#B3261E` (stamp and primary action only). Values and derived neutrals are in `tokens.md`. The palette conversation (orchestrator Step 4a) is skipped on purpose.

The style search for "warm paper ink print editorial" returned `e-ink-paper` with dark mode "not-recommended", which supports the owner's light-only decision. Its "sharp transitions (no fade)" note does not apply; Direction A keeps 160ms fades.

## Font pairing check (Direction A's faces)

Faces: Barlow Condensed 700 (display), Source Serif 4 italic 400 (standfirst), Inter 400/500 (body), JetBrains Mono 500 (data).

- No catalogue entry matches the four-face set, so there is no pairing ID to record. Nearest entries: "Sports/Fitness" (Barlow Condensed headings, paired there with Barlow body) and "Minimalist Monochrome Editorial" (Source Serif 4 with JetBrains Mono).
- Deliberate deviation: Inter, not Barlow, for body. Inter stays more legible at 16 to 17px for guests aged up to 70, and its tabular figures are on hand for non-mono numbers.
- Catalogue caution on JetBrains Mono (weight 400, no bold) is for terminal styling; we use 500 at 14 to 20px for numerals, which stays within that spirit.
- Cost and risk: four families, five files. Mitigation is in `tokens.md` (latin subset, `swap`, size-adjusted fallbacks). The role split is strict: display only for the ticket title, headings and tabs; serif only for one standfirst line per view; mono only for numerals and the email address.
- Verdict: pairing holds. Condensed caps against a serif italic is a classic programme contrast and the two never sit on the same line.

## Top 5 UX rules to apply

1. **Forms: visible label above every field, no placeholder-only labels.** (UX: Form Labels, Input Labels; shadcn: `Field` + `FieldLabel`.) Optional fields carry a muted "optional" tag.
2. **Forms: specific inline error under the field, tied with `aria-describedby`, announced with `role="alert"` or a live region, validated on blur; after a failed submit, move focus to the first invalid field.** (UX: Error Placement, Error Messages, Inline Validation, Focusable Error Summary.) Keep the guest's answers on every failure.
3. **OTP entry: one real input with `autocomplete="one-time-code"` and `inputmode="numeric"`, paste of six digits (spaces and dashes stripped), six visual cells, auto-advance and Backspace back.** (UX: Input Types, Mobile Keyboards; the helper has no OTP entry, so the paste and autofill detail comes from `edge-cases.md` C-11 and C-12.) Show the cooldown as a live countdown and name every outcome in a status line.
4. **Motion: respect `prefers-reduced-motion`, animate one or two key elements per view, take durations from shared tokens.** (UX: Reduced Motion, Excessive Motion, Duration Timing.) Here that is the tear and the stamp only, plus 160ms fades.
5. **Mobile and keyboard: 48px targets with 8px gaps, the right keyboard per field (`email`, `tel`, `numeric`), visible focus ring on every control, keep the focused field unobscured by the on-screen keyboard or sticky UI.** (UX: Touch Target Size, Touch Spacing, Mobile Keyboards, Focus States, Focus Not Obscured.)

Also applied: disable the submit button and show a loading state while sending, to stop double submits (UX: Loading Buttons, Submit Feedback); prefill known answers after a re-verify so "Change my answer" is not re-typing (UX: Redundant Entry).

## Stack notes (`--stack react`, `--stack shadcn`)

- shadcn: use `Field` + `FieldLabel` + `FieldError` for structure; React Hook Form integration uses `Controller` inside a native form (matches the installed `react-hook-form` and `@hookform/resolvers`).
- react: "Label form controls" (`htmlFor` matches input `id`). The `--stack react "animation reduced motion"` query returned no entries; reduced-motion handling follows the web UX rule above and `tokens.md`.
