---
title: Adding a Game
description: Step-by-step recipe for adding a new game to GamePulse — seed entry, taste profile, reviews, and verification.
sidebar_position: 2
---

# Adding a Game

This is the canonical recipe for adding a game. It takes about 5 minutes.

## 1. Add the catalog row

Open `lib/db/seeds/games.ts` and append:

```ts
// lib/db/seeds/games.ts
export const games: SeedGame[] = [
  // …existing games…
  {
    slug: "ark-nova",
    title: "Ark Nova",
    year: 2021,
    description:
      "Plan and design a modern, scientifically managed zoo. Build enclosures, support conservation projects, and run a successful zoo.",
    categories: ["Strategy", "Animals", "Card-Driven"],
    mechanics: ["Action Selection", "Tableau Building", "Resource Management"],
    min_players: 1,
    max_players: 4,
    complexity: 3.7,
    play_time: 150,
    buzz: 88,
    rising: 72,
    taste_profile: {
      strategy: 92, thematic: 78, party: 10, family: 25, solo: 85, conflict: 20,
    },
  },
];
```

### Taste profile guidelines

Each dimension is **0–100**:

| Dimension | What "high" looks like |
| --- | --- |
| `strategy` | Many decisions, long-term planning, engine building |
| `thematic` | Strong narrative, immersive world, evocative components |
| `party` | Fast, social, group-dynamics-driven |
| `family` | Approachable, kid-friendly, gateway weight |
| `solo` | Robust single-player mode or designed for solo |
| `conflict` | Direct player interaction, take-that, PvP |

Score relative to *the catalog*, not absolutely. A 90 strategy means "among the most strategic games we list."

## 2. Add at least one critic review

Critic reviews live in `lib/db/seeds/critic-reviews.ts`. Reference the game and critic by **slug**:

```ts
// lib/db/seeds/critic-reviews.ts
export const criticReviews: SeedCriticReview[] = [
  // …existing reviews…
  {
    game_slug: "ark-nova",
    critic_slug: "tabletop-tara",
    score: 92,
    verdict: "Buy",
    excerpt: "The card synergies are deep without ever feeling fiddly. Ark Nova rewards patient builders.",
    source: "YouTube",
    content_type: "video-review",
    published_at: "2022-08-12T10:00:00Z",
  },
];
```

The orchestrator resolves `game_slug` and `critic_slug` to numeric IDs at insert time.

## 3. (Optional) Seed prices and awards

```ts
// lib/db/seeds/prices.ts
{ game_slug: "ark-nova", retailer: "Miniature Market", price: 64.99, shipping: "Free over $99", label: "best" }

// lib/db/seeds/awards.ts
{ game_slug: "ark-nova", award_name: "Spiel des Jahres", award_year: 2022, result: "Recommended" }
```

## 4. (Optional) Seed community ratings

For more realistic personalized predictions, add a few community ratings:

```ts
// lib/db/seeds/community-reviews.ts
{ game_slug: "ark-nova", user_handle: "alex", rating: 9.0, review: "Best card-driven euro of the decade.", created_at: "2024-01-04T12:00:00Z" }
```

## 5. Bump the seed version

```ts
// lib/db/seed.ts
const SEED_VERSION = 5; // was 4
```

## 6. Rebuild and verify

```bash
npm run clean
npm run dev
```

Then check:

- **Browse page** at `/browse` → your game appears, filterable.
- **Game detail** at `/games/ark-nova` → scores render, consensus badge is correct.
- **Dashboard** at `/me` → if matched critics reviewed it, a personalized prediction shows up.
- **Search** in the header → the title autocompletes.

## 7. Run the CI gate

```bash
npm run check
```

This runs `type-check → lint → build`. If types or seeds are inconsistent the build will catch it.

## Common mistakes

| Mistake | Symptom | Fix |
| --- | --- | --- |
| Forgot to bump `SEED_VERSION` | New game doesn't appear locally | Bump it and `npm run clean && npm run dev` |
| Taste profile dimensions don't sum to anything | None — they're independent axes | Treat each axis independently, don't normalize |
| Used `critic_id: 12` instead of `critic_slug` | Build error from the seed type | Always reference by slug |
| Score is 9.2 (a 1–10 rating in a critic review) | Validation throws | Critic scores are 0–100; community ratings are 1–10 |

Next: [Customizing Scoring](./customizing-scoring.md) if you want to tune the algorithms.
