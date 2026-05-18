import type Database from "better-sqlite3";
import { TASTE_DIMENSIONS, type TasteProfile } from "@/lib/taste";
import { critics, type CriticSeed } from "./seeds/critics";
import { communityUsers, type CommunityUserSeed } from "./seeds/users";
import { awardSeeds, gameSeeds, releaseCalendarSeeds, type GameSeed } from "./seeds/games";

const NOW = process.env.NODE_ENV === "test" ? new Date("2026-05-16T12:00:00.000Z") : new Date();
const SEED_VERSION = "gamepulse-v2-rich-catalog";

type SeedOverride = {
  criticReviews?: number;
  communityReviews?: number;
  criticBias?: number;
  communityBias?: number;
  forcedCritics?: string[];
  forcedUsers?: string[];
};

const GAME_OVERRIDES: Record<string, SeedOverride> = {
  crokinole: { criticReviews: 1, communityReviews: 7, criticBias: -7, communityBias: 1.6, forcedCritics: ["jasper-flynn"], forcedUsers: ["piper", "zane", "hugo"] },
  "sea-salt-paper": { criticReviews: 2, communityReviews: 9, criticBias: 8, communityBias: 3.6, forcedCritics: ["jasper-flynn", "naomi-hart"], forcedUsers: ["sofia", "paige", "nora"] },
  "beyond-the-sun": { criticReviews: 2, communityReviews: 6, criticBias: -4, communityBias: 0.8, forcedCritics: ["greta-ledger", "viv-chen"] },
  tapestry: { criticReviews: 4, communityReviews: 6, criticBias: 10, communityBias: -1.4 },
  hegemony: { criticReviews: 5, communityReviews: 5, criticBias: 9, communityBias: -1.7, forcedCritics: ["greta-ledger", "hector-ruiz", "priya-nandi"] },
  "ready-set-bet": { criticReviews: 5, communityReviews: 8, criticBias: 7, communityBias: -1.1, forcedCritics: ["theo-sparks", "benji-cruz", "jasper-flynn"] },
  skull: { criticReviews: 3, communityReviews: 8, criticBias: -2, communityBias: 0.9 },
  "wonderland-s-war": { criticReviews: 4, communityReviews: 6, criticBias: 4, communityBias: -0.7 },
  "puerto-rico-1897": { criticReviews: 1, communityReviews: 4, criticBias: 3, communityBias: -0.3, forcedCritics: ["greta-ledger"] },
  "the-white-castle": { criticReviews: 5, communityReviews: 8, criticBias: 5, communityBias: 0.2, forcedCritics: ["greta-ledger", "viv-chen", "priya-nandi"] },
  harmonies: { criticReviews: 5, communityReviews: 10, criticBias: 6, communityBias: 3.6, forcedCritics: ["naomi-hart", "owen-park"] },
  "sky-team": { criticReviews: 6, communityReviews: 10, criticBias: 4, communityBias: 0.6, forcedCritics: ["clara-bishop", "samira-holt", "owen-park"] },
  "seti-search-for-extraterrestrial-intelligence": { criticReviews: 6, communityReviews: 9, criticBias: 5, communityBias: 0.5, forcedCritics: ["greta-ledger", "viv-chen", "hector-ruiz"] },
  cascadia: { criticReviews: 4, communityReviews: 10, criticBias: 6, communityBias: 2.9 },
  "castle-combo": { criticReviews: 4, communityReviews: 9, criticBias: 7, communityBias: 3.1, forcedCritics: ["naomi-hart", "jasper-flynn"] },
  decrypto: { criticReviews: 3, communityReviews: 8, criticBias: 1, communityBias: 0.6 },
};

const REVIEW_OPENERS = [
  "The standout move is",
  "What keeps the design humming is",
  "The strongest part of the experience is",
  "At its best, the game delivers",
] as const;

const REVIEW_CRITIQUES = [
  "the closing turns can drag if your group misses the pacing cue.",
  "the teach asks for patience before the best decisions emerge.",
  "its roughest edges show when the table wants a cleaner rhythm.",
  "the final score can hinge on whether players embrace the central tension.",
] as const;

const COMMUNITY_PRAISE = [
  "earned another immediate rematch with this group.",
  "kept the table locked in from teach to final score.",
  "clicked harder on repeat play than the hype suggested.",
  "felt approachable without running out of interesting choices.",
] as const;

const COMMUNITY_MIXED = [
  "landed well overall, though a few people bounced off the tempo.",
  "had some brilliant moments, even if the ending felt slightly loose.",
  "worked best once everyone understood the central rhythm.",
  "showed real promise, but the table wanted one more round to fully gel.",
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hash(value: string) {
  return value.split("").reduce((acc, character) => acc + character.charCodeAt(0), 0);
}

function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function affinity(game: GameSeed, tasteProfile: TasteProfile) {
  const total = TASTE_DIMENSIONS.reduce((sum, key) => {
    return sum + (game.tasteProfile[key] * tasteProfile[key]) / 100;
  }, 0);
  return total / TASTE_DIMENSIONS.length;
}

function tasteAlignment(left: TasteProfile, right: TasteProfile) {
  const total = TASTE_DIMENSIONS.reduce((sum, key) => {
    return sum + (left[key] * right[key]) / 100;
  }, 0);
  return total / TASTE_DIMENSIONS.length;
}

function criticScoreForGame(game: GameSeed, critic: CriticSeed, seedKey: string, bias = 0) {
  const taste = affinity(game, critic.tasteProfile);
  const complexityPenalty = Math.abs(game.complexity - critic.preferredComplexity) * 7.5;
  const noise = (hash(seedKey) % 11) - 5;
  return clamp(Math.round(42 + taste * 0.58 + game.buzz * 0.12 + game.rising * 0.08 - complexityPenalty + noise + bias), 45, 98);
}

function userRatingForGame(game: GameSeed, user: CommunityUserSeed, seedKey: string, bias = 0) {
  const taste = affinity(game, user.tasteProfile);
  const complexityPenalty = Math.abs(game.complexity - user.preferredComplexity) * 0.9;
  const noise = ((hash(seedKey) % 17) - 8) / 10;
  const raw = 4.1 + taste * 0.055 + game.rising * 0.008 - complexityPenalty + noise + bias;
  return Number(clamp(Math.round(raw * 10) / 10, 3.8, 9.9).toFixed(1));
}

function criticVerdict(score: number) {
  if (score >= 92) return "Pulse essential";
  if (score >= 86) return "Pulse pick";
  if (score >= 78) return "Strong recommend";
  if (score >= 70) return "Worth your table";
  return "Mixed pulse";
}

function communityReviewText(score: number, user: CommunityUserSeed, game: GameSeed, seedKey: string) {
  const praise = COMMUNITY_PRAISE[hash(`${seedKey}-praise`) % COMMUNITY_PRAISE.length] ?? COMMUNITY_PRAISE[0];
  const mixed = COMMUNITY_MIXED[hash(`${seedKey}-mixed`) % COMMUNITY_MIXED.length] ?? COMMUNITY_MIXED[0];
  const firstMechanic = game.mechanics[0]?.toLowerCase() ?? "play pattern";
  if (score >= 8.8) {
    return `${user.name} loved how ${game.title} turns ${firstMechanic} into a satisfying arc and said it ${praise}`;
  }
  if (score >= 7.4) {
    return `${user.name} thought ${game.title} was easy to root for because the ${firstMechanic} kept producing smart little choices and it ${mixed}`;
  }
  return `${user.name} respected what ${game.title} was aiming for, but felt the ${firstMechanic} never fully paid off for this particular group.`;
}

function criticExcerpt(score: number, critic: CriticSeed, game: GameSeed, seedKey: string) {
  const opener = REVIEW_OPENERS[hash(`${seedKey}-opener`) % REVIEW_OPENERS.length] ?? REVIEW_OPENERS[0];
  const critique = REVIEW_CRITIQUES[hash(`${seedKey}-critique`) % REVIEW_CRITIQUES.length] ?? REVIEW_CRITIQUES[0];
  const firstCategory = game.categories[0]?.toLowerCase() ?? "game";
  const firstMechanic = game.mechanics[0]?.toLowerCase() ?? "gameplay";

  if (score >= 90) {
    return `${critic.name} argues ${game.title} is a benchmark for ${firstCategory} design. ${opener.toLowerCase()} the way ${firstMechanic} supports ${game.hook}.`;
  }
  if (score >= 80) {
    return `${critic.name} found ${game.title} consistently engaging, especially in how ${firstMechanic} reinforces ${game.hook}, though ${critique}`;
  }
  if (score >= 70) {
    return `${critic.name} liked the central ideas in ${game.title}, but noted the experience depends heavily on whether your table enjoys ${firstCategory} pressure and ${firstMechanic}.`;
  }
  return `${critic.name} appreciated the ambition in ${game.title}, yet felt ${game.hook} never overcame the fact that ${critique}`;
}

function priceForRetailer(game: GameSeed, retailerOffset: number) {
  const base = 24 + game.complexity * 10 + game.buzz * 0.22 + retailerOffset * 3;
  return Number((base - (retailerOffset % 2 === 0 ? 6.5 : 2.75)).toFixed(2));
}

function sourceLink(critic: CriticSeed, game: GameSeed) {
  const contentPath = critic.platform === "YouTube" || critic.platform === "Shorts" || critic.platform === "Video Essay"
    ? "videos"
    : critic.platform === "Podcast"
      ? "episodes"
      : "reviews";
  return `${critic.baseUrl}/${contentPath}/${slugify(game.title)}-${slugify(critic.tagline)}`;
}

function reviewCountForGame(game: GameSeed, override: SeedOverride) {
  if (override.criticReviews) return override.criticReviews;
  if (game.buzz >= 88 || game.rising >= 85) return 5;
  if (game.buzz >= 80 || game.rising >= 70) return 4;
  if (game.buzz >= 72) return 3;
  return 2;
}

function communityCountForGame(game: GameSeed, override: SeedOverride) {
  if (override.communityReviews) return override.communityReviews;
  const momentum = game.buzz + game.rising;
  if (momentum >= 175) return 9;
  if (momentum >= 160) return 7;
  if (momentum >= 145) return 6;
  if (game.complexity <= 2.1) return 5;
  return 4;
}

function pushUnique<T extends { slug: string }>(collection: T[], items: Array<T | undefined>) {
  const seen = new Set(collection.map((item) => item.slug));
  for (const item of items) {
    if (!item || seen.has(item.slug)) continue;
    collection.push(item);
    seen.add(item.slug);
  }
}

export function seedDatabase(db: Database.Database) {
  const insertCritic = db.prepare(`
    INSERT INTO critics (slug, name, avatar, platform, outlet, bio, tagline, preferred_complexity, taste_profile)
    VALUES (@slug, @name, @avatar, @platform, @outlet, @bio, @tagline, @preferredComplexity, @tasteProfile)
  `);
  const insertUser = db.prepare(`
    INSERT INTO community_users (handle, name, avatar, bio, preferred_complexity, taste_profile, is_current)
    VALUES (@handle, @name, @avatar, @bio, @preferredComplexity, @tasteProfile, @isCurrent)
  `);
  const insertGame = db.prepare(`
    INSERT INTO games (slug, title, year, description, categories, mechanics, min_players, max_players, complexity, play_time, buzz, rising, taste_profile)
    VALUES (@slug, @title, @year, @description, @categories, @mechanics, @minPlayers, @maxPlayers, @complexity, @playTime, @buzz, @rising, @tasteProfile)
  `);
  const insertCriticReview = db.prepare(`
    INSERT INTO critic_reviews (game_id, critic_id, score, verdict, excerpt, source, content_type, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCommunityReview = db.prepare(`
    INSERT INTO community_reviews (game_id, user_id, rating, review, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertPrice = db.prepare(`
    INSERT INTO game_prices (game_id, retailer, price, shipping, label)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertAward = db.prepare(`
    INSERT INTO awards (game_id, award_name, award_year, result)
    VALUES (?, ?, ?, ?)
  `);
  const insertRelease = db.prepare(`
    INSERT INTO release_calendar (title, release_date, item_type, anticipation, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertFeed = db.prepare(`
    INSERT INTO feed_items (item_type, title, summary, game_id, critic_id, published_at, badge)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertList = db.prepare(`
    INSERT INTO user_lists (user_id, game_id, list_type, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const insertFollow = db.prepare(`
    INSERT INTO follows (user_id, critic_id, created_at)
    VALUES (?, ?, ?)
  `);
  const setMeta = db.prepare(`INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`);

  const transaction = db.transaction(() => {
    db.exec(`
      DELETE FROM newsletter_signups;
      DELETE FROM newsletter_manage_tokens;
      DELETE FROM follows;
      DELETE FROM user_lists;
      DELETE FROM feed_items;
      DELETE FROM release_calendar;
      DELETE FROM awards;
      DELETE FROM game_prices;
      DELETE FROM community_reviews;
      DELETE FROM critic_reviews;
      DELETE FROM games;
      DELETE FROM community_users;
      DELETE FROM critics;
      DELETE FROM app_meta;
      DELETE FROM sqlite_sequence WHERE name IN (
        'critics',
        'community_users',
        'games',
        'critic_reviews',
        'community_reviews',
        'game_prices',
        'awards',
        'release_calendar',
        'feed_items',
        'user_lists',
        'follows'
      );
    `);

    const criticIds = new Map<string, number>();
    const userIds = new Map<string, number>();
    const gameIds = new Map<string, number>();
    const reviewsByUser = new Map<number, Set<number>>();

    for (const critic of critics) {
      const result = insertCritic.run({ ...critic, tasteProfile: JSON.stringify(critic.tasteProfile) });
      criticIds.set(critic.slug, Number(result.lastInsertRowid));
    }

    for (const user of communityUsers) {
      const result = insertUser.run({
        ...user,
        tasteProfile: JSON.stringify(user.tasteProfile),
        isCurrent: user.isCurrent ? 1 : 0,
      });
      userIds.set(user.handle, Number(result.lastInsertRowid));
    }

    for (const game of gameSeeds) {
      const slug = slugify(game.title);
      const result = insertGame.run({
        slug,
        title: game.title,
        year: game.year,
        description: `${game.title} lets players ${game.hook}.`,
        categories: JSON.stringify(game.categories),
        mechanics: JSON.stringify(game.mechanics),
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        complexity: game.complexity,
        playTime: game.playTime,
        buzz: game.buzz,
        rising: game.rising,
        tasteProfile: JSON.stringify(game.tasteProfile),
      });
      gameIds.set(slug, Number(result.lastInsertRowid));
    }

    for (const [gameIndex, game] of gameSeeds.entries()) {
      const slug = slugify(game.title);
      const gameId = gameIds.get(slug);
      if (!gameId) continue;

      const override = GAME_OVERRIDES[slug] ?? {};
      const reviewPool = critics
        .map((critic, criticIndex) => ({
          slug: critic.slug,
          critic,
          criticId: criticIds.get(critic.slug)!,
          score: criticScoreForGame(game, critic, `${critic.slug}-${slug}`, override.criticBias ?? 0),
          rankSignal: affinity(game, critic.tasteProfile) + ((hash(`${slug}-${critic.slug}`) % 9) - 4),
          criticIndex,
        }))
        .sort((left, right) => right.rankSignal - left.rankSignal || right.score - left.score || left.criticIndex - right.criticIndex);

      const selectedCritics: Array<(typeof reviewPool)[number]> = [];
      pushUnique(
        selectedCritics,
        (override.forcedCritics ?? []).map((criticSlug) => reviewPool.find((entry) => entry.critic.slug === criticSlug)),
      );
      pushUnique(
        selectedCritics,
        Array.from({ length: Math.min(critics.length, 6) }, (_, offset) => reviewPool[(gameIndex + offset) % reviewPool.length]),
      );
      pushUnique(selectedCritics, reviewPool.slice(0, 6));

      selectedCritics.slice(0, reviewCountForGame(game, override)).forEach((review, reviewIndex) => {
        const publishedAt = daysAgo((gameIndex * 5 + reviewIndex * 7 + review.criticIndex * 3) % 140 + 1);
        insertCriticReview.run(
          gameId,
          review.criticId,
          review.score,
          criticVerdict(review.score),
          criticExcerpt(review.score, review.critic, game, `${review.critic.slug}-${slug}-${reviewIndex}`),
          sourceLink(review.critic, game),
          review.critic.platform,
          publishedAt,
        );
      });

      const retailers = [
        ["MeepleMart", "Free over $75", "Best editorial pick"],
        ["Cardboard Corner", "$5 flat", "Lowest live price"],
        ["Tabletop Direct", "Pickup eligible", "Fastest delivery"],
      ] as const;

      retailers.forEach(([retailer, shipping, label], retailerIndex) => {
        insertPrice.run(gameId, retailer, priceForRetailer(game, retailerIndex), shipping, label);
      });

      const audiencePool = communityUsers
        .filter((user) => !user.isCurrent)
        .map((user, userIndex) => ({
          slug: user.handle,
          user,
          userId: userIds.get(user.handle)!,
          desirability:
            affinity(game, user.tasteProfile)
            - Math.abs(game.complexity - user.preferredComplexity) * 5
            + (hash(`${user.handle}-${slug}`) % 13)
            + game.rising * 0.08,
          userIndex,
        }))
        .sort((left, right) => right.desirability - left.desirability || left.userIndex - right.userIndex);

      const selectedUsers: Array<(typeof audiencePool)[number]> = [];
      pushUnique(
        selectedUsers,
        (override.forcedUsers ?? []).map((handle) => audiencePool.find((entry) => entry.user.handle === handle)),
      );
      pushUnique(
        selectedUsers,
        Array.from({ length: Math.min(audiencePool.length, 10) }, (_, offset) => audiencePool[(gameIndex * 2 + offset) % audiencePool.length]),
      );
      pushUnique(selectedUsers, audiencePool.slice(0, 8));

      selectedUsers.slice(0, communityCountForGame(game, override)).forEach((entry, reviewIndex) => {
        const rating = userRatingForGame(game, entry.user, `${entry.user.handle}-${slug}`, override.communityBias ?? 0);
        insertCommunityReview.run(
          gameId,
          entry.userId,
          rating,
          communityReviewText(rating, entry.user, game, `${entry.user.handle}-${slug}-${reviewIndex}`),
          daysAgo((gameIndex * 4 + reviewIndex * 5 + entry.userIndex) % 120 + 2),
        );
        const userReviews = reviewsByUser.get(entry.userId) ?? new Set<number>();
        userReviews.add(gameId);
        reviewsByUser.set(entry.userId, userReviews);
      });
    }

    const alexRatedGames = [
      "wingspan",
      "spirit-island",
      "ark-nova",
      "dune-imperium",
      "sky-team",
      "the-white-castle",
      "seti-search-for-extraterrestrial-intelligence",
      "harmonies",
      "earth",
      "lost-ruins-of-arnak",
      "brass-birmingham",
      "cascadia",
      "sea-salt-paper",
      "beyond-the-sun",
      "wonderland-s-war",
    ];

    const alexUser = communityUsers.find((user) => user.handle === "alex");
    const alexId = userIds.get("alex");
    if (alexUser && alexId) {
      for (const slug of alexRatedGames) {
        const game = gameSeeds.find((candidate) => slugify(candidate.title) === slug);
        const gameId = gameIds.get(slug);
        if (!game || !gameId) continue;
        const rating = userRatingForGame(game, alexUser, `alex-${slug}`, slug === "wonderland-s-war" ? -0.2 : 0.4);
        insertCommunityReview.run(
          gameId,
          alexId,
          rating,
          communityReviewText(rating, alexUser, game, `alex-${slug}`),
          daysAgo((hash(slug) % 45) + 1),
        );
        const alexReviews = reviewsByUser.get(alexId) ?? new Set<number>();
        alexReviews.add(gameId);
        reviewsByUser.set(alexId, alexReviews);
      }
    }

    const updateGameScores = db.prepare(`
      UPDATE games
      SET critics_score = ?, community_score = ?, critic_reviews_count = ?, community_reviews_count = ?
      WHERE id = ?
    `);

    for (const gameId of gameIds.values()) {
      const criticStats = db.prepare(`SELECT ROUND(AVG(score)) as avgScore, COUNT(*) as count FROM critic_reviews WHERE game_id = ?`).get(gameId) as { avgScore: number; count: number };
      const communityStats = db.prepare(`SELECT ROUND(AVG(rating) * 10) as avgScore, COUNT(*) as count FROM community_reviews WHERE game_id = ?`).get(gameId) as { avgScore: number; count: number };
      updateGameScores.run(criticStats.avgScore ?? 0, communityStats.avgScore ?? 0, criticStats.count ?? 0, communityStats.count ?? 0, gameId);
    }

    for (const [title, awardName, year, result] of awardSeeds) {
      const gameId = gameIds.get(slugify(title));
      if (!gameId) continue;
      insertAward.run(gameId, awardName, year, result);
    }

    for (const [title, releaseDate, itemType, anticipation, note] of releaseCalendarSeeds) {
      insertRelease.run(title, releaseDate, itemType, anticipation, note);
    }

    const freshestReviews = db.prepare(`
      SELECT cr.game_id, cr.critic_id, cr.score, cr.published_at, g.title as game_title, c.name as critic_name
      FROM critic_reviews cr
      JOIN games g ON g.id = cr.game_id
      JOIN critics c ON c.id = cr.critic_id
      ORDER BY cr.published_at DESC
      LIMIT 16
    `).all() as Array<{
      game_id: number;
      critic_id: number;
      score: number;
      published_at: string;
      game_title: string;
      critic_name: string;
    }>;

    freshestReviews.forEach((review, index) => {
      const itemType = index % 4 === 0 ? "video" : "review";
      const badge = review.score >= 88 ? "Fresh pulse" : review.score >= 76 ? "Critic radar" : "Mixed buzz";
      insertFeed.run(
        itemType,
        `${review.critic_name} on ${review.game_title}`,
        `${review.critic_name} posted a ${itemType === "video" ? "new breakdown" : "fresh take"} with a ${review.score}/100 score for ${review.game_title}.`,
        review.game_id,
        review.critic_id,
        review.published_at,
        badge,
      );
    });

    const editorialFeed = [
      ["Hidden gem watch: Sea Salt & Paper keeps climbing", "Community sentiment continues to outrun critic coverage as more tables discover the tiny card game's replay value.", "news", "Hidden gem", "sea-salt-paper"],
      ["Award radar: Sky Team adds another trophy", "The two-player co-op remains one of the most decorated modern releases in the database.", "news", "Award season", "sky-team"],
      ["Deal watch: Brass drops below premium euro pricing", "Retailers are cutting into the usual heavy-game markup after a fresh restock wave.", "deals", "Deal", "brass-birmingham"],
      ["Divisive corner: Hegemony sparks another debate", "Critics still admire the ambition, while community scores split over length and teach overhead.", "news", "Divisive", "hegemony"],
      ["Release tracker: Dune expansion dominates anticipation", "Upcoming release interest is clustering around high-interaction strategy expansions.", "news", "Trending", "dune-imperium"],
      ["Party table pulse: Ready Set Bet still plays loud", "Short-form critics keep resurfacing race-night favorites for summer gatherings.", "video", "Creator clip", "ready-set-bet"],
      ["New release momentum: SETI refuses to cool off", "Heavy-strategy critics and curious euro fans are still driving the highest rising score in the catalog.", "news", "Rising", "seti-search-for-extraterrestrial-intelligence"],
      ["Family shelf update: Harmonies leads the cozy stack", "Watchlists are filling with puzzle-forward games that still feel approachable for mixed groups.", "news", "Watchlist", "harmonies"],
    ] as const;

    editorialFeed.forEach(([title, summary, type, badge, slug], index) => {
      insertFeed.run(type, title, summary, gameIds.get(slug) ?? null, null, daysAgo(index + 1), badge);
    });

    const rankedGamesForUser = (user: CommunityUserSeed) =>
      gameSeeds
        .map((game) => ({
          game,
          slug: slugify(game.title),
          score:
            affinity(game, user.tasteProfile)
            + game.rising * 0.18
            + game.buzz * 0.08
            - Math.abs(game.complexity - user.preferredComplexity) * 4,
        }))
        .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug));

    for (const [userIndex, user] of communityUsers.entries()) {
      const userId = userIds.get(user.handle);
      if (!userId) continue;

      const ratedGames = reviewsByUser.get(userId) ?? new Set<number>();
      const rankedGames = rankedGamesForUser(user).filter((entry) => {
        const gameId = gameIds.get(entry.slug);
        return gameId ? !ratedGames.has(gameId) : false;
      });

      const watchCount = user.isCurrent ? 3 : 1 + (userIndex % 2);
      const wishCount = user.isCurrent ? 3 : 1 + (userIndex % 3 === 0 ? 1 : 0);
      const watchlist = user.isCurrent
        ? ["seti-search-for-extraterrestrial-intelligence", "harmonies", "sea-salt-paper"]
        : rankedGames.slice(0, watchCount).map((entry) => entry.slug);
      const wishlist = user.isCurrent
        ? ["sky-team", "the-white-castle", "apiary"]
        : rankedGames.slice(watchCount, watchCount + wishCount).map((entry) => entry.slug);

      watchlist.forEach((slug, index) => {
        const gameId = gameIds.get(slug);
        if (gameId) insertList.run(userId, gameId, "watchlist", daysAgo((userIndex + 1) * 2 + index));
      });

      wishlist.forEach((slug, index) => {
        const gameId = gameIds.get(slug);
        if (gameId) insertList.run(userId, gameId, "wishlist", daysAgo((userIndex + 1) * 2 + index + 3));
      });

      const matchedCritics = critics
        .map((critic) => ({
          slug: critic.slug,
          alignment:
            tasteAlignment(user.tasteProfile, critic.tasteProfile)
            - Math.abs(user.preferredComplexity - critic.preferredComplexity) * 6,
        }))
        .sort((left, right) => right.alignment - left.alignment || left.slug.localeCompare(right.slug));

      const followSlugs = user.isCurrent
        ? ["greta-ledger", "samira-holt", "mina-vale", "viv-chen"]
        : matchedCritics.slice(0, 1 + (userIndex % 3)).map((entry) => entry.slug);

      followSlugs.forEach((criticSlug, index) => {
        const criticId = criticIds.get(criticSlug);
        if (criticId) insertFollow.run(userId, criticId, daysAgo(userIndex + index + 1));
      });
    }

    setMeta.run("seed_version", SEED_VERSION);
    setMeta.run(
      "seed_summary",
      JSON.stringify({
        games: gameSeeds.length,
        critics: critics.length,
        communityUsers: communityUsers.length,
        criticReviews: (db.prepare(`SELECT COUNT(*) as count FROM critic_reviews`).get() as { count: number }).count,
        communityReviews: (db.prepare(`SELECT COUNT(*) as count FROM community_reviews`).get() as { count: number }).count,
      }),
    );
  });

  transaction();
}

export { SEED_VERSION };
