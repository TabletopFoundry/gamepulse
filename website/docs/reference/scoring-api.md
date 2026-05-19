---
title: Scoring API
description: TypeScript reference for every function exported from lib/scoring.ts and lib/taste.ts.
sidebar_position: 4
---

# Scoring API

The full TypeScript reference for [`lib/scoring.ts`](https://github.com/TabletopFoundry/gamepulse/blob/main/lib/scoring.ts) and [`lib/taste.ts`](https://github.com/TabletopFoundry/gamepulse/blob/main/lib/taste.ts).

## Types

### `TasteDimension`

```ts
export const TASTE_DIMENSIONS = [
  "strategy", "thematic", "party", "family", "solo", "conflict",
] as const;
export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];
```

### `TasteProfile`

```ts
export type TasteProfile = Record<TasteDimension, number>;
```

A 6-element vector. Each value is `0..100`.

### `ConsensusLabel`

```ts
export const CONSENSUS_LABELS = [
  "Divisive",
  "Critically Acclaimed",
  "Community Favorite",
  "Hidden Gem",
  "On the Rise",
] as const;
export type ConsensusLabel = (typeof CONSENSUS_LABELS)[number];
```

## Functions

### `clamp(value, min, max)`

Clamp a number into `[min, max]`.

```ts
clamp(120, 0, 100); // → 100
clamp(-5, 0, 100);  // → 0
```

### `average(numbers)`

Numeric mean. Returns `0` for an empty array.

```ts
average([8, 9, 10]); // → 9
average([]);          // → 0
```

### `cosineSimilarity(a, b)`

Cosine similarity between two taste profiles. Range: `[0, 1]` (assuming non-negative profiles).

```ts
import { cosineSimilarity } from "@/lib/scoring";

const alex = { strategy: 90, thematic: 70, party: 30, family: 45, solo: 65, conflict: 55 };
const tara = { strategy: 95, thematic: 60, party: 15, family: 30, solo: 70, conflict: 35 };

cosineSimilarity(alex, tara); // → ~0.97
```

Used to score user × critic and game × game similarity.

### `pearson(left, right)`

Pearson correlation. Range: `[-1, 1]`. Returns `0` if either array has length `< 2` or zero variance.

```ts
pearson([8, 9, 7, 6], [85, 92, 75, 60]); // → ~0.98 (perfectly correlated)
```

Used to detect calibration agreement between a user's ratings and a critic's scores on the same games.

### `buildConsensus(criticsScore, communityScore, rising)`

Compute a consensus label.

```ts
buildConsensus(90, 88, 70); // → "Critically Acclaimed"
buildConsensus(88, 72, 50); // → "Divisive"
buildConsensus(75, 86, 65); // → "Hidden Gem"
buildConsensus(60, 90, 40); // → "Community Favorite"
buildConsensus(70, 70, 40); // → "On the Rise"
```

The function is pure and synchronous. Pass in already-computed 0–100 scores.

### `topGenres(profile)`

Return the top dimensions in a taste profile, sorted descending. Used to render "Likes strategy + thematic" badges on user/critic cards.

```ts
topGenres({ strategy: 90, thematic: 72, party: 30, family: 45, solo: 65, conflict: 55 });
// → ["strategy", "thematic", "solo"]
```

### `getPersonalizedScore(gameId, matchedCritics, reviewsByGame?)`

Compute a 0–100 personalized score for `gameId` based on a user's top matched critics.

```ts
import { getPersonalizedScore } from "@/lib/scoring";
import { getMatchedCritics } from "@/lib/queries/user";

const matchedCritics = await getMatchedCritics();
const score = getPersonalizedScore(brassBirminghamId, matchedCritics);
// → 91
```

Algorithm:

1. Collect each matched critic's score for `gameId` (if any).
2. Weighted average — weight = match score (cosine × pearson blend).
3. If fewer than 2 matched critics reviewed the game, fall back to the global `critics_score`.

The optional `reviewsByGame` parameter pre-fetches reviews in bulk for batch scoring (used on browse/dashboard pages).

### `batchFetchCriticReviews(gameIds)`

Fetch all critic reviews for a list of game IDs in a single SQL query. Returns a `Map<gameId, Array<{ critic_id, score }>>` for efficient batch personalized-scoring on listing pages.

```ts
const reviewsByGame = batchFetchCriticReviews([1, 2, 3, 4, 5]);
const matchedCritics = await getMatchedCritics();

for (const game of games) {
  game.personalizedScore = getPersonalizedScore(game.id, matchedCritics, reviewsByGame);
}
```

Use this whenever you compute personalized scores for more than one game at a time.

## Worked example

The dashboard's "Predicted for you" rail:

```ts
// app/me/page.tsx (excerpt)
import { getMatchedCritics } from "@/lib/queries/user";
import { batchFetchCriticReviews, getPersonalizedScore } from "@/lib/scoring";
import { getRecommendedGames } from "@/lib/queries/dashboard";

const matchedCritics = await getMatchedCritics();
const recommendations = getRecommendedGames();
const reviewsByGame = batchFetchCriticReviews(recommendations.map((g) => g.id));

const enriched = recommendations.map((game) => ({
  ...game,
  predicted: getPersonalizedScore(game.id, matchedCritics, reviewsByGame),
}));
```

That's the whole personalization pipeline in 6 lines.
