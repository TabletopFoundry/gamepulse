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

type PersonaKey =
  | "hybridStrategist"
  | "strategyPurist"
  | "thematicHost"
  | "familyGuide"
  | "soloPlanner"
  | "partyStarter"
  | "conflictPilot"
  | "natureCurator"
  | "cozyPuzzler"
  | "duelSpecialist"
  | "simulationBrain"
  | "narrativeSolo";

const personaProfiles: Record<PersonaKey, { preferredComplexity: number; tasteProfile: TasteProfile }> = {
  hybridStrategist: { preferredComplexity: 3.6, tasteProfile: { strategy: 84, thematic: 76, party: 43, family: 38, solo: 81, conflict: 47 } },
  strategyPurist: { preferredComplexity: 4.1, tasteProfile: { strategy: 92, thematic: 37, party: 14, family: 18, solo: 55, conflict: 41 } },
  thematicHost: { preferredComplexity: 3.2, tasteProfile: { strategy: 59, thematic: 92, party: 38, family: 34, solo: 44, conflict: 82 } },
  familyGuide: { preferredComplexity: 2.0, tasteProfile: { strategy: 46, thematic: 44, party: 71, family: 97, solo: 23, conflict: 18 } },
  soloPlanner: { preferredComplexity: 3.5, tasteProfile: { strategy: 71, thematic: 83, party: 16, family: 22, solo: 98, conflict: 21 } },
  partyStarter: { preferredComplexity: 1.8, tasteProfile: { strategy: 29, thematic: 51, party: 98, family: 72, solo: 12, conflict: 27 } },
  conflictPilot: { preferredComplexity: 3.6, tasteProfile: { strategy: 68, thematic: 71, party: 19, family: 21, solo: 31, conflict: 95 } },
  natureCurator: { preferredComplexity: 2.9, tasteProfile: { strategy: 62, thematic: 65, party: 41, family: 57, solo: 52, conflict: 29 } },
  cozyPuzzler: { preferredComplexity: 2.2, tasteProfile: { strategy: 58, thematic: 63, party: 34, family: 88, solo: 49, conflict: 9 } },
  duelSpecialist: { preferredComplexity: 2.5, tasteProfile: { strategy: 78, thematic: 33, party: 14, family: 39, solo: 8, conflict: 52 } },
  simulationBrain: { preferredComplexity: 4.3, tasteProfile: { strategy: 95, thematic: 54, party: 6, family: 10, solo: 42, conflict: 61 } },
  narrativeSolo: { preferredComplexity: 3.8, tasteProfile: { strategy: 66, thematic: 96, party: 12, family: 16, solo: 91, conflict: 37 } },
};

const avatarFromName = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const communityBlueprints: Array<{
  name: string;
  handle: string;
  persona: PersonaKey;
  bio: string;
  isCurrent?: boolean;
}> = [
  { name: "Alex Rowan", handle: "alex", persona: "hybridStrategist", bio: "Your profile: medium-heavy strategy games, thematic co-ops, and the occasional buzzy party game for game night.", isCurrent: true },
  { name: "Jordan Pike", handle: "jordan", persona: "familyGuide", bio: "Buys games for weekly meetups and values teachability over rules overhead." },
  { name: "Leah Stone", handle: "leah", persona: "strategyPurist", bio: "Prefers elegant strategy and low-luck engine builders." },
  { name: "Marco Singh", handle: "marco", persona: "thematicHost", bio: "Always up for dramatic table moments and cinematic adventure nights." },
  { name: "Nina Costa", handle: "nina", persona: "familyGuide", bio: "Collects approachable games that work with family and non-gamers." },
  { name: "Omar Hale", handle: "omar", persona: "soloPlanner", bio: "Mostly plays solo late at night and loves campaigns and co-ops." },
  { name: "Piper West", handle: "piper", persona: "partyStarter", bio: "Hosts noisy party nights and values social energy above all else." },
  { name: "Quinn Mercer", handle: "quinn", persona: "conflictPilot", bio: "Enjoys tense tactical games where every move feels meaningful." },
  { name: "Rae Kim", handle: "rae", persona: "natureCurator", bio: "Loves nature themes, tactile production, and polished medium-weight experiences." },
  { name: "Sofia Tran", handle: "sofia", persona: "cozyPuzzler", bio: "Keeps a shelf of welcoming puzzlers that still have room for mastery." },
  { name: "Tyler Boone", handle: "tyler", persona: "duelSpecialist", bio: "Mostly plays two-player and rates games by how sharp the decision space feels." },
  { name: "Uma Patel", handle: "uma", persona: "simulationBrain", bio: "Happy to spend an entire Saturday inside one deeply interlocking system." },
  { name: "Victor Lane", handle: "victor", persona: "narrativeSolo", bio: "Looks for campaign arcs and solo modes that still feel dramatic." },
  { name: "Willa Hart", handle: "willa", persona: "cozyPuzzler", bio: "Prefers bright art, mellow interaction, and satisfying spatial planning." },
  { name: "Xavier Cole", handle: "xavier", persona: "strategyPurist", bio: "Rates games by their action economy, arc, and replay depth." },
  { name: "Yara Flores", handle: "yara", persona: "thematicHost", bio: "Chases story-first productions that turn a session into an event." },
  { name: "Zane Ellis", handle: "zane", persona: "partyStarter", bio: "Needs games that teach fast, play loud, and survive large groups." },
  { name: "Amaya Brooks", handle: "amaya", persona: "natureCurator", bio: "Always notices art direction and how a theme carries the experience." },
  { name: "Bennett Ross", handle: "bennett", persona: "conflictPilot", bio: "Likes tactical knife fights with just enough politics to matter." },
  { name: "Callie Moss", handle: "callie", persona: "familyGuide", bio: "Curates titles for cousins, coworkers, and anyone new to the hobby." },
  { name: "Damon Yu", handle: "damon", persona: "simulationBrain", bio: "Rarely backs down from a huge teach if the payoff is worth it." },
  { name: "Elise Navarro", handle: "elise", persona: "soloPlanner", bio: "Tracks solo scores, campaign notes, and scenario rankings in a spreadsheet." },
  { name: "Felix Garner", handle: "felix", persona: "duelSpecialist", bio: "Obsessed with tempo windows, card efficiency, and elegant counters." },
  { name: "Gia Moreno", handle: "gia", persona: "thematicHost", bio: "Lives for emergent stories, betrayals, and big table reveals." },
  { name: "Harper Wade", handle: "harper", persona: "cozyPuzzler", bio: "Likes thinky games that still feel serene on the table." },
  { name: "Isaac Bell", handle: "isaac", persona: "strategyPurist", bio: "Chases precision and hates when randomness overwhelms planning." },
  { name: "June Alvarez", handle: "june", persona: "familyGuide", bio: "Finds new favorites by testing games with parents and first-timers." },
  { name: "Kieran Fox", handle: "kieran", persona: "partyStarter", bio: "Would rather play six fillers in a row than one long slog." },
  { name: "Lena Ortiz", handle: "lena", persona: "natureCurator", bio: "Enjoys tableau builders, tactile bits, and nature-forward themes." },
  { name: "Miles Hsu", handle: "miles", persona: "hybridStrategist", bio: "Likes strategic arcs but still wants a strong sense of theme." },
  { name: "Noelle Price", handle: "noelle", persona: "narrativeSolo", bio: "Prefers campaigns with character growth and a solo mode that matters." },
  { name: "Orion Black", handle: "orion", persona: "conflictPilot", bio: "Always looking for the next asymmetric showdown." },
  { name: "Paige Sutton", handle: "paige", persona: "cozyPuzzler", bio: "Collects compact games that shine on a weeknight table." },
  { name: "Reid Gallagher", handle: "reid", persona: "simulationBrain", bio: "Enjoys systems that make every optimization decision feel consequential." },
  { name: "Sana Noor", handle: "sana", persona: "soloPlanner", bio: "Tests automa modes first and teaches co-ops second." },
  { name: "Toby Grimes", handle: "toby", persona: "partyStarter", bio: "Wants social sparks, fast laughs, and zero downtime." },
  { name: "Valeria Cruz", handle: "valeria", persona: "thematicHost", bio: "Brings soundtrack playlists and mood lighting to campaign night." },
  { name: "Wes Holloway", handle: "wes", persona: "duelSpecialist", bio: "Mostly shops for head-to-head tension and portable strategy." },
  { name: "Xena Doyle", handle: "xena", persona: "strategyPurist", bio: "Gravitates toward austere euros and crunchy action compression." },
  { name: "Yusuf Malik", handle: "yusuf", persona: "hybridStrategist", bio: "Likes games that reward planning without feeling dry." },
  { name: "Ada Sinclair", handle: "ada", persona: "natureCurator", bio: "Finds joy in engines that bloom over time and look good doing it." },
  { name: "Beau Tanner", handle: "beau", persona: "familyGuide", bio: "Needs titles that work at mixed skill levels and different table sizes." },
  { name: "Cora Fields", handle: "cora", persona: "cozyPuzzler", bio: "Appreciates low-conflict games with satisfying puzzle depth." },
  { name: "Dev Patel", handle: "dev", persona: "simulationBrain", bio: "Will gladly invest in a heavy teach for a memorable payoff arc." },
  { name: "Emi Larson", handle: "emi", persona: "soloPlanner", bio: "Uses quiet mornings for solo sessions and campaign upkeep." },
  { name: "Finn Carver", handle: "finn", persona: "conflictPilot", bio: "Wants interaction to stay sharp from the first turn to the last." },
  { name: "Greer Novak", handle: "greer", persona: "narrativeSolo", bio: "Adores co-ops that deliver atmosphere without burying players in upkeep." },
  { name: "Hugo Park", handle: "hugo", persona: "partyStarter", bio: "Seeks games that feel alive with four to eight players." },
  { name: "Ivy Romero", handle: "ivy", persona: "familyGuide", bio: "Looks for big-table accessibility with enough staying power for repeat plays." },
  { name: "Jules Harper", handle: "jules-user", persona: "duelSpecialist", bio: "Benchmarks every new two-player release against old favorites." },
  { name: "Kai Winters", handle: "kai", persona: "hybridStrategist", bio: "Likes medium-heavy games that still generate memorable stories." },
  { name: "Lila Monroe", handle: "lila", persona: "natureCurator", bio: "Chooses games by theme first, then stays for the replayability." },
  { name: "Marek Silva", handle: "marek", persona: "strategyPurist", bio: "Happy to iterate on the same euro until every opening line is mapped." },
  { name: "Nora Bishop", handle: "nora", persona: "cozyPuzzler", bio: "Prefers inviting productions and short rules with subtle depth." },
  { name: "Owen Frost", handle: "owenf", persona: "simulationBrain", bio: "Finds delight in dense systems and long-horizon planning." },
  { name: "Priyanka Shah", handle: "priyanka", persona: "narrativeSolo", bio: "Tracks campaign stories more carefully than final scores." },
  { name: "Ronan Keats", handle: "ronan", persona: "conflictPilot", bio: "Rates games by how tense the table feels in the final third." },
];

export const communityUsers: CommunityUserSeed[] = communityBlueprints.map((user) => ({
  name: user.name,
  handle: user.handle,
  avatar: avatarFromName(user.name),
  bio: user.bio,
  isCurrent: user.isCurrent,
  preferredComplexity: personaProfiles[user.persona].preferredComplexity,
  tasteProfile: personaProfiles[user.persona].tasteProfile,
}));
