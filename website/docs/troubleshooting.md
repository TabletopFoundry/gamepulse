---
title: Troubleshooting & FAQ
description: Fixes for the most common GamePulse errors and answers to recurring questions.
---

# Troubleshooting & FAQ

## Install & build errors

### `better-sqlite3` fails to build

You'll see an error like:

```
gyp ERR! find Python …
or
node-gyp rebuild failed
```

`better-sqlite3` compiles a native binding during `npm install`. You need a C++ toolchain.

- **macOS**: `xcode-select --install`
- **Ubuntu/Debian**: `sudo apt install build-essential python3`
- **Windows**: install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with the "Desktop development with C++" workload.

Then re-run `npm install`.

### Node version error

If the install fails on `engines` or you see syntax errors during build, check your Node version:

```bash
node --version  # must be ≥ 20.x
```

The repo includes a `.nvmrc`. With `nvm`:

```bash
nvm use
```

### `npm run dev` hangs at "seeding database"

This usually means an earlier seed crashed mid-transaction and left a lock. Fix with:

```bash
npm run clean
npm run dev
```

`clean` removes `data/gamepulse.db*` so the next dev start rebuilds from scratch.

## Runtime issues

### Database is locked (`SQLITE_BUSY`)

SQLite is single-writer. You'll see this if two processes try to write at once — typically `npm run dev` running alongside `npm run start`. Stop one of them.

If you're running in production behind a process supervisor (PM2, systemd, Docker), make sure only one instance writes to `data/gamepulse.db`.

### "Cannot find module" after pulling new changes

Something in `node_modules` is stale.

```bash
rm -rf node_modules .next
npm install
npm run dev
```

### My new seed data isn't showing up

You probably forgot to bump `SEED_VERSION`:

```ts
// lib/db/seed.ts
const SEED_VERSION = 5; // ← bump this
```

Then:

```bash
npm run clean && npm run dev
```

See [Seeding Data](./guides/seeding-data.md) for the full pipeline.

### A page returns 404 after I added it

The Next.js App Router file conventions changed in v16. Make sure your new route is:

```
app/<your-route>/page.tsx
```

Not `index.tsx`. Not `route.tsx` (that's for API routes). The file must be named `page.tsx`.

### Type errors after editing the schema

If you added a column to `lib/db/schema.ts` but didn't update parsers, TypeScript will surface the gap. Update:

1. `lib/queries/types.ts` — add the field to the relevant type.
2. `lib/queries/parsers.ts` — read the new field from `RawGame` / `RawCritic`.

Then `npm run type-check` should pass.

## Performance

### Pages feel slow in dev

Dev mode runs everything in development — no minification, no static optimization, source maps, HMR. Run `npm run build && npm run start` to get a realistic feel. Production pages render in single-digit milliseconds.

### `npm run check` takes forever

`npm run check` runs `type-check → lint → build`. The build is the slow part — typically 20–40 seconds. To iterate faster:

```bash
npm run type-check  # ~3 seconds
npm run lint        # ~5 seconds
```

Then `npm run build` only when you're ready to verify the whole thing.

## FAQ

### Where's the real authentication?

It's intentionally not built in. `getCurrentUser()` returns the seeded mock user `alex`. Adding NextAuth.js (or Clerk, or Lucia) is a roadmap item — see [Data Model → Mock authentication](./concepts/data-model.md#mock-authentication) for the minimum diff.

### Can I use Postgres instead of SQLite?

Yes. The schema is portable. Swap `better-sqlite3` for `pg` in `lib/db/connection.ts` and update the parameterized SQL placeholders (`?` → `$1`, `$2`, …). The query and route layers don't need to change.

### Can I deploy to Vercel?

No — Vercel's serverless runtime can't host a persistent SQLite file across invocations. Use Fly.io, Railway, Render, a VPS, or Docker on any host with a persistent volume. See [Deploying](./guides/deploying.md).

### Where do the critic scores come from?

They're hand-authored in `lib/db/seeds/critic-reviews.ts`. GamePulse doesn't scrape any third-party site. The 14 critics are illustrative — replace them with whatever set makes sense for your audience.

### Why not BoardGameGeek's API?

Two reasons: BGG's API has aggressive rate limits and inconsistent response shapes, and seeding from a third party makes the project less self-contained. The MVP optimizes for "clone and run" over "synced with the real world." Adding a BGG importer is a reasonable extension — it just doesn't ship by default.

### Is there a roadmap?

Yes, in [`docs/IMPROVEMENTS.md`](https://github.com/TabletopFoundry/gamepulse/blob/main/docs/IMPROVEMENTS.md) in the repo. The headline items: real auth, BGG sync (optional), price-tracker webhooks, and a public read-only API.

### How do I report a bug?

[Open an issue](https://github.com/TabletopFoundry/gamepulse/issues/new) with reproduction steps. Issue templates are provided. For security issues, please email the maintainers privately rather than opening a public issue.
