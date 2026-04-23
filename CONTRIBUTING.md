# Contributing to GamePulse

Thanks for your interest in contributing to GamePulse! This guide will help you get from zero to your first PR.

## Prerequisites

- **Node.js 20+** (use `nvm use` if you have [nvm](https://github.com/nvm-sh/nvm) installed)
- **npm 10+**
- A code editor with TypeScript and Tailwind CSS support (VS Code recommended)

## Getting Started

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/gamepulse.git
cd gamepulse

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

The SQLite database seeds automatically on first run. No additional setup is needed.

## Project Architecture

GamePulse follows a layered architecture:

```
Pages (app/)  →  Queries (lib/queries/)  →  Database (lib/db/)
                        ↓
              Scoring (lib/scoring.ts)
              Taste (lib/taste.ts)
```

- **`app/`** — Next.js App Router pages. Each route is a server component that calls query functions directly.
- **`components/`** — Reusable UI components. Files ending in `client-widgets.tsx` and `action-forms.tsx` are client components (`"use client"`).
- **`lib/queries/`** — Data access layer split by domain (games, critics, feed, user, dashboard).
- **`lib/db/`** — Database connection singleton, schema definition, and seed data.
- **`lib/scoring.ts`** — Scoring algorithms: cosine similarity, Pearson correlation, consensus badges, personalized predictions.
- **`lib/actions.ts`** — Server Actions for mutations (reviews, follows, watchlist, newsletter).

## Development Workflow

### Available Scripts

| Script | Use When |
|---|---|
| `npm run dev` | Active development with hot reload |
| `npm run build` | Verify production build works |
| `npm run lint` | Check for ESLint issues |
| `npm run type-check` | Check TypeScript types without building |
| `npm run clean` | Reset database and build artifacts |

### Before Submitting a PR

```bash
# Run all checks
npm run type-check
npm run lint
npm run build
```

All three must pass. The CI pipeline will run these automatically on your PR.

## Coding Conventions

### TypeScript
- **Strict mode is enabled** — no `any` types, no unchecked indexed access
- Use explicit return types on exported functions
- Prefer `type` over `interface` for object shapes (project convention)
- Use path aliases: `@/lib/...`, `@/components/...`

### Styling
- **Tailwind CSS only** — no custom CSS files except `globals.css`
- Follow the existing design system: `rounded-[2rem]` cards, `rose-500` accents, `slate-950` text
- Use the shared components from `gamepulse-ui.tsx` (`PageShell`, `SectionHeading`, `ScoreCard`, etc.)

### Components
- Server components by default; add `"use client"` only when needed (hooks, event handlers, browser APIs)
- Forms use Server Actions via `useActionState` + `SubmitButton` for pending states
- Toast notifications via `useToast()` from `@/components/toast`

### Database
- All queries go in `lib/queries/` — never call `getDb()` directly from page components
- Seed data lives in `lib/db/seeds/` — one file per entity type
- Bump `SEED_VERSION` in `lib/db/seed.ts` when changing seed data

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Types: `PascalCase` (e.g., `GameCardData`, `CriticReview`)
- Database columns: `snake_case`

## Important Notes

### Mock Authentication
The current user is hardcoded via `getCurrentUser()` in `lib/queries/user.ts`. All server actions operate as the seeded "alex" user. This is intentional for the MVP demo — a real auth layer (NextAuth.js) is on the roadmap.

### Database
The SQLite database is ephemeral and auto-seeds. Don't commit `data/*.db` files (they're gitignored). If your database gets into a bad state, run `npm run clean` and restart the dev server.

## Pull Request Guidelines

1. **One concern per PR** — keep changes focused and reviewable
2. **Descriptive title** — use conventional commit style: `feat: add game comparison view`, `fix: correct score rounding`, `docs: update API examples`
3. **Description** — explain *what* changed and *why*, not just *how*
4. **Self-review** — check the diff before requesting review
5. **Tests** — add tests for new utility functions in `lib/`

## Need Help?

- Check the [docs/](./docs/) folder for the PRD, code review, and UX review documents
- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas

Thank you for helping make GamePulse better! 🎲
