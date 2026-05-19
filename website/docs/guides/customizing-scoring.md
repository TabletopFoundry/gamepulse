---
title: Customizing Scoring
description: Practical recipes for adjusting consensus thresholds, weighting taste dimensions, and changing personalized prediction behaviour.
sidebar_position: 3
---

# Customizing Scoring

All scoring logic lives in `lib/scoring.ts`. These are the four most common tweaks.

## Tweak the consensus thresholds

```ts
// lib/scoring.ts
export function buildConsensus(criticsScore, communityScore, rising) {
  if (Math.abs(criticsScore - communityScore) >= 15) return "Divisive";
  if (criticsScore >= 86 && communityScore >= 80) return "Critically Acclaimed";
  if (communityScore >= 88) return "Community Favorite";
  if (communityScore >= 80 && criticsScore >= 74 && rising >= 60) return "Hidden Gem";
  return "On the Rise";
}
```

Want stricter "Critically Acclaimed"? Bump `86 → 90`. Want a tighter "Divisive" gap? Bump `15 → 20`. Re-run `npm run check` to verify no regressions.

:::tip
Run the dev server and sweep the browse page after a change. The mix of badges should still look reasonable across the seeded catalog.
:::

## Weight taste dimensions

By default, cosine similarity treats every dimension equally. If you want *strategy* to count twice as much as *family*:

```ts
// lib/scoring.ts
const WEIGHTS: Record<TasteDimension, number> = {
  strategy: 2,
  thematic: 1,
  party: 1,
  family: 0.5,
  solo: 1,
  conflict: 1,
};

function dot(a: TasteProfile, b: TasteProfile) {
  return TASTE_DIMENSIONS.reduce(
    (sum, key) => sum + WEIGHTS[key] * a[key] * b[key],
    0,
  );
}

function magnitude(profile: TasteProfile) {
  return Math.sqrt(
    TASTE_DIMENSIONS.reduce(
      (sum, key) => sum + WEIGHTS[key] * profile[key] ** 2,
      0,
    ),
  );
}
```

The change preserves the `[0, 1]` output range as long as `WEIGHTS` are applied symmetrically to both `dot()` and `magnitude()`.

## Change the matched-critic count

The dashboard shows the **top N** matched critics. To change `N`, locate `getMatchedCritics()` in `lib/queries/user.ts` and adjust the `.slice()` at the end. We'd recommend keeping `N` between 3 and 10:

- `N < 3` produces unstable personalized predictions when one critic skips a game.
- `N > 10` dilutes the personalization signal.

## Re-weight personalized predictions

`getPersonalizedScore()` weights each matched critic's score by their match. To bias toward higher-confidence critics:

```ts
// lib/scoring.ts → getPersonalizedScore
const weights = matchedCritics.map((c) => c.matchScore ** 2); // was: c.matchScore
```

Squaring the match score makes a 90%-match critic count ~3× a 60%-match critic, instead of 1.5×. Useful if you find low-match critics dragging predictions toward the global average.

## Add a new consensus label

1. Extend `CONSENSUS_LABELS` in `lib/scoring.ts`:

   ```ts
   export const CONSENSUS_LABELS = [
     "Divisive",
     "Critically Acclaimed",
     "Community Favorite",
     "Hidden Gem",
     "Cult Classic",   // new
     "On the Rise",
   ] as const;
   ```

2. Add a branch in `buildConsensus()` **before** the `return "On the Rise"` fallback:

   ```ts
   if (criticsScore <= 60 && communityScore >= 85) return "Cult Classic";
   ```

3. Update `ConsensusBadge` in `components/gamepulse-ui.tsx` to add the new label's icon, color, and tooltip.

4. Run `npm run check`. TypeScript will surface any switch/case that hasn't handled the new value — fix those.

## Verify your changes

Two quick checks any scoring change should pass:

```bash
npm run type-check    # types still align
npm run build         # all pages render with the new logic
```

Then walk through:

- `/browse` — badges visually plausible across the catalog
- `/games/brass-birmingham` — a Critically Acclaimed staple
- `/games/<a divisive game>` — Divisive triggers correctly
- `/me` — personalized predictions update

Next: [Deploying](./deploying.md) when you're ready to ship.
