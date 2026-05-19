---
title: Scoring Model
description: How GamePulse aggregates critic and community scores, derives consensus badges, and computes personalized predictions.
sidebar_position: 2
---

# Scoring Model

GamePulse derives **four numbers and one label** per game:

| Output | Range | Where it lives |
| --- | --- | --- |
| Critics Score | `0–100` | `games.critics_score` (precomputed on seed) |
| Community Score | `0–100` | `games.community_score` (precomputed on seed) |
| Consensus Badge | enum | Computed on read by `buildConsensus()` |
| Personalized Score | `0–100` | Computed per user by `getPersonalizedScore()` |
| Taste Match % | `0–100` | Computed per user by `getMatchedCritics()` |

All scoring lives in [`lib/scoring.ts`](https://github.com/TabletopFoundry/gamepulse/blob/main/lib/scoring.ts). Pages never compute scores inline.

## Critics Score

A weighted average of critic review scores (each on a 0–100 scale), stored on the `games` row at seed time.

A real production version would recompute this on every critic review write. We don't, because critic reviews are seeded — not user-generated.

## Community Score

The average of community ratings (1–10), rescaled to 0–100:

```
community_score = round(average(community_ratings) * 10)
```

## Consensus Badge

The single most useful signal on a game card. Computed by `buildConsensus(criticsScore, communityScore, rising)`:

```ts
export function buildConsensus(
  criticsScore: number,
  communityScore: number,
  rising: number,
): ConsensusLabel {
  if (Math.abs(criticsScore - communityScore) >= 15) return "Divisive";
  if (criticsScore >= 86 && communityScore >= 80) return "Critically Acclaimed";
  if (communityScore >= 88) return "Community Favorite";
  if (communityScore >= 80 && criticsScore >= 74 && rising >= 60) return "Hidden Gem";
  return "On the Rise";
}
```

### Why the order matters

The checks run **top to bottom**, and the first match wins:

1. **Divisive** is checked first — a game with `critics=90, community=70` is not "Critically Acclaimed", it's contentious. We surface the split.
2. **Critically Acclaimed** is the strongest positive label. It requires *both* axes high.
3. **Community Favorite** rewards strong community love even when critics are quieter.
4. **Hidden Gem** triggers only when **rising momentum** is also high — preventing old games from being labeled "hidden" forever.
5. **On the Rise** is the default for everything else with activity.

### Tweaking thresholds

All thresholds are literal numbers in `buildConsensus()`. Want a stricter "Critically Acclaimed"? Bump 86 to 90. Want to widen the "Divisive" gap? Change 15 to 20.

:::info
Run `npm run check` after changing thresholds. The build verifies all seeded games still render consistent badges.
:::

## Personalized Predictions

This is the killer feature. Instead of showing you the global community score, the dashboard shows **what your matched critics would predict for you**.

```ts
getPersonalizedScore(gameId, matchedCritics, reviewsByGame)
```

Algorithm:

1. Take the top *N* critics matched to your taste profile (see [Taste Matching](./taste-matching.md)).
2. For each matched critic, look up their score for `gameId` if it exists.
3. Compute a **weighted average** where each critic's vote is weighted by their match score (cosine × correlation).
4. Fall back to the global critics score if fewer than 2 matched critics reviewed the game.

The result: a 0–100 prediction tailored to *your* taste, with confidence falling back gracefully for thin data.

## Cosine similarity and Pearson correlation

Both functions live in `lib/scoring.ts` and are used by taste matching:

```ts
export function cosineSimilarity(a: TasteProfile, b: TasteProfile): number {
  const denominator = magnitude(a) * magnitude(b);
  if (!denominator) return 0;
  return dot(a, b) / denominator;
}

export function pearson(left: number[], right: number[]): number {
  // …standard Pearson formula…
}
```

- **Cosine** answers *"do these two taste profiles point in the same direction?"* — perfect for the six taste dimensions.
- **Pearson** answers *"when this critic rates games higher than their average, do you also rate them higher than yours?"* — perfect for review history.

We combine both because each captures something the other misses: cosine handles **preferences**, Pearson handles **calibration**.

## The score columns on `games`

| Column | Refreshed when |
| --- | --- |
| `critics_score` | Seed time + when a critic review is added/edited (not in MVP) |
| `community_score` | Computed on seed + revalidated by the post-review action |
| `critic_reviews_count` | Maintained alongside `critics_score` |
| `community_reviews_count` | Maintained alongside `community_score` |
| `buzz`, `rising` | Static, set at seed time |

`buzz` and `rising` are seed-defined "momentum" inputs. In a production version these would be derived from view counts, search trends, or follow rate.

## Edge cases the seed includes on purpose

- **One-review games** to test thin-data fallbacks.
- **Hidden gems** — community ≥80, critics in mid-70s.
- **Divisive titles** — strong critics, weak community (or vice versa).
- **Games with no community reviews yet** — the dashboard must not crash.

Next: see how matched critics are computed in [Taste Matching](./taste-matching.md).
