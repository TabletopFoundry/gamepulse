import type { TasteProfile } from "@/lib/taste";
import type { ConsensusLabel } from "@/lib/scoring";

export type RawGame = {
  id: number;
  slug: string;
  title: string;
  year: number;
  description: string;
  categories: string;
  mechanics: string;
  min_players: number;
  max_players: number;
  complexity: number;
  play_time: number;
  buzz: number;
  rising: number;
  critics_score: number;
  community_score: number;
  critic_reviews_count: number;
  community_reviews_count: number;
  taste_profile: string;
};

export type RawCritic = {
  id: number;
  slug: string;
  name: string;
  avatar: string;
  platform: string;
  outlet: string;
  bio: string;
  tagline: string;
  preferred_complexity: number;
  taste_profile: string;
};

export type RawUser = {
  id: number;
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  preferred_complexity: number;
  taste_profile: string;
  is_current: number;
};

export type GameCardData = {
  id: number;
  slug: string;
  title: string;
  year: number;
  description: string;
  categories: string[];
  mechanics: string[];
  minPlayers: number;
  maxPlayers: number;
  playersLabel: string;
  complexity: number;
  playTime: number;
  buzz: number;
  rising: number;
  criticsScore: number;
  communityScore: number;
  criticReviewCount: number;
  communityReviewCount: number;
  tasteProfile: TasteProfile;
  consensus: ConsensusLabel;
};

export type CriticData = {
  id: number;
  slug: string;
  name: string;
  avatar: string;
  platform: string;
  outlet: string;
  bio: string;
  tagline: string;
  preferredComplexity: number;
  tasteProfile: TasteProfile;
};

export type CommunityReview = {
  id: number;
  rating: number;
  review: string;
  createdAt: string;
  user: { name: string; avatar: string; handle: string };
};

export type CriticReview = {
  id: number;
  score: number;
  verdict: string;
  excerpt: string;
  publishedAt: string;
  source: string;
  contentType: string;
  critic: CriticData;
};

export type MatchedCritic = CriticData & {
  matchPercent: number;
  overlapCount: number;
  correlation: number;
  topGenres: string[];
  followed: boolean;
};
