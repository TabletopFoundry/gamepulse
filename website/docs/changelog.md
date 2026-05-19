---
title: Changelog
description: Release notes for GamePulse.
---

# Changelog

All notable changes to GamePulse will be documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Real authentication via NextAuth.js — replaces the mock `getCurrentUser()` stub.
- Optional BoardGameGeek importer as an alternative seed pipeline.
- Public read-only API for game and critic data.

## [0.1.0] — 2024

The initial open-source release.

### Added

- **Landing page** with hero, trending games, latest critic reviews, rising games, and an awards tracker.
- **Game detail pages** with dual GamePulse scores (critics + community), consensus badges, full critic breakdown, community reviews, price comparison, and a "Similar games" rail.
- **Browse & discover** with filters for category, player count, and complexity. Sort by score, trending, newest, or most reviewed. Header search with keyboard navigation.
- **Critic profiles** with taste-profile radar charts, review history, taste-match percentage, and follow/unfollow.
- **User dashboard** at `/me` — your ratings, watchlist, wishlist, matched critics, taste-profile visualization, and personalized score predictions.
- **Personalized content feed** with filters for reviews, news, deals, and videos. Release calendar and weekly newsletter preview.
- **Taste matching** that combines cosine similarity and Pearson correlation across six taste dimensions.
- **Local persistence** — all interactions (ratings, reviews, watchlist, follows, newsletter signups) persist in SQLite via `better-sqlite3`.
- **Deterministic seeds** — 60+ board games, 14 named critics, 50+ community users, 200+ critic reviews, 100+ community reviews, awards, release-calendar entries, follow relationships, and saved-list activity.
- **Server Actions** for every mutation, with rate limiting per action.
- **Production guard** — automatic reseeds are blocked in production unless `GAMEPULSE_ENABLE_PRODUCTION_RESEED=1`.
- **Dockerfile** + volume-mountable database for one-command deploys.
- **CI pipeline** running `type-check → lint → build` on every PR.

### Technical foundation

- Next.js 16 (App Router) + React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- Recharts for taste-profile radar charts
- Lucide React for icons
- `better-sqlite3` for synchronous server-component-friendly persistence

---

_This changelog will grow as releases ship. For the unreleased work-in-progress, see [docs/IMPROVEMENTS.md](https://github.com/TabletopFoundry/gamepulse/blob/main/docs/IMPROVEMENTS.md) in the repo._
