# GamePulse MVP

GamePulse is a Rotten Tomatoes-style board game content hub built with Next.js App Router, TypeScript, Tailwind CSS, Recharts, and SQLite via `better-sqlite3`.

## What&apos;s included

- Landing page with hero, trending games, latest reviews, and newsletter signup
- Game pages with dual GamePulse scores, consensus badge, critic breakdown, community reviews, price comparison, and similar games
- Browse and discover flow with filters, sort options, search autocomplete, and awards tracker
- Critic profile pages with taste profile charts, review history, taste match percentage, and follow action
- User dashboard with ratings, watchlist, wishlist, matched critics, and personalized score recommendations
- Personalized content feed with filters, release calendar, and newsletter preview
- SQLite seed layer with 40+ games, 8 mock critics, community ratings, reviews, awards, feed items, and release data

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — start the local dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Data notes

- The database is stored at `data/gamepulse.db`
- Seed data is generated automatically on first run or when the internal seed version changes
- Interactive actions (ratings, reviews, watchlist, wishlist, follows, newsletter signups) persist locally in SQLite
