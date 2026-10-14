# Verify report: sealed-screen stadium stage and 3D ticket, 2026-10-14

Local dev server (`pnpm dev`, port 5173), headless Chromium with SwiftShader WebGL, axe-core 4.x tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa. The RSVP form was never submitted ("Send my code" not pressed). Screenshots: scratchpad `pixel-verify/`.

States scanned at 390x844 and 1440x900: sealed 3D, sealed DOM fallback (WebGL disabled), sealed with `prefers-reduced-motion`, sealed with `forced-colors`; after "Tear open" (attendance) and the details form after Continue. Returned stub not reached (needs a submit).

## Result
- 3D, DOM fallback and reduced motion: attendance 0 violations, details form 0 violations. Sealed: 1 `color-contrast` (serious) on the footer in each, an axe artefact: axe reads the body `#E8E0CF` because the stage is a fixed `aria-hidden` layer. Measured on screenshot pixels, the footer is paper on `scene-pitch-lit` `rgb(42, 74, 49)`, 8.49:1, as the contract states.
- forced-colors: 1 to 2 `color-contrast` per state, all authored colours that forced colors overrides (screenshot renders black on Canvas, white button with border). Treated as artefacts; not counted as defects.
- Console: one deprecation warning (`THREE.Clock`) in 3D; none elsewhere. Netlify badge CSP errors are accepted by the owner and do not appear on the dev server.

## Defect
- HIGH: a failed load of the lazy 3D chunk replaces the sealed screen with the "Something slipped" boundary and removes "Tear open". "Try again" does not recover. `src/components/SealedView.tsx:19` (lazy import) and `:395-408` (Suspense with no error boundary). The lanyard spec section 5 says a chunk error steps down silently to the DOM ticket.
