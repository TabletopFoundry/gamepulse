import { getDb } from "@/lib/db";
import type { RawGame } from "./types";
import { parseGame } from "./parsers";

const VALID_FEED_FILTERS = new Set(["review", "news", "deals", "video"]);

export function getFeedData(filter?: string) {
  const db = getDb();
  const useFilter = filter && filter !== "all" && VALID_FEED_FILTERS.has(filter);
  const whereClause = useFilter ? `WHERE fi.item_type = ?` : "";
  const filterParams = useFilter ? [filter] : [];
  const items = db.prepare(`
    SELECT fi.id, fi.item_type, fi.title, fi.summary, fi.published_at, fi.badge,
           g.slug as game_slug, g.title as game_title,
           c.slug as critic_slug, c.name as critic_name
    FROM feed_items fi
    LEFT JOIN games g ON g.id = fi.game_id
    LEFT JOIN critics c ON c.id = fi.critic_id
    ${whereClause}
    ORDER BY fi.published_at DESC
  `).all(...filterParams) as Array<{
    id: number;
    item_type: string;
    title: string;
    summary: string;
    published_at: string;
    badge: string;
    game_slug: string | null;
    game_title: string | null;
    critic_slug: string | null;
    critic_name: string | null;
  }>;

  const releases = db.prepare(`SELECT * FROM release_calendar ORDER BY release_date ASC`).all() as Array<{
    id: number;
    title: string;
    release_date: string;
    item_type: string;
    anticipation: number;
    note: string;
  }>;

  const newsletterPreview = {
    title: "This week in GamePulse",
    bullets: [
      "SETI and Sky Team continue to dominate rising-score momentum.",
      "Fresh critic videos are leaning hard into tactical two-player games.",
      "Deal alerts are strongest for Heat, Brass, and family-weight puzzle games.",
    ],
  };

  return { items, releases, newsletterPreview };
}

export function getHomePageData() {
  const db = getDb();

  const trendingGames = (db.prepare(`SELECT * FROM games ORDER BY buzz DESC, critics_score DESC LIMIT 6`).all() as RawGame[]).map(parseGame);
  const risingGames = (db.prepare(`SELECT * FROM games ORDER BY rising DESC, buzz DESC LIMIT 4`).all() as RawGame[]).map(parseGame);
  const latestCriticReviews = db.prepare(`
    SELECT cr.id, cr.score, cr.verdict, cr.excerpt, cr.published_at, cr.source, cr.content_type,
           c.id as critic_id, c.slug as critic_slug, c.name as critic_name, c.avatar as critic_avatar, c.platform as critic_platform,
           c.outlet as critic_outlet, c.bio as critic_bio, c.tagline as critic_tagline, c.preferred_complexity as critic_preferred_complexity, c.taste_profile as critic_taste_profile,
           g.slug as game_slug, g.title as game_title
    FROM critic_reviews cr
    JOIN critics c ON c.id = cr.critic_id
    JOIN games g ON g.id = cr.game_id
    ORDER BY cr.published_at DESC
    LIMIT 6
  `).all() as Array<{
    id: number;
    score: number;
    verdict: string;
    excerpt: string;
    published_at: string;
    source: string;
    content_type: string;
    critic_id: number;
    critic_slug: string;
    critic_name: string;
    critic_avatar: string;
    critic_platform: string;
    critic_outlet: string;
    critic_bio: string;
    critic_tagline: string;
    critic_preferred_complexity: number;
    critic_taste_profile: string;
    game_slug: string;
    game_title: string;
  }>;

  const awards = db.prepare(`
    SELECT a.award_name, a.award_year, a.result, g.slug, g.title
    FROM awards a
    JOIN games g ON g.id = a.game_id
    ORDER BY a.award_year DESC, a.result ASC
    LIMIT 6
  `).all() as Array<{ award_name: string; award_year: number; result: string; slug: string; title: string }>;

  const feedPreview = db.prepare(`SELECT * FROM feed_items ORDER BY published_at DESC LIMIT 4`).all() as Array<{
    id: number;
    item_type: string;
    title: string;
    summary: string;
    published_at: string;
    badge: string;
  }>;

  return { trendingGames, risingGames, latestCriticReviews, awards, feedPreview };
}
