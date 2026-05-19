---
title: Your First Review
description: Walk through the full review submission flow — UI, server action, database write, and personalized score recomputation.
sidebar_position: 2
---

# Your First Review

This 10-minute walkthrough traces a community review from the form submit button to the personalized score that appears on your dashboard. By the end you'll know exactly where to plug in your own features.

## 1. Find a game

Go to [http://localhost:3000/browse](http://localhost:3000/browse), filter by **Heavy** complexity, and click on **Brass: Birmingham**.

On the game detail page (`app/games/[slug]/page.tsx`) you'll see:

- The **dual GamePulse scores** rendered by `ScoreCard` (`components/gamepulse-ui.tsx`)
- A **consensus badge** computed by `buildConsensus()` (`lib/scoring.ts`)
- A **review form** rendered by `CommunityReviewForm` (`components/action-forms.tsx`)

## 2. Submit a review

Fill in:

- **Rating**: 9
- **Review**: `Best engine builder of the decade. The canal era pays off massively in rail.`

Click **Post review**. The button is a `SubmitButton` that shows a pending spinner until the action resolves.

## 3. Trace the server action

The form is wired with `useActionState` to `submitCommunityReview` in [`lib/actions.ts`](https://github.com/TabletopFoundry/gamepulse/blob/main/lib/actions.ts):

```ts
"use server";

export async function submitCommunityReview(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const limit = await rateLimit("submitCommunityReview", 5);
  if (!limit.allowed) return { success: false, message: limit.message };

  const db = getDb();
  const user = getCurrentUser();
  const gameId = Number(formData.get("gameId"));
  const rating = normalizeRating(formData.get("rating"));
  const review = String(formData.get("review") ?? "").trim().slice(0, MAX_REVIEW_LENGTH);
  // …validation…

  db.prepare(/* upsert into community_reviews */).run(gameId, user.id, rating, review);
  revalidateCommunityPages(`/games/${slug}`);
  refreshMatchedCriticsCache();
  return { success: true, message: "Thanks for the review!" };
}
```

Three important things happen here:

1. **Rate limiting** via `rateLimit("submitCommunityReview", 5)` — 5 calls per minute per action key.
2. **Validation** — rating in `[1, 10]`, review length between `MIN_REVIEW_LENGTH` (10) and `MAX_REVIEW_LENGTH` (280).
3. **Cache invalidation** — `revalidateCommunityPages()` busts the static cache for affected routes, and `refreshMatchedCriticsCache()` invalidates the `matched-critics` tag so your personalized predictions recompute.

## 4. See it on your dashboard

Go to [http://localhost:3000/me](http://localhost:3000/me). You should see:

- Your new review at the top of **My ratings**
- Your **personalized prediction** for Brass: Birmingham updated — because the matched-critics cache was invalidated, the next render recomputes [taste matches](../concepts/taste-matching.md) using your latest ratings.

## 5. What you just learned

| Concept | Where it lives |
| --- | --- |
| Server actions with `useActionState` | `components/action-forms.tsx` |
| Mutation logic | `lib/actions.ts` |
| Rate limiting | `lib/rate-limit.ts` |
| Cache invalidation | `revalidatePath`, `updateTag` calls in actions |
| Personalized score recomputation | `lib/scoring.ts` → `getPersonalizedScore()` |

## Next steps

- Read the [Scoring Model](../concepts/scoring.md) to understand how badges and predictions are computed.
- Read [Taste Matching](../concepts/taste-matching.md) to see the cosine + Pearson math.
- Want to add a new game? Jump to [Adding a Game](../guides/adding-a-game.md).
