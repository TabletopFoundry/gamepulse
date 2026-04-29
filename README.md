# 🎲 GamePulse

**A Rotten Tomatoes-style aggregation hub for board games** — critic consensus scores, community reviews, personalized taste matching, and discovery, all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003b57?logo=sqlite)
![CI](https://img.shields.io/github/actions/workflow/status/josedab/gamepulse/ci.yml?label=CI&logo=github)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏠 **Landing Page** | Hero section, trending games, latest critic reviews, rising games, awards tracker, and newsletter signup |
| 🎮 **Game Pages** | Dual GamePulse scores (critics + community), consensus badge, full critic breakdown, community reviews, price comparison, and similar games |
| 🔍 **Browse & Discover** | Filter by category, player count, and complexity. Sort by score, trending, newest, or most reviewed. Search autocomplete with keyboard navigation |
| 👤 **Critic Profiles** | Taste profile radar charts, review history, taste match percentage, and follow/unfollow actions |
| 📊 **User Dashboard** | Your ratings, watchlist, wishlist, matched critics, taste profile visualization, and personalized score predictions |
| 📰 **Content Feed** | Personalized feed with filters (reviews, news, deals, videos), release calendar, and weekly newsletter preview |
| 🧮 **Taste Matching** | Cosine similarity + Pearson correlation across 6 taste dimensions to match users with aligned critics |
| 💾 **Local Persistence** | All interactions (ratings, reviews, watchlist, follows, newsletter signups) persist in SQLite |

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd 10-gamepulse
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
open http://localhost:3000
```

The database seeds automatically on first run with 40+ games, 8 mock critics, community ratings, reviews, awards, and feed items. No configuration needed.

## 📦 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint checks |
| `npm run type-check` | Run TypeScript compiler checks (no emit) |
| `npm run check` | Run type-check → lint → build (CI gate) |
| `npm run clean` | Remove build artifacts and database |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │
│  │  /       │ │ /browse  │ │ /feed  │ │ /critics │ │
│  │  /games  │ │ /me      │ │        │ │          │ │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └────┬─────┘ │
│       └─────────────┴───────────┴───────────┘       │
│                        │                             │
│  ┌─────────────────────▼──────────────────────────┐ │
│  │            lib/queries/ (Data Layer)            │ │
│  │  games.ts · critics.ts · feed.ts · dashboard.ts│ │
│  └─────────────────────┬──────────────────────────┘ │
│                        │                             │
│  ┌─────────────────────▼──────────────────────────┐ │
│  │         lib/scoring.ts + lib/taste.ts           │ │
│  │   Cosine similarity · Pearson correlation       │ │
│  │   Consensus badges · Personalized predictions   │ │
│  └─────────────────────┬──────────────────────────┘ │
│                        │                             │
│  ┌─────────────────────▼──────────────────────────┐ │
│  │          lib/db/ (SQLite via better-sqlite3)    │ │
│  │  connection.ts · schema.ts · seed.ts · seeds/   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
10-gamepulse/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── api/health/         # Health check endpoint
│   ├── browse/             # Browse & discover with filters
│   ├── critics/            # Critic directory + [slug] profiles
│   ├── feed/               # Personalized content feed
│   ├── games/[slug]/       # Individual game pages
│   ├── me/                 # User dashboard
│   ├── robots.ts           # SEO robots.txt generation
│   └── sitemap.ts          # SEO sitemap generation
├── components/             # React components
│   ├── gamepulse-ui.tsx    # Shared UI: cards, badges, sections
│   ├── client-widgets.tsx  # Client components: search, charts
│   ├── action-forms.tsx    # Form components with server actions
│   ├── submit-button.tsx   # Pending-state submit button
│   └── toast.tsx           # Toast notification system
├── lib/                    # Business logic & data access
│   ├── db/                 # Database connection, schema, seeds
│   ├── queries/            # Per-domain query modules
│   ├── actions.ts          # Server Actions (review, follow, etc.)
│   ├── config.ts           # Centralized configuration constants
│   ├── scoring.ts          # Score algorithms & consensus logic
│   ├── taste.ts            # Taste dimension types
│   └── gamepulse.ts        # Barrel re-exports
├── data/                   # SQLite database (auto-generated)
├── docs/                   # Project documentation
│   ├── PRD.md              # Product Requirements Document
│   ├── CODE_REVIEW.md      # Code quality audit
│   ├── UX_REVIEW.md        # UX & accessibility audit
│   └── IMPROVEMENTS.md     # Improvement roadmap
├── .github/                # GitHub templates and CI
│   ├── workflows/ci.yml    # CI pipeline
│   ├── ISSUE_TEMPLATE/     # Bug report & feature request forms
│   └── pull_request_template.md
└── public/                 # Static assets
```

## 🧮 How Scoring Works

GamePulse uses a multi-signal scoring system:

- **Critics Score** — Weighted average of critic reviews (0–100 scale)
- **Community Score** — Average of user ratings (1–10 scale, displayed as 0–100)
- **Consensus Badge** — Derived from score spread and momentum:
  - 🏆 *Critically Acclaimed* — Critics ≥86 AND Community ≥80
  - ❤️ *Community Favorite* — Community ≥88
  - 💎 *Hidden Gem* — Community ≥80, Critics ≥74, Rising ≥60
  - 🔥 *On the Rise* — Default for active games
  - ⚡ *Divisive* — |Critics − Community| ≥15
- **Personalized Predictions** — Weighted by taste-matched critic correlation (cosine similarity + Pearson)

## 💾 Data Notes

- The database lives at `data/gamepulse.db` and is auto-created on first run
- Seed data regenerates when the internal `SEED_VERSION` changes
- All user interactions (ratings, reviews, watchlist, follows, newsletter) persist locally
- The current user is a hardcoded mock user ("alex") — see [CONTRIBUTING.md](./CONTRIBUTING.md) for auth notes

## 🐳 Docker

```bash
# Build the container
docker build -t gamepulse .

# Run it
docker run -p 3000:3000 gamepulse
```

The SQLite database is created inside the container at `/app/data/gamepulse.db`. Mount a volume to persist data across restarts:

```bash
docker run -p 3000:3000 -v gamepulse-data:/app/data gamepulse
```

## 🔧 Configuration

Copy `.env.example` to `.env.local` to customize settings:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | `https://gamepulse.example.com` | Public URL for sitemap, OG tags, canonical links |
| `NODE_ENV` | `development` | Node.js environment |

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) | Server components, server actions, streaming |
| UI | [React 19](https://react.dev) | Latest concurrent features, `useActionState` |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) | Utility-first, zero-config with PostCSS |
| Charts | [Recharts](https://recharts.org) | Composable radar charts for taste profiles |
| Icons | [Lucide React](https://lucide.dev) | Tree-shakeable icon library |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Synchronous SQLite for server components |
| Language | [TypeScript 5](https://typescriptlang.org) | Strict mode enabled |

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, coding conventions, and the PR process.

## 📄 License

MIT
