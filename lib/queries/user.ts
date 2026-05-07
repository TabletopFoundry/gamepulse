import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { TASTE_DIMENSIONS, type TasteProfile } from "@/lib/taste";
import { clamp, cosineSimilarity, pearson, topGenres } from "@/lib/scoring";
import { safeJsonParse } from "@/lib/utils";
import type { RawCritic, RawUser, MatchedCritic } from "./types";
import { parseCritic, parseUser } from "./parsers";

const EMPTY_TASTE_PROFILE: TasteProfile = {
  strategy: 0,
  thematic: 0,
  party: 0,
  family: 0,
  solo: 0,
  conflict: 0,
};

export const getCurrentUser = cache(() => {
  const db = getDb();
  let user = db.prepare(`SELECT * FROM community_users WHERE is_current = 1 LIMIT 1`).get() as RawUser | undefined;

  if (!user) {
    user = db.transaction(() => {
      const existingUser = db.prepare(`SELECT * FROM community_users ORDER BY id ASC LIMIT 1`).get() as RawUser | undefined;
      if (existingUser) {
        db.prepare(`UPDATE community_users SET is_current = CASE WHEN id = ? THEN 1 ELSE 0 END`).run(existingUser.id);
        return { ...existingUser, is_current: 1 };
      }

      const insert = db.prepare(`
        INSERT INTO community_users (handle, name, avatar, bio, preferred_complexity, taste_profile, is_current)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(
        "guest-player",
        "Guest Player",
        "GP",
        "GamePulse created a local guest profile because no seeded current user was available yet.",
        2.5,
        JSON.stringify(EMPTY_TASTE_PROFILE),
      );

      return db.prepare(`SELECT * FROM community_users WHERE id = ?`).get(Number(insert.lastInsertRowid)) as RawUser;
    })();
  }

  return parseUser(user);
});

export const getCurrentUserRatings = cache(() => {
  const db = getDb();
  const user = getCurrentUser();
  return db.prepare(`
    SELECT g.slug, g.title, cr.rating, cr.review, cr.created_at
    FROM community_reviews cr
    JOIN games g ON g.id = cr.game_id
    WHERE cr.user_id = ?
    ORDER BY cr.created_at DESC
  `).all(user.id) as Array<{ slug: string; title: string; rating: number; review: string; created_at: string }>;
});

export const getCurrentUserTasteProfile = cache(() => {
  const db = getDb();
  const user = getCurrentUser();
  const rows = db.prepare(`
    SELECT cr.rating, g.taste_profile
    FROM community_reviews cr
    JOIN games g ON g.id = cr.game_id
    WHERE cr.user_id = ?
  `).all(user.id) as Array<{ rating: number; taste_profile: string }>;

  if (!rows.length) return user.tasteProfile;

  const aggregate = TASTE_DIMENSIONS.reduce((profile, key) => ({ ...profile, [key]: 0 }), {} as TasteProfile);
  let weightTotal = 0;

  rows.forEach((row) => {
    const gameProfile = safeJsonParse<TasteProfile>(row.taste_profile, { strategy: 0, thematic: 0, party: 0, family: 0, solo: 0, conflict: 0 });
    const weight = row.rating / 10;
    weightTotal += weight;
    TASTE_DIMENSIONS.forEach((key) => {
      aggregate[key] += gameProfile[key] * weight;
    });
  });

  TASTE_DIMENSIONS.forEach((key) => {
    aggregate[key] = Math.round(aggregate[key] / Math.max(weightTotal, 1));
  });

  return aggregate;
});

/** Compute matched critics for the given user — expensive O(critics × games) work. */
function computeMatchedCritics(userId: number): MatchedCritic[] {
  const db = getDb();
  const userRow = db.prepare(`SELECT * FROM community_users WHERE id = ?`).get(userId) as RawUser | undefined;
  if (!userRow) return [];
  const user = parseUser(userRow);

  // Compute taste profile for this specific user (mirrors getCurrentUserTasteProfile logic)
  const tasteRows = db.prepare(`
    SELECT cr.rating, g.taste_profile
    FROM community_reviews cr
    JOIN games g ON g.id = cr.game_id
    WHERE cr.user_id = ?
  `).all(userId) as Array<{ rating: number; taste_profile: string }>;

  let userTaste = user.tasteProfile;
  if (tasteRows.length) {
    const aggregate = TASTE_DIMENSIONS.reduce((profile, key) => ({ ...profile, [key]: 0 }), {} as TasteProfile);
    let weightTotal = 0;
    tasteRows.forEach((row) => {
      const gameProfile = safeJsonParse<TasteProfile>(row.taste_profile, { strategy: 0, thematic: 0, party: 0, family: 0, solo: 0, conflict: 0 });
      const weight = row.rating / 10;
      weightTotal += weight;
      TASTE_DIMENSIONS.forEach((key) => { aggregate[key] += gameProfile[key] * weight; });
    });
    TASTE_DIMENSIONS.forEach((key) => { aggregate[key] = Math.round(aggregate[key] / Math.max(weightTotal, 1)); });
    userTaste = aggregate;
  }

  const userRatings = db.prepare(`SELECT game_id, rating FROM community_reviews WHERE user_id = ?`).all(userId) as Array<{ game_id: number; rating: number }>;
  const ratingMap = new Map(userRatings.map((entry) => [entry.game_id, entry.rating]));
  const follows = new Set(
    (db.prepare(`SELECT critic_id FROM follows WHERE user_id = ?`).all(userId) as Array<{ critic_id: number }>).map((row) => row.critic_id),
  );

  const critics = (db.prepare(`SELECT * FROM critics ORDER BY name ASC`).all() as RawCritic[]).map(parseCritic);

  const reviewsByCritic = new Map<number, Array<{ game_id: number; score: number }>>();
  if (userRatings.length) {
    const placeholders = userRatings.map(() => "?").join(",");
    const overlappingCriticReviews = db.prepare(`
      SELECT critic_id, game_id, score
      FROM critic_reviews
      WHERE game_id IN (${placeholders})
    `).all(...userRatings.map((entry) => entry.game_id)) as Array<{ critic_id: number; game_id: number; score: number }>;

    for (const review of overlappingCriticReviews) {
      let list = reviewsByCritic.get(review.critic_id);
      if (!list) {
        list = [];
        reviewsByCritic.set(review.critic_id, list);
      }
      list.push({ game_id: review.game_id, score: review.score });
    }
  }

  return critics
    .map((critic) => {
      const criticRatings = reviewsByCritic.get(critic.id) ?? [];
      const overlap: Array<{ user: number; critic: number }> = [];

      criticRatings.forEach((entry) => {
        const userRating = ratingMap.get(entry.game_id);
        if (typeof userRating === "number") {
          overlap.push({ user: userRating, critic: entry.score / 10 });
        }
      });

      const correlation = pearson(
        overlap.map((pair) => pair.user),
        overlap.map((pair) => pair.critic),
      );
      const tasteSimilarity = cosineSimilarity(userTaste, critic.tasteProfile);
      const matchPercent = Math.round(
        clamp(((correlation + 1) / 2) * 65 + tasteSimilarity * 35, 0, 100),
      );

      return {
        ...critic,
        matchPercent,
        overlapCount: overlap.length,
        correlation,
        topGenres: topGenres(critic.tasteProfile),
        followed: follows.has(critic.id),
      };
    })
    .sort((left, right) => right.matchPercent - left.matchPercent);
}

/** Cross-request cached version with 60s TTL — avoids recomputing on every page load. */
const getCachedMatchedCritics = unstable_cache(
  async (userId: number) => computeMatchedCritics(userId),
  ["matched-critics"],
  { revalidate: 60 },
);

/** Intra-request dedup via React.cache + cross-request caching via unstable_cache. */
export const getMatchedCritics = cache(async (): Promise<MatchedCritic[]> => {
  const user = getCurrentUser();
  return getCachedMatchedCritics(user.id);
});
