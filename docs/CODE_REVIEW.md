# Code Quality & Architecture Review — GamePulse

**Reviewed:** 2025-07-18
**Scope:** Full codebase (`10-gamepulse/`)
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · SQLite (better-sqlite3) · Tailwind CSS 4 · Recharts

---

## Executive Summary

| Dimension              | Rating         |
|------------------------|----------------|
| Overall Quality Score  | **B+**         |
| Architecture Health    | **Good**       |
| Maintainability Index  | **Medium-High** |
| Technical Debt Estimate| **Low-Medium**  |

The codebase is well-organized, idiomatically typed, and follows modern Next.js patterns (App Router, Server Actions, async `params`/`searchParams`). The layered split into `lib/queries/`, `lib/db/`, and `components/` provides clear module boundaries. Several issues—primarily around redundant queries, data leaking through the WAL files, and copy-paste duplication—prevent an "A" rating. All findings are actionable and most are low-effort.

---

## Critical Findings — P0 (Must Address)

### P0-1 · SQLite WAL/SHM files tracked in Git

**Files:** `data/gamepulse.db-shm`, `data/gamepulse.db-wal` (tracked via `git ls-files`)
**Impact:** Binary database journal files contain live data and change on every write. They create noisy diffs, merge conflicts, and may leak user-submitted data into version control.
**Root cause:** `.gitignore` excludes `*.db` but not `*.db-shm` and `*.db-wal`.
**Fix:**
```gitignore
# .gitignore — add these two lines
*.db-shm
*.db-wal
```
Then run:
```bash
git rm --cached data/gamepulse.db-shm data/gamepulse.db-wal
```

---

### P0-2 · No authentication layer — `getCurrentUser()` hardcodes a single DB row

**File:** `lib/queries/user.ts:7-10`
```ts
export function getCurrentUser() {
  const db = getDb();
  const user = db.prepare(`SELECT * FROM community_users WHERE is_current = 1 LIMIT 1`).get() as RawUser;
  return parseUser(user);
}
```
**Impact:** Every mutating Server Action (`submitCommunityReview`, `toggleUserList`, `toggleFollowCritic`) operates on a globally-hardcoded user. There is no session, cookie, or auth check. In production this would let any visitor perform writes as "alex".
**Fix (for MVP/demo):** Add a comment `// MOCK: replace with real auth before production` and ensure the README documents this is demo-only. For production, integrate NextAuth.js or a session cookie and derive `userId` from the request context.

---

### P0-3 · Server Actions accept trust-the-client `gameId` and `criticId` without ownership checks

**File:** `lib/actions.ts:19, 55, 82`
**Impact:** `gameId` and `criticId` are read straight from `FormData` and used in SQL. Although parameterized (no SQL injection), there is no validation that these IDs actually exist in the database before writing. Inserting a review for a nonexistent `game_id` would succeed silently due to missing FK enforcement at runtime (SQLite FKs are off by default in some paths).
**Fix:** Add existence checks:
```ts
const game = db.prepare(`SELECT id FROM games WHERE id = ?`).get(gameId);
if (!game) return { success: false, message: "Game not found." };
```

---

## Architectural Concerns — P1

### P1-1 · Redundant `getCurrentUser()` calls cascade through every request

**Files:** `lib/queries/user.ts`, `lib/queries/dashboard.ts`, `lib/queries/games.ts`, `lib/queries/critics.ts`
**Detail:** `getUserDashboard()` calls `getCurrentUser()` → which calls `getDb()` + SQL. Then it calls `getCurrentUserRatings()` which calls `getCurrentUser()` again. Then `getMatchedCritics()` calls `getCurrentUser()` yet again, plus `getCurrentUserTasteProfile()` which calls `getCurrentUser()` a fourth time. A single `/me` page load executes `SELECT * FROM community_users WHERE is_current = 1` at least **4 times**.
**Fix:** Accept the user as a parameter:
```ts
export function getUserDashboard() {
  const user = getCurrentUser();
  const ratings = getCurrentUserRatings(user);
  const matchedCritics = getMatchedCritics(user);
  // …
}
```
Or introduce a per-request context via `React.cache`:
```ts
import { cache } from "react";
export const getCurrentUser = cache(() => {
  const db = getDb();
  return parseUser(db.prepare(`SELECT * FROM community_users WHERE is_current = 1 LIMIT 1`).get() as RawUser);
});
```

---

### P1-2 · `getGamePageData()` calls `getAllGames()` to find 3 similar games

**File:** `lib/queries/games.ts:74-77`
```ts
const similarGames = getAllGames()
  .filter((candidate) => candidate.slug !== game.slug)
  .sort(…)
  .slice(0, 3);
```
**Impact:** Loads and parses every game from the database, then JSON-parses every `categories`, `mechanics`, and `taste_profile` column — just to rank and discard all but 3. As the game catalog grows this becomes O(n) work per page view.
**Fix:** Compute similarity in SQL or pre-compute a similarity index. Short-term, add `LIMIT` + a taste-profile filter in the query to reduce the working set.

---

### P1-3 · `getBrowseData()` also calls `getAllGames()` then filters in JS

**File:** `lib/queries/games.ts:127-163`
**Detail:** All filtering (category, player count, complexity, sort) happens in JavaScript after loading every row. With 40+ games this is fine; at 1000+ it becomes a scalability bottleneck.
**Fix:** Build a parameterized SQL query with `WHERE` clauses for each filter. The sort can also be pushed into `ORDER BY`.

---

### P1-4 · `getPersonalizedScore()` makes a per-game DB call inside a loop

**File:** `lib/scoring.ts:63-65`
```ts
export function getPersonalizedScore(gameId: number, matchedCritics: MatchedCritic[]) {
  const db = getDb();
  const reviews = db.prepare(`SELECT critic_id, score FROM critic_reviews WHERE game_id = ?`).all(gameId);
```
**Called from:** `lib/queries/dashboard.ts:31` inside `.map()` over all unrated games.
**Impact:** Classic N+1 query. For 30 unrated games = 30 additional DB round-trips.
**Fix:** Batch-fetch all `critic_reviews` for the candidate game IDs in a single query, then compute scores in memory. The N+1 fix pattern already exists in `getMatchedCritics()` (line 68-78 of `user.ts`) and should be reused.

---

### P1-5 · Global mutable `toastId` counter in module scope

**File:** `components/toast.tsx:22`
```ts
let toastId = 0;
```
**Impact:** Module-level mutable state survives across hot-reloads and multiple `ToastProvider` instances. In SSR environments or concurrent rendering, this could theoretically produce ID collisions or stale closures.
**Fix:** Move the counter inside the `ToastProvider` component using `useRef`:
```ts
const nextId = useRef(0);
const id = ++nextId.current;
```

---

## Code Smell Inventory — P2

### P2-1 · Duplicated `getSingle()` utility

**Files:** `app/browse/page.tsx:16-18`, `app/feed/page.tsx:16-18`
**Severity:** Low — Copy-paste smell.
**Fix:** Extract to `lib/utils.ts` and import from both pages.

---

### P2-2 · Duplicated `clamp()` function

**Files:** `lib/scoring.ts:5-7`, `lib/db/seed.ts:17-19`
**Severity:** Low — Identical implementation in two places.
**Fix:** Import from `lib/scoring.ts` in `seed.ts`, or extract to a shared `lib/math.ts`.

---

### P2-3 · Identical toast-effect pattern repeated 4 times in `action-forms.tsx`

**File:** `components/action-forms.tsx` — lines 19-26, 56-63, 95-101, 128-135
```ts
useEffect(() => {
  if (state?.success) {
    addToast(state.message, "success");
    formRef.current?.reset();
  } else if (state && !state.success) {
    addToast(state.message, "error");
  }
}, [state, addToast]);
```
**Fix:** Extract a custom hook:
```ts
function useActionToast(state: ActionResult | null, formRef?: RefObject<HTMLFormElement | null>) {
  const { addToast } = useToast();
  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      formRef?.current?.reset();
    } else if (state && !state.success) {
      addToast(state.message, "error");
    }
  }, [state, addToast, formRef]);
}
```

---

### P2-4 · Inline type assertions (`as`) throughout query modules

**Files:** Every file in `lib/queries/` and `lib/actions.ts`
**Example:** `lib/queries/feed.ts:15-26` — a 14-field inline type assertion after `.all()`.
**Impact:** `as` casts bypass the type system. If the SQL schema changes, TypeScript won't catch the mismatch.
**Fix:** Create named row types (partially done in `types.ts` for `RawGame`, `RawCritic`, `RawUser`) and expand coverage to critic reviews, feed items, awards, etc. Consider a thin wrapper:
```ts
function queryAll<T>(db: Database, sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}
```

---

### P2-5 · Magic numbers in scoring formulas

**File:** `lib/db/seed.ts:38-40`
```ts
return clamp(Math.round(42 + taste * 0.58 + game.buzz * 0.12 + game.rising * 0.08 - complexityPenalty + noise), 47, 98);
```
Also `lib/scoring.ts:24-28` (buildConsensus thresholds) and `lib/queries/user.ts:97-98` (match formula).
**Fix:** Extract into named constants:
```ts
const CRITIC_BASE_SCORE = 42;
const TASTE_WEIGHT = 0.58;
const BUZZ_WEIGHT = 0.12;
// …
```

---

### P2-6 · Weak email validation in `subscribeNewsletter`

**File:** `lib/actions.ts:111`
```ts
if (!email || !email.includes("@") || email.length < 5) {
```
**Impact:** Accepts `a@b.c` or `@@@@@@`. Not critical for an MVP but worth noting.
**Fix:** Use a stricter regex or a validation library (e.g., `zod`). Consider `z.string().email()`.

---

### P2-7 · `games/[slug]/page.tsx` is the longest page at 191 lines

**File:** `app/games/[slug]/page.tsx`
**Detail:** Contains hero section, score cards, shelves, critic reviews, game info, prices, community reviews, review form, similar games, and matched critics — all in a single component.
**Fix:** Extract sub-sections into named server components (`CriticBreakdown`, `PriceComparison`, `CommunityReviewSection`, `SimilarGames`) for readability and independent revalidation.

---

### P2-8 · `seed.ts` at 359 lines — God Function risk

**File:** `lib/db/seed.ts`
**Detail:** `seedDatabase()` spans ~270 lines (86-357) with nested loops, inline business logic, and hardcoded lists.
**Fix:** Split into `seedCritics()`, `seedGames()`, `seedReviews()`, `seedFeedItems()`, etc. The transaction wrapper can call them sequentially.

---

### P2-9 · No test infrastructure

**Impact:** There are zero test files, no test runner configured (`jest`, `vitest`, etc.), and no CI pipeline.
**Priority:** P2 for an MVP/prototype, but P1 for any production path.
**Fix:** Add `vitest` (aligns well with Next.js). Priority test targets:
1. `lib/scoring.ts` — pure functions, easy to unit test
2. `lib/queries/parsers.ts` — parsing logic
3. `lib/actions.ts` — server action validation logic
4. `lib/taste.ts` — type definitions (snapshot tests)

---

### P2-10 · `generateMetadata()` duplicates the full data fetch

**Files:** `app/games/[slug]/page.tsx:12-26`, `app/critics/[slug]/page.tsx:13-27`
**Detail:** `generateMetadata()` calls `getGamePageData(slug)` / `getCriticPageData(slug)` which runs all queries. Then the page component calls the same function again. Next.js may deduplicate `fetch()` calls, but `better-sqlite3` is synchronous and not memoized by the framework.
**Fix:** Use `React.cache` to memoize the data-fetching function:
```ts
import { cache } from "react";
const getCachedGamePageData = cache(getGamePageData);
```
Then use `getCachedGamePageData` in both `generateMetadata` and the page component.

---

## SOLID Violations

### SRP Violations
| Location | Issue |
|----------|-------|
| `lib/db/seed.ts` | Seed function handles critics, users, games, reviews, prices, awards, feed items, lists, and follows — 9+ responsibilities |
| `app/games/[slug]/page.tsx` | Single component renders 7 distinct UI sections |
| `lib/queries/games.ts:getGamePageData()` | Fetches game, reviews, prices, awards, user lists, matched critics, personalized score, and similar games in one function (174 lines) |

### DIP Violations
| Location | Issue |
|----------|-------|
| `lib/queries/*.ts` | Every query function directly calls `getDb()` internally rather than receiving a database handle. This makes unit testing impossible without hitting the real database. |
| `lib/actions.ts` | `getCurrentUser()` is called inside actions rather than being injected, coupling actions to the global user resolution strategy. |

### OCP Observation
The consensus badge system (`buildConsensus` in `scoring.ts`, `ConsensusBadge` in `gamepulse-ui.tsx`) uses hardcoded if/else chains. Adding a new consensus label requires modifying both files. A map-based configuration would be more extensible:
```ts
const CONSENSUS_RULES = [
  { label: "Critically Acclaimed", test: (c, u, r) => c >= 86 && u >= 80 },
  // …
];
```

---

## Refactoring Roadmap

### High Impact, Low Effort
1. **P0-1:** Add `*.db-shm` and `*.db-wal` to `.gitignore` and untrack them
2. **P1-1:** Wrap `getCurrentUser()` with `React.cache` (1-line change)
3. **P2-1/P2-2:** Extract `getSingle()` and `clamp()` into shared utilities
4. **P2-3:** Extract `useActionToast` custom hook from `action-forms.tsx`
5. **P1-5:** Move `toastId` counter into `useRef`

### High Impact, High Effort
6. **P1-2/P1-3:** Push browse/similar-games filtering into SQL queries
7. **P1-4:** Batch `getPersonalizedScore()` queries to eliminate N+1
8. **P2-10:** Memoize data-fetching functions with `React.cache` for metadata + page
9. **P0-2/P0-3:** Add auth layer and input existence validation to server actions

### Medium Impact, Low Effort
10. **P2-5:** Replace magic numbers with named constants
11. **P2-6:** Strengthen email validation (or adopt `zod` for all action inputs)
12. **P2-4:** Create named row types for all SQL result shapes

### Medium Impact, High Effort
13. **P2-8:** Split `seedDatabase()` into domain-specific seed functions
14. **P2-7:** Decompose `games/[slug]/page.tsx` into sub-components
15. **P2-9:** Add `vitest` and unit tests for `lib/scoring.ts`, `lib/queries/parsers.ts`, `lib/actions.ts`

---

## Positive Observations

| Area | Observation |
|------|-------------|
| **TypeScript strictness** | `strict: true` in `tsconfig.json`; types are well-defined in `lib/queries/types.ts` and `lib/taste.ts` |
| **Modern Next.js patterns** | Correct use of async `params`/`searchParams`, `useActionState`, `useFormStatus`, server actions |
| **Accessibility** | Skip-link, `aria-label`, `aria-live` on toasts, `role="alert"` on errors, `role="combobox"` on search |
| **N+1 prevention** | `getMatchedCritics()` batch-fetches all critic reviews to avoid per-critic queries (`user.ts:68-78`) |
| **Module re-exports** | `lib/gamepulse.ts` and `lib/db.ts` provide clean barrel exports for backward compatibility |
| **Parser layer** | `lib/queries/parsers.ts` cleanly separates raw DB row shapes from domain types |
| **Schema design** | Proper `UNIQUE` constraints, foreign keys, and `CREATE TABLE IF NOT EXISTS` for idempotent init |
| **Seed versioning** | `app_meta` table tracks seed version for safe re-seeding on schema changes |
| **Loading states** | Every route has a `loading.tsx` with skeleton placeholders |
| **Error boundary** | `app/error.tsx` provides a global error UI with retry |
| **Consensus engine** | `buildConsensus()` provides a clear, readable scoring heuristic |
| **CSS architecture** | Tailwind utility classes with consistent design tokens (`rounded-[2rem]`, `tracking-[0.28em]`) |
| **Form UX** | Optimistic UI with `SubmitButton` pending states and toast notifications |

---

## Detailed Metrics

| File | Lines | Complexity Notes |
|------|-------|-----------------|
| `lib/db/seed.ts` | 359 | ⚠️ Exceeds 300-line threshold; `seedDatabase()` is ~270 lines |
| `app/games/[slug]/page.tsx` | 191 | ⚠️ Single component; decompose into sub-components |
| `lib/queries/games.ts` | 174 | `getGamePageData()` alone is ~95 lines; `getBrowseData()` is ~45 lines |
| `components/client-widgets.tsx` | 152 | Acceptable — 2 distinct components (search + chart) |
| `components/action-forms.tsx` | 144 | 4 form components with duplicated toast effect |
| `components/gamepulse-ui.tsx` | 144 | 9 small presentational components — good SRP |
| `lib/queries/user.ts` | 111 | `getMatchedCritics()` is ~55 lines — acceptable |
| `lib/scoring.ts` | 78 | Clean pure functions — excellent testability |
| `lib/taste.ts` | 11 | Minimal, well-scoped type module |

---

## Dependency Analysis

```
app/layout.tsx → components/client-widgets, components/toast, lib/gamepulse
app/page.tsx → components/gamepulse-ui, components/action-forms, lib/gamepulse
app/games/[slug] → components/gamepulse-ui, components/action-forms, lib/gamepulse
app/critics/[slug] → components/client-widgets, components/gamepulse-ui, components/action-forms, lib/gamepulse
app/me → components/client-widgets, components/gamepulse-ui, lib/gamepulse
app/browse → components/client-widgets, components/gamepulse-ui, lib/gamepulse
app/feed → components/gamepulse-ui, lib/gamepulse

lib/gamepulse.ts → lib/queries/* (barrel re-export)
lib/queries/* → lib/db, lib/scoring, lib/taste
lib/actions.ts → lib/db, lib/gamepulse
lib/db/connection.ts → lib/db/schema, lib/db/seed
lib/db/seed.ts → lib/taste, lib/db/seeds/*
lib/scoring.ts → lib/taste, lib/db
```

**No circular dependencies detected.** Dependency flow is unidirectional: `app/ → components/ → lib/queries/ → lib/db/`. The only cross-layer call is `lib/scoring.ts` importing `lib/db` (for `getPersonalizedScore`), which slightly muddies the otherwise clean layering — this function could be moved to `lib/queries/`.

---

*Review conducted against commit HEAD. All line numbers reference the codebase as of review date.*
