import { getDb } from "@/lib/db";
import { topGenres } from "@/lib/scoring";
import type { RawCritic } from "./types";
import { parseCritic } from "./parsers";
import { getCurrentUser, getMatchedCritics } from "./user";

export async function getCriticPageData(slug: string) {
  const db = getDb();
  const criticRow = db.prepare(`SELECT * FROM critics WHERE slug = ?`).get(slug) as RawCritic | undefined;
  if (!criticRow) return null;
  const critic = parseCritic(criticRow);
  const matchedCritic = (await getMatchedCritics()).find((candidate) => candidate.slug === slug) ?? null;
  const reviews = db.prepare(`
    SELECT cr.id, cr.score, cr.verdict, cr.excerpt, cr.published_at, g.slug as game_slug, g.title as game_title
    FROM critic_reviews cr
    JOIN games g ON g.id = cr.game_id
    WHERE cr.critic_id = ?
    ORDER BY cr.published_at DESC
  `).all(critic.id) as Array<{ id: number; score: number; verdict: string; excerpt: string; published_at: string; game_slug: string; game_title: string }>;
  const followed = Boolean(db.prepare(`SELECT 1 FROM follows WHERE user_id = ? AND critic_id = ?`).get(getCurrentUser().id, critic.id));

  return {
    critic,
    matchedCritic,
    followed,
    reviews,
    favoriteGenres: topGenres(critic.tasteProfile),
  };
}

export async function getCriticDirectory() {
  return getMatchedCritics();
}

export function getCriticCount() {
  const db = getDb();
  return (db.prepare(`SELECT COUNT(*) as count FROM critics`).get() as { count: number }).count;
}
