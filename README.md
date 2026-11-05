# Thirty United

The invite-only RSVP for Makes's 30th: Monday 21 December 2026, venue TBA. Guests walk through a vanilla three.js stadium world to answer, then confirm with a code sent by email. It replaced the React front end, which is still available for [rollback](#rollback).

Backend: [Convex](convex/), called from the browser with `ConvexHttpClient` (`src/matchday/submit.js`). Hosting: Netlify.

## Run it locally

```sh
pnpm install
pnpm dev                # Vite dev server
npx convex dev          # local Convex backend
```

Run `npx convex dev` under Node 24. Node 26 can't run Convex's local backend.

## Checks

| Command | What it checks |
| --- | --- |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | oxlint |
| `pnpm build && pnpm budget` | Production build, then the entry budget: at most 160 kB gzipped (160,000 bytes) |
| `pnpm capture` / `pnpm smoke` | Screenshot sheet and smoke run of the 3D world |
| `pnpm test:e2e` | Playwright end-to-end tests against local Convex. Setup is in [e2e/README.md](e2e/README.md) |

## Where things live

| Path | What is there |
| --- | --- |
| `src/matchday/` | The 3D world: scene, game, stations, cards, fallback page, submit path |
| `src/matchday/config.js` | `EVENT` (details and privacy notice values) and `NOTICE_VERSION` |
| `public/world/` | Unhashed statics for the world (HDR, textures, model, font). Asset credits are in `public/world/CREDITS.md` |
| `src/poster/` | Poster compositor and the Open Graph image (`pnpm og`) |
| `src/lib/` | Shared helpers: API, calendar, keepsake, seat, motion preferences, haptics |
| `convex/` | Backend functions, schema and tests, including the host-only `admin.ts` |
| `scripts/` | Entry budget check, world capture and smoke, Open Graph render, CSV export |
| `index.html` | Root page that loads the world |

Design decisions are in [DESIGN.md](DESIGN.md). The build brief, with the go-live checklist, is [docs/matchday-brief.md](docs/matchday-brief.md).

## Deploys and previews

Configured in `netlify.toml`.

- **Production:** the build runs `npx convex deploy --cmd 'pnpm build'`, so the Convex backend and the front end ship together.
- **Previews** (deploy previews and branch deploys): the build runs `pnpm build` only, with no `convex deploy`. They use the separate dev deployment "previews" (`modest-marten-55`), which has mock mail and its own `INVITE_KEY`. A preview never writes to production.
- `CONVEX_DEPLOY_KEY` stays Production-scoped in the Netlify UI.
- The build refuses a non-production `NODE_ENV`, so don't set `NODE_ENV` in the Netlify site's environment variables.

## Admin commands

Host-only, run through the Convex CLI. Check which deployment your CLI points at before you run them.

| Command | Does |
| --- | --- |
| `pnpm rsvps:summary` | Counts: total, yes, maybe, no, plus-ones, expected headcount, teams |
| `pnpm rsvps:csv` | Exports all RSVPs as CSV (`admin:listRsvps` piped through `scripts/export-rsvps.mjs`) |
| `pnpm rsvps:get '{"email":"a@x.com"}'` | Shows one guest's row |
| `pnpm rsvps:delete '{"email":"a@x.com"}'` | Erases one guest on request: the guest row, their code challenges and their rate-limit buckets |
| `pnpm rsvps:reset-limits` | Resets the global code limit. Add `'{"email":"a@x.com"}'` to reset one guest's limits too |
| `pnpm rsvps:declines-csv` | Exports name-only declines as CSV. Every row is marked "self-reported, unverified" |
| `pnpm rsvps:get-decline '{"firstName":"Ada","surname":"Lovelace"}'` | Shows one decline by name |
| `pnpm rsvps:delete-decline '{"firstName":"Ada","surname":"Lovelace"}'` | Erases one decline on request: the row and that name's rate-limit bucket |
| `pnpm rsvps:reset-decline-limits` | Resets the global decline limit |

Name-only declines (a guest who picked away and has not replied before) live in their own table, apart from guests. Anyone with the link can decline under any name, so treat them as unverified. They show in `rsvps:summary` as `declinesUnverified`, never in the headcount.

- Declines only work on a deployment where `DECLINES_OPEN` is `"true"`. The owner sets it. Without it the decline action answers `service_unavailable`.
- An erasure request must check both `rsvps:get` (by email) and `rsvps:get-decline` (by name), and delete from whichever holds a row.

### Purge all guests

A manual step with no cron, for the end of the retention period (`RETENTION_DAYS` in `convex/admin.ts`).

```sh
npx convex run admin:purgeGuests '{"confirm":"PURGE-GUESTS"}'                  # dry run (default): counts only
npx convex run admin:purgeGuests '{"confirm":"PURGE-GUESTS","dryRun":false}'   # deletes
```

- `confirm` must be `"PURGE-GUESTS"`.
- `dryRun` defaults to `true`.
- Declines are purged too, in batches after the guests.
- Before the hard-coded floor (the event date plus `RETENTION_DAYS`), nothing is deleted. The result reads `before_floor`.

## Rollback

- The git tag `react-final` marks the last React front end.
- In Netlify, use "Publish deploy" on the last React build.

Backend changes are additive, so the React build still works against the current backend.
