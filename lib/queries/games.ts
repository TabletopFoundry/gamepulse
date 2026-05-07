import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { DEFAULT_REVALIDATE } from "@/lib/config";
import { cosineSimilarity, getPersonalizedScore } from "@/lib/scoring";
import { safeJsonParse, escapeLike } from "@/lib/utils";
import type { RawGame, GameCardData, CommunityReview } from "./types";
import { parseGame, parseCritic } from "./parsers";
import { getCurrentUser, getMatchedCritics } from "./user";

const BROWSE_PAGE_SIZE = 24;

const getCachedSearchOptions = unstable_cache(
  async () => {
    const db = getDb();
    return db.prepare(`SELECT slug, title FROM games ORDER BY title ASC`).all() as Array<{ slug: string; title: string }>;
  },
  ["search-options"],
  { revalidate: DEFAULT_REVALIDATE },
);

export const getSearchOptions = cache(async () => getCachedSearchOptions());

export function getAllGames() {
  const db = getDb();
  return (db.prepare(`SELECT * FROM games ORDER BY title ASC`).all() as RawGame[]).map(parseGame);
}

export function getGameCount() {
  const db = getDb();
  return (db.prepare(`SELECT COUNT(*) as count FROM games`).get() as { count: number }).count;
}

function similarityScore(base: GameCardData, candidate: GameCardData) {
  return cosineSimilarity(base.tasteProfile, candidate.tasteProfile) * 70 + (candidate.criticsScore / 100) * 30;
}

export async function getGamePageData(slug: string) {
  const db = getDb();
  const rawGame = db.prepare(`SELECT * FROM games WHERE slug = ?`).get(slug) as RawGame | undefined;
  if (!rawGame) return null;
  const game = parseGame(rawGame);

  const criticReviews = db.prepare(`
    SELECT cr.id, cr.score, cr.verdict, cr.excerpt, cr.published_at, cr.source, cr.content_type,
           c.id as critic_id, c.slug as critic_slug, c.name as critic_name, c.avatar as critic_avatar,
           c.platform as critic_platform, c.outlet as critic_outlet, c.bio as critic_bio, c.tagline as critic_tagline,
           c.preferred_complexity as critic_preferred_complexity, c.taste_profile as critic_taste_profile
    FROM critic_reviews cr
    JOIN critics c ON c.id = cr.critic_id
    WHERE cr.game_id = ?
    ORDER BY cr.score DESC, cr.published_at DESC
  `).all(game.id) as Array<{
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
  }>;

  const communityReviews = db.prepare(`
    SELECT cr.id, cr.rating, cr.review, cr.created_at, u.name, u.avatar, u.handle
    FROM community_reviews cr
    JOIN community_users u ON u.id = cr.user_id
    WHERE cr.game_id = ?
    ORDER BY cr.created_at DESC
    LIMIT 8
  `).all(game.id) as Array<{ id: number; rating: number; review: string; created_at: string; name: string; avatar: string; handle: string }>;

  const priceComparison = db.prepare(`SELECT retailer, price, shipping, label FROM game_prices WHERE game_id = ? ORDER BY price ASC`).all(game.id) as Array<{ retailer: string; price: number; shipping: string; label: string }>;
  const awards = db.prepare(`SELECT award_name, award_year, result FROM awards WHERE game_id = ? ORDER BY award_year DESC`).all(game.id) as Array<{ award_name: string; award_year: number; result: string }>;
  const currentUser = getCurrentUser();
  const matchedCritics = await getMatchedCritics();
  const userListRows = db.prepare(`SELECT list_type FROM user_lists WHERE user_id = ? AND game_id = ?`).all(currentUser.id, game.id) as Array<{ list_type: string }>;
  const listTypes = new Set(userListRows.map((row) => row.list_type));
  const personalizedScore = getPersonalizedScore(game.id, matchedCritics);

  // Fetch only candidates for similar games instead of loading all games
  const similarCandidates = (db.prepare(`
    SELECT * FROM games WHERE slug != ? ORDER BY critics_score DESC LIMIT 20
  `).all(game.slug) as RawGame[]).map(parseGame);
  const similarGames = similarCandidates
    .sort((left, right) => similarityScore(game, right) - similarityScore(game, left))
    .slice(0, 3);

  return {
    game,
    awards,
    criticReviews: criticReviews.map((review) => ({
      id: review.id,
      score: review.score,
      verdict: review.verdict,
      excerpt: review.excerpt,
      publishedAt: review.published_at,
      source: review.source,
      contentType: review.content_type,
      critic: parseCritic({
        id: review.critic_id,
        slug: review.critic_slug,
        name: review.critic_name,
        avatar: review.critic_avatar,
        platform: review.critic_platform,
        outlet: review.critic_outlet,
        bio: review.critic_bio,
        tagline: review.critic_tagline,
        preferred_complexity: review.critic_preferred_complexity,
        taste_profile: review.critic_taste_profile,
      }),
    })),
    communityReviews: communityReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      review: review.review,
      createdAt: review.created_at,
      user: { name: review.name, avatar: review.avatar, handle: review.handle },
    })) satisfies CommunityReview[],
    priceComparison,
    similarGames,
    currentUser,
    onWatchlist: listTypes.has("watchlist"),
    onWishlist: listTypes.has("wishlist"),
    personalizedScore,
    matchedCritics: matchedCritics.slice(0, 3),
  };
}

export async function getBrowseData(filters: {
  query?: string;
  category?: string;
  players?: string;
  complexity?: string;
  sort?: string;
  page?: number;
}) {
  const db = getDb();
  const query = (filters.query ?? "").trim().toLowerCase();
  const requestedPage = Number.isInteger(filters.page) && (filters.page ?? 0) > 0 ? (filters.page as number) : 1;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (query) {
    conditions.push(`(LOWER(title) LIKE ? ESCAPE '\\' OR LOWER(categories) LIKE ? ESCAPE '\\' OR LOWER(mechanics) LIKE ? ESCAPE '\\')`);
    const like = `%${escapeLike(query)}%`;
    params.push(like, like, like);
  }

  if (filters.category && filters.category !== "all") {
    conditions.push(`LOWER(categories) LIKE ? ESCAPE '\\'`);
    params.push(`%"${escapeLike(filters.category.toLowerCase())}"%`);
  }

  if (filters.players && filters.players !== "all") {
    switch (filters.players) {
      case "1-2":
        conditions.push(`min_players <= 2 AND max_players >= 1`);
        break;
      case "3-4":
        conditions.push(`min_players <= 4 AND max_players >= 3`);
        break;
      case "5+":
        conditions.push(`max_players >= 5`);
        break;
    }
  }

  if (filters.complexity && filters.complexity !== "all") {
    switch (filters.complexity) {
      case "light":
        conditions.push(`complexity < 2.3`);
        break;
      case "medium":
        conditions.push(`complexity >= 2.3 AND complexity < 3.4`);
        break;
      case "heavy":
        conditions.push(`complexity >= 3.4`);
        break;
    }
  }

  let orderBy: string;
  switch (filters.sort) {
    case "trending":
      orderBy = `buzz DESC`;
      break;
    case "newest":
      orderBy = `year DESC`;
      break;
    case "most-reviewed":
      orderBy = `community_reviews_count DESC`;
      break;
    default:
      orderBy = `critics_score DESC`;
      break;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const totalResults = (db.prepare(`SELECT COUNT(*) as count FROM games ${whereClause}`).get(...params) as { count: number }).count;
  const totalPages = Math.max(1, Math.ceil(totalResults / BROWSE_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * BROWSE_PAGE_SIZE;

  const games = (db.prepare(`SELECT * FROM games ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, BROWSE_PAGE_SIZE, offset) as RawGame[]).map(parseGame);

  const categories = (db.prepare(`SELECT DISTINCT categories FROM games`).all() as Array<{ categories: string }>)
    .flatMap((row) => safeJsonParse<string[]>(row.categories, []));
  const uniqueCategories = Array.from(new Set(categories)).sort();

  const awards = getAwardsTracker();
  const autocomplete = (await getSearchOptions())
    .filter((game) => !query || game.title.toLowerCase().includes(query))
    .slice(0, 6);

  return {
    games,
    categories: uniqueCategories,
    awards,
    autocomplete,
    pagination: {
      page,
      pageSize: BROWSE_PAGE_SIZE,
      totalPages,
      totalResults,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

export function getAwardsTracker() {
  const db = getDb();
  return db.prepare(`
    SELECT a.award_name, a.award_year, a.result, g.slug, g.title
    FROM awards a
    JOIN games g ON g.id = a.game_id
    ORDER BY a.award_year DESC, a.result DESC
  `).all() as Array<{ award_name: string; award_year: number; result: string; slug: string; title: string }>;
}
