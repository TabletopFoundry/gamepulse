# Code Quality & Architecture Review — GamePulse (Delta #3)

**Reviewed:** 2025-07-20
**Scope:** Full codebase (`10-gamepulse/`), delta from `docs/CODE_REVIEW.md` + `docs/CODE_REVIEW_2.md`
**Objective:** Surface only genuinely **new** P0/P1 issues not already documented in prior reviews

---

## Executive Summary

Both prior reviews were thorough. The codebase has meaningfully improved: `React.cache` now wraps all expensive query functions (`getCurrentUser`, `getCurrentUserRatings`, `getCurrentUserTasteProfile`, `getMatchedCritics`), the `batchFetchCriticReviews` uses fixed-size chunks, `listType` validation uses an allowlist, `safeJsonLd` escapes `</script>` sequences, the sitemap uses a slug-only query with `revalidate = 3600`, and dashboard candidate selection is pushed into SQL.

This third review found **1 new P0 issue** and **4 new P1 issues** not covered by the previous two reviews.

| Dimension              | Rating (updated) |
|------------------------|------------------|
| Overall Quality Score  | **A-**           |
| Architecture Health    | **Good**         |
| Maintainability Index  | **High**         |
| Technical Debt Estimate| **Low**          |

---

## New Critical Findings — P0

### P0-NEW-1 · `batchStmt()` creates a module-level closure over `getDb()` that breaks on cold starts

**File:** `lib/scoring.ts:92-95`
```ts
const batchStmt = () =>
  getDb().prepare(
    `SELECT game_id, critic_id, score FROM critic_reviews WHERE game_id IN (${Array(BATCH_CHUNK_SIZE).fill("?").join(",")})`
  );
```

**Impact:** `batchStmt` is a function (good), but `batchFetchCriticReviews` calls `batchStmt()` on every invocation at line 101, which calls `getDb().prepare()` each time — creating a new compiled statement per call instead of reusing a single prepared statement. The original motivation for fixed-size chunks ("so better-sqlite3 caches only one prepared statement") is defeated because `getDb().prepare()` always creates a new `Statement` object. The cache comment at line 89-90 is misleading.

More critically, in production under Next.js, `global.__gamePulseDb` may be `undefined` during hot-reloads in dev or after module re-evaluation. If `batchStmt` were accidentally called at module evaluation time (e.g., changed from `() =>` to a direct assignment), it would crash with "database not initialized".

**Fix:** Cache the prepared statement lazily after the first call:
```ts
let _batchStmt: ReturnType<Database.Database["prepare"]> | null = null;

function getBatchStmt() {
  if (!_batchStmt) {
    _batchStmt = getDb().prepare(
      `SELECT game_id, critic_id, score FROM critic_reviews WHERE game_id IN (${Array(BATCH_CHUNK_SIZE).fill("?").join(",")})`
    );
  }
  return _batchStmt;
}
```
Or, since the DB connection is already a singleton via `global.__gamePulseDb`, simply call `getDb().prepare()` once inside `batchFetchCriticReviews` and reuse it across chunks within that call (the current code already does this at line 101, so the fix is just removing the `batchStmt` helper and inlining the `.prepare()` call once):

```ts
export function batchFetchCriticReviews(gameIds: number[]) {
  if (!gameIds.length) return new Map<number, Array<{ critic_id: number; score: number }>>();
  const db = getDb();
  const stmt = db.prepare(
    `SELECT game_id, critic_id, score FROM critic_reviews WHERE game_id IN (${Array(BATCH_CHUNK_SIZE).fill("?").join(",")})`
  );
  // ... rest of function using stmt
}
```

**Severity rationale:** P0 because the comment claims statement caching but the code doesn't achieve it, and the pattern is fragile to refactoring. Under load, `prepare()` on every call is a performance regression vs. the intended design.

---

## New Architectural Concerns — P1

### P1-NEW-1 · `robots.ts` duplicates `BASE_URL` from `lib/config.ts`

**Files:** `app/robots.ts:3`, `lib/config.ts:10`
```ts
// app/robots.ts
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://gamepulse.example.com";

// lib/config.ts
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://gamepulse.example.com";
```

**Impact:** The base URL is defined in two places with the same fallback. If someone updates the fallback or env variable name in one location but not the other, `robots.txt` and `sitemap.xml` will point to different origins — a silent SEO defect that's extremely hard to debug. The `sitemap.ts` file correctly imports from `lib/config`, but `robots.ts` has its own copy.

**Fix:**
```ts
// app/robots.ts
import { BASE_URL } from "@/lib/config";
```

---

### P1-NEW-2 · `feed_items` filter accepts arbitrary `item_type` values without validation

**File:** `lib/queries/feed.ts:6-9`
```ts
export function getFeedData(filter?: string) {
  const db = getDb();
  const useFilter = filter && filter !== "all";
  const whereClause = useFilter ? `WHERE fi.item_type = ?` : "";
```

**Called from:** `app/feed/page.tsx:27` where `filter` comes directly from `searchParams`:
```ts
const filter = getSingle(params.filter) ?? "all";
const { items, releases, newsletterPreview } = getFeedData(filter);
```

**Impact:** While the query is parameterized (no SQL injection), any arbitrary string from the URL query parameter is passed as a SQL `WHERE` filter value. A user can navigate to `/feed?filter=xss_test` and the query silently returns zero results. This isn't a security vulnerability per se, but it violates the defense-in-depth principle established for `toggleUserList` (which now validates `listType` against `VALID_LIST_TYPES`).

More practically, the feed page defines its valid filter values at `app/feed/page.tsx:17-23`:
```ts
const filters = [
  { label: "All", value: "all" },
  { label: "Reviews", value: "review" },
  { label: "News", value: "news" },
  { label: "Deals", value: "deals" },
  { label: "Videos", value: "video" },
];
```

These valid values are only used for UI rendering — the data layer has no awareness of them.

**Fix:** Validate against an allowlist before querying:
```ts
const VALID_FEED_FILTERS = new Set(["review", "news", "deals", "video"]);

export function getFeedData(filter?: string) {
  const db = getDb();
  const useFilter = filter && filter !== "all" && VALID_FEED_FILTERS.has(filter);
  // ...
}
```

Or co-locate the valid filter values in `lib/config.ts` and import from both the query module and the page.

---

### P1-NEW-3 · `getBrowseData` constructs SQL `LIKE` clause with unescaped user input for category filter

**File:** `lib/queries/games.ts:147-149`
```ts
if (filters.category && filters.category !== "all") {
  conditions.push(`LOWER(categories) LIKE ?`);
  params.push(`%"${filters.category.toLowerCase()}"%`);
}
```

**Impact:** The `category` value comes from `searchParams` (URL query string). While parameterized queries prevent SQL injection, the value is embedded inside a `LIKE` pattern with `%` wildcards. If a user crafts a category like `Strategy%` or `_trategy`, SQLite's `LIKE` operator interprets `%` and `_` as wildcards, potentially matching unintended rows.

For example, `/browse?category=S_rategy` would match "Strategy" because `_` matches any single character in SQLite LIKE. Similarly, `/browse?category=Str%` would match any category starting with "Str".

The same pattern applies to the text search query at line 141-143:
```ts
const like = `%${query}%`;
params.push(like, like, like);
```

Here, a search for `100%` would match any row containing "100" followed by anything.

**Fix:** Escape `LIKE` special characters in user input:
```ts
function escapeLike(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}

// Then in the query:
conditions.push(`LOWER(categories) LIKE ? ESCAPE '\\'`);
params.push(`%"${escapeLike(filters.category.toLowerCase())}"%`);
```

---

### P1-NEW-4 · `getGamePageData` calls `getMatchedCritics()` on every game page, even for anonymous visitors

**File:** `lib/queries/games.ts:72`
```ts
const matchedCritics = getMatchedCritics();
```

**Impact:** `getMatchedCritics()` is now `React.cache`-wrapped (P1-NEW-2 from review #2 is fixed), so it deduplicates within a single request. However, it is still called unconditionally for every game detail page load. This function:

1. Fetches the current user
2. Computes the user's taste profile from all their ratings
3. Loads ALL critics from the database
4. Batch-fetches ALL critic reviews (entire `critic_reviews` table)
5. Computes Pearson correlation and cosine similarity for every critic

This O(critics × games) computation runs on every `/games/[slug]` page view, even though only 3 matched critics are used (line 122: `matchedCritics: matchedCritics.slice(0, 3)`) and the personalized score uses the full list but could accept a smaller set.

The same computation also runs on every `/critics/[slug]` page (via `getCriticPageData`), every `/critics` directory page (via `getCriticDirectory`), and every `/me` dashboard page (via `getUserDashboard`).

Within a single request, `React.cache` ensures it runs once. But across requests (which is the normal case for page loads from different users or even the same user navigating), there is no cross-request caching.

**Fix:** For an MVP where the data is seed-only, consider:
1. Pre-computing matched critics as a materialized view or cached result with a TTL
2. Adding `unstable_cache` from Next.js to cache across requests with a time-based revalidation tag:
   ```ts
   import { unstable_cache } from "next/cache";
   
   export const getMatchedCriticsForUser = unstable_cache(
     (userId: number) => { /* existing computation */ },
     ["matched-critics"],
     { revalidate: 60 }
   );
   ```
3. At minimum, for the game page, only compute the personalized score and top-3 critics — not the full ranked list

---

## Status of Previously Reported Issues (Cumulative)

| Issue | Status | Notes |
|-------|--------|-------|
| **Review 1** | | |
| P0-1 WAL files in git | ✅ Fixed | `.gitignore` now includes `*.db-shm` and `*.db-wal` |
| P0-2 No auth layer | ⏳ Open | Still hardcoded `is_current = 1`; expected for MVP |
| P0-3 No existence checks | ✅ Fixed | All three actions now validate entity existence |
| P1-1 Redundant `getCurrentUser()` | ✅ Fixed | Wrapped in `React.cache` |
| P1-2 `getAllGames()` for similar | ✅ Fixed | Now uses top-20 by `critics_score` |
| P1-3 `getBrowseData()` JS filtering | ✅ Fixed | SQL-level WHERE + ORDER BY |
| P1-4 N+1 `getPersonalizedScore()` | ✅ Fixed | `batchFetchCriticReviews()` with fixed-size chunks |
| P1-5 Module-level `toastId` | ✅ Fixed | Now `useRef` inside `ToastProvider` |
| P2-1 Duplicated `getSingle()` | ✅ Fixed | Centralized in `lib/utils.ts` |
| P2-2 Duplicated `clamp()` | ⏳ Open | Still duplicated in `scoring.ts:5` and `seed.ts:17` |
| P2-3 Repeated toast effect | ✅ Fixed | `useActionToast` custom hook extracted |
| P2-4 Inline `as` casts | ⏳ Open | Still present throughout |
| P2-5 Magic numbers | ⏳ Open | Still present in scoring/seed |
| P2-6 Weak email validation | ⏳ Open | Still `email.includes("@")` at `actions.ts:120` |
| P2-7 Large game page | ⏳ Open | 209 lines, still a single component |
| P2-8 `seed.ts` God Function | ⏳ Open | 365 lines, still one large function (but seed data extracted to `seeds/`) |
| P2-9 No test infrastructure | ⏳ Open | No tests or test runner |
| P2-10 Duplicated metadata fetch | ✅ Fixed | `cache(getGamePageData)` applied |
| **Review 2** | | |
| P0-NEW-1 Unbounded stmt cache | ✅ Fixed | Fixed-size chunks in `batchFetchCriticReviews` |
| P0-NEW-2 `dangerouslySetInnerHTML` XSS | ✅ Fixed | `safeJsonLd()` in `lib/utils.ts` |
| P0-NEW-3 `listType` not validated | ✅ Fixed | `VALID_LIST_TYPES` allowlist at `actions.ts:56` |
| P1-NEW-1 `getCriticPageData` full compute | ✅ Fixed | `getMatchedCritics` now wrapped in `React.cache` |
| P1-NEW-2 Missing `React.cache` on queries | ✅ Fixed | `getCurrentUserRatings`, `getCurrentUserTasteProfile`, `getMatchedCritics` all cached |
| P1-NEW-3 `revalidatePath` stale windows | ✅ Fixed | Actions now use `revalidatePath("/", "layout")` |
| P1-NEW-4 `getAllGames()` on dashboard | ✅ Fixed | SQL-based candidate selection in `dashboard.ts:29` |
| P1-NEW-5 Sitemap full table scan | ✅ Fixed | Slug-only query + `revalidate = 3600` |

---

## Refactoring Roadmap (New Issues Only)

### High Impact, Low Effort
1. **P1-NEW-1:** Import `BASE_URL` from `lib/config` in `robots.ts` — 2-line change
2. **P1-NEW-2:** Add feed filter allowlist validation — 3-line change
3. **P0-NEW-1:** Inline `batchStmt` into `batchFetchCriticReviews` — single `.prepare()` call at function entry

### High Impact, Medium Effort
4. **P1-NEW-3:** Escape LIKE wildcards in `getBrowseData` query/category params — add `escapeLike()` helper
5. **P1-NEW-4:** Add cross-request caching for `getMatchedCritics` via `unstable_cache` or pre-computation

---

## Positive Changes Since Last Review

| Area | Observation |
|------|-------------|
| **React.cache coverage** | All four expensive user-query functions now wrapped in `React.cache` — eliminates all intra-request duplication |
| **Batch reviews** | `batchFetchCriticReviews()` uses fixed-size chunks with padding — statement cache is now bounded |
| **Input validation** | `listType` allowlist, existence checks on all entities, `safeJsonLd` for XSS prevention |
| **Revalidation strategy** | `revalidatePath("/", "layout")` ensures consistent cross-page cache invalidation |
| **Sitemap efficiency** | Slug-only query with 1-hour `revalidate` — no more full table scans per crawler hit |
| **Seed data extraction** | Seed source data now lives in `lib/db/seeds/` (critics, games, users) — cleaner separation |
| **Config centralization** | `lib/config.ts` consolidates env-derived values and application constants |
| **Utility consolidation** | `lib/utils.ts` hosts `getSingle`, `safeJsonParse`, and `safeJsonLd` — good shared module |

---

*Review conducted against commit HEAD. All line numbers reference the codebase as of review date.*
