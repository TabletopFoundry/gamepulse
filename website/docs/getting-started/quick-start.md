---
title: Quick Start
description: Clone, install, and run GamePulse locally in under five minutes.
sidebar_position: 1
---

# Quick Start

You'll go from zero to a populated GamePulse running on `localhost:3000` in **about five minutes**.

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | **20.x or newer** | App Router, React 19, native fetch |
| npm | **10.x or newer** | Workspaces and lockfile v3 |
| Build toolchain | Xcode CLT (macOS), `build-essential` (Linux), or VS Build Tools (Windows) | `better-sqlite3` compiles a native binding on install |

:::tip
A `.nvmrc` is checked in. If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` from the repo root.
:::

## 1. Clone and install

```bash
git clone https://github.com/TabletopFoundry/gamepulse.git
cd gamepulse
npm install
```

The install step compiles `better-sqlite3` against your local Node ABI. If it fails, see [Troubleshooting → native build errors](../troubleshooting.md#better-sqlite3-fails-to-build).

## 2. Start the dev server

```bash
npm run dev
```

On first boot you'll see seed output like:

```
▲ Next.js 16.2.6
- Local:        http://localhost:3000

[gamepulse] seeding database (version 4)…
[gamepulse] seed complete — 62 games, 14 critics, 53 users, 218 critic reviews
```

The database is materialized at `data/gamepulse.db`. **Seeds are deterministic** — re-running the seed produces the same catalog every time.

## 3. Open the app

Open [http://localhost:3000](http://localhost:3000). You should see:

- A **hero** with featured games and trending titles
- **Latest critic reviews** with consensus badges
- **Rising games** and an **awards tracker**
- A **newsletter signup** form (writes to your local SQLite)

## 4. Try the core flows

Take 2 minutes to try each:

1. **Browse** → `/browse` — filter by category, player count, and complexity.
2. **Game detail** → click any game card. Note the dual GamePulse scores, consensus badge, and "Similar games" rail.
3. **Critic profile** → `/critics` → click any critic. You'll see a radar chart of their taste profile and your **taste match %**.
4. **Your dashboard** → `/me` — your ratings, watchlist, matched critics, and **personalized score predictions**.
5. **Submit a review** — on any game page, rate it 1–10 and write a short review. The submission goes through a server action and updates your dashboard.

## 5. Verify the build

Before opening a PR (or just to verify your install), run the full CI gate:

```bash
npm run check
```

This runs **type-check → lint → build** in sequence. All three must pass.

## What just happened?

When you ran `npm run dev`, three things happened:

1. **Schema bootstrap** — `lib/db/connection.ts` opened (or created) `data/gamepulse.db` and applied `lib/db/schema.ts`.
2. **Deterministic seed** — `lib/db/seed.ts` checked `app_meta.seed_version`, then rebuilt reference tables in a single transaction.
3. **Server rendering** — Next.js rendered the home page as a server component, calling typed query modules in `lib/queries/` directly. No client-side data fetching needed.

Next: build something real with the [Your First Review](./your-first-review.md) walkthrough, or jump straight into the [Architecture](../concepts/architecture.md).
