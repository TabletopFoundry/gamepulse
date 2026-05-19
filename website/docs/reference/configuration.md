---
title: Configuration
description: Every environment variable, configuration constant, and runtime flag in GamePulse.
sidebar_position: 1
---

# Configuration

All configuration is centralized in [`lib/config.ts`](https://github.com/TabletopFoundry/gamepulse/blob/main/lib/config.ts). The rest of the codebase imports typed constants — `process.env` is never read outside this file.

## Environment variables

| Variable | Default | Type | Used for |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `https://gamepulse.example.com` | string | Sitemap, OpenGraph, canonical URLs |
| `NODE_ENV` | `development` | `"development" \| "production" \| "test"` | Standard Next.js modes |
| `GAMEPULSE_ENABLE_PRODUCTION_RESEED` | unset | `"1"` to enable | Allows the seeder to wipe data in production |

Copy `.env.example` to `.env.local` and edit. `NEXT_PUBLIC_*` variables are baked into the client bundle at build time — change them by rebuilding, not at runtime.

## Compile-time constants

These live in `lib/config.ts`. Change them in code, not via environment:

| Constant | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `"GamePulse"` | Branded name in metadata + UI chrome |
| `APP_VERSION` | from `package.json` | Returned by `/api/health` |
| `DEFAULT_REVALIDATE` | `60` (seconds) | Cache TTL for static-ish pages |
| `LIST_TYPES` | `["watchlist", "wishlist"]` | Valid `list_type` values |
| `MATCHED_CRITICS_CACHE_TAG` | `"matched-critics"` | Cache tag busted by mutation actions |
| `MAX_REVIEW_LENGTH` | `280` | Community review character cap |
| `MIN_REVIEW_LENGTH` | `10` | Minimum community review length |
| `SIMILAR_GAMES_LIMIT` | `3` | "Similar games" rail size on game detail |
| `FEED_PREVIEW_LIMIT` | `4` | Feed teasers on the home page |

## Rate limiting

`lib/rate-limit.ts` exposes a `rateLimit(actionName, perMinute)` helper used in every server action:

```ts
const limit = await rateLimit("submitCommunityReview", 5);
if (!limit.allowed) return { success: false, message: limit.message };
```

Defaults per action:

| Action | Per-minute limit |
| --- | --- |
| `submitCommunityReview` | 5 |
| `toggleUserList` | 30 |
| `toggleFollowCritic` | 30 |
| `subscribeNewsletter` | 3 |
| `deleteNewsletterSignup` | 5 |

Keys are scoped to `actionName + client IP` (or a stable cookie when IP is unavailable).

## Caching

GamePulse uses three Next.js cache primitives:

| Primitive | Where | Purpose |
| --- | --- | --- |
| `React.cache()` | `lib/queries/games.ts`, others | Per-request memoization of pure queries |
| `unstable_cache()` | `getCachedSearchOptions`, expensive aggregates | Cross-request memoization with TTL |
| `revalidatePath`, `updateTag` | `lib/actions.ts` after every mutation | Bust caches when data changes |

The single named tag is `matched-critics` — any mutation that affects taste matching invalidates it so the next dashboard render recomputes.

## Database location

The SQLite file path is currently `data/gamepulse.db` relative to the working directory. The directory is created on first run.

To relocate the database (e.g. to a mounted volume), update `lib/db/connection.ts`:

```ts
const dbPath = process.env.GAMEPULSE_DB_PATH ?? path.join(process.cwd(), "data", "gamepulse.db");
```

…and set `GAMEPULSE_DB_PATH=/var/lib/gamepulse/gamepulse.db` in your environment. The default is intentionally simple to keep local dev zero-config.

## Mock user

Authentication is currently a stub: `getCurrentUser()` in `lib/queries/user.ts` returns the row with `community_users.is_current = 1`. Override by toggling the `is_current` flag in `lib/db/seeds/users.ts` and reseeding.

To plug in real auth, see [Data Model → Mock authentication](../concepts/data-model.md#mock-authentication).
