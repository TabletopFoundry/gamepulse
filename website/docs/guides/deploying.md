---
title: Deploying
description: How to deploy GamePulse with Docker, on a single VM, or behind a managed Node host — and the SQLite gotchas that matter.
sidebar_position: 4
---

# Deploying

GamePulse is a **single Next.js server + a SQLite file**. That makes deployment simple, but there are two things to get right: **persistence** and **single-writer SQLite**.

## TL;DR

| Target | Difficulty | Use when |
| --- | --- | --- |
| Docker on any VM | ⭐ Easy | You want full control and persistence |
| Fly.io with a volume | ⭐ Easy | You want managed infra + a persistent disk |
| Railway / Render with a volume | ⭐ Easy | You want one-click deploys |
| Vercel / serverless | ⛔ Don't | Serverless runtimes can't hold a persistent SQLite file |
| Kubernetes | ⭐⭐ Medium | Pin to a single replica with a `PersistentVolume` |

The non-negotiable rule: **the process must write to a persistent disk, and only one process can write at a time.** SQLite is single-writer.

## Docker

The repo ships a production-ready `Dockerfile`:

```bash
docker build -t gamepulse .
docker run -p 3000:3000 -v gamepulse-data:/app/data gamepulse
```

The `-v gamepulse-data:/app/data` mount keeps `gamepulse.db` across container restarts.

## Fly.io

1. Install the Fly CLI and `fly launch` from the repo root.
2. When asked about a volume, **yes** — create one named `data` of at least 1 GB, mounted at `/app/data`.
3. Set runtime env:

   ```bash
   fly secrets set NEXT_PUBLIC_BASE_URL=https://gamepulse.fly.dev
   ```

4. Deploy:

   ```bash
   fly deploy
   ```

Make sure your `fly.toml` declares `min_machines_running = 1` and a single region — multi-region with SQLite needs LiteFS, which is out of scope here.

## Behind a reverse proxy

GamePulse listens on port `3000` and has no internal HTTPS. Front it with **Caddy**, **Nginx**, **Traefik**, or your platform's edge.

### Caddy snippet

```
gamepulse.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

That's it. Caddy handles TLS automatically.

## Environment variables

The complete list lives in [Reference → Configuration](../reference/configuration.md). The two you'll most likely set:

| Variable | Example | Why |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `https://gamepulse.example.com` | Used for sitemap, Open Graph, and canonical links |
| `NODE_ENV` | `production` | Enables Next.js production optimizations and blocks accidental reseeds |

## Database persistence

The SQLite file lives at `data/gamepulse.db`. The WAL and SHM sidecars (`gamepulse.db-wal`, `gamepulse.db-shm`) live next to it.

**Back up all three together** while the server is stopped, or use `sqlite3 .backup` for a hot copy:

```bash
sqlite3 data/gamepulse.db ".backup data/backups/gamepulse-$(date +%F).db"
```

## Production reseed guard

In production, the seeder **refuses to wipe existing data**. To force a reseed (e.g. on a staging environment), set:

```bash
GAMEPULSE_ENABLE_PRODUCTION_RESEED=1
```

This is intentional — running `npm run start` on a production box should never destroy user data.

## Health checks

The app exposes `GET /api/health`:

```json
{ "status": "ok", "version": "0.1.0" }
```

Wire it into your platform's health check. The endpoint returns `200` if the database is reachable and the process is up.

## Scaling beyond one box

You can scale Next.js horizontally, but not SQLite. Two practical options:

1. **Vertical only** — give one box more CPU/RAM. For the seed-scale workload (60 games, 200 reviews, dozens of QPS), this carries you a long way.
2. **Migrate to Postgres** — replace `lib/db/connection.ts` and the parameterized SQL in `lib/queries/*` with `pg`. The schema is portable; only the driver changes.

See [Configuration](../reference/configuration.md) for the full env-variable reference and [Troubleshooting](../troubleshooting.md) for common deployment errors.
