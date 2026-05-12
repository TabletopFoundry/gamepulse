import type { TasteProfile } from "@/lib/taste";

export type CriticSeed = {
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

export const critics: CriticSeed[] = [
  {
    slug: "greta-ledger",
    name: "Greta Ledger",
    avatar: "GL",
    platform: "Blog",
    outlet: "Meeple Metrics",
    bio: "Former economist turned board game critic obsessed with razor-tight euros, efficient engines, and scoring arcs that reward perfect planning.",
    tagline: "Heavy euro evangelist",
    preferredComplexity: 4.4,
    tasteProfile: { strategy: 96, thematic: 34, party: 12, family: 25, solo: 68, conflict: 43 },
  },
  {
    slug: "theo-sparks",
    name: "Theo Sparks",
    avatar: "TS",
    platform: "Podcast",
    outlet: "Table Talk FM",
    bio: "Theo hunts for games that light up a room fast, especially party hits and teach-in-five-minute crowd pleasers.",
    tagline: "Party game pulse checker",
    preferredComplexity: 1.9,
    tasteProfile: { strategy: 38, thematic: 52, party: 97, family: 88, solo: 21, conflict: 35 },
  },
  {
    slug: "mina-vale",
    name: "Mina Vale",
    avatar: "MV",
    platform: "YouTube",
    outlet: "Cardboard Cut",
    bio: "Mina loves dramatic arcs, immersive worlds, and production that makes every session feel like an event.",
    tagline: "Narrative table storyteller",
    preferredComplexity: 3.7,
    tasteProfile: { strategy: 58, thematic: 96, party: 28, family: 35, solo: 74, conflict: 69 },
  },
  {
    slug: "owen-park",
    name: "Owen Park",
    avatar: "OP",
    platform: "Blog",
    outlet: "First Turn Family",
    bio: "Owen reviews games for mixed-age tables, valuing accessibility, replayability, and ease of getting back to the fun.",
    tagline: "Gateway and family curator",
    preferredComplexity: 2.1,
    tasteProfile: { strategy: 49, thematic: 44, party: 63, family: 98, solo: 26, conflict: 19 },
  },
  {
    slug: "priya-nandi",
    name: "Priya Nandi",
    avatar: "PN",
    platform: "Podcast",
    outlet: "Decision Space",
    bio: "Priya chases elegant systems, crunchy puzzles, and games where every turn opens a new line of play.",
    tagline: "Abstract strategy specialist",
    preferredComplexity: 4.0,
    tasteProfile: { strategy: 91, thematic: 41, party: 18, family: 22, solo: 57, conflict: 47 },
  },
  {
    slug: "luca-marsh",
    name: "Luca Marsh",
    avatar: "LM",
    platform: "YouTube",
    outlet: "Weekend Wargamer",
    bio: "Luca spotlights tactical clashes, daring reversals, and games where table tension matters as much as optimization.",
    tagline: "Conflict-driven tactician",
    preferredComplexity: 3.5,
    tasteProfile: { strategy: 67, thematic: 78, party: 24, family: 16, solo: 39, conflict: 98 },
  },
  {
    slug: "samira-holt",
    name: "Samira Holt",
    avatar: "SH",
    platform: "Newsletter",
    outlet: "Solo Mode",
    bio: "Samira focuses on co-op arcs, smart solo bots, and designs that scale beautifully from one player to full groups.",
    tagline: "Solo and co-op whisperer",
    preferredComplexity: 3.3,
    tasteProfile: { strategy: 74, thematic: 71, party: 22, family: 34, solo: 99, conflict: 25 },
  },
  {
    slug: "benji-cruz",
    name: "Benji Cruz",
    avatar: "BC",
    platform: "Shorts",
    outlet: "Snack Table",
    bio: "Benji loves bold hooks, quick turns, and games that create instant stories before the snacks run out.",
    tagline: "Fast-fun enthusiast",
    preferredComplexity: 2.2,
    tasteProfile: { strategy: 44, thematic: 61, party: 84, family: 66, solo: 18, conflict: 55 },
  },
];
