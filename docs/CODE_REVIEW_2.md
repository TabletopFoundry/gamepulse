# Code Quality & Architecture Review — GamePulse (Follow-up)

**Reviewed:** 2025-07-19
**Scope:** Full codebase (`10-gamepulse/`), delta from `docs/CODE_REVIEW.md`
**Objective:** Surface only genuinely new P0/P1 issues not already documented

---

## Executive Summary

The previous review (CODE_REVIEW.md) was thorough and many of its recommendations have been partially addressed — `getCurrentUser()` is now wrapped in `React.cache` (P1-1 fixed), the `toastId` counter was moved to `useRef` (P1-5 fixed), `useActionToast` was extracted (P2-3 fixed), `getSingle()` was centralized into `lib/utils.ts` (P2-1 fixed), existence checks were added to server actions (P0-3 fixed), `getBrowseData()` now uses SQL-level filtering (P1-3 fixed), `getPersonalizedScore()` accepts an optional batched map (P1-4 partially fixed), similar-games now uses a top-20 candidate set instead of `getAllGames()` (P1-2 partially fixed), and `.gitignore` now covers `*.db-shm` / `*.db-wal` (P0-1 fixed).

This follow-up review found **3 new P0 issues** and **5 new P1 issues** not previously documented.

| Dimension              | Rating (updated) |
|------------------------|------------------|
| Overall Quality Score  | **B+** (unchanged) |
| Architecture Health    | **Good**         |
| Maintainability Index  | **Medium-High**  |
| Technical Debt Estimate| **Low-Medium**   |

---

## New Critical Findings — P0 (Must Address)

### P0-NEW-1 · SQL injection via string interpolation in `batchFetchCriticReviews()`

**File:** `lib/scoring.ts:93-94`
```ts
const placeholders = gameIds.map(() => "?").join(",");
const rows = db.prepare(`SELECT game_id, critic_id, score FROM critic_reviews WHERE game_id IN (${placeholders})`).all(...gameIds);
```
**Impact:** While the current implementation generates `?` placeholders (safe), the pattern of interpolating into the SQL string is fragile. The real issue is that `better-sqlite3` compiles and caches prepared statements by SQL text. Because the number of placeholders varies with every call, this creates an unbounded prepared-statement cache — one compiled statement per unique array length. With frequent calls across different game-set sizes, this leaks memory and degrades SQLite performance over time.

**Fix:** Use a fixed-size batch approach or a temporary table:
```ts
// Option 1: Chunk into fixed batch sizes (e.g., 50) for cache-friendly prepared statements
const BATCH_SIZE = 50;
const stmt = db.prepare(
  `SELECT game_id, critic_id, score FROM critic_reviews WHERE game_id IN (${Array(BATCH_SIZE).fill("?").join(",")})`
);

// Pad arrays to BATCH_SIZE with -1 (no game will match)
for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
  const chunk = gameIds.slice(i, i + BATCH_SIZE);
  while (chunk.length < BATCH_SIZE) chunk.push(-1);
  const rows = stmt.all(...chunk);
  // accumulate...
}
```

---

### P0-NEW-2 · `dangerouslySetInnerHTML` with `JSON.stringify` on user-influenced data

**File:** `app/games/[slug]/page.tsx:54`
```ts
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
**Impact:** The `jsonLd` object includes `game.description` which is derived from `game.hook` in `seed.ts` — currently safe since it's seeded data. However, this pattern is a latent XSS vector. If descriptions ever come from user input or an external API, an attacker could inject `</script><script>alert(1)</script>` into a game title or description. `JSON.stringify` does **not** escape `</script>` sequences by default.

**Fix:** Sanitize the JSON-LD output by escaping dangerous sequences:
```ts
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
```

---

### P0-NEW-3 · `listType` parameter in `toggleUserList` is not validated — accepts arbitrary strings

**File:** `lib/actions.ts:59`
```ts
const listType = String(formData.get("listType") ?? "watchlist");
```
**Impact:** The action stores `listType` directly into the `user_lists` table with no allowlist check. Any client can submit `listType=anything_malicious` via form manipulation. While parameterized queries prevent SQL injection, this pollutes the database with arbitrary `list_type` values that downstream code (`user_lists` queries filtering by `watchlist`/`wishlist`) will never surface — creating orphaned rows and confusing data integrity.

**Fix:** Validate against an allowlist:
```ts
const VALID_LIST_TYPES = new Set(["watchlist", "wishlist"]);
const listType = String(formData.get("listType") ?? "watchlist");
if (!VALID_LIST_TYPES.has(listType)) {
  return { success: false, message: "Invalid list type." };
}
```

---

## New Architectural Concerns — P1

### P1-NEW-1 · `getCriticPageData()` computes ALL critic matches just to find one

**File:** `lib/queries/critics.ts:12`
```ts
const matchedCritic = getMatchedCritics().find((candidate) => candidate.slug === slug) ?? null;
```
**Impact:** `getMatchedCritics()` loads every critic, batch-fetches all critic reviews from the database, and computes Pearson correlations and cosine similarities for every critic — all to extract a single match for the current page. This is O(critics × games) work for a single-critic page view. The same expensive call happens again in `getCriticDirectory()` which lists all critics.

The `/critics` directory page triggers `getMatchedCritics()` (via `getCriticDirectory()`). Then navigating to `/critics/[slug]` triggers `getMatchedCritics()` again. Since `getMatchedCritics()` is **not** wrapped in `React.cache`, each route re-executes the full computation independently.

**Fix:**
1. Wrap `getMatchedCritics` in `React.cache` (it already uses `cache` for `getCurrentUser` — apply the same pattern):
   ```ts
   export const getMatchedCritics = cache((): MatchedCritic[] => {
     // existing implementation
   });
   ```
2. For critic page, accept a pre-computed list or add a targeted `getMatchedCritic(slug)` that only computes the single match needed.

---

### P1-NEW-2 · `React.cache` on synchronous `better-sqlite3` calls does not deduplicate across requests

**Files:** `lib/queries/user.ts:8`, `lib/queries/games.ts:8`, `app/games/[slug]/page.tsx:13`, `app/critics/[slug]/page.tsx:14`

**Impact:** `React.cache` only deduplicates within a **single React server render** (one request). The codebase applies `React.cache` to `getCurrentUser`, `getSearchOptions`, `getCachedGamePageData`, and `getCachedCriticPageData` — which correctly deduplicates `generateMetadata` + page component within the same request. However, `getMatchedCritics()`, `getCurrentUserRatings()`, `getCurrentUserTasteProfile()`, `getAllGames()` and `getUserDashboard()` are **not** cached at all.

On the `/me` dashboard page, `getUserDashboard()` calls `getCurrentUser()` (cached ✓), then `getCurrentUserRatings()`, `getMatchedCritics()`, `getCurrentUserTasteProfile()`, and `getAllGames()` — none of which are cached. If any middleware, layout, or metadata function also calls these, they execute redundantly.

More critically, `getMatchedCritics()` internally calls `getCurrentUser()` and `getCurrentUserTasteProfile()` which itself calls `getCurrentUser()` again. While `getCurrentUser()` is cached, `getCurrentUserTasteProfile()` is not — so its query runs twice per dashboard load (once from `getUserDashboard` line 13, once from `getMatchedCritics` line 60).

**Fix:** Apply `React.cache` to the remaining expensive query functions:
```ts
export const getCurrentUserTasteProfile = cache(() => { /* ... */ });
export const getMatchedCritics = cache((): MatchedCritic[] => { /* ... */ });
export const getCurrentUserRatings = cache(() => { /* ... */ });
```

---

### P1-NEW-3 · `revalidatePath` pattern in server actions creates stale-data windows

**File:** `lib/actions.ts:48-50, 72-73, 100-101`
```ts
revalidatePath(path);
revalidatePath(`/games/${slug}`);
revalidatePath("/me");
```
**Impact:** Server actions revalidate the current path, the game page, and `/me` — but not `/browse`, `/feed`, `/critics`, or the homepage `/`. After submitting a community review, the homepage's "trending games" section, the browse page results, and the feed still serve stale community scores and review counts until the 60-second `revalidate` timer expires (or the full-page `force-dynamic` re-renders).

This creates an inconsistency: the game detail page immediately reflects the new review, but every other page that shows `communityScore` or `communityReviewCount` for that game shows stale data.

**Fix:** Either:
1. Revalidate more broadly: `revalidatePath("/", "layout")` to invalidate all pages under the root layout
2. Or use tag-based revalidation for finer control:
   ```ts
   // In data fetchers:
   import { unstable_cacheTag as cacheTag } from "next/cache";
   // ... use cacheTag("games") in game queries
   
   // In actions:
   import { revalidateTag } from "next/cache";
   revalidateTag("games");
   ```

---

### P1-NEW-4 · `getAllGames()` is still called on every dashboard load to compute personalized picks

**File:** `lib/queries/dashboard.ts:29`
```ts
const candidateGames = getAllGames()
  .filter((game) => !ratings.some((rating) => rating.slug === game.slug));
```
**Impact:** `getAllGames()` loads every game, JSON-parses `categories`, `mechanics`, and `taste_profile` for each, and computes consensus — all to filter out rated games and find personalized picks. This is the same O(n) full-table-scan pattern flagged for `getBrowseData` (which was fixed) but still present here.

Additionally, the filter uses `ratings.some()` which is O(ratings) per game — making the total filter O(games × ratings).

**Fix:** Push the exclusion into SQL:
```ts
const ratedGameIds = ratings.map(r => r.slug); // or fetch IDs
const candidateGames = db.prepare(`
  SELECT * FROM games 
  WHERE slug NOT IN (SELECT g.slug FROM community_reviews cr JOIN games g ON g.id = cr.game_id WHERE cr.user_id = ?)
  ORDER BY buzz DESC
  LIMIT 20
`).all(user.id) as RawGame[];
```
This avoids loading and parsing every game and reduces the candidate set to only the top-20 unrated games by buzz.

---

### P1-NEW-5 · `sitemap.ts` calls `getAllGames()` without caching — full table scan on every sitemap request

**File:** `app/sitemap.ts:7`
```ts
const games = getAllGames();
```
**Impact:** Every sitemap request triggers a full table scan with JSON parsing of every game row. Sitemaps are often crawled by multiple bots and can be requested frequently. `getAllGames()` is not wrapped in `React.cache`, so this work is not deduplicated.

Additionally, the sitemap hardcodes `lastModified: new Date()` for every entry, which tells search engines every page changed "right now" — defeating the purpose of `lastModified` as a change-detection signal.

**Fix:**
1. Use a lighter SQL query that only fetches slugs:
   ```ts
   const slugs = db.prepare(`SELECT slug FROM games`).all() as Array<{ slug: string }>;
   ```
2. Set meaningful `lastModified` values based on actual data (e.g., latest review date per game).
3. Add `revalidate = 3600` to limit regeneration frequency.

---

## Status of Previously Reported Issues

| Issue | Status | Notes |
|-------|--------|-------|
| P0-1 WAL files in git | ✅ Fixed | `.gitignore` now includes `*.db-shm` and `*.db-wal` |
| P0-2 No auth layer | ⏳ Open | Still hardcoded `is_current = 1`; expected for MVP |
| P0-3 No existence checks | ✅ Fixed | All three actions now validate entity existence |
| P1-1 Redundant `getCurrentUser()` | ✅ Fixed | Wrapped in `React.cache` |
| P1-2 `getAllGames()` for similar | ⚡ Improved | Now uses top-20 by `critics_score` instead of all |
| P1-3 `getBrowseData()` JS filtering | ✅ Fixed | SQL-level WHERE + ORDER BY |
| P1-4 N+1 `getPersonalizedScore()` | ✅ Fixed | `batchFetchCriticReviews()` added |
| P1-5 Module-level `toastId` | ✅ Fixed | Now `useRef` inside `ToastProvider` |
| P2-1 Duplicated `getSingle()` | ✅ Fixed | Centralized in `lib/utils.ts` |
| P2-2 Duplicated `clamp()` | ⏳ Open | Still duplicated in `scoring.ts` and `seed.ts` |
| P2-3 Repeated toast effect | ✅ Fixed | `useActionToast` custom hook extracted |
| P2-4 Inline `as` casts | ⏳ Open | Still present throughout |
| P2-5 Magic numbers | ⏳ Open | Still present in scoring/seed |
| P2-6 Weak email validation | ⏳ Open | Still `email.includes("@")` |
| P2-7 Large game page | ⏳ Open | 209 lines now (grew slightly) |
| P2-8 `seed.ts` God Function | ⏳ Open | 365 lines, still one large function |
| P2-9 No test infrastructure | ⏳ Open | No tests or test runner |
| P2-10 Duplicated metadata fetch | ✅ Fixed | `cache(getGamePageData)` applied |

---

## Refactoring Roadmap (New Issues Only)

### High Impact, Low Effort
1. **P0-NEW-3:** Add `listType` allowlist validation in `toggleUserList` (3-line fix)
2. **P1-NEW-2:** Wrap `getMatchedCritics`, `getCurrentUserTasteProfile`, `getCurrentUserRatings` in `React.cache` (1-line change each)
3. **P1-NEW-5:** Replace `getAllGames()` in sitemap with a slug-only query + add `revalidate`

### High Impact, Medium Effort
4. **P0-NEW-2:** Sanitize JSON-LD output with `</script>` escaping
5. **P1-NEW-1:** Add targeted single-critic match function or cache `getMatchedCritics`
6. **P1-NEW-4:** Push personalized-pick candidate selection into SQL

### Medium Impact, Medium Effort
7. **P0-NEW-1:** Switch `batchFetchCriticReviews` to fixed-size batch chunks
8. **P1-NEW-3:** Broaden `revalidatePath` scope or adopt tag-based revalidation

---

## Positive Changes Since Last Review

| Area | Observation |
|------|-------------|
| **P0 fixes** | Existence checks added to all server actions; WAL files properly gitignored |
| **React.cache adoption** | `getCurrentUser`, `getSearchOptions`, game/critic page data all properly cached |
| **N+1 elimination** | `batchFetchCriticReviews()` cleanly solves the per-game query loop |
| **SQL filtering** | `getBrowseData()` now pushes all filters into parameterized SQL — well implemented |
| **Custom hook extraction** | `useActionToast` is clean and correctly handles the formRef reset pattern |
| **Utility consolidation** | `getSingle()` moved to shared `lib/utils.ts` |
| **Similar games optimization** | Uses top-20 candidate set instead of full table scan |

---

*Review conducted against commit HEAD. All line numbers reference the codebase as of review date.*
