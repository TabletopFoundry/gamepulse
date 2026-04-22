# GamePulse — Second-Pass UX & DX Audit

**Auditor perspective:** Senior engineer verifying fixes from UX_REVIEW.md and hunting remaining gaps.
**Date:** 2025-07-18
**Scope:** Remaining UX gaps, accessibility, visual polish, responsive edge cases, error handling, regressions.

---

## 1. Executive Summary

The first review drove meaningful improvements: form feedback now uses `useFormStatus` + `useActionState` with a toast system, the search autocomplete has full keyboard navigation with proper ARIA combobox markup, skip-to-content and landmark roles are in place, the God-files have been split into clean domain modules (`lib/queries/`, `lib/db/`), and per-page `generateMetadata` exists on dynamic routes. The codebase builds cleanly with zero TS errors and only 3 lint warnings (unused imports).

However, significant issues remain. **Every form input on the browse page lacks a visible `<label>`**, the `outline-none` class on 9 form controls actively suppresses the global `:focus-visible` ring that was added to fix the original audit, `toggleUserList` and `toggleFollowCritic` silently swallow errors with bare `return` statements giving users zero feedback, there are no per-route `loading.tsx` skeletons, and the `getPersonalizedScore` function is copy-pasted across two files. Several issues below are regressions introduced by the fixes themselves.

---

## 2. Findings

### P0 — Ship Blockers

#### P0-1. `outline-none` on form inputs defeats the global `:focus-visible` fix

**Status:** Regression from first review fix (MT-9).

The first review added a global `:focus-visible { outline: 2px solid #f43f5e }` rule in `globals.css:41-45` — the correct fix. However, **9 form controls** still carry `outline-none` in their Tailwind classes, which overrides the global rule and makes these inputs invisible to keyboard-only users.

**Affected elements:**
- `app/browse/page.tsx:49` — search input
- `app/browse/page.tsx:50,54,60,66` — all 4 `<select>` filters
- `components/action-forms.tsx:36` — rating input
- `components/action-forms.tsx:40` — review textarea
- `components/action-forms.tsx:68` — newsletter email input
- `components/client-widgets.tsx:92` — search autocomplete input

**Fix:** Remove `outline-none` from all 9 elements. The `focus:border-rose-300` can remain as a supplementary visual cue, but the outline must not be suppressed.

---

#### P0-2. Browse page form controls have no visible or accessible `<label>`

**Impact:** WCAG 2.1 AA failure (1.3.1 Info and Relationships, 4.1.2 Name Role Value).

The browse filter form at `app/browse/page.tsx:48-72` contains 5 inputs/selects with zero `<label>` elements and zero `aria-label` attributes. Screen readers announce these controls with no identifying name. The `placeholder` on the text input is not a valid substitute — it disappears on input and isn't exposed as the accessible name in all assistive technologies.

**Affected controls:** `query` input, `category` select, `players` select, `complexity` select, `sort` select.

**Fix:** Add `aria-label` to each, or wrap each in a `<label>` with visible text (preferred for sighted users too).

---

#### P0-3. `toggleUserList` and `toggleFollowCritic` silently swallow failures

**Impact:** Users get zero feedback when watchlist/wishlist/follow actions fail or succeed.

Both server actions (`lib/actions.ts:52-71`, `lib/actions.ts:73-90`) use a plain `formData` signature (not `useActionState`) and `return` silently on invalid input (`if (!gameId) return`). Unlike `submitCommunityReview` and `subscribeNewsletter` which now return `ActionResult` and feed the toast system, these two actions:
- Return `void` — no success/error message is possible.
- Have no client-side wrapper using `useActionState` — the `SubmitButton` shows a pending state but no result toast.
- Silently swallow DB errors (no try/catch).

The first review's QW-1/QW-8/MT-8 fixes were applied only to the review and newsletter forms, but the watchlist, wishlist, and follow actions were missed.

**Fix:** Refactor both to return `ActionResult`, wrap their forms in client components using `useActionState`, and show success/error toasts ("Added to watchlist" / "Removed from watchlist" / "Now following" / "Unfollowed").

---

### P1 — Must-Fix Before Users

#### P1-1. No per-route `loading.tsx` — only root-level skeleton exists

**Status:** Unfixed from first review (MT-4).

Only `app/loading.tsx` exists. Navigating between `/browse`, `/feed`, `/critics`, `/games/[slug]`, and `/me` shows a generic skeleton that doesn't match the target page's layout. This causes visible layout shift when the real content arrives. Each route segment should have its own `loading.tsx` with a skeleton that approximates the page structure (hero block + grid, etc.).

---

#### P1-2. `getPersonalizedScore` is duplicated across two files

**Status:** Introduced by first review fix (MT-1/MT-2 code split).

The function `getPersonalizedScore` exists as identical copies in:
- `lib/queries/games.ts:23-38`
- `lib/queries/dashboard.ts:7-22`

This is a DRY violation that will cause scoring bugs when one copy is updated but not the other.

**Fix:** Extract to `lib/scoring.ts` (which already exists and is the natural home for scoring logic) and import from both consumers.

---

#### P1-3. 3 unused imports trigger lint warnings

**Files:**
- `components/action-forms.tsx:6` — `ActionResult` type imported but unused.
- `lib/queries/games.ts:3` — `RawCritic` imported but unused.
- `lib/queries/user.ts:4` — `CriticData` imported but unused.

These were likely left behind during the code split. They don't affect users but create noise in CI and signal sloppy cleanup.

---

#### P1-4. N+1 query pattern in `getMatchedCritics`

`lib/queries/user.ts:70` executes a per-critic `db.prepare(...).all(critic.id)` inside a `.map()` loop. With 8 critics this is fine, but the PRD targets scaling to many more. This should be refactored to a single query that fetches all critic reviews and groups client-side, or uses a JOIN.

---

#### P1-5. Browse filter form uses GET but lacks `action` attribute

`app/browse/page.tsx:48` renders `<form className="...">` with no `action` and no `method`. The "Apply filters" button triggers a default form submission that reloads the page with query params — which works by accident (default GET to current URL), but:
- Screen readers can't announce the form's purpose (no `aria-label` on the form).
- The button should be `type="submit"` explicitly for clarity.
- There's no loading indicator while the page is re-fetching with new filters.

---

#### P1-6. No structured data (JSON-LD) on any page

**Status:** Unfixed from first review (MT-6).

Game detail pages need `Product` or `Review` schema.org markup for SEO. The PRD requires this (FR-011). No `<script type="application/ld+json">` exists anywhere.

---

#### P1-7. No `sitemap.ts` route

**Status:** Unfixed from first review (LT-6).

For an SEO-led product, `app/sitemap.ts` should exist and return all game/critic URLs. This is a Next.js convention that's trivial to implement.

---

#### P1-8. `force-dynamic` on every route — no caching at all

**Status:** Unfixed from first review (MT-5).

All 7 page routes export `force-dynamic`. The home page, browse (without user-specific content), critics directory, and feed pages could use `revalidate = 60` or similar for dramatically better performance. Only `/games/[slug]` (watchlist status) and `/me` truly need dynamic rendering.

---

#### P1-9. Zero test files of any kind

**Status:** Unfixed from first review (MT-3).

No `*.test.*` or `*.spec.*` files exist. No test runner is configured in `package.json`. The pure scoring functions in `lib/scoring.ts` (`buildConsensus`, `pearson`, `cosineSimilarity`, `clamp`) are ideal candidates for unit tests with zero setup.

---

### P2 — Polish & Quality

#### P2-1. Low-contrast text used extensively (39 instances)

Classes like `text-slate-400` (on white: ~3.5:1 contrast ratio) and `opacity-80` / `opacity-90` on score cards are used 39 times across the codebase. While some are decorative eyebrow text, many carry meaningful information (dates, review metadata, filter labels). WCAG AA requires 4.5:1 for normal text. The `text-slate-400` → `text-slate-500` swap would fix most instances.

**Key locations:** Score card detail text (`gamepulse-ui.tsx:53`), review metadata rows (every `article` in game/critic/feed pages), browse filter labels.

---

#### P2-2. Category/mechanic tags and score badges may be too small for touch

Multiple interactive and informational elements use `px-3 py-1 text-xs` (roughly 24px height). While non-interactive tags are acceptable, the filter autocomplete suggestions in browse (`app/browse/page.tsx:77`) are `<Link>` elements with this sizing, falling below the 44×44px WCAG 2.5.5 minimum touch target recommendation.

---

#### P2-3. No pagination on browse or feed pages

**Status:** Unfixed from first review (MT-7).

All 40+ games render at once on `/browse`, and all feed items on `/feed`. The PRD targets 2,000+ games — this will become a performance and usability wall.

---

#### P2-4. Toast container may overlap content on small screens

The toast notification container is `fixed bottom-4 right-4` (`components/toast.tsx:45`). On mobile viewports (< 375px), toasts can overlap the bottom navigation links and the newsletter form. The container should use `left-4 right-4 sm:left-auto` to center on mobile, and add `max-w-[calc(100vw-2rem)]` to prevent overflow.

---

#### P2-5. Search autocomplete `onBlur` 120ms timeout is fragile

`components/client-widgets.tsx:72` still uses `window.setTimeout(() => { ... }, 120)` to delay blur so `onMouseDown` on options can fire first. This is a known fragile pattern: on slow devices or high-latency situations, the timeout can fire before the mousedown event is processed. The robust pattern is `onMouseDown={e => e.preventDefault()}` on the dropdown container (which is already done on individual options via `event.preventDefault()` at line 111, but a container-level handler would be more defensive).

---

#### P2-6. `formatDate` doesn't handle invalid date strings gracefully

`components/gamepulse-ui.tsx:13` calls `new Date(value)` without validation. If a DB value is malformed, this produces "Invalid Date" in the UI. A defensive fallback (`value` itself, or "—") would prevent silent rendering bugs.

---

#### P2-7. No `<img>` or image support anywhere — text-only game cards

**Status:** Unfixed from first review (LT-7).

Every game card and detail page is pure text. The PRD (FR-001) mentions "primary image URL." Adding game artwork would dramatically improve visual scanability. At minimum, placeholder illustrations or colored pattern backgrounds per category would help differentiate cards.

---

#### P2-8. DB connection is never closed on process exit

`lib/db/connection.ts` opens a SQLite connection via a global singleton but registers no `process.on('SIGTERM')` or `process.on('exit')` handler to call `db.close()`. While `better-sqlite3` handles this reasonably, explicit cleanup prevents WAL file corruption under abrupt shutdown.

---

#### P2-9. Hero stats include a hardcoded magic number

`app/page.tsx:29` calculates game count as `{trendingGames.length + risingGames.length + 32}+`. The `32` is a magic number. This should query the total game count from the database.

---

## 3. What's Been Successfully Fixed Since First Review

| First Review Item | Status | Notes |
|---|---|---|
| **QW-1** Form feedback (useFormStatus) | ✅ Fixed | `SubmitButton` component with `useFormStatus` + `Loader2` spinner |
| **QW-2** ARIA basics | ✅ Fixed | 37 ARIA attributes now present; landmarks, combobox pattern, sr-only text |
| **QW-4** Keyboard search autocomplete | ✅ Fixed | Arrow keys, Escape, highlighted index, `aria-activedescendant` |
| **QW-5** Affiliate disclosure | ✅ Fixed | Disclosure text at `app/games/[slug]/page.tsx:144` |
| **QW-6** Skip-to-content link | ✅ Fixed | `app/layout.tsx:33`, `#main-content` on `<main>` |
| **QW-7** Newsletter feedback | ✅ Fixed | `NewsletterForm` uses `useActionState` + toast |
| **QW-8** Double-submit protection | ✅ Fixed | `SubmitButton` disables + shows spinner during pending |
| **MT-1** Split `lib/db.ts` | ✅ Fixed | Now `lib/db/connection.ts`, `lib/db/schema.ts`, `lib/db/seed.ts`, `lib/db/seeds/` |
| **MT-2** Split `lib/gamepulse.ts` | ✅ Fixed | Now `lib/queries/{games,critics,feed,user,dashboard,parsers,types}.ts` |
| **MT-8** Toast system | ✅ Fixed | `ToastProvider` with `aria-live`, `role="alert"`, dismiss button |
| **MT-9** Focus rings | ⚠️ Partially | Global `:focus-visible` added but `outline-none` on 9 inputs overrides it |
| **QW-3** Per-page metadata | ✅ Fixed | `generateMetadata` on game + critic pages; static metadata on browse, feed, critics, me |
| **MT-10** Server action validation | ⚠️ Partial | Review + newsletter validate and return errors; watchlist/follow still return void |

---

## 4. Recommended Priority Order

| Priority | Items | Effort |
|---|---|---|
| **P0 — Must fix now** | P0-1 (outline-none regression), P0-2 (browse labels), P0-3 (silent action failures) | 2-4 hours |
| **P1 — Before users** | P1-1 (loading skeletons), P1-2 (DRY scoring), P1-3 (lint cleanup), P1-4 (N+1 queries), P1-5 (browse form), P1-6 (JSON-LD), P1-7 (sitemap), P1-8 (caching), P1-9 (tests) | 3-5 days |
| **P2 — Polish** | P2-1 (contrast), P2-2 (touch targets), P2-3 (pagination), P2-4 (toast mobile), P2-5 (blur timeout), P2-6 (date safety), P2-7 (images), P2-8 (DB close), P2-9 (magic number) | 1-2 sprints |
