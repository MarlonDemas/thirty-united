# Design review: poster thumbnail (lux move 6), 2026-10-22

Scope: uncommitted diff on feat/poster-thumbnail (src/poster/SavePoster.tsx:99-132). Code- and contract-level review only; no visual capture (T3 panel needs a production RSVP). Beside layout is owner-approved and not reviewed.
Labels: [A] from code/contract arithmetic, [I] inferred, not rendered.

Result per dimension: accessibility GREEN; usability AMBER; communication GREEN; platform fit AMBER; tokens and drift GREEN; direction conformance GREEN.

Findings (ranked)
1. AMBER SavePoster.tsx:99,101. Panel height grows 48 px where Share is absent (Android WebView, no navigator.share). Column is 48+12+20=80 px, thumb is 128 px, items-center centres the column. With Share the column is ~140 px, so no growth. tokens.md Spacing: panel 40-45% of viewport (362/844 = 42.9%). Fix: accept, or crop the thumb to 72x112 object-cover [A].
2. AMBER SavePoster.tsx:99-101. Layout shift when the poster finishes drawing: the thumb mounts, the buttons narrow by 88 px and the label may re-wrap, and the column jumps in the no-Share case. Fix: reserve the 72x128 slot at mount (an empty box, no fill, no border) so only the image appears.
3. AMBER SavePoster.tsx:117,126 (button.tsx:8 base is whitespace-nowrap). Wrapped labels are left-aligned: inline-flex centres the item, not its lines. Fix: add text-center beside whitespace-normal (link variant already pairs text-left). At 200% text the label is ~250 px against ~178 px available, so wrapping is the normal case; min-h-12 is 3rem, so each button is ~96 px [A]. Column ~330 px against a 128 px thumb: the thumb floats mid-column and the panel scrolls inside itself, which the contract allows (never clips).
4. LOW SavePoster.tsx:100. The thumb is a dead tap target: a 72 px poster beside "Save your poster" reads as tappable. Fix: leave it (lux note requires aria-hidden) or, if testing shows dead taps, make it a second hit area for the Save handler without exposing it to AT (onClick only, no role). Owner call.
5. LOW SavePoster.tsx:100. Frameless edge is unverified [I]: a dark night poster on panel #18131F may dissolve at its edges (no line token fits; radius-0 and no shadow are met, tokens.md rule table). Check on a real capture before adding anything; if it dissolves, the only token-legal answer is a 1 px `line` rule, which breaks "no frame". Prefer leaving it.
6. LOW SavePoster.tsx:99-132. Child blocks are not re-indented after the new wrapper div. Cosmetic.
7. LOW 360 px width: label room is ~156 px (320-88-48-28); "Making your poster…" is ~150 px [I], so it is borderline; whitespace-normal covers it.

Pass: gap-4/gap-3 sit on the 4 px scale; radius 0 matches radius-0; no shadow; no motion, so reduced motion is moot (no transition added; button base already has motion-reduce); alt="" plus aria-hidden is redundant but correct, the viewer carries posterAlt; thumb reuses poster.url (no extra draw, no shared import, so first-paint JS is unchanged); the focus ring (3 px, offset 2) has room inside the 24 px panel padding; forced-colors shows the thumb as an image, harmless.
