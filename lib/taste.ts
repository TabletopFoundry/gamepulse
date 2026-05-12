export const TASTE_DIMENSIONS = [
  "strategy",
  "thematic",
  "party",
  "family",
  "solo",
  "conflict",
] as const;

export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];
export type TasteProfile = Record<TasteDimension, number>;
