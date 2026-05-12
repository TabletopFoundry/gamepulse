import type { TasteProfile } from "@/lib/taste";

export type CommunityUserSeed = {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  isCurrent?: boolean;
  preferredComplexity: number;
  tasteProfile: TasteProfile;
};

export const communityUsers: CommunityUserSeed[] = [
  {
    name: "Alex Rowan",
    handle: "alex",
    avatar: "AR",
    bio: "Your profile: medium-heavy strategy games, thematic co-ops, and the occasional buzzy party game for game night.",
    isCurrent: true,
    preferredComplexity: 3.6,
    tasteProfile: { strategy: 84, thematic: 76, party: 43, family: 38, solo: 81, conflict: 47 },
  },
  {
    name: "Jordan Pike",
    handle: "jordan",
    avatar: "JP",
    bio: "Buys games for weekly meetups and values teachability over rules overhead.",
    preferredComplexity: 2.4,
    tasteProfile: { strategy: 51, thematic: 49, party: 76, family: 84, solo: 19, conflict: 32 },
  },
  {
    name: "Leah Stone",
    handle: "leah",
    avatar: "LS",
    bio: "Prefers elegant strategy and low-luck engine builders.",
    preferredComplexity: 4.1,
    tasteProfile: { strategy: 92, thematic: 37, party: 14, family: 18, solo: 55, conflict: 41 },
  },
  {
    name: "Marco Singh",
    handle: "marco",
    avatar: "MS",
    bio: "Always up for dramatic table moments and cinematic adventure nights.",
    preferredComplexity: 3.2,
    tasteProfile: { strategy: 59, thematic: 92, party: 38, family: 34, solo: 44, conflict: 82 },
  },
  {
    name: "Nina Costa",
    handle: "nina",
    avatar: "NC",
    bio: "Collects approachable games that work with family and non-gamers.",
    preferredComplexity: 2.0,
    tasteProfile: { strategy: 46, thematic: 44, party: 71, family: 97, solo: 23, conflict: 18 },
  },
  {
    name: "Omar Hale",
    handle: "omar",
    avatar: "OH",
    bio: "Mostly plays solo late at night and loves campaigns and co-ops.",
    preferredComplexity: 3.5,
    tasteProfile: { strategy: 71, thematic: 83, party: 16, family: 22, solo: 98, conflict: 21 },
  },
  {
    name: "Piper West",
    handle: "piper",
    avatar: "PW",
    bio: "Hosts noisy party nights and values social energy above all else.",
    preferredComplexity: 1.8,
    tasteProfile: { strategy: 29, thematic: 51, party: 98, family: 72, solo: 12, conflict: 27 },
  },
  {
    name: "Quinn Mercer",
    handle: "quinn",
    avatar: "QM",
    bio: "Enjoys tense tactical games where every move feels meaningful.",
    preferredComplexity: 3.6,
    tasteProfile: { strategy: 68, thematic: 71, party: 19, family: 21, solo: 31, conflict: 95 },
  },
  {
    name: "Rae Kim",
    handle: "rae",
    avatar: "RK",
    bio: "Loves nature themes, tactile production, and polished medium-weight experiences.",
    preferredComplexity: 2.9,
    tasteProfile: { strategy: 62, thematic: 65, party: 41, family: 57, solo: 52, conflict: 29 },
  },
];
