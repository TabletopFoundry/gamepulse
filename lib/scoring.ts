import { TASTE_DIMENSIONS, type TasteProfile } from "@/lib/taste";
import { getDb } from "@/lib/db";
import type { MatchedCritic } from "@/lib/queries/types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dot(a: TasteProfile, b: TasteProfile) {
  return TASTE_DIMENSIONS.reduce((sum, key) => sum + a[key] * b[key], 0);
}

function magnitude(profile: TasteProfile) {
  return Math.sqrt(TASTE_DIMENSIONS.reduce((sum, key) => sum + profile[key] ** 2, 0));
}

export function cosineSimilarity(a: TasteProfile, b: TasteProfile) {
  const denominator = magnitude(a) * magnitude(b);
  if (!denominator) return 0;
  return dot(a, b) / denominator;
}

export const CONSENSUS_LABELS = ["Divisive", "Critically Acclaimed", "Community Favorite", "Hidden Gem", "On the Rise"] as const;
export type ConsensusLabel = (typeof CONSENSUS_LABELS)[number];

export function buildConsensus(criticsScore: number, communityScore: number, rising: number): ConsensusLabel {
  if (Math.abs(criticsScore - communityScore) >= 15) return "Divisive";
  if (criticsScore >= 86 && communityScore >= 80) return "Critically Acclaimed";
  if (communityScore >= 88) return "Community Favorite";
  if (communityScore >= 80 && criticsScore >= 74 && rising >= 60) return "Hidden Gem";
  return "On the Rise";
}

export function average(numbers: number[]) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

export function pearson(left: number[], right: number[]) {
  if (left.length !== right.length || left.length < 2) return 0;
  const leftAvg = average(left);
  const rightAvg = average(right);
  let numerator = 0;
  let leftDenominator = 0;
  let rightDenominator = 0;

  left.forEach((value, index) => {
    const leftDelta = value - leftAvg;
    const rightValue = right[index];
    if (rightValue === undefined) return;
    const rightDelta = rightValue - rightAvg;
    numerator += leftDelta * rightDelta;
    leftDenominator += leftDelta ** 2;
    rightDenominator += rightDelta ** 2;
  });

  if (!leftDenominator || !rightDenominator) return 0;
  return numerator / Math.sqrt(leftDenominator * rightDenominator);
}

export function topGenres(profile: TasteProfile) {
  return [...TASTE_DIMENSIONS]
    .sort((left, right) => profile[right] - profile[left])
    .slice(0, 3)
    .map((item) => (item[0]?.toUpperCase() ?? "") + item.slice(1));
}

export function getPersonalizedScore(gameId: number, matchedCritics: MatchedCritic[], reviewsByGame?: Map<number, Array<{ critic_id: number; score: number }>>) {
  let reviews: Array<{ critic_id: number; score: number }>;

  if (reviewsByGame) {
    reviews = reviewsByGame.get(gameId) ?? [];
  } else {
    const db = getDb();
    reviews = db.prepare(`SELECT critic_id, score FROM critic_reviews WHERE game_id = ?`).all(gameId) as Array<{ critic_id: number; score: number }>;
  }

  const matched = matchedCritics
    .map((critic) => {
      const review = reviews.find((candidate) => candidate.critic_id === critic.id);
      if (!review) return null;
      return { score: review.score / 10, weight: critic.matchPercent };
    })
    .filter((item): item is { score: number; weight: number } => Boolean(item));

  if (!matched.length) return null;
  const weightTotal = matched.reduce((sum, entry) => sum + entry.weight, 0);
  const weightedAverage = matched.reduce((sum, entry) => sum + entry.score * entry.weight, 0) / Math.max(weightTotal, 1);
  return Number(weightedAverage.toFixed(1));
}

/** Batch-fetch all critic reviews for a set of game IDs, returning a map by game_id.
 *  Uses fixed-size chunks so better-sqlite3 caches only one prepared statement. */
const BATCH_CHUNK_SIZE = 50;

export function batchFetchCriticReviews(gameIds: number[]) {
  if (!gameIds.length) return new Map<number, Array<{ critic_id: number; score: number }>>();

  const db = getDb();
  const reviewsByGame = new Map<number, Array<{ critic_id: number; score: number }>>();
  const stmt = db.prepare(
    `SELECT game_id, critic_id, score FROM critic_reviews WHERE game_id IN (${Array(BATCH_CHUNK_SIZE).fill("?").join(",")})`
  );

  for (let i = 0; i < gameIds.length; i += BATCH_CHUNK_SIZE) {
    const chunk = gameIds.slice(i, i + BATCH_CHUNK_SIZE);
    // Pad to fixed size with -1 (no game will match) for cache-friendly prepared statements
    while (chunk.length < BATCH_CHUNK_SIZE) chunk.push(-1);
    const rows = stmt.all(...chunk) as Array<{ game_id: number; critic_id: number; score: number }>;
    for (const row of rows) {
      let list = reviewsByGame.get(row.game_id);
      if (!list) {
        list = [];
        reviewsByGame.set(row.game_id, list);
      }
      list.push({ critic_id: row.critic_id, score: row.score });
    }
  }
  return reviewsByGame;
}
