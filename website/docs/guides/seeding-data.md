---
title: Seeding Data
description: How GamePulse seeds its SQLite database — and how to reset, extend, or version your seed data safely.
sidebar_position: 1
---

# Seeding Data

GamePulse ships with **deterministic seed data** so that `git clone && npm run dev` always gives you the same populated catalog. This guide explains the seed pipeline and the moves you'll most often make.

## The seed pipeline

```
npm run dev
  ├─▶ lib/db/connection.ts opens data/gamepulse.db (creating it if missing)
  ├─▶ Schema applied (CREATE TABLE IF NOT EXISTS …)
  └─▶ lib/db/seed.ts runs
        ├─▶ Read app_meta.seed_version
        ├─▶ If unchanged AND data present → skip
        └─▶ Else → BEGIN TRANSACTION
              ├─▶ DELETE all reference rows
              ├─▶ Reset autoincrement sequences
              ├─▶ INSERT seeds (games, critics, users, reviews, …)
              ├─▶ Recompute critics_score and community_score on games
              ├─▶ UPDATE app_meta.seed_version
              └─▶ COMMIT
```

The transaction is **atomic**: if anything fails, your existing database is left untouched.

## Where seeds live

```
lib/db/
├── seed.ts                # Orchestrator + SEED_VERSION constant
└── seeds/
    ├── games.ts           # 60+ board games with taste profiles
    ├── critics.ts         # 14 named critics
    ├── users.ts           # 50+ community users + the mock current user
    ├── critic-reviews.ts  # 200+ critic reviews (game × critic)
    ├── community-reviews.ts
    ├── prices.ts          # Retailer × game prices
    ├── awards.ts
    ├── feed-items.ts
    ├── release-calendar.ts
    └── follows.ts         # critic_follows + user_lists
```

Each file exports a typed array. The orchestrator imports them and runs the inserts in dependency order.

## Resetting the database

When the DB is in a weird state, nuke it:

```bash
npm run clean
npm run dev
```

`npm run clean` removes `data/gamepulse.db` (plus WAL/SHM sidecars) and `.next/`. The next `npm run dev` rebuilds everything from `lib/db/seeds/`.

## Bumping the seed version

If you change seed data, **bump `SEED_VERSION` in `lib/db/seed.ts`**:

```ts
// lib/db/seed.ts
const SEED_VERSION = 5; // was 4
```

Why: existing developers running `npm run dev` against an older database won't see your changes otherwise. The version bump tells the orchestrator to reseed.

## Adding seed data

Add a row to the appropriate file under `lib/db/seeds/`. For example, adding a new critic:

```ts
// lib/db/seeds/critics.ts
export const critics: SeedCritic[] = [
  // …existing critics…
  {
    slug: "tabletop-tara",
    name: "Tabletop Tara",
    avatar: "/critics/tara.png",
    platform: "YouTube",
    outlet: "Tara Plays Tabletop",
    bio: "Heavy-eurogame specialist with 1.2M subs.",
    tagline: "Calm, considered, never hyped.",
    preferred_complexity: 4.2,
    taste_profile: {
      strategy: 95, thematic: 60, party: 15, family: 30, solo: 70, conflict: 35,
    },
  },
];
```

Then bump `SEED_VERSION` and run:

```bash
npm run clean && npm run dev
```

## Determinism rules

A few invariants keep seeds deterministic. Stick to them:

1. **Never call `Math.random()` in seed code.** Use stable, hand-authored data.
2. **Never read the current time.** Use fixed ISO strings (`"2024-03-15T10:00:00Z"`).
3. **IDs are auto-assigned, slugs are hand-authored.** Foreign keys reference slugs in seed source, then resolve to IDs at insertion time.
4. **Order matters within a file** — the order of inserts determines the auto-increment ID. Don't reorder unless you mean to.

## Production guard

Auto-reseeding is **blocked in production** when reference data already exists. To force a reseed in production (e.g. for a staging environment), set:

```bash
GAMEPULSE_ENABLE_PRODUCTION_RESEED=1 npm run start
```

Without that flag, production starts with whatever data is in the database and assumes you manage migrations elsewhere.

## Edge cases worth keeping

The seed includes specific cases that exist to catch regressions. Keep them when you edit:

| Case | Why it exists |
| --- | --- |
| At least one game with **only one critic review** | Tests thin-data fallbacks in `getPersonalizedScore()` |
| At least one **Hidden Gem** | Tests the rising-momentum branch of `buildConsensus()` |
| At least one **Divisive** title | Tests the `|critics - community| >= 15` branch |
| A game with **no community reviews yet** | Ensures the dashboard handles empty community scores |

If you add a new game, prefer to extend an existing edge case rather than removing one.
