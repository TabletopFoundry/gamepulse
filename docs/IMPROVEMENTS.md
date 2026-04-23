# GamePulse — Improvement Plan

**Generated:** 2025-07-18
**Scope:** Repository quality, developer experience, documentation, and project polish
**Stack:** Next.js 16 · React 19 · TypeScript 5 · SQLite (better-sqlite3) · Tailwind CSS 4 · Recharts

---

## Executive Summary

GamePulse is an impressively complete MVP — a "Rotten Tomatoes for board games" with polished UI, modular architecture, and rich seeded data. However, the project lacks the foundational project-health infrastructure that signals quality to contributors, employers, and users.

**Top 5 highest-impact changes:**

1. **README overhaul** — Transform from minimal bootstrapped README to a showcase-quality project page with feature descriptions, architecture overview, tech stack badges, and quick-start that builds trust in < 30 seconds
2. **Developer tooling** — Add `.editorconfig`, `.nvmrc`, type-check script, and stricter TypeScript/ESLint configurations for contributor consistency
3. **Contributing guide** — Create a clear `CONTRIBUTING.md` path from zero to first PR
4. **Package metadata** — Add description, keywords, repository URL, and convenience scripts to `package.json`
5. **Architecture documentation** — Document the layered data architecture, scoring algorithms, and project structure for onboarding

---

## Current State Assessment

| Dimension | Score (1-10) | Key Gap |
|-----------|:---:|---------|
| Language Modernity | 8 | Modern Next.js 16/React 19/TS5 stack; could tighten TS strictness |
| Tooling & CI/CD | 3 | No CI, no pre-commit hooks, no formatting config, no type-check script |
| Type Safety / Correctness | 7 | `strict: true` enabled; some `as` casts on DB results could use runtime validation |
| Documentation | 4 | Minimal README, no CONTRIBUTING.md, existing review docs are internal-only |
| Security Posture | 3 | No auth (documented as mock), no SECURITY.md, WAL files could leak data |
| Community Health | 2 | No issue templates, no PR template, no CONTRIBUTING guide, no CODEOWNERS |
| Discoverability | 3 | No badges, no social preview, minimal README, no topic tags |

---

## Implemented Improvements

### ✅ Quick Wins (Implemented)

#### 1. README.md — Complete Rewrite
- **What:** Replaced boilerplate README with a showcase-quality project page
- **Includes:** Feature grid, architecture overview, tech stack with badges, expanded quick-start, project structure map, contributing pointer, roadmap section
- **Impact:** First impression goes from "bootstrapped template" to "serious project"

#### 2. .editorconfig — Editor Consistency
- **What:** Added `.editorconfig` for consistent formatting across editors/IDEs
- **Impact:** Prevents mixed indentation, trailing whitespace, and line-ending issues from contributors

#### 3. .nvmrc — Node Version Pinning
- **What:** Pinned Node.js 20 LTS as the expected runtime
- **Impact:** `nvm use` just works; no "works on my machine" version drift

#### 4. package.json — Metadata & Scripts
- **What:** Added `description`, `keywords`, `homepage`, `repository`, convenience scripts (`type-check`, `dev:seed`, `clean`)
- **Impact:** npm/GitHub discovery; developers can type-check independently of build

#### 5. CONTRIBUTING.md — Contributor Onboarding
- **What:** Created comprehensive contributing guide with setup steps, architecture overview, coding conventions, and PR process
- **Impact:** Reduces barrier from "I'd like to help" to "here's my first PR"

#### 6. TypeScript — Stricter Compiler Options
- **What:** Added `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, and `exactOptionalPropertyTypes`
- **Impact:** Catches more bugs at compile time; signals code quality to contributors

#### 7. Homepage Metadata
- **What:** Added explicit `metadata` export to homepage (`app/page.tsx`) with OpenGraph and Twitter card tags
- **Impact:** Better SEO and social sharing for the landing page

---

## Remaining Recommendations

### Medium Effort (1 day – 1 week)

#### 1. GitHub Actions CI Pipeline
Add a `.github/workflows/ci.yml` that runs on PRs:
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build
```
**Impact:** Prevents broken code from landing; green badge builds trust.

#### 2. Issue & PR Templates
Create `.github/ISSUE_TEMPLATE/bug_report.yml` and `.github/PULL_REQUEST_TEMPLATE.md` to standardize contributions and triage.

#### 3. Prettier Integration
Add Prettier for consistent auto-formatting:
```bash
npm install -D prettier eslint-config-prettier
```
**Impact:** Eliminates all formatting debates; consistent diffs.

#### 4. Testing Foundation
Add Vitest with React Testing Library for component and utility tests:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```
Priority test targets: `lib/scoring.ts` (pure functions), `lib/taste.ts`, server actions validation.

#### 5. Runtime Type Validation for DB Results
Replace `as` type assertions on SQLite query results with a lightweight runtime validator (e.g., Zod schemas) to catch schema drift at runtime instead of silently mis-typing data.

### Strategic Investments (> 1 week)

#### 1. Authentication Layer
Replace the hardcoded `getCurrentUser()` with NextAuth.js or a session-cookie approach. All server actions currently trust a single global user — this is the biggest gap between "demo" and "usable product."

#### 2. API Layer / tRPC
Extract data access behind a typed API layer. Currently, page components directly call SQLite queries. An API boundary enables:
- Future client-side data fetching
- Easier testing with mock data
- Potential migration away from SQLite

#### 3. Comprehensive SEO
- Sitemap generation (`next-sitemap`)
- JSON-LD structured data for game pages
- Canonical URLs
- robots.txt optimization

#### 4. Performance Monitoring
- Lighthouse CI in GitHub Actions
- Web Vitals tracking
- Database query performance logging

---

## GitHub Project Health Checklist

```
Repository Basics:
[x] Descriptive README with quick start
[x] LICENSE file (needs adding)
[x] CONTRIBUTING.md
[ ] Issue templates
[ ] PR template
[ ] CODEOWNERS

Automation:
[ ] CI running on PRs
[ ] Automated testing
[ ] Dependency updates (Dependabot/Renovate)
[ ] Release automation
[ ] Security scanning

Documentation:
[x] Architecture overview (in README)
[x] Project structure map (in README)
[ ] API docs
[x] Existing review docs (PRD, CODE_REVIEW, UX_REVIEW)
[ ] Changelog

Community:
[ ] Good first issues
[ ] Discussion forum or chat
[ ] Social preview image
[ ] Appropriate topic tags
```

---

## 90-Day Roadmap

### Days 1–7: Foundation ✅ (Mostly Done)
- [x] README overhaul with feature showcase
- [x] CONTRIBUTING.md
- [x] .editorconfig + .nvmrc
- [x] Stricter TypeScript config
- [x] Package metadata and scripts
- [ ] Add LICENSE file (MIT recommended)
- [ ] Set up GitHub repository topics

### Days 8–30: Core Quality
- [ ] GitHub Actions CI (lint + type-check + build)
- [ ] Prettier integration
- [ ] Issue and PR templates
- [ ] Vitest setup with first 10 unit tests on scoring/taste utilities
- [ ] Dependabot configuration

### Days 31–60: Polish & DX
- [ ] Authentication spike (NextAuth.js)
- [ ] Runtime DB result validation (Zod)
- [ ] Sitemap + JSON-LD structured data
- [ ] Lighthouse CI integration
- [ ] Error boundary improvements per route segment

### Days 61–90: Growth
- [ ] Interactive demo deployment (Vercel)
- [ ] Social preview image (1280×640)
- [ ] "Good first issue" labels on 5+ issues
- [ ] Blog post / case study writeup
- [ ] Submit to awesome-nextjs and awesome-boardgames lists

---

## Competitive Analysis

| Feature | GamePulse | BoardGameGeek | Meeple.net | Dicebreaker |
|---|---|---|---|---|
| Aggregated critic scores | ✅ Core feature | ❌ Community only | ❌ | ❌ Single outlet |
| Taste-matched critics | ✅ Cosine similarity | ❌ | ❌ | ❌ |
| Personalized predictions | ✅ Weighted scoring | ⚠️ GeekBuddy (basic) | ❌ | ❌ |
| Modern tech stack | ✅ Next.js 16/React 19 | ❌ Legacy PHP | ⚠️ | ⚠️ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Mobile responsive | ✅ | ⚠️ Partial | ✅ | ✅ |
| Community reviews | ✅ | ✅ (dominant) | ⚠️ | ⚠️ |
| Price comparison | ✅ Mock | ❌ | ❌ | ❌ |

**Key differentiator:** GamePulse is the only open-source project that combines aggregated critic scoring with personalized taste matching — a "Rotten Tomatoes meets Spotify Wrapped" approach that no existing board game platform offers.
