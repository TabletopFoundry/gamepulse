# GamePulse — Fourth-Pass UX & DX Audit

**Auditor perspective:** Senior engineer encountering this codebase for the first time, with access to Reviews 1–3.  
**Date:** 2025-07-21  
**Scope:** Genuinely new P0/P1 issues not already documented in prior reviews. Items from Reviews 1–3 that are still open are tracked but not re-described; only their current status is noted.

---

## 1. Executive Summary

GamePulse has matured into a polished MVP. Build is clean (0 TS errors, 0 lint warnings), onboarding is frictionless (`npm install && npm run dev`), and the prior three rounds of review have resolved every P0. The codebase demonstrates strong architecture: layered modules (`app/ → components/ → lib/queries/ → lib/db/`), `React.cache` for deduplication, proper ARIA/combobox patterns, per-route loading skeletons, toast feedback on all actions, and a sensible static-vs-dynamic caching split.

This review surfaces **five genuinely new P1 issues** that prior reviews did not identify — all related to runtime behavior, architectural edge cases, or security-adjacent patterns that only emerge on closer inspection. No new P0s exist. The remaining open items from prior reviews are tracked in §3 for completeness.

---

## 2. New Findings

### P1 — Must-Fix Before Real Users

#### P1-NEW-1. `getSearchOptions()` is called on every navigation via root layout — unbounded and uncached

**Files:** `app/layout.tsx:27`, `lib/queries/games.ts:7-11`

The root `RootLayout` is an `async` server component that calls `getSearchOptions()` on every render. This executes `SELECT slug, title FROM games ORDER BY title ASC` on every single page navigation. Because `RootLayout` has no `revalidate` or `force-dynamic` export of its own, it inherits from child routes — meaning on `force-dynamic` routes (`/games/[slug]`, `/critics/[slug]`, `/me`), this query runs on every request.

Additionally, `app/browse/page.tsx:29` calls `getSearchOptions()` again redundantly — the layout already passes options to `SearchAutocomplete`, and the browse page fetches the same data separately for its own autocomplete widget.

At 40 games this is invisible. At the PRD's target of 2,000+ games, this unbounded `SELECT` runs on every navigation with no `LIMIT`, no caching, and no memoization. The layout is the highest-traffic code path in the application.

**Fix:**
1. Wrap `getSearchOptions` in `React.cache()` to deduplicate within a single request (layout + browse page).
2. Add a `LIMIT 200` or similar ceiling to the query to prevent unbounded memory growth at scale.
3. Consider moving the search to a client-side fetch with `route.ts` API endpoint so the layout doesn't block on DB I/O for every page.

---

#### P1-NEW-2. `getCriticDirectory()` on the home page fetches **all critic reviews** for taste matching — massive over-fetch

**File:** `app/page.tsx:28`, `lib/queries/critics.ts:31-33`, `lib/queries/user.ts:57-112`

The home page calls `getCriticDirectory()` solely to display a critic count stat (`{critics.length}`). However, `getCriticDirectory()` delegates to `getMatchedCritics()`, which:

1. Fetches the current user.
2. Fetches all user ratings.
3. Fetches all follows.
4. Fetches **all critics**.
5. Fetches **every critic review in the database** (`SELECT critic_id, game_id, score FROM critic_reviews` — no WHERE clause).
6. Runs Pearson correlation + cosine similarity for every critic.

This entire computation exists on the home page just to render a number. The home page is `revalidate = 60`, so this runs every 60 seconds — but if the home page were ever moved to `force-dynamic` (e.g., for personalized hero content), it would run on every request.

**Fix:** Replace with a lightweight count query:
```ts
const criticCount = db.prepare(`SELECT COUNT(*) as count FROM critics`).get() as { count: number };
```
Or export a `getCriticCount()` function from `lib/queries/critics.ts` and use it on the home page instead of loading the full directory.

---

#### P1-NEW-3. Browse page declares `revalidate = 60` but uses `searchParams` — always dynamic anyway

**File:** `app/browse/page.tsx:9,17-21`

The browse page exports `revalidate = 60` (suggesting static ISR), but it also reads `searchParams` (a `Promise<Record<...>>`). In Next.js App Router, any page that reads `searchParams` is automatically opted into dynamic rendering per-request — the `revalidate` export is ignored. The build output confirms this: browse shows as `ƒ (Dynamic)`.

This isn't a bug (the page works correctly), but it's misleading to contributors who see `revalidate = 60` and assume the page benefits from ISR caching. It should either:
- Remove `export const revalidate = 60` and add `export const dynamic = "force-dynamic"` for clarity.
- Or split into a cached default view (no search params) with ISR, and a dynamic search results mode.

---

#### P1-NEW-4. Feed filtering fetches all items then filters in JS — SQL `WHERE` not used

**File:** `lib/queries/feed.ts:5-28`

`getFeedData(filter)` always runs `SELECT ... FROM feed_items ... ORDER BY fi.published_at DESC` (no WHERE clause), then filters in JavaScript:

```ts
const filtered = !filter || filter === "all" ? items : items.filter((item) => item.item_type === filter);
```

Unlike the browse page (which correctly builds parameterized SQL WHERE clauses after R2 fixes), the feed page loads every feed item from the database regardless of the filter and discards non-matching rows in JS. With the PRD targeting continuous ingestion of reviews, news, deals, and videos, this will scale poorly.

**Fix:** Add a SQL `WHERE` clause when filter is not `"all"`:
```ts
const whereClause = filter && filter !== "all" ? `WHERE fi.item_type = ?` : "";
const filterParams = filter && filter !== "all" ? [filter] : [];
const items = db.prepare(`
  SELECT ... FROM feed_items fi
  LEFT JOIN games g ON g.id = fi.game_id
  LEFT JOIN critics c ON c.id = fi.critic_id
  ${whereClause}
  ORDER BY fi.published_at DESC
`).all(...filterParams);
```

---

#### P1-NEW-5. `error.tsx` renders a full `<html>/<body>` shell — creates invalid nested HTML

**File:** `app/error.tsx`

The global error boundary renders `<html lang="en"><body>...</body></html>`. In Next.js App Router, `error.tsx` renders *inside* the nearest layout — meaning this produces nested `<html>` and `<body>` elements when an error occurs on any route except the root. This is invalid HTML and can cause hydration mismatches, broken styling, and accessibility tool confusion.

Only `global-error.tsx` (which replaces the root layout entirely) should render `<html>` and `<body>`. The file at `app/error.tsx` should render only the error UI content without the document shell:

```tsx
"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Something slipped off the table</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">GamePulse hit an error state.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{error.message || "Try again to reload the latest scores, reviews, and feed items."}</p>
        <button onClick={() => reset()} className="mt-8 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">Try again</button>
      </div>
    </div>
  );
}
```

If a root-level error boundary that replaces the layout is also desired, add a separate `app/global-error.tsx` with the `<html>/<body>` wrapper.

---

## 3. Status of Previously Reported Issues (Reviews 1–3)

### Fully Resolved ✅

All P0 items from Reviews 1–3 are resolved. Key resolved items:
- Form feedback, ARIA, skip link, keyboard search, affiliate disclosure, double-submit protection
- Code split (db.ts, gamepulse.ts), per-route loading skeletons, toast system, focus rings
- `outline-none` regression, browse labels, silent action failures
- `React.cache` on `generateMetadata` data fetches, `getPersonalizedScore` deduplication
- N+1 queries in `getMatchedCritics`, browse filters in SQL, `force-dynamic` only on user-specific pages
- JSON-LD structured data on game detail pages
- `app/sitemap.ts` now exists with all game URLs

### Still Open ⚠️ (from prior reviews — not re-described here)

| Prior Item | Status | Priority |
|---|---|---|
| R3-P1-4: Zero test infrastructure | ❌ Open | P1 |
| R3-P1-5: `getSingle()` duplicated | ✅ Fixed | — |
| R3-P1-6: Toast `useEffect` duplication | ✅ Fixed (extracted to `useActionToast` hook) | — |
| R3-P2-1: `clamp()` duplicated in scoring.ts + seed.ts | ❌ Open | P2 |
| R3-P2-2: `text-slate-400` low contrast (~15 instances) | ⚠️ Open (~15 remaining) | P2 |
| R3-P2-3: Hero magic number (`+ 32`) | ❌ Open | P2 |
| R3-P2-4: No DB cleanup on process exit | ❌ Open | P2 |
| R3-P2-5: Fragile `onBlur` 120ms timeout | ❌ Open | P2 |
| R3-P2-7: No pagination on browse/feed | ❌ Open | P2 |
| R3-P2-8: `seed.ts` at 365 lines | ❌ Open | P2 |
| R3-P2-9: Weak email validation | ❌ Open | P2 |
| R3-P2-10: Toast container overlap on narrow viewports | ❌ Open | P2 |
| R3-P2-11: No CI pipeline config | ❌ Open | P2 |
| R3-P2-12: Recharts SSR warnings during build | ❌ Open | P2 |

---

## 4. Recommended Priority Order

| Priority | Items | Effort |
|---|---|---|
| **P1 — Before real users** | P1-NEW-1 (layout search caching), P1-NEW-2 (home page over-fetch), P1-NEW-3 (browse revalidate clarity), P1-NEW-4 (feed SQL filtering), P1-NEW-5 (error.tsx HTML nesting), R3-P1-4 (test infra) | 1–2 days |
| **P2 — Quality polish** | All R3-P2 items (clamp dedup, contrast, magic number, DB cleanup, blur timeout, pagination, seed split, email validation, toast mobile, CI, Recharts SSR) | 1–2 sprints |
