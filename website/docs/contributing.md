---
title: Contributing
description: How to contribute to GamePulse — setup, conventions, PR process.
---

# Contributing

Thanks for your interest in contributing to GamePulse! This guide gets you from zero to your first PR in **about 15 minutes**.

## Code of Conduct

GamePulse follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be welcoming, be patient, assume good intent. Harassment of any kind is not tolerated.

## Setup

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/<your-username>/gamepulse.git
cd gamepulse

# 2. Install
nvm use     # if you have nvm
npm install

# 3. Run
npm run dev
```

You're ready. See [Quick Start](./getting-started/quick-start.md) if anything blows up.

## Before you start coding

1. **Search [open issues](https://github.com/TabletopFoundry/gamepulse/issues)** — your idea may already be tracked.
2. For non-trivial changes, **open an issue or discussion first** describing the proposal. This avoids wasted work.
3. **Branch from `main`**: `git checkout -b feat/your-feature`.

## Coding conventions

These are enforced by ESLint + TypeScript, but worth reading once:

### TypeScript

- **Strict mode is on.** No `any`, no unchecked indexed access.
- **Explicit return types** on exported functions.
- **`type` over `interface`** for object shapes (project convention).
- **Path aliases**: `@/lib/...`, `@/components/...` — never relative paths across layers.

### Styling

- **Tailwind only.** No additional CSS files except `app/globals.css`.
- **Stick to the design system**: `rounded-[2rem]` cards, `rose-500` accents, `slate-950` text.
- **Use shared UI** from `components/gamepulse-ui.tsx` (`PageShell`, `SectionHeading`, `ScoreCard`, `ConsensusBadge`, `GameCard`).

### Components

- **Server components by default.** Add `"use client"` only when you need hooks, event handlers, or browser APIs.
- **Forms use server actions** via `useActionState` + the shared `SubmitButton`.
- **Toast notifications** via `useToast()` from `@/components/toast`.

### Data access

- **Pages never call `getDb()` directly.** All reads go through `lib/queries/`, all writes through `lib/actions.ts`.
- **Seed data** lives in `lib/db/seeds/`. Bump `SEED_VERSION` in `lib/db/seed.ts` when you change it.
- **Parameter binding always** — never string-interpolate SQL.

### Naming

| Kind | Style | Example |
| --- | --- | --- |
| Files | kebab-case | `game-card.tsx` |
| Components | PascalCase | `GameCard` |
| Functions | camelCase | `getGameBySlug` |
| Types | PascalCase | `GameCardData` |
| DB columns | snake_case | `community_score` |

## The PR process

### 1. Make the change

Keep PRs **focused**. One concern per PR. If your change touches three unrelated areas, split it.

### 2. Run the CI gate

```bash
npm run check
```

This runs `type-check → lint → build`. All three must pass before you push.

### 3. Write a clear PR description

Use the PR template. Cover:

- **What** changed (one or two sentences)
- **Why** it changed (link to issue or explain the motivation)
- **How** to test it (the steps a reviewer should take)
- Screenshots for any visual change

### 4. Conventional commit prefixes

| Prefix | Use for |
| --- | --- |
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Internal change, no behavior difference |
| `perf:` | Performance improvement |
| `chore:` | Tooling, deps, build config |

### 5. Self-review

Read your own diff before you request review. Catch:

- Dead code, console.logs, commented-out blocks
- Unused imports
- Inconsistent naming
- Missing types on exported functions

## What we're looking for

| Welcome | Less welcome |
| --- | --- |
| Bug fixes with reproduction steps | Drive-by formatting changes |
| New games / critics with realistic data | Sweeping refactors without discussion |
| Documentation improvements | Adding heavy dependencies (`zod`, `prisma`, …) for marginal gains |
| Accessibility fixes | Style nitpicks not tied to a real readability issue |
| Test improvements for `lib/` algorithms | Tests for trivial components |

## Areas that need help

- **Real authentication** integration (NextAuth.js or Clerk) — see [Data Model → Mock authentication](./concepts/data-model.md#mock-authentication).
- **BoardGameGeek importer** as an optional seed pipeline.
- **Price-tracker webhooks** for `game_prices` updates.
- **Accessibility audit** of forms and modals.
- **More critic personalities** in seed data — bring your community's voice.

## Need help?

- Read [docs/](https://github.com/TabletopFoundry/gamepulse/tree/main/docs) in the repo (PRD, code review, UX review).
- Open a [Discussion](https://github.com/TabletopFoundry/gamepulse/discussions) for questions.
- Open an [Issue](https://github.com/TabletopFoundry/gamepulse/issues) for bugs.

Thank you for helping make GamePulse better. 🎲
