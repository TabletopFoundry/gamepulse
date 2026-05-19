---
title: Project Tour
description: A guided tour of the GamePulse codebase — what every folder does and where to make changes.
sidebar_position: 3
---

# Project Tour

A guided tour of the directory structure. Read this once and you'll know exactly where to put new code.

```
gamepulse/
├── app/                    # Next.js App Router pages (server components)
├── components/             # React components — UI + client widgets
├── lib/                    # Business logic & data access
│   ├── db/                 # Connection, schema, seeds
│   ├── queries/            # Typed data access, one file per domain
│   ├── actions.ts          # Server Actions (mutations)
│   ├── scoring.ts          # Score algorithms
│   ├── taste.ts            # Taste-dimension types
│   ├── rate-limit.ts       # Per-action token bucket
│   ├── config.ts           # Centralized env-derived constants
│   └── gamepulse.ts        # Barrel re-exports
├── data/                   # SQLite database (gitignored)
├── docs/                   # Internal product/code/UX review docs
├── public/                 # Static assets
└── website/                # This documentation site
```

## `app/` — Routes

Each top-level folder under `app/` is a route. Every `page.tsx` is a **server component** that calls query functions directly:

| Route | Purpose |
| --- | --- |
| `app/page.tsx` | Landing page — trending games, latest reviews, awards |
| `app/browse/page.tsx` | Filter & sort the catalog |
| `app/games/[slug]/page.tsx` | Game detail — scores, reviews, prices, similar games |
| `app/critics/page.tsx` + `[slug]/page.tsx` | Critic directory and profile |
| `app/feed/page.tsx` | Personalized content feed |
| `app/me/page.tsx` | Your dashboard |
| `app/newsletter/manage/page.tsx` | Self-serve newsletter removal |
| `app/api/health/route.ts` | `200 OK` + version (for uptime checks) |
| `app/sitemap.ts`, `app/robots.ts` | SEO |

:::info
Pages **never** import `getDb()` directly. All data access goes through `lib/queries/`.
:::

## `components/` — UI

Mostly server components. Client components are explicitly marked `"use client"`:

| File | What it is |
| --- | --- |
| `gamepulse-ui.tsx` | Shared building blocks — `PageShell`, `SectionHeading`, `ScoreCard`, `ConsensusBadge`, `GameCard` |
| `action-forms.tsx` | `"use client"` — review form, follow/unfollow, watchlist toggles, newsletter signup |
| `submit-button.tsx` | `"use client"` — pending-state button driven by `useFormStatus` |
| `search-autocomplete.tsx` | `"use client"` — header search combobox with keyboard navigation |
| `client-widgets.tsx` | `"use client"` — Recharts radar charts for taste profiles |
| `toast.tsx` | `"use client"` — toast provider + `useToast()` hook |

## `lib/queries/` — Data access

One file per domain. Functions are pure-ish: they take parameters, hit SQLite synchronously through `getDb()`, and return typed results.

| File | Owns reads for |
| --- | --- |
| `games.ts` | Game cards, game detail, similar games, search options |
| `critics.ts` | Critic directory + profile data, taste-match arrays |
| `feed.ts` | Feed items, release calendar |
| `dashboard.ts` | User dashboard rollups |
| `user.ts` | Current user (mock `alex`), user lists, matched critics |
| `parsers.ts` | `RawGame → Game`, `RawCritic → Critic` (JSON parsing) |
| `types.ts` | Shared shapes |

## `lib/db/` — Persistence

| File | What it does |
| --- | --- |
| `connection.ts` | Lazy singleton: opens `data/gamepulse.db`, applies `PRAGMA`, runs schema |
| `schema.ts` | `CREATE TABLE IF NOT EXISTS …` statements |
| `seed.ts` | Deterministic seed in a single transaction; bumps `app_meta.seed_version` |
| `seeds/` | Reference data, one file per entity type (games, critics, users, etc.) |

## `lib/` — Algorithms

| File | What it owns |
| --- | --- |
| `scoring.ts` | `cosineSimilarity`, `pearson`, `buildConsensus`, `getPersonalizedScore` |
| `taste.ts` | `TASTE_DIMENSIONS` (the 6-element tuple), `TasteProfile` type |
| `actions.ts` | All Server Actions — mutations, rate-limited |
| `rate-limit.ts` | Token-bucket rate limiter keyed by action name + client IP |
| `config.ts` | All env-derived constants in one place |

## Where to put new code

| You want to… | Add it here |
| --- | --- |
| Add a new page | `app/<route>/page.tsx`, plus a query in `lib/queries/` |
| Add a mutation | New exported function in `lib/actions.ts` |
| Add a new column | Update `lib/db/schema.ts` **and** the relevant `lib/queries/parsers.ts` |
| Add a new game/critic | Edit `lib/db/seeds/*.ts` and bump `SEED_VERSION` |
| Change a score formula | `lib/scoring.ts` only — pages don't compute scores |
| Tweak a constant | `lib/config.ts` (not inline) |

Now head into the [Architecture](../concepts/architecture.md) for the wide-angle view.
