import { getDb } from "@/lib/db";
import { getPersonalizedScore, batchFetchCriticReviews } from "@/lib/scoring";
import type { RawGame, GameCardData } from "./types";
import { parseGame } from "./parsers";
import { getCurrentUser, getCurrentUserRatings, getCurrentUserTasteProfile, getMatchedCritics } from "./user";

export async function getUserDashboard() {
  const user = getCurrentUser();
  const db = getDb();
  const ratings = getCurrentUserRatings();
  const matchedCritics = await getMatchedCritics();
  const tasteProfile = getCurrentUserTasteProfile();
  const watchlist = db.prepare(`
    SELECT g.*
    FROM user_lists ul
    JOIN games g ON g.id = ul.game_id
    WHERE ul.user_id = ? AND ul.list_type = 'watchlist'
    ORDER BY ul.created_at DESC
  `).all(user.id) as RawGame[];
  const wishlist = db.prepare(`
    SELECT g.*
    FROM user_lists ul
    JOIN games g ON g.id = ul.game_id
    WHERE ul.user_id = ? AND ul.list_type = 'wishlist'
    ORDER BY ul.created_at DESC
  `).all(user.id) as RawGame[];

  // Fetch top unrated games via SQL instead of loading all games
  const candidateGames = (db.prepare(`
    SELECT * FROM games
    WHERE id NOT IN (SELECT game_id FROM community_reviews WHERE user_id = ?)
    ORDER BY buzz DESC
    LIMIT 20
  `).all(user.id) as RawGame[]).map(parseGame);

  // Batch-fetch all critic reviews for candidate games to avoid N+1 queries
  const reviewsByGame = batchFetchCriticReviews(candidateGames.map((game) => game.id));

  const personalizedPicks = candidateGames
    .map((game) => ({ game, score: getPersonalizedScore(game.id, matchedCritics, reviewsByGame) }))
    .filter((entry): entry is { game: GameCardData; score: number } => typeof entry.score === "number")
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return {
    user,
    ratings,
    ratingsCount: ratings.length,
    tasteProfile,
    matchedCritics,
    watchlist: watchlist.map(parseGame),
    wishlist: wishlist.map(parseGame),
    personalizedPicks,
  };
}
