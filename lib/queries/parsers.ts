import type { TasteProfile } from "@/lib/taste";
import { buildConsensus } from "@/lib/scoring";
import { safeJsonParse } from "@/lib/utils";
import type { RawGame, RawCritic, RawUser, GameCardData, CriticData } from "./types";

const EMPTY_TASTE: TasteProfile = { strategy: 0, thematic: 0, party: 0, family: 0, solo: 0, conflict: 0 };

export function parseGame(row: RawGame): GameCardData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    year: row.year,
    description: row.description,
    categories: safeJsonParse<string[]>(row.categories, []),
    mechanics: safeJsonParse<string[]>(row.mechanics, []),
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    playersLabel: `${row.min_players}-${row.max_players} players`,
    complexity: row.complexity,
    playTime: row.play_time,
    buzz: row.buzz,
    rising: row.rising,
    criticsScore: row.critics_score,
    communityScore: row.community_score,
    criticReviewCount: row.critic_reviews_count,
    communityReviewCount: row.community_reviews_count,
    tasteProfile: safeJsonParse<TasteProfile>(row.taste_profile, EMPTY_TASTE),
    consensus: buildConsensus(row.critics_score, row.community_score, row.rising),
  };
}

export function parseCritic(row: RawCritic): CriticData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    avatar: row.avatar,
    platform: row.platform,
    outlet: row.outlet,
    bio: row.bio,
    tagline: row.tagline,
    preferredComplexity: row.preferred_complexity,
    tasteProfile: safeJsonParse<TasteProfile>(row.taste_profile, EMPTY_TASTE),
  };
}

export function parseUser(row: RawUser) {
  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    preferredComplexity: row.preferred_complexity,
    tasteProfile: safeJsonParse<TasteProfile>(row.taste_profile, EMPTY_TASTE),
    isCurrent: Boolean(row.is_current),
  };
}
