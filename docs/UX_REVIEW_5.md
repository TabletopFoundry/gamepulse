# GamePulse — Fifth-Pass UX & DX Audit

**Auditor perspective:** Senior engineer encountering this codebase for the first time, with access to Reviews 1–4.  
**Date:** 2025-07-22  
**Scope:** Genuinely new P0/P1 issues not already documented in prior reviews. Items from Reviews 1–4 that are still open are tracked in §3 for completeness but not re-described.

---

## 1. Executive Summary

GamePulse is in strong shape. Build is clean (0 TS errors, 0 lint warnings), onboarding is frictionless, CI exists, prior P0s are fully resolved, the R4 `error.tsx` nested-HTML issue is fixed (correct split into `error.tsx` + `global-error.tsx`), and the browse page caching confusion from R4 is resolved (now correctly uses `force-dynamic`). The `getSearchOptions()` is now wrapped in `React.cache` with a `LIMIT 200`, and a lightweight `getCriticCount()` replaces the home page over-fetch.

This review surfaces **four genuinely new P1 issues** and **three new P2 issues** that no prior review identified — centered on unguarded JSON parsing that can crash pages, a keyboard navigation division-by-zero edge case, a feed page caching declaration mismatch identical to the browse bug R4 caught, and the critics directory caching user-specific data with `revalidate = 60`. No new P0s exist.

---

## 2. New Findings

### P1 — Must-Fix Before Real Users

#### P1-NEW-1. `JSON.parse()` on DB fields in `parsers.ts` has zero error handling — any malformed row crashes the page

**Files:** `lib/queries/parsers.ts:12-13, 25, 41, 53`

Every game, critic, and user parse function calls raw `JSON.parse()` on string columns (`categories`, `mechanics`, `taste_profile`) with no try/catch. These columns are stored as serialized JSON strings in SQLite. If any row has malformed JSON — due to a bad seed, manual DB edit, migration error, or upstream data corruption — the entire page render crashes with an unhandled exception. Since these parsers are called from the root layout (via `getSearchOptions` → `getAllGames`) and every detail page, a single bad row can take down the entire application.

Additionally, no runtime validation is performed on the parsed result — a `taste_profile` that parses to `null` or an array instead of the expected `TasteProfile` object would propagate silently and cause downstream `TypeError` crashes in `cosineSimilarity()`, `pearson()`, and `topGenres()`.

```ts
// Current — crashes on malformed data:
categories: JSON.parse(row.categories),

// Fixed — defensive with fallback:
categories: safeJsonParse<string[]>(row.categories, []),
```

**Fix:** Add a `safeJsonParse` utility in `lib/utils.ts`:
```ts
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
```
Use it in all four `JSON.parse` call sites in `parsers.ts` and the two in `user.ts:42,48` (`getCurrentUserTasteProfile`).

**Impact:** A single corrupt DB row crashes all pages that load games, critics, or user data — effectively a site-wide outage.

---

#### P1-NEW-2. Feed page declares `revalidate = 60` but reads `searchParams` — always dynamic (same bug as R4-P1-NEW-3 for browse)

**File:** `app/feed/page.tsx:9, 25-26`

The feed page exports `export const revalidate = 60` at line 9, but the page component reads `searchParams` at line 25-26 to extract the `filter` value. In Next.js App Router, reading `searchParams` automatically opts the page into dynamic rendering — the `revalidate` export is silently ignored. This is the exact same pattern R4 identified on the browse page (R4-P1-NEW-3), but it was only fixed there — the feed page still has the issue.

**Fix:** Replace `export const revalidate = 60` with `export const dynamic = "force-dynamic"` for honesty, or split into a static default view and dynamic filtered view.

---

#### P1-NEW-3. Critics directory page caches user-specific match percentages with `revalidate = 60`

**File:** `app/critics/page.tsx:8, 17`, `lib/queries/critics.ts:31-33`

The critics directory page exports `revalidate = 60` (ISR caching), but calls `getCriticDirectory()` → `getMatchedCritics()` which computes **personalized** taste match percentages based on the current user's ratings, taste profile, and follows. The rendered output includes `{critic.matchPercent}% match` for each critic.

Currently this works because there's only one hardcoded user ("alex"). But this is architecturally incorrect — when real auth is added, ISR-cached pages would serve one user's match percentages to all visitors. This is both a data privacy risk and a correctness bug waiting to happen.

The critics directory should use `force-dynamic` (like `/me` and `/critics/[slug]` do) since its content is inherently user-specific.

**Fix:** Change `export const revalidate = 60` to `export const dynamic = "force-dynamic"`.

---

#### P1-NEW-4. Search autocomplete ArrowDown/ArrowUp divides by zero when `suggestions` is empty

**File:** `components/client-widgets.tsx:83, 86`

When the user types a query that matches no games, `suggestions` becomes an empty array (length 0). The `isOpen` guard (`isFocused && suggestions.length > 0`) hides the dropdown visually, but the `onKeyDown` handler still runs. Pressing ArrowDown executes:

```ts
setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
// When suggestions.length === 0: (prev + 1) % 0 → NaN
```

This sets `highlightedIndex` to `NaN`, which:
1. Corrupts the `aria-activedescendant` value to `"${listboxId}-option-NaN"` — an invalid ARIA reference.
2. Causes the `aria-selected` comparison (`index === NaN`) to always be `false` — benign, but semantically broken.
3. The `NaN` state persists — subsequent ArrowDown presses continue producing `NaN`, so even when suggestions reappear, the highlight is broken until the user types again (which resets to `-1`).

**Fix:** Guard the modulo:
```ts
onKeyDown={(event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (suggestions.length > 0) {
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (suggestions.length > 0) {
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    }
  }
  // ...
}}
```

---

### P2 — Polish & Quality

#### P2-NEW-1. Toast timers are never cleaned up on component unmount — potential state-update-after-unmount

**File:** `components/toast.tsx:29-31`

The `addToast` callback creates a `setTimeout` to auto-dismiss toasts after 4 seconds, but the timer ID is never stored or cleaned up. If the `ToastProvider` unmounts (e.g., during route error boundaries, hot module replacement, or test teardown), the timeout fires and calls `setToasts()` on an unmounted component.

In React 18+ with concurrent features, this can silently leak timers. In strict mode during development, double-mounting will create duplicate timers for the same toast.

**Fix:** Track timer IDs in a `useRef(Map<number, NodeJS.Timeout>)` and clear them in a cleanup effect or when toasts are manually dismissed:
```ts
const timers = useRef(new Map<number, NodeJS.Timeout>());

const addToast = useCallback((message: string, type: "success" | "error") => {
  const id = ++nextId.current;
  setToasts((prev) => [...prev, { id, message, type }]);
  const timer = setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timers.current.delete(id);
  }, 4000);
  timers.current.set(id, timer);
}, []);

const removeToast = useCallback((id: number) => {
  const timer = timers.current.get(id);
  if (timer) { clearTimeout(timer); timers.current.delete(id); }
  setToasts((prev) => prev.filter((t) => t.id !== id));
}, []);
```

---

#### P2-NEW-2. `robots.ts` redeclares `BASE_URL` instead of importing from `lib/config.ts`

**Files:** `app/robots.ts:3` vs `lib/config.ts:10-11`, `app/sitemap.ts:3`

The `robots.ts` file manually reads `process.env.NEXT_PUBLIC_BASE_URL` and provides its own default:
```ts
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://gamepulse.example.com";
```

Meanwhile, `sitemap.ts` correctly imports `BASE_URL` from `@/lib/config`. This is a DRY violation — if the default URL or variable name changes, `robots.ts` would silently diverge from the rest of the application, producing a mismatched sitemap URL in the robots.txt output.

**Fix:** Replace with `import { BASE_URL } from "@/lib/config"`.

---

#### P2-NEW-3. No HTTP security headers configured in `next.config.ts`

**File:** `next.config.ts:3-5`

The Next.js config contains only `serverExternalPackages`. No HTTP security headers are configured. While not critical for an MVP with no real user data, the following headers are industry standard and trivial to add:

- `X-Frame-Options: DENY` — prevents clickjacking.
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage.
- `Permissions-Policy` — disables unused browser APIs.

**Fix:** Add a `headers()` function to `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};
```

---

## 3. Status of Previously Reported Issues (Reviews 1–4)

### Resolved Since R4 ✅

| R4 Item | Status | Evidence |
|---|---|---|
| R4-P1-NEW-1: `getSearchOptions()` uncached | ✅ Fixed | Wrapped in `React.cache` + `LIMIT 200` at `games.ts:8` |
| R4-P1-NEW-2: Home page `getCriticDirectory()` over-fetch | ✅ Fixed | `getCriticCount()` at `critics.ts:35-38`, home page uses it at `page.tsx:28` |
| R4-P1-NEW-3: Browse `revalidate` vs `searchParams` | ✅ Fixed | Browse now uses `export const dynamic = "force-dynamic"` at `browse/page.tsx:9` |
| R4-P1-NEW-4: Feed filtering in JS | ✅ Fixed | SQL `WHERE` clause at `feed.ts:7-9` |
| R4-P1-NEW-5: `error.tsx` nested HTML | ✅ Fixed | `error.tsx` renders content only; `global-error.tsx` has `<html>/<body>` wrapper |

### Still Open ⚠️ (from prior reviews — not re-described here)

| Prior Item | Status | Priority |
|---|---|---|
| R3-P1-4: Zero test infrastructure | ❌ Open | P1 |
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
| **P1 — Before real users** | P1-NEW-1 (JSON.parse crash), P1-NEW-2 (feed revalidate mismatch), P1-NEW-3 (critics directory caching user data), P1-NEW-4 (ArrowDown ÷ 0), R3-P1-4 (test infra) | ~1 day |
| **P2 — Quality polish** | P2-NEW-1 (toast timer leak), P2-NEW-2 (robots.ts BASE_URL), P2-NEW-3 (security headers), plus all R3-P2 items | 1–2 sprints |

---

## 5. What's Working Well (Preserved Strengths)

1. **Clean build**: 0 TS errors, 0 lint warnings. `npm run check` passes end-to-end.
2. **CI pipeline**: GitHub Actions with type-check + lint + build on push/PR.
3. **Onboarding**: `npm install && npm run dev` → running app in ~30s with auto-seeded data.
4. **Architecture**: Clean layer separation (`app/ → components/ → lib/queries/ → lib/db/`), `React.cache` on user queries and page data, barrel re-exports for ergonomic imports.
5. **Accessibility**: 39+ ARIA attributes, combobox pattern, skip link, landmark roles, focus-visible rings, `aria-live` toast region.
6. **SEO**: Per-route metadata, JSON-LD on game pages, sitemap, robots.txt, OG/Twitter cards.
7. **Form UX**: `useActionState` + toast feedback on all server actions, `SubmitButton` with pending state, double-submit protection.
8. **Caching strategy**: `revalidate = 60` for public pages, `force-dynamic` only for user-specific routes.
9. **Docker**: Multi-stage build with non-root user, proper data volume mount documentation.
10. **README**: Accurate architecture diagram, quick start, scripts table, scoring explanation.
