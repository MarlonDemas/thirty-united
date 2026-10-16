# Structured picks: save-the-date (Step 4)

Date: 2026-10-14, updated 2026-10-15 for Direction D "Matchday: The Signing".
Stack: web-vite (family: web). On 2026-10-14 the helper was the project-local `ui-ux-pro-max` scripts, run directly, no `--persist`, no `--force` (typography, ux and style domains; `--stack react` and `--stack shadcn`). The 2026-10-15 update did not re-run them: the palette comes from the owner's own reference image, measured, and the faces are unchanged.

## Palette (Direction D, settled by the owner's pick)

The palette is sampled from the owner's reference image 4 ("MAKES 08" under a moonlit sky; `audits/cinematic-audit-2026-10-15.md` section 1) and measured with the WCAG formula. The palette conversation (orchestrator Step 4a) is skipped on purpose: the owner chose the picture, and the picture sets the colours.

- Panel `#18131F` (the poster's night sky), the solid surface for every readable word.
- Moonlight `#B7D3FA`, the one cold colour: muted text, rings, focus.
- Shirt red `#9F0B19`, the only button fill (white on it 8.28:1), always with a 2 px moonlight ring (it is 2.20:1 on the panel).
- Poster red `#F81E24`, in the scene only: the "UNITED" lockup, the Yes stamp, decoration.
- Error `#FF9E8F`, always with an icon.

Every value, the derived neutrals and every measured pair are in `tokens.md`. Cliché guard: dark plus red can drift toward a betting or gaming app, so there is no neon, no glow border and no gold, and red never glows on the UI layer.

## Font pairing check (Direction D keeps the shipped faces; owner accepted)

Faces: Barlow Condensed 700 (display), Source Serif 4 italic 400 (standfirst), Inter 400/500 (body), JetBrains Mono 500 (data), plus SVG brush lockups for "THIRTY" and "UNITED" (no font file ships).

- No catalogue entry matches the four-face set (2026-10-14 run), so there is no pairing ID to record. Nearest entries: "Sports/Fitness" (Barlow Condensed headings) and "Minimalist Monochrome Editorial" (Source Serif 4 with JetBrains Mono).
- Barlow Condensed 700 now also letters the guest's name and number on the shirt and the poster's fixture line. It is close in spirit to the heavy condensed grotesque of the owner's MATCHDAY reference and covers accented names, which no brush font was confirmed to do.
- Inter, not Barlow, for body: it stays more legible at 16 to 17 px for guests aged up to 70, now on a dark panel.
- Cost: nothing new to load. The title lockups are SVG paths, so their font never ships and its accent coverage does not matter.
- Role split: display for panel headings, chips, group labels and scene type; serif for one standfirst line per beat at most; mono for numerals and the email address only.

## Top 5 UX rules to apply

1. **Forms: visible label above every field, no placeholder-only labels.** (UX: Form Labels, Input Labels; shadcn: `Field` + `FieldLabel`.) Optional fields carry a muted "optional" tag.
2. **Forms: specific inline error under the field, tied with `aria-describedby`, announced with `role="alert"` or a live region; after a failed submit, move focus to the first invalid field.** (UX: Error Placement, Error Messages, Inline Validation, Focusable Error Summary.) Keep the guest's answers on every failure. As built, fields revalidate on change after a failed submit (see `feedback.md`).
3. **OTP entry: one real input with `autocomplete="one-time-code"` and `inputmode="numeric"`, paste of six digits (spaces and dashes stripped), six visual cells, auto-advance and Backspace back.** (UX: Input Types, Mobile Keyboards; detail from `edge-cases.md` C-11 and C-12.) Show the cooldown as a live countdown and name every outcome in a status line. The scene's six lamps mirror the digits; they never show numerals.
4. **Motion: respect `prefers-reduced-motion`, take durations from shared tokens.** (UX: Reduced Motion, Excessive Motion, Duration Timing.) Here that means T0 under reduced motion (nothing loops, every beat swaps to its final state), the Still chip for anyone, one-way brightness changes of 300 ms or more, and no motion on the UI layer beyond the panel's content change and the stamp.
5. **Mobile and keyboard: 48 px targets with 8 px gaps, the right keyboard per field (`email`, `tel`, `numeric`), a visible focus ring on every control, the focused field never hidden by the on-screen keyboard or the panel.** (UX: Touch Target Size, Touch Spacing, Mobile Keyboards, Focus States, Focus Not Obscured.) With the keyboard open, the shot reframes to the shirt strip and the panel scrolls the focused field into view.

Also applied: disable the submit button and show a loading state while sending, to stop double submits (UX: Loading Buttons, Submit Feedback); prefill known answers after a re-verify so "Change my answer" is not re-typing (UX: Redundant Entry).

## Stack notes (`--stack react`, `--stack shadcn`, 2026-10-14)

- shadcn: use `Field` + `FieldLabel` + `FieldError` for structure; React Hook Form integration uses `Controller` inside a native form (matches the installed `react-hook-form` and `@hookform/resolvers`).
- react: "Label form controls" (`htmlFor` matches input `id`). The `--stack react "animation reduced motion"` query returned no entries; reduced-motion handling follows the web UX rule above and `tokens.md`.
