---
title: Server Actions API
description: Every server action exported from lib/actions.ts — signature, inputs, validation, and rate limits.
sidebar_position: 3
---

# Server Actions API

GamePulse exposes **five server actions**, all in [`lib/actions.ts`](https://github.com/TabletopFoundry/gamepulse/blob/main/lib/actions.ts). Each returns a `Promise<ActionResult>`:

```ts
export type ActionResult = {
  success: boolean;
  message: string;
};
```

All actions are rate-limited and revalidate the relevant page paths.

## `submitCommunityReview`

Insert or replace the current user's review for a game.

```ts
async function submitCommunityReview(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult>
```

### FormData fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `gameId` | number | ✅ | Positive integer matching `games.id` |
| `slug` | string | ✅ | Used for revalidation |
| `rating` | number | ✅ | `1.0`–`10.0`, rounded to one decimal |
| `review` | string | ✅ | `MIN_REVIEW_LENGTH ≤ length ≤ MAX_REVIEW_LENGTH` (10–280) |
| `path` | string | ⛔ | Optional path to revalidate (defaults to `/games/${slug}`) |

### Effects

- Upserts into `community_reviews` (unique on `game_id + user_id`).
- Recomputes `games.community_score` for the affected game.
- Calls `revalidatePath` for `/`, `/browse`, `/me`, `/critics`, `/critics/[slug]`, and the game page.
- Invalidates the `matched-critics` cache tag.

### Rate limit

`5 per minute` per (user IP × action).

## `toggleUserList`

Add or remove a game from the user's watchlist or wishlist.

```ts
async function toggleUserList(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult>
```

### FormData fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `gameId` | number | ✅ | |
| `listType` | string | ✅ | One of `LIST_TYPES = ["watchlist", "wishlist"]` |
| `path` | string | ⛔ | Optional path to revalidate |

### Behavior

If the row exists, it's deleted. If not, it's inserted. The action is idempotent in the "final state" sense.

### Rate limit

`30 per minute`.

## `toggleFollowCritic`

Follow or unfollow a critic. Updates the `critic_follows` table.

```ts
async function toggleFollowCritic(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult>
```

### FormData fields

| Field | Type | Required |
| --- | --- | --- |
| `criticId` | number | ✅ |
| `path` | string | ⛔ |

### Effects

Toggles the follow row. Revalidates `/feed`, `/critics`, `/critics/[slug]`, and `/me`.

### Rate limit

`30 per minute`.

## `subscribeNewsletter`

Subscribe an email address. Issues a `newsletter_manage_token` cookie so the user can self-serve unsubscribe later.

```ts
async function subscribeNewsletter(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult>
```

### FormData fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string | ✅ | Validated against `EMAIL_REGEX` |

### Behavior

- Inserts into `newsletter_signups` (deduped on email).
- Generates a `randomUUID()` token, stored on the row.
- Sets two cookies: `newsletter_email` and `newsletter_manage_token`, both `httpOnly`, `sameSite: lax`, `Max-Age: 1 year`, `secure` in production.

### Rate limit

`3 per minute`.

## `deleteNewsletterSignup`

Remove a subscription via the manage page (`/newsletter/manage`). Reads the cookies set by `subscribeNewsletter`.

```ts
async function deleteNewsletterSignup(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult>
```

### FormData fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string | ✅ | Must match the cookie email |
| `token` | string | ✅ | Must match `newsletter_manage_token` cookie |

### Behavior

Deletes the row, clears both cookies.

### Rate limit

`5 per minute`.

## Using server actions from a form

```tsx
"use client";
import { useActionState } from "react";
import { submitCommunityReview } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export function ReviewForm({ gameId, slug }) {
  const [state, formAction] = useActionState(submitCommunityReview, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="slug" value={slug} />
      <input name="rating" type="number" min={1} max={10} step={0.1} required />
      <textarea name="review" minLength={10} maxLength={280} required />
      <SubmitButton>Post review</SubmitButton>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

The full implementation is in `components/action-forms.tsx`.

## Failure modes

Every action returns `{ success: false, message: "…" }` with a user-safe message. The action never throws to the form — errors are surfaced as `ActionResult.message`. Validation, rate-limit, and database errors all funnel through the same return shape so forms can render a single error region.
