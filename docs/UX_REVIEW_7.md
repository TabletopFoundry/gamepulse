# UX Review 7 — Focused Delta Audit

**Date**: 2025-07-21
**Scope**: New P0/P1 issues only — findings not covered in UX_REVIEW 1–6 or CODE_REVIEW 1–3.

---

## P0 — Critical

### 1. No rate limiting on any server action

**Files**: `lib/actions.ts:13–133`

All four write endpoints — `submitCommunityReview`, `toggleUserList`, `toggleFollowCritic`, `subscribeNewsletter` — accept unlimited requests with zero throttling. This is distinct from the previously flagged authentication gap: even behind auth, rate limiting is independently required.

**Impact**:
- An attacker can flood `newsletter_signups` with millions of rows via a trivial loop (`curl -X POST … -d "email=x${i}@spam.com"`).
- `submitCommunityReview` writes + runs an `AVG()` aggregate in a transaction on every call — sustained abuse can saturate SQLite's single-writer lock and make the entire app unresponsive.
- `toggleUserList` and `toggleFollowCritic` toggling can create write-contention storms.

**Recommendation**: Add per-IP or per-session rate limiting at the middleware or action level. For server actions, a lightweight in-memory token-bucket (e.g., `Map<string, { count, resetAt }>` keyed by IP from headers) provides baseline protection without external dependencies. For production, move to a Redis-backed limiter or Cloudflare/Vercel rate-limit rules.

---

## P1 — High

### 2. Home page game count is inflated with a hardcoded magic number

**File**: `app/page.tsx:45`

```tsx
<div className="text-3xl font-semibold">{trendingGames.length + risingGames.length + 32}+</div>
<p className="mt-2 text-sm text-slate-300">Games with live GamePulse scores</p>
```

The `+ 32` is a baked-in constant that artificially inflates the displayed count. As games are added or removed from the seed, this number diverges further from reality. Users who inspect the browse page and count ~60 games will see the mismatch.

**Recommendation**: Query the actual game count from the DB:

```tsx
const totalGames = db.prepare(`SELECT COUNT(*) as count FROM games`).get() as { count: number };
```

Or reuse the existing pattern: `getCriticCount()` already does this for critics.

---

### 3. Seed data is anchored to a hardcoded future date

**File**: `lib/db/seed.ts:7`

```ts
const NOW = new Date("2026-05-16T12:00:00.000Z");
```

All `published_at`, `created_at`, and `release_date` values are computed relative to this date via the `daysAgo()` helper. As of mid-2025, "latest reviews" and "feed items" display timestamps months into the future. The `formatDate()` calls throughout the UI then show dates like "Nov 14, 2026" on the "Latest reviews" section of the home page.

**Impact**: Users see future-dated content, which undercuts credibility and makes "newest first" sorting confusing. Release calendar items appear to be upcoming even when the relative anchor date has long passed.

**Recommendation**: Replace the hardcoded date with `new Date()` (or `Date.now()`) so the seed is always relative to the actual run time. If deterministic seeds are needed for testing, gate the hardcoded date behind `NODE_ENV === 'test'`.

---

### 4. Newsletter email validation is trivially weak

**File**: `lib/actions.ts:120`

```ts
if (!email || !email.includes("@") || email.length < 5) {
  return { success: false, message: "Please enter a valid email address." };
}
```

This allows inputs like `a@b.c`, `@@@@.`, `test@`, `.@...`, etc. The `INSERT OR IGNORE` prevents duplicates, but garbage data still pollutes the `newsletter_signups` table and skews analytics.

**Recommendation**: At minimum, validate against a basic structural regex (e.g., `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`). Better: use a lightweight library like `validator.js`'s `isEmail()` or the native HTML `type="email"` constraint (which is client-only and already present, but the server must independently enforce).

---

### 5. Browse page renders a duplicate search autocomplete

**Files**: `app/layout.tsx:78`, `app/browse/page.tsx:39`

The root layout renders `<SearchAutocomplete>` in the sticky header on every page (layout.tsx:78). The browse page renders a *second* identical `<SearchAutocomplete>` inside its hero section (browse/page.tsx:39). Both are fully functional, wired to the same `getSearchOptions()` data, and navigate to `/games/[slug]`.

**Impact**:
- Two identical search UIs are visible simultaneously, confusing users about which to use.
- Two client-side combobox instances with ARIA `listbox` roles may confuse screen readers with duplicate landmark semantics.
- Doubles the client-side state and event listener overhead for the same feature.

**Recommendation**: Remove the hero-embedded autocomplete on browse. The sticky header already provides persistent search. Replace the hero autocomplete with the existing filter text input (which is there anyway at browse/page.tsx:46) and a prominent CTA.

---

### 6. `computeMatchedCritics` ignores its `_userId` parameter

**File**: `lib/queries/user.ts:63–118`

```ts
function computeMatchedCritics(_userId: number): MatchedCritic[] {
  const db = getDb();
  const user = getCurrentUser();  // ← ignores _userId, always uses hardcoded current user
```

The function signature accepts `_userId` (underscore-prefixed, signaling "unused"), but internally calls `getCurrentUser()` to fetch the user. The `unstable_cache` wrapper at line 121 passes `userId` as the cache key:

```ts
const getCachedMatchedCritics = unstable_cache(
  async (userId: number) => computeMatchedCritics(userId),
  ["matched-critics"],
  { revalidate: 60 },
);
```

Today this works because there's only one user. When real authentication is added, the cache will partition by `userId` (correct) but the function will always compute against `is_current=1` (incorrect), returning wrong taste matches for every non-default user.

**Recommendation**: Use the `_userId` parameter instead of `getCurrentUser()` inside `computeMatchedCritics`. Pass the user's taste profile and ratings as arguments or query them by the provided ID:

```ts
function computeMatchedCritics(userId: number): MatchedCritic[] {
  const db = getDb();
  const userRow = db.prepare(`SELECT * FROM community_users WHERE id = ?`).get(userId) as RawUser;
  // ... use userRow instead of getCurrentUser()
```

---

### 7. Critics directory renders a full Recharts RadarChart for every critic

**File**: `app/critics/page.tsx:43`

```tsx
{critics.map((critic) => (
  <article key={critic.slug} ...>
    ...
    <div className="mt-5"><TasteProfileChart profile={critic.tasteProfile} accent="#fb7185" /></div>
    ...
  </article>
))}
```

Each `<TasteProfileChart>` instantiates a full `recharts` `<RadarChart>` with `<ResponsiveContainer>`, `<PolarGrid>`, `<PolarAngleAxis>`, `<PolarRadiusAxis>`, and `<Radar>` (see `client-widgets.tsx:131–159`). With the current seed of ~15 critics, this renders 15 independent SVG radar charts simultaneously.

**Impact**:
- `recharts` is a heavy library (~200KB gzipped). Every chart creates its own React subtree with resize observers, SVG path calculations, and tick computations.
- On mobile or mid-range devices, rendering 15+ complex SVG charts in a single scroll causes visible jank and increases Time to Interactive.
- The charts all look nearly identical at card-grid scale and add minimal information at that size.

**Recommendation**: Either (a) lazy-load charts with `IntersectionObserver` / `React.lazy` so only visible cards render their chart, (b) replace the directory-level charts with a lightweight static visual (e.g., a simple bar or pill-based taste summary) and reserve the full radar chart for the individual critic profile page, or (c) use a lightweight SVG component instead of the full recharts library for these small sparkline-style charts.

---

## Summary

| # | Severity | Issue | File(s) |
|---|----------|-------|---------|
| 1 | **P0** | No rate limiting on server actions | `lib/actions.ts` |
| 2 | P1 | Home page game count inflated with `+32` | `app/page.tsx:45` |
| 3 | P1 | Seed data anchored to hardcoded future date | `lib/db/seed.ts:7` |
| 4 | P1 | Newsletter email validation trivially weak | `lib/actions.ts:120` |
| 5 | P1 | Duplicate search autocomplete on browse | `app/layout.tsx:78`, `app/browse/page.tsx:39` |
| 6 | P1 | `computeMatchedCritics` ignores `_userId` param | `lib/queries/user.ts:63` |
| 7 | P1 | Full RadarChart rendered per critic in directory | `app/critics/page.tsx:43` |

**Previously flagged issues not repeated here**: accessibility/ARIA gaps, auth model, `force-dynamic` overuse, pagination, N+1 queries, error boundary nesting, WAL/SHM tracking, test infrastructure, duplicated helpers, magic scoring numbers, security headers, JSON-LD escaping, `clamp()` duplication — all documented in UX_REVIEW 1–6 and CODE_REVIEW 1–3.
