# Verify report: save-the-date (web-vite, Direction A) 2026-10-14

Screenshots + scripts: /private/tmp/claude-501/-Users-makes-Documents-proj/27e5ff09-dff7-4334-ae7d-5ebd54ee89be/scratchpad/shots/ (flow*.mjs alongside). Local Convex + mock mail, desktop 1440 / tablet 768 / mobile 390.

Result: no anti-slop or Signature blocker. 0 axe violations (wcag2a/aa/21aa/22aa) in 26 states. 0 console errors. tsc clean, vitest 186/186.

## Findings (ranked)
MUST-FIX
1. Layout shift on blur swallows the first click (src/components/DetailsView.tsx:61 reValidateMode "onBlur" + FieldError mount/unmount). After a failed submit, fixing First/Surname then clicking Football (or Email radio) lands on a moved target: radio stays unchecked. Reproduced on desktop and mobile. Also stale error "Pick football or another sport" stays after Football is chosen.
2. Offline-queued verify: Convex client replays the action after reconnect. UI said "Couldn't confirm. Try again" (CodeView.tsx verify_failed) but RSVP was saved; retry shows "We don't have a code for that email". Guest believes it failed. Handle no_code after verify_failed/timeout as "possibly saved" (CodeView.tsx:~150-190 / InvitePage.tsx).
3. index.html:6,7: viewport lacks viewport-fit=cover (safe-area CSS in index.css is inert, edge-case D-3 WILL); title is "thirty-united"; no robots noindex, no og:image (brand.md says noindex + OG image).
POLISH
4. No stub, mobile: diagonal void line (StubView.tsx:91-93) strikes through the guest name; long surnames break mid-word (FEATHERSTO/NEHAUGH, [overflow-wrap:anywhere]; use break-word + hyphens).
5. Locked code (too many tries): resend stays disabled until the 60s cooldown from the first send ends; edge table says enabled immediately.
6. Focus lands on h1 in code view (edge table says code input); keyboard users need one Tab (acceptable per brand.md, reconcile docs).
7. Button focus ring flashes pale for ~150ms (outline-color transition on shadcn button); settled ring is red 3px.
8. Code-view label tab mid-transition grey text on focus (120ms), cosmetic.
9. Production CSP (netlify.toml style-src without unsafe-inline) not testable on dev server; run verify on `vite preview`/deploy preview.

## Passes
Contract fonts: Barlow Condensed / Inter / JetBrains Mono / Source Serif 4 italic. Italic serif IS sanctioned (tokens.md Standfirst, brand.md "one serif standfirst", index.css .standfirst) - not drift.
Red only on primary buttons, stamp, focus ring (computed-style audit across states). Stamp never overlaps name/team (3 viewports, long names). Tear 700ms drag+button+touch; reduced motion instant (68ms, no handle). Forced colors OK. 200% text and 320px reflow: no hscroll/clipping. Seat unchanged on update; Yes solid / Maybe outlined stamp / No no-seat. Wrong code "4 tries left", "1 try left", rate-limit countdown, network + slow states, paste with spaces, accents, reload restores answers.
Known accepted: no router/back, reload during code step, mobile table folded, bot protection pending.

## Post-fix re-check (2026-10-14)
Axe wcag2a/2aa/21a/21aa/22aa re-run after the fix loop at 390x844 and 1440x900: 0 violations in all 22 states (sealed, attendance, details empty / errors after failed submit / fixed, No details, code sent, wrong code, stub Yes/Maybe/No with long names). 0 console errors or warnings. No horizontal scroll on long-name stubs. After fixing errors, no stale error text remained and Football stayed checked (both viewports).
Script: scratchpad/recheck.mjs; screenshots: scratchpad/shots/recheck-{desktop,mobile}-*.png.
