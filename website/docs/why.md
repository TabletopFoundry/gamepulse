---
title: Why GamePulse
description: How GamePulse compares to BoardGameGeek, Tabletop Tycoon, and rolling-your-own.
---

# Why GamePulse

GamePulse exists because the board-game discovery space has two extremes:

- **Crowdsourced behemoths** like BoardGameGeek — comprehensive but cluttered, with a UX from another era.
- **Spreadsheets and Notion docs** — clean but lonely. No critics, no community pulse, no personalization.

There's a middle ground: **a clean, modern, personalized aggregator that surfaces the consensus and tells you whose taste matches yours.** That's what GamePulse is.

## How it compares

| | **GamePulse** | BoardGameGeek | Tabletop Tycoon | Notion / spreadsheet |
| --- | --- | --- | --- | --- |
| Critic aggregation | ✅ Built-in | ⚠️ Buried under user content | ✅ Yes | ❌ DIY |
| Community scores | ✅ With consensus badge | ✅ Massive scale | ⚠️ Limited | ❌ |
| Personalized predictions | ✅ Taste-matched critics | ❌ | ⚠️ Basic | ❌ |
| Modern, fast UI | ✅ Next.js 16 + React 19 | ❌ | ✅ | ✅ |
| Self-hostable | ✅ One Docker command | ❌ | ❌ | ⚠️ |
| Open source | ✅ MIT | ❌ | ❌ | n/a |
| Setup time | < 5 minutes | n/a | n/a | hours |
| External APIs required | ❌ | n/a | n/a | n/a |

## What makes GamePulse different

### 1. Consensus badges that actually mean something

Five labels — `Critically Acclaimed`, `Community Favorite`, `Hidden Gem`, `Divisive`, `On the Rise` — derived from explicit thresholds you can read and tune in 12 lines of TypeScript. No mystery algorithm.

```ts
if (Math.abs(criticsScore - communityScore) >= 15) return "Divisive";
if (criticsScore >= 86 && communityScore >= 80) return "Critically Acclaimed";
// …
```

### 2. Predictions weighted by *your* matched critics

A critic at 92% taste match counts much more than a critic at 30%. The math is cosine similarity + Pearson correlation — interpretable, debuggable, and cheap.

### 3. Server components, server actions, zero plumbing

No REST tier. No client-side data fetching. No SWR/React Query/RTK. Pages call query functions and SQLite responds synchronously through `better-sqlite3`. The codebase is smaller than the toolchain you'd otherwise need.

### 4. Deterministic seed data

`git clone && npm run dev` and you have 60+ games, 14 critics, and 200+ reviews. No empty states to fight. No "import from CSV" wizard. Just a populated, working app you can mess with immediately.

### 5. One file, one schema, one deploy target

The entire database is `data/gamepulse.db`. Backups are file copies. Migrations are schema patches. Deploy is `docker run -v gamepulse-data:/app/data`. Boring on purpose.

## When *not* to use GamePulse

Be honest with yourself. Don't pick GamePulse if:

- You need to **scale writes** beyond a single machine. SQLite is single-writer. Move to Postgres.
- You need a **public user community** with sign-ups, moderation tooling, and trust/safety. That's not built in.
- You want a **mobile app**. The web app is responsive, but there's no native shell.
- You need **real-time data** from BGG or other external sources. The catalog is a local seed.

For those workloads, fork it and use it as a starting point — the layering makes that easy. But the MVP scope is intentionally narrow.

## The bet

GamePulse bets that most of what people actually want from a board-game discovery tool boils down to:

1. **"Is this game good?"** → consensus badge
2. **"Will *I* like it?"** → personalized prediction
3. **"What should I play next?"** → matched-critic recommendations

Everything in the codebase is structured around answering those three questions as fast and as clearly as possible.

Get started → [Quick Start](./getting-started/quick-start.md).
