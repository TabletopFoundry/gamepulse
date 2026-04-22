# GamePulse — UX & Developer Experience Audit

**Auditor perspective:** Senior engineer encountering this codebase for the first time.  
**Date:** 2025-07-18  
**Scope:** Product UX, developer experience, PRD compliance, polish, performance.

---

## 1. Executive Summary

GamePulse is an impressively complete MVP for a "Rotten Tomatoes for board games." The visual design is polished, the information architecture is clear, and the codebase builds cleanly with zero lint or type errors. The application covers home, browse, feed, critics, game detail, and user dashboard pages — all server-rendered with SQLite and seeded with realistic mock data.

That said, the project punches above its weight visually while cutting corners on **accessibility, form feedback, SEO per-page metadata, keyboard navigation, and mobile interaction polish.** The code is heavily concentrated in two God-files (`lib/db.ts` at 795 lines, `lib/gamepulse.ts` at 670 lines), and every route is `force-dynamic` with no caching strategy. There are zero tests, zero `aria-*` attributes, zero `alt` attributes, and zero `useFormStatus`/`useTransition` calls — meaning all form actions (review, watchlist, follow, newsletter) provide no loading or success feedback to the user.

---

## 2. Top Friction Points (Ranked by User/Developer Impact)

### F1. Zero form feedback on any interactive action
**Impact: Critical (P0)**  
Every `<form action={serverAction}>` fires without any loading indicator, disabled state, optimistic update, or success/error toast. The user clicks "Save rating", "Add to watchlist", "Follow critic", or "Join the pulse" and sees *nothing* change until the page revalidates — which can take perceptible time. Double-clicks are also unprotected.

**Files:** `app/games/[slug]/page.tsx:46-57` (watchlist/wishlist), `app/games/[slug]/page.tsx:133-148` (review form), `app/critics/[slug]/page.tsx:49-53` (follow), `app/page.tsx:62-66` (newsletter).

### F2. Zero accessibility attributes across the entire application
**Impact: Critical (P0)**  
A `grep -rn 'aria-\|role=\|alt='` across the whole codebase returns zero matches. This means:
- The search autocomplete dropdown has no `role="listbox"`, no `aria-expanded`, no `aria-activedescendant`, and no keyboard arrow navigation.
- Score cards have no `aria-label` explaining their meaning to screen readers.
- Icon-only indicators (Flame, Star, Award) convey no information to assistive technology.
- The mobile nav bar has no `role="navigation"` or landmark labeling.
- No skip-to-content link exists.

The PRD explicitly requires **WCAG 2.1 AA** (§5 NFRs). The current state would fail an automated audit.

### F3. No per-page SEO metadata
**Impact: High (P1)**  
Only the root layout exports `metadata`. Game detail pages, critic profiles, browse, and feed pages all render with the generic `<title>GamePulse</title>`. The PRD (FR-011, §9) requires canonical tags, Open Graph, Twitter cards, structured data, and sitemaps — none of which exist.

**Files:** `app/layout.tsx:13-16` is the only metadata export.

### F4. Search autocomplete is mouse-only
**Impact: High (P1)**  
The `SearchAutocomplete` component (`components/client-widgets.tsx:17-89`) has no keyboard arrow key navigation. Pressing Enter selects the first suggestion, but there is no way to highlight a different suggestion with the keyboard. The `onBlur` uses a `setTimeout(120ms)` hack for mouse-down timing that breaks assistive technology focus management.

### F5. `lib/db.ts` is a 795-line God-file mixing schema, seeds, and runtime
**Impact: High (P1) for developer velocity**  
A single file contains the database schema definition, all 40+ game seeds as inline TypeScript arrays, all mock critic/user definitions, the entire seeding transaction, and the runtime `getDb()` singleton. This makes it hard to:
- Find the schema without scrolling past 250 lines of seed data.
- Add a new game or critic without touching critical infra code.
- Test any data layer in isolation.

---

## 3. PRD Feature Compliance

| PRD Requirement | Status | Notes |
|---|---|---|
| **FR-001** Canonical Game Catalog | ✅ Implemented | 40+ games with stable slugs, all metadata fields present |
| **FR-002** Approved Source Registry | ⚠️ Stubbed | Critic seeds exist but no source management, legal status, or ingestion config |
| **FR-003** Content Ingestion & Dedup | ❌ Not implemented | No ingestion pipeline; all data is seed-generated |
| **FR-004** Content-to-Game Matching | ❌ Not implemented | No matching engine; reviews are pre-assigned in seed |
| **FR-005** Review Signal Extraction | ⚠️ Simulated | Scores are algorithmically generated, not extracted from real sources |
| **FR-006** GamePulse Critics Score | ✅ Implemented | Weighted average from critic reviews, consensus badges work |
| **FR-007** Public Game Page | ✅ Implemented | All required modules present: scores, critics, community, prices, similar games |
| **FR-008** Search & Browse | ✅ Implemented | Search, autocomplete, filter by category/players/complexity/sort |
| **FR-009** Deal Links & Affiliate | ⚠️ Simulated | Mock prices with three retailers shown; no click tracking or affiliate disclosure |
| **FR-010** Trending & Recently Updated | ✅ Implemented | Home page has trending and rising modules |
| **FR-011** SEO, Analytics & Monitoring | ❌ Mostly missing | No per-page metadata, no sitemap, no structured data, no analytics events |
| **FR-012** Admin Review Queue | ❌ Not implemented | No admin tooling at all |
| **NFR** WCAG 2.1 AA | ❌ Failing | Zero aria attributes, no focus management, no skip links |
| **NFR** Performance targets | ⚠️ Untested | No lighthouse, no performance monitoring |
| **UX** Loading states | ⚠️ Partial | Root `loading.tsx` exists with skeletons; no per-page or per-section loading |
| **UX** Empty states | ✅ Implemented | `EmptyState` component used consistently across all sections |
| **UX** Error states | ⚠️ Partial | Global `error.tsx` and `not-found.tsx` exist; no per-form or inline error handling |

---

## 4. Quick Wins (< 1 day each)

### QW-1. Add `useFormStatus` pending states to all forms **(P0)**
Wrap each submit button in a small client component that uses `useFormStatus` to show a spinner/disabled state during submission. This eliminates the "dead click" UX on all 5+ forms.

```tsx
// components/submit-button.tsx
"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({ children, ...props }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} {...props}>{pending ? "Saving…" : children}</button>;
}
```

**Files to update:** `app/games/[slug]/page.tsx`, `app/critics/[slug]/page.tsx`, `app/page.tsx`

### QW-2. Add `aria-label` to icon-only elements and landmark roles **(P0)**
- Add `role="navigation" aria-label="Main"` to the header nav.
- Add `aria-label` to the search input.
- Add `sr-only` text to icon-only indicators (Flame = "Buzz score", Star = "Complexity").
- Add `role="listbox"` and `role="option"` to the search autocomplete dropdown.

**Files:** `app/layout.tsx`, `components/client-widgets.tsx`, `components/gamepulse-ui.tsx`

### QW-3. Add per-page `generateMetadata` for game and critic pages **(P1)**
Each dynamic route should export `generateMetadata` returning the game/critic title, description, and Open Graph tags.

```tsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = getGamePageData(slug);
  if (!data) return {};
  return {
    title: `${data.game.title} — GamePulse Score ${data.game.criticsScore}/100`,
    description: data.game.description,
    openGraph: { title: data.game.title, description: data.game.description },
  };
}
```

**Files:** `app/games/[slug]/page.tsx`, `app/critics/[slug]/page.tsx`, `app/browse/page.tsx`, `app/feed/page.tsx`, `app/me/page.tsx`

### QW-4. Add keyboard navigation to search autocomplete **(P1)**
Handle `ArrowDown`, `ArrowUp`, and `Escape` in the `onKeyDown` handler. Track a `highlightedIndex` state. Add `aria-activedescendant` and `role="combobox"`.

**File:** `components/client-widgets.tsx:55-65`

### QW-5. Add affiliate disclosure to price comparison cards **(P1)**
The PRD (§9, FR-009) requires visible affiliate disclosure before click-out. Add a small disclaimer line: "Prices may include affiliate links. GamePulse may earn a commission."

**File:** `app/games/[slug]/page.tsx:110-127`

### QW-6. Add a skip-to-content link **(P1)**
Add a visually-hidden-until-focused "Skip to main content" link as the first element in the body, pointing to `<main id="main-content">`.

**File:** `app/layout.tsx`

### QW-7. Show success feedback after newsletter signup **(P2)**
The newsletter form submits silently. Use `useFormStatus` or `useActionState` to show "You're in! Check your inbox." after successful submission.

**File:** `app/page.tsx:62-66`

### QW-8. Protect against double-submit on review form **(P0)**
The community review form has no disabled state during submission. A user clicking "Save rating" twice could trigger duplicate requests (the DB has a UNIQUE constraint, but the UX is broken).

**File:** `app/games/[slug]/page.tsx:133-148`

---

## 5. Medium-Term Improvements (Days to Sprint)

### MT-1. Split `lib/db.ts` into separate modules **(P1)**
Refactor into:
- `lib/db/schema.ts` — DDL statements
- `lib/db/seeds/critics.ts`, `lib/db/seeds/games.ts`, `lib/db/seeds/users.ts` — seed data
- `lib/db/seed.ts` — the seeding transaction
- `lib/db/connection.ts` — singleton, init, WAL config

This makes each file < 150 lines and allows seed data to be maintained by non-engineers.

### MT-2. Split `lib/gamepulse.ts` into domain modules **(P1)**
Refactor into:
- `lib/queries/games.ts` — `getGamePageData`, `getAllGames`, `getBrowseData`
- `lib/queries/critics.ts` — `getCriticPageData`, `getCriticDirectory`, `getMatchedCritics`
- `lib/queries/feed.ts` — `getFeedData`
- `lib/queries/user.ts` — `getUserDashboard`, `getCurrentUser`, `getCurrentUserRatings`
- `lib/scoring.ts` — `buildConsensus`, `cosineSimilarity`, `pearson`, `getPersonalizedScore`

### MT-3. Add a test suite **(P1)**
There are currently **zero tests** of any kind. Prioritized recommendations:
1. **Unit tests** for scoring functions (`buildConsensus`, `pearson`, `cosineSimilarity`, `getPersonalizedScore`) — these are pure functions with clear expected outputs.
2. **Integration tests** for server actions (`submitCommunityReview`, `toggleUserList`, `toggleFollowCritic`) verifying DB state changes.
3. **Smoke tests** for each route rendering without errors.

### MT-4. Add `loading.tsx` to each route segment **(P1)**
Only the root has a loading skeleton. Each of `/browse`, `/feed`, `/critics`, `/games/[slug]`, `/me` should have its own `loading.tsx` with a layout-matched skeleton to prevent layout shift during navigation.

### MT-5. Remove `force-dynamic` where unnecessary **(P2)**
Every page has `export const dynamic = "force-dynamic"`. The home page, browse (without user-specific data), and critics directory could use `revalidate` instead for much better performance. Only pages that depend on user session state (game detail with watchlist status, `/me`) genuinely need dynamic rendering.

### MT-6. Add structured data markup (JSON-LD) **(P1)**
Game detail pages should include `Product` or `Review` schema.org markup to improve search engine visibility — a core PRD requirement (FR-011).

### MT-7. Add pagination to browse and feed **(P2)**
Currently all 40+ games render at once on `/browse` and all feed items on `/feed`. With the PRD targeting 2,000+ games, this will break. Add cursor-based or offset pagination.

### MT-8. Add toast/notification system for server action feedback **(P1)**
Beyond just pending states, users need success/error feedback. Implement a lightweight toast system (or use `useActionState`) to show "Added to watchlist", "Review saved", "Following critic", etc.

### MT-9. Add visible focus rings to all interactive elements **(P0)**
The CSS resets `outline: none` on inputs but never adds a visible `:focus-visible` ring. This makes the application unusable for keyboard-only users.

**File:** `app/globals.css` — add a global `:focus-visible` style.

### MT-10. Validate and sanitize server action inputs more robustly **(P1)**
`lib/actions.ts` does basic validation but:
- `submitCommunityReview` silently returns on invalid input with no user feedback.
- Email validation (`email.includes("@")`) is minimal.
- No rate limiting or CSRF protection.

---

## 6. Long-Term Investments

### LT-1. Implement real authentication **(P1)**
The app hardcodes `is_current = 1` to identify "Alex Rowan" as the user. All user features (watchlist, ratings, follows, taste matching) are single-user. To support multiple users:
- Add auth (NextAuth.js, Clerk, or similar).
- Make `getCurrentUser()` session-aware.
- Protect `/me` and write actions behind auth.

### LT-2. Build admin tooling (FR-002, FR-012) **(P1)**
The PRD designates source management and review queue as "Must" requirements. Neither exists. This is the largest gap between PRD and implementation.

### LT-3. Replace mock data pipeline with real ingestion **(P1)**
The entire data layer is a single seed transaction with algorithmically-generated scores. To move toward production:
- Build a BGG metadata importer.
- Build RSS/YouTube ingestion pipeline.
- Implement the content-matching engine.
- Replace synthetic scores with extracted review signals.

### LT-4. Add real-time or near-real-time score updates **(P2)**
The PRD requires score recalculation within 30 minutes of ingestion. This implies a background job system (cron, queue, or Next.js cron routes) that doesn't exist yet.

### LT-5. Add analytics event tracking **(P1)**
FR-011 requires page view, content click, deal click, search, and zero-result search events. None are instrumented. Consider a lightweight event system (PostHog, Plausible, or custom).

### LT-6. Implement sitemap generation **(P1)**
No `sitemap.ts` or `sitemap.xml` route exists. For an SEO-led growth strategy (PRD §1), this is foundational.

### LT-7. Consider image support for game cards **(P2)**
Every game card is text-only. The PRD mentions "primary image URL" in FR-001. Adding game artwork/thumbnails would dramatically improve visual scanability and the browse experience.

---

## 7. Comparison to Best Practices

| Area | Current State | Industry Standard |
|---|---|---|
| **Accessibility** | Zero ARIA, no focus management, no skip links | WCAG 2.1 AA minimum; automated CI checks (axe-core) |
| **Form UX** | Silent submission, no loading/success/error | `useFormStatus` + optimistic updates + toast feedback |
| **SEO** | Single generic `<title>` tag | Per-page `generateMetadata`, structured data, sitemap, OG/Twitter cards |
| **Testing** | Zero tests | Unit tests for business logic, integration for actions, E2E for critical flows |
| **Error handling** | Global error boundary only | Per-form validation errors, inline field errors, retry logic |
| **Code organization** | Two 700+ line files | Domain-split modules, max ~200 lines per file |
| **Caching** | `force-dynamic` on every route | ISR/revalidate for public pages, dynamic only for user-specific views |
| **CI/CD** | No CI config found | Lint + type-check + test + build in CI; preview deploys |
| **Performance monitoring** | None | Lighthouse CI budget, Core Web Vitals tracking |
| **Keyboard navigation** | Broken in autocomplete, no visible focus | Full keyboard support, visible focus rings, roving tabindex |

---

## 8. What's Working Well

These are genuine strengths worth preserving:

1. **Visual design is cohesive and premium.** The rose/slate palette, generous border-radius, gradient heroes, and consistent spacing create a distinctive brand identity.
2. **Information architecture is intuitive.** Home → Browse → Game Detail → Critic Profile is a natural funnel. The "Rising now" sidebar, awards tracker, and feed page create multiple discovery entry points.
3. **Taste matching algorithm is well-thought-out.** The combination of Pearson correlation on rating overlap + cosine similarity on taste profiles is a solid foundation for personalization.
4. **Empty states are handled everywhere.** Every list section has a meaningful `EmptyState` with contextual copy that guides the user toward action.
5. **Data model is clean and normalized.** The SQLite schema has proper foreign keys, unique constraints, and sensible indexing.
6. **Server actions with `revalidatePath` work correctly.** Despite lacking UX feedback, the underlying data flow (form → action → DB → revalidate) is architecturally sound.
7. **Build is clean.** Zero TypeScript errors, zero lint warnings, and the build completes in ~22 seconds.
8. **Onboarding is frictionless.** `npm install && npm run dev` just works — the database auto-seeds and the README is accurate.

---

## 9. Recommended Priority Order

| Priority | Items | Estimated Effort |
|---|---|---|
| **P0 — Ship blockers** | QW-1 (form feedback), QW-2 (aria basics), QW-8 (double-submit), MT-9 (focus rings) | 1-2 days |
| **P1 — Must-fix before users** | QW-3 (SEO metadata), QW-4 (keyboard search), QW-5 (affiliate disclosure), QW-6 (skip link), MT-1/MT-2 (code split), MT-3 (tests), MT-6 (JSON-LD), MT-8 (toasts), MT-10 (validation) | 1-2 weeks |
| **P2 — Polish for quality** | QW-7 (newsletter feedback), MT-4 (loading skeletons), MT-5 (caching), MT-7 (pagination), LT-7 (images) | 1-2 sprints |
| **P1 — Platform gaps** | LT-1 (auth), LT-2 (admin tooling), LT-5 (analytics), LT-6 (sitemap) | Multi-sprint |
| **Long-term** | LT-3 (real ingestion), LT-4 (background jobs) | Quarter+ |
