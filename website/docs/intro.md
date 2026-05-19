---
title: Introduction
description: GamePulse is a Rotten Tomatoes-style aggregator for board games — critic consensus, community reviews, and personalized taste matching.
---

# Welcome to GamePulse

**GamePulse is a Rotten Tomatoes-style aggregator for board games.**
It combines critic consensus scores, community pulse, and personalized taste matching into a single, inspectable codebase you can run locally in under a minute.

This documentation is for developers and product folks who want to **run GamePulse, understand how it works, and extend it**.

## In 60 seconds

```bash
git clone https://github.com/TabletopFoundry/gamepulse.git
cd gamepulse
npm install
npm run dev
# open http://localhost:3000
```

The SQLite database seeds itself on first boot. No API keys. No external services. No Docker required.

## What you get out of the box

- **60+ board games**, **14 named critics**, **50+ community users**, and **200+ critic reviews** as deterministic seed data.
- **Dual scores** — critics and community — with a consensus badge (`Critically Acclaimed`, `Hidden Gem`, `Divisive`, …).
- **Taste matching** that combines cosine similarity and Pearson correlation across six taste dimensions.
- **Personalized predictions** that reweight critic scores based on how well their taste matches yours.
- A **personalized content feed** with reviews, news, deals, videos, and a release calendar.
- A full **server-actions data layer** — reviews, follows, watchlists, newsletter signups — backed by `better-sqlite3`.

## Where to go next

| If you want to… | Start here |
| --- | --- |
| Get a running app in 5 minutes | [Quick Start](./getting-started/quick-start.md) |
| Understand the architecture | [Architecture](./concepts/architecture.md) |
| Learn how scoring works | [Scoring Model](./concepts/scoring.md) |
| Add a new game or critic | [Seeding Data](./guides/seeding-data.md) |
| Deploy to production | [Deploying](./guides/deploying.md) |
| Configure environment variables | [Configuration](./reference/configuration.md) |
| Compare against alternatives | [Why GamePulse](./why.md) |

## What GamePulse is **not**

- Not a SaaS — there is no hosted version. You run it yourself.
- Not coupled to BoardGameGeek or any external API. The catalog is a local, deterministic seed you control.
- Not a multi-tenant auth system. The current user is a hardcoded mock (`alex`) — see [Mock authentication](./concepts/data-model.md#mock-authentication) for why and what would change with real auth.

Ready? Head to the [Quick Start](./getting-started/quick-start.md).
