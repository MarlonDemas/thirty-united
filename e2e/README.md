# E2E tests (Playwright)

End-to-end tests for the RSVP world. They drive the real page against the **local** Convex deployment with mock mail.

## Run

1. Start the local backend (needs Node 22 or 24 on PATH for the "use node" actions) and leave it running:
   `npx convex dev` — its banner must say `[Local] Port 3210 ... http://127.0.0.1:3210`. If it names a cloud deployment, stop.
2. The local deployment needs `MAIL_PROVIDER=mock`, `MAIL_ALLOW_MOCK=true`, `OTP_PEPPER` and `INVITE_KEY`
   (check names with `npx convex env list --names-only`).
   Set the invite key to the test default: `npx convex env set INVITE_KEY e2e-local-invite-key`
   (or export `E2E_INVITE_KEY` to whatever the local deployment uses). Never use a production key.
3. `pnpm test:e2e` (starts `pnpm dev --port 5173` itself, or reuses a running one).

The codes come from `[mail:mock] code for <email>: <code>` lines in `npx convex logs` (`mail-code.ts`).

## Specs

| File | Covers |
| --- | --- |
| `world-yes-maybe.spec.ts` | new YES via JUST REPLY (SIGNED, seat, poster dialog image, .ics `DTSTART;VALUE=DATE:20261221` + `SUMMARY:Makes turns 30`); same email as MAYBE (Welcome back, same seat) |
| `world-decline.spec.ts` | new AWAY: "Noted, <first>", no seat, poster or calendar |
| `world-invite-key.spec.ts` | missing `?k=` (closed intro); wrong `?k=` (closed after the code request) |
| `world-code-card.spec.ts` | wrong code then right code; resend cooldown (client countdown and server "A code went out a moment ago") |
| `world-validation.spec.ts` | YES without team / surname: inline message, zero Convex calls |
| `world-fallback.spec.ts` | WebGL blocked: fallback page completes a YES |
| `world-asset-failure.spec.ts` | one texture request aborted: the fast-lane page appears (no hang on the loading screen) |
| `world-walk.spec.ts` | HOME END walk: kiosk, stations 2-4 via their skip buttons, full time, code card, sign |

## Notes

- Mobile viewport 390x844 with touch. Every test uses its own `e2e+<timestamp>-<pid>-<n>-<tag>@example.com`; tests that request codes reset that email's limits in `afterEach`/`afterAll`.
- `helpers.ts` passes the GPU flags `scripts/capture.mjs` uses (`--use-angle=metal ...`). Without them headless Chromium renders the world with software GL at about 1 fps and clicks time out. Off macOS, Chromium falls back to SwiftShader and the specs will be slower.
- The walk spec uses the dev-only `window.__dbg.flow` hooks (`skip`, `teleport`, `state`) to advance the world's sim clock deterministically, never real-time sleeps or pixel steering. It does not play the challenges themselves (ticket, dribble, corner, penalty); each is finished through its visible Skip button. The forms, arrival, gate, walk-out, full time and code card run for real.
- Code expiry (10 minute TTL) is not tested here: it is covered by the Convex unit tests (`convex/rsvp.test.ts`, `convex/rsvpFlow.test.ts`) and would need a 10 minute wait.
- `--workers=3` (in the `test:e2e` script) keeps the GPU-bound pages from starving each other.
