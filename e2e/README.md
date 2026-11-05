# E2E tests (Playwright)

End-to-end tests for the RSVP world. They drive the real page against the **local** Convex deployment with mock mail.

## Run

1. Start the local backend (needs Node 22 or 24 on PATH for the "use node" actions) and leave it running:
   `npx convex dev` — its banner must say `[Local] Port 3210 ... http://127.0.0.1:3210`. If it names a cloud deployment, stop.
2. The local deployment needs `MAIL_PROVIDER=mock`, `MAIL_ALLOW_MOCK=true`, `OTP_PEPPER` and `INVITE_KEY`
   (check names with `npx convex env list --names-only`).
   Set the invite key to the test default: `npx convex env set INVITE_KEY e2e-local-invite-key`
   (or export `E2E_INVITE_KEY` to whatever the local deployment uses). Never use a production key.
3. Name-only declines need `DECLINES_OPEN=true` on the **local** deployment: `npx convex env set DECLINES_OPEN true` (run it against the local deployment only; with it unset, `declines:submitDecline` answers `service_unavailable`).
4. `pnpm test:e2e` (starts `pnpm dev --port 5173` itself, or reuses a running one).

The codes come from `[mail:mock] code for <email>: <code>` lines in `npx convex logs` (`mail-code.ts`).

## Specs

| File | Covers |
| --- | --- |
| `world-yes-maybe.spec.ts` | new YES via JUST REPLY (SIGNED, seat, poster dialog image, .ics `DTSTART;VALUE=DATE:20261221` + `SUMMARY:Makes turns 30`); same email as MAYBE (Welcome back, same seat) |
| `world-decline.spec.ts` | "Can't make it" asks "Have you replied before?". **No, first time** (fast lane): name-only notice wording, no email field, "Noted, <first>" / "You'll be missed..." with no seat, poster or calendar, and the row exists (`admin:getDecline`). **Yes, use my email**: email + code, "Noted, <first>". **AWAY END kiosk, name-only**: flow stage `awayEnd`, lights 0.45, `dejected` pose, then the confirmation. A reason with a link: inline message, zero `declines:submitDecline` calls. Failure copy (`rate_limited`, `service_unavailable`, "Try again"), with the action response mocked because the real limits can't be triggered safely. WebGL blocked: the fallback page completes a name-only decline |
| `world-invite-key.spec.ts` | missing `?k=` (closed intro); wrong `?k=` (closed after the code request) |
| `world-code-card.spec.ts` | wrong code then right code; resend cooldown (client countdown and server "A code went out a moment ago") |
| `world-validation.spec.ts` | YES without team / surname: inline message, zero Convex calls |
| `world-fallback.spec.ts` | WebGL blocked: fallback page completes a YES |
| `world-asset-failure.spec.ts` | one texture request aborted: the fast-lane page appears (no hang on the loading screen) |
| `world-walk.spec.ts` | HOME END walk: kiosk, stations 2-4 via their skip buttons, full time, code card, sign |

## Notes

- Decline tests use a letters-only unique surname each (`uniqueSurname` in `helpers.ts`) and, in `afterEach`, call `admin:deleteDecline` (row plus that name's limiter bucket) and `admin:resetDeclineLimits` (global bucket), via the helpers in `mail-code.ts`. The backend allows 2 declines per name per 24h (further ones silently write nothing), 50 per day and 200 rows, so skipping the cleanup makes later runs fail.
- The fast lane has two radiogroups with a "Yes" option ("Can you make it?" is "Yes"; "Have you replied before?" is "Yes, use my email"): scope clicks by the radiogroup's accessible name (`fillFastLane` does).
- Fields hidden by the form stay in the DOM: assert `toBeHidden()`, not `toHaveCount(0)`.
- Mobile viewport 390x844 with touch. Every test uses its own `e2e+<timestamp>-<pid>-<n>-<tag>@example.com`; tests that request codes reset that email's limits in `afterEach`/`afterAll`.
- `helpers.ts` passes the GPU flags `scripts/capture.mjs` uses (`--use-angle=metal ...`). Without them headless Chromium renders the world with software GL at about 1 fps and clicks time out. Off macOS, Chromium falls back to SwiftShader and the specs will be slower.
- The walk spec uses the dev-only `window.__dbg.flow` hooks (`skip`, `teleport`, `state`) to advance the world's sim clock deterministically, never real-time sleeps or pixel steering. It does not play the challenges themselves (ticket, dribble, corner, penalty); each is finished through its visible Skip button. The forms, arrival, gate, walk-out, full time and code card run for real.
- Code expiry (10 minute TTL) is not tested here: it is covered by the Convex unit tests (`convex/rsvp.test.ts`, `convex/rsvpFlow.test.ts`) and would need a 10 minute wait.
- `--workers=3` (in the `test:e2e` script) keeps the GPU-bound pages from starving each other.
