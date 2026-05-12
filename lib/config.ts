/**
 * Centralized configuration module.
 *
 * All environment-derived values are read here so the rest of the
 * codebase can import typed constants instead of scattering
 * `process.env` reads across files.
 */

/** Public-facing base URL used for sitemap, Open Graph, and canonical links. */
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://gamepulse.example.com";

/** Application version surfaced in the health-check endpoint. */
export const APP_VERSION = process.env.npm_package_version ?? "0.1.0";

/** Name shown in metadata and UI chrome. */
export const APP_NAME = "GamePulse";

/** Default revalidation interval (in seconds) for mostly-static pages. */
export const DEFAULT_REVALIDATE = 60;

export const LIST_TYPES = ["watchlist", "wishlist"] as const;
export type ListType = (typeof LIST_TYPES)[number];

/** Tag used to invalidate cached critic-match calculations after user mutations. */
export const MATCHED_CRITICS_CACHE_TAG = "matched-critics";

/** Maximum length for community review text. */
export const MAX_REVIEW_LENGTH = 280;

/** Minimum length for community review text. */
export const MIN_REVIEW_LENGTH = 10;

/** Number of similar games shown on the game detail page. */
export const SIMILAR_GAMES_LIMIT = 3;

/** Number of feed preview items on the home page. */
export const FEED_PREVIEW_LIMIT = 4;
