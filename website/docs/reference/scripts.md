---
title: npm Scripts
description: Every npm script defined in package.json — when to use it and what it actually does.
sidebar_position: 2
---

# npm Scripts

Every script defined in `package.json`, ordered by how often you'll use it.

## Development

### `npm run dev`

Starts the Next.js development server with hot reload on `http://localhost:3000`.

On first boot it:

1. Opens (or creates) `data/gamepulse.db`.
2. Applies the schema.
3. Runs the seed if `app_meta.seed_version` is behind `SEED_VERSION` or the database is empty.

```bash
npm run dev
```

### `npm run clean`

Removes `.next/` and the SQLite file (plus WAL/SHM sidecars). Use when:

- You changed seed data and want a fresh database.
- The dev server is misbehaving and you want to nuke caches.

```bash
npm run clean
```

Then re-run `npm run dev`.

## Quality gates

### `npm run type-check`

Runs `tsc --noEmit`. Verifies TypeScript types without building.

```bash
npm run type-check
```

Fast (~2–4 seconds on a warm cache). Run this constantly while editing.

### `npm run lint`

Runs ESLint with the Next.js + project ruleset. Strict mode is on; no `any`, no unchecked indexed access.

```bash
npm run lint
```

### `npm run build`

Builds the production bundle. Runs through every page, statically analyzes routes, and emits `.next/`.

```bash
npm run build
```

### `npm run check`

The CI gate. Runs **type-check → lint → build** sequentially. All three must pass.

```bash
npm run check
```

Before every PR, run this. The GitHub Action runs the same command.

## Production

### `npm run start`

Serves the production build (you must run `npm run build` first).

```bash
npm run build
npm run start
```

In Docker, the entrypoint runs both.

## When to use which

| You just… | Run this |
| --- | --- |
| Started working | `npm run dev` |
| Changed seed data | `npm run clean && npm run dev` |
| Made type changes | `npm run type-check` |
| Are about to push | `npm run check` |
| Deployed | `npm run build && npm run start` |
| Got weird build output | `npm run clean && npm install && npm run dev` |

See [Troubleshooting](../troubleshooting.md) if any script fails.
