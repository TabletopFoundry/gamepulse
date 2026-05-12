// Re-export from split query modules for backward compatibility
export type { GameCardData, CriticData, CommunityReview, CriticReview, MatchedCritic } from "@/lib/queries/types";
export type { ConsensusLabel } from "@/lib/scoring";
export type { ListType } from "@/lib/config";
export { getSearchOptions, getAllGames, getGamePageData, getBrowseData, getAwardsTracker, getGameCount } from "@/lib/queries/games";
export { getCriticPageData, getCriticDirectory, getCriticCount } from "@/lib/queries/critics";
export { getFeedData, getHomePageData } from "@/lib/queries/feed";
export { getCurrentUser, getCurrentUserRatings, getCurrentUserTasteProfile, getMatchedCritics } from "@/lib/queries/user";
export { getUserDashboard } from "@/lib/queries/dashboard";
