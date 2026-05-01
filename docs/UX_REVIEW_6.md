# GamePulse — Sixth-Pass UX & DX Audit

**Auditor perspective:** Senior engineer encountering this codebase for the first time, with access to Reviews 1–5.  
**Date:** 2025-07-23  
**Scope:** Genuinely new P0/P1 issues not already documented in prior reviews. Items from Reviews 1–5 that are still open are tracked in §3 for completeness but not re-described.

---

## 1. Executive Summary

GamePulse remains in excellent shape for an MVP. Build is clean, onboarding is fast, CI covers type-check + lint + build, and the R5 fixes (ArrowDown ÷ 0 guard, feed `force-dynamic`, `safeJsonParse` in `parsers.ts`) have landed. The codebase is well-layered and readable.

This review surfaces **five genuinely new P1 issues** that no prior review identified — a null-safety crash in the `getCurrentUser()` path that can take down every user-dependent page, a Docker build that will fail because `output: "standalone"` is not configured, two server actions with no error handling around DB writes, raw `error.message` exposed to end users in both error boundaries, and a `JSON.parse` call site in browse category extraction that was missed by the R5 `safeJsonParse` rollout. No new P0s exist.

---

## 2. New Findings

### P1 — Must-Fix Before Real Users

#### P1-NEW-1. `getCurrentUser()` crashes all pages if the `is_current = 1` user row is missing

**File:** `lib/queries/user.ts:9-13`

```ts
export const getCurrentUser = cache(() => {
  const db = getDb();
  const user = db.prepare(`SELECT * FROM community_users WHERE is_current = 1 LIMIT 1`)
    .get() as RawUser;       // ← .get() returns undefined if no row matches
  return parseUser(user);    // ← parseUser accesses user.id, user.handle, etc. → TypeError
});
```

If the `is_current = 1` user is missing — due to a clean DB without seed data, a migration that resets the flag, manual DB editing, or a seed version mismatch that drops and doesn't re-insert the user — `db.prepare().get()` returns `undefined`. The `as RawUser` cast silently coerces this to the wrong type, and `parseUser(undefined)` immediately throws `TypeError: Cannot read properties of undefined (reading 'id')`.

This function is called (directly or transitively) by:
- Every server action (`actions.ts:15, 54, 86`)
- Game detail page (`games.ts:70`)
- Critics page data (`critics.ts:20`)
- Critic directory (`user.ts:58` → `getMatchedCritics`)
- User dashboard (`dashboard.ts:8`)

A missing user row **crashes the entire application** — not just `/me`, but `/games/*`, `/critics/*`, browse (via layout search), and all form submissions.

**Fix:** Guard for `undefined` and return a controlled error or redirect:
```ts
export const getCurrentUser = cache(() => {
  const db = getDb();
  const user = db.prepare(`SELECT * FROM community_users WHERE is_current = 1 LIMIT 1`)
    .get() as RawUser | undefined;
  if (!user) {
    throw new Error("No current user configured. Run the seed or set is_current = 1 on a community_users row.");
  }
  return parseUser(user);
});
```

Or better, return `null` and let callers handle it gracefully with `notFound()` or a setup prompt.

**Impact:** Single missing DB row takes down every page and every server action.

---

#### P1-NEW-2. Dockerfile COPY assumes `.next/standalone` but `next.config.ts` doesn't enable `output: "standalone"` — Docker build fails

**Files:** `Dockerfile:27-28` vs `next.config.ts:3-5`

The Dockerfile's production stage copies the standalone output:
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

But `next.config.ts` only configures:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};
```

Without `output: "standalone"`, `next build` does not produce a `.next/standalone/` directory. The `COPY` at line 27 fails with `COPY failed: file not found in build context`, and `docker build` exits with a non-zero status. The README documents Docker usage (`docker build -t gamepulse .`), but this has never worked.

The CI pipeline (`ci.yml`) runs `npm run build` but does not run `docker build`, so this breakage is not caught.

**Fix:** Add `output: "standalone"` to `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
};
```

And optionally add a Docker build step to CI to prevent future regressions.

**Impact:** Docker deployment path documented in README is broken. Any attempt to containerize fails.

---

#### P1-NEW-3. `submitCommunityReview` and `subscribeNewsletter` have no try/catch — DB errors crash instead of returning `ActionResult`

**Files:** `lib/actions.ts:34-42` (review), `lib/actions.ts:117` (newsletter)

The `toggleUserList` and `toggleFollowCritic` actions properly wrap their DB operations in `try/catch` blocks and return `{ success: false, message: "..." }` on failure. However, `submitCommunityReview` and `subscribeNewsletter` do not:

```ts
// submitCommunityReview — lines 34-42, NO try/catch:
db.prepare(`INSERT INTO community_reviews ...`).run(gameId, user.id, rating, review);
const stats = db.prepare(`SELECT ROUND(AVG(rating) * 10) ...`).get(gameId);
db.prepare(`UPDATE games SET community_score = ? ...`).run(stats.avgScore ?? 0, stats.count ?? 0, gameId);

// subscribeNewsletter — line 117, NO try/catch:
db.prepare(`INSERT OR IGNORE INTO newsletter_signups ...`).run(email);
```

If any DB operation fails (disk full, WAL corruption, locked database, constraint violation on a race), the error propagates as an unhandled server-side exception. Instead of the toast showing a friendly error message, the user sees the error boundary's generic crash page. This is inconsistent with the other two actions and violates the project's own error-handling pattern.

Additionally, `submitCommunityReview` performs three sequential DB writes (INSERT review, SELECT stats, UPDATE score) without a transaction. If the UPDATE fails after the INSERT succeeds, the game's `community_score` becomes permanently stale until another review is submitted.

**Fix:** Wrap both in try/catch, and use a transaction for the review action:
```ts
// submitCommunityReview
try {
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO community_reviews ...`).run(gameId, user.id, rating, review);
    const stats = db.prepare(`SELECT ...`).get(gameId) as { avgScore: number; count: number };
    db.prepare(`UPDATE games SET community_score = ? ...`).run(stats.avgScore ?? 0, stats.count ?? 0, gameId);
  });
  tx();
} catch {
  return { success: false, message: "Failed to save review. Please try again." };
}

// subscribeNewsletter
try {
  db.prepare(`INSERT OR IGNORE INTO newsletter_signups ...`).run(email);
} catch {
  return { success: false, message: "Failed to subscribe. Please try again." };
}
```

**Impact:** Any DB-level failure on review or newsletter submission crashes the page instead of showing a user-friendly toast.

---

#### P1-NEW-4. Error boundaries expose raw `error.message` to end users — information disclosure risk

**Files:** `app/error.tsx:9`, `app/global-error.tsx:10`

Both error boundary components render the raw error message directly in the UI:

```tsx
<p className="mt-4 text-sm leading-7 text-slate-600">
  {error.message || "Try again to reload the latest scores, reviews, and feed items."}
</p>
```

In production, runtime errors can contain sensitive implementation details:
- SQLite errors: `"SQLITE_CANTOPEN: unable to open database file /app/data/gamepulse.db"`
- Node.js errors: `"ENOENT: no such file or directory, open '/app/data/...'"` 
- Type errors from malformed data: `"Cannot read properties of undefined (reading 'taste_profile')"`
- Potential query fragments or table names from DB errors

These messages help attackers understand the technology stack, file system layout, and database schema. Next.js already provides a `digest` property for server-side error tracking — the client-facing message should always be generic.

**Fix:** Remove `error.message` from both components; use only the static fallback:
```tsx
<p className="mt-4 text-sm leading-7 text-slate-600">
  Try again to reload the latest scores, reviews, and feed items.
</p>
{error.digest ? (
  <p className="mt-2 text-xs text-slate-400">Error reference: {error.digest}</p>
) : null}
```

Log the actual error for developers via `console.error` or a monitoring service.

**Impact:** Internal system details (file paths, DB schema, stack fragments) may be exposed to end users.

---

#### P1-NEW-5. `getBrowseData()` category extraction uses raw `JSON.parse` — bypasses the `safeJsonParse` fix from R5

**File:** `lib/queries/games.ts:197-198`

R5-P1-NEW-1 identified that `parsers.ts` used raw `JSON.parse` on DB fields and recommended adding `safeJsonParse`. The `parsers.ts` file was fixed (now uses `safeJsonParse` on all four call sites). However, `getBrowseData()` has its own separate `JSON.parse` call for extracting unique categories:

```ts
const categories = (db.prepare(`SELECT DISTINCT categories FROM games`).all() as Array<{ categories: string }>)
  .flatMap((row) => JSON.parse(row.categories) as string[]);  // ← raw JSON.parse, no safeJsonParse
```

This code path is independent of `parsers.ts` — it extracts categories for the browse filter dropdown, not for game card rendering. A single malformed `categories` field in any game row crashes the entire browse page with an unhandled JSON parse error.

**Fix:** Replace with `safeJsonParse`:
```ts
const categories = (db.prepare(`SELECT DISTINCT categories FROM games`).all() as Array<{ categories: string }>)
  .flatMap((row) => safeJsonParse<string[]>(row.categories, []));
```

**Impact:** A single corrupt game row crashes the browse page. The fix from R5 addressed `parsers.ts` but missed this separate call site.

---

## 3. Status of Previously Reported Issues (Reviews 1–5)

### Resolved Since R5 ✅

| R5 Item | Status | Evidence |
|---|---|---|
| R5-P1-NEW-1: `JSON.parse` crash in `parsers.ts` | ✅ Fixed | `safeJsonParse` used at `parsers.ts:15,16,28,44,56` |
| R5-P1-NEW-2: Feed page `revalidate` vs `searchParams` | ✅ Fixed | Feed now uses `export const dynamic = "force-dynamic"` at `feed/page.tsx:9` |
| R5-P1-NEW-3: Critics directory caching user data | ✅ Fixed | Critics directory now uses `export const dynamic = "force-dynamic"` at `critics/page.tsx:8` |
| R5-P1-NEW-4: ArrowDown ÷ 0 in search autocomplete | ✅ Fixed | Guard `if (suggestions.length > 0)` at `client-widgets.tsx:83,88` |

### Still Open ⚠️ (from prior reviews — not re-described here)

| Prior Item | Status | Priority |
|---|---|---|
| R3-P1-4: Zero test infrastructure | ❌ Open | P1 |
| R5-P2-NEW-1: Toast timer cleanup on unmount | ❌ Open | P2 |
| R5-P2-NEW-2: `robots.ts` redeclares `BASE_URL` | ❌ Open | P2 |
| R5-P2-NEW-3: No HTTP security headers | ❌ Open | P2 |
| R3-P2-1: `clamp()` duplicated in scoring.ts + seed.ts | ❌ Open | P2 |
| R3-P2-2: `text-slate-400` low contrast (~15 instances) | ⚠️ Open | P2 |
| R3-P2-3: Hero magic number (`+ 32`) | ❌ Open | P2 |
| R3-P2-4: No DB cleanup on process exit | ❌ Open | P2 |
| R3-P2-5: Fragile `onBlur` 120ms timeout | ❌ Open | P2 |
| R3-P2-7: No pagination on browse/feed | ❌ Open | P2 |
| R3-P2-8: `seed.ts` at 365 lines | ❌ Open | P2 |
| R3-P2-9: Weak email validation | ❌ Open | P2 |
| R3-P2-10: Toast container overlap on narrow viewports | ❌ Open | P2 |
| R3-P2-12: Recharts SSR warnings during build | ❌ Open | P2 |

---

## 4. Recommended Priority Order

| Priority | Items | Effort |
|---|---|---|
| **P1 — Before real users** | P1-NEW-1 (getCurrentUser crash), P1-NEW-2 (Docker build broken), P1-NEW-3 (missing try/catch + transaction), P1-NEW-4 (error.message info disclosure), P1-NEW-5 (browse JSON.parse), R3-P1-4 (test infra) | ~1 day |
| **P2 — Quality polish** | R5-P2 items (toast timer, robots.ts, security headers), all R3-P2 items | 1–2 sprints |

---

## 5. What's Working Well (Preserved Strengths)

1. **Clean build**: 0 TS errors, 0 lint warnings. `npm run check` passes end-to-end.
2. **CI pipeline**: GitHub Actions with type-check + lint + build on push/PR, with concurrency cancellation.
3. **Onboarding**: `npm install && npm run dev` → running app in ~30s with auto-seeded data.
4. **Architecture**: Clean layer separation (`app/ → components/ → lib/queries/ → lib/db/`), `React.cache` on user queries and search options, barrel re-exports.
5. **Accessibility**: 39+ ARIA attributes, combobox pattern with ArrowDown/ArrowUp guards, skip link, landmark roles, focus-visible rings, `aria-live` toast region.
6. **SEO**: Per-route metadata, JSON-LD on game pages, sitemap, robots.txt, OG/Twitter cards.
7. **Form UX**: `useActionState` + toast feedback on all server actions, `SubmitButton` with pending state, double-submit protection, inline error rendering.
8. **Caching strategy**: `revalidate = 60` for public pages, `force-dynamic` on all user-specific routes (now including feed and critics directory).
9. **Docker**: Multi-stage build with non-root user, data volume documentation — needs `output: "standalone"` to actually work (P1-NEW-2).
10. **Code quality**: `safeJsonParse` utility, centralized config, `useActionToast` hook extraction, parameterized SQL everywhere.
