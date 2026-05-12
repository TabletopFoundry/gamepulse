import type Database from "better-sqlite3";
import { TASTE_DIMENSIONS, type TasteProfile } from "@/lib/taste";
import { critics, type CriticSeed } from "./seeds/critics";
import { communityUsers, type CommunityUserSeed } from "./seeds/users";
import { gameSeeds, awardSeeds, releaseCalendarSeeds, type GameSeed } from "./seeds/games";

const NOW = process.env.NODE_ENV === "test" ? new Date("2026-05-16T12:00:00.000Z") : new Date();
const SEED_VERSION = "gamepulse-v1";

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

function criticScoreForGame(game: GameSeed, critic: CriticSeed, seedKey: string) {
  const taste = affinity(game, critic.tasteProfile);
  const complexityPenalty = Math.abs(game.complexity - critic.preferredComplexity) * 7.5;
  const noise = (hash(seedKey) % 11) - 5;
  return clamp(Math.round(42 + taste * 0.58 + game.buzz * 0.12 + game.rising * 0.08 - complexityPenalty + noise), 47, 98);
}

function userRatingForGame(game: GameSeed, user: CommunityUserSeed, seedKey: string) {
  const taste = affinity(game, user.tasteProfile);
  const complexityPenalty = Math.abs(game.complexity - user.preferredComplexity) * 0.9;
  const noise = ((hash(seedKey) % 17) - 8) / 10;
  const raw = 4.1 + taste * 0.055 + game.rising * 0.008 - complexityPenalty + noise;
  return Number(clamp(Math.round(raw * 10) / 10, 4.8, 9.9).toFixed(1));
}

function criticVerdict(score: number) {
  if (score >= 90) return "Pulse pick";
  if (score >= 82) return "Strong recommend";
  if (score >= 72) return "Worth your table";
  return "Mixed pulse";
}

function communitySnippet(score: number, game: GameSeed) {
  if (score >= 8.8) {
    return `${game.title} keeps earning replays because the core loop feels instantly satisfying.`;
  }
  if (score >= 7.5) {
    return `${game.title} lands well at the table, even if a few edges show on repeat plays.`;
  }
  return `${game.title} has flashes of brilliance, but this group wanted a tighter finish.`;
}

function criticExcerpt(score: number, critic: CriticSeed, game: GameSeed) {
  const firstCategory = game.categories[0]?.toLowerCase() ?? "game";
  const firstMechanic = game.mechanics[0]?.toLowerCase() ?? "gameplay";
  const secondMechanic = game.mechanics[1]?.toLowerCase() ?? firstMechanic;
  if (score >= 90) {
    return `${critic.name} says ${game.title} feels like a benchmark for ${firstCategory} design, with ${firstMechanic} that keeps every turn meaningful.`;
  }
  if (score >= 80) {
    return `${critic.name} found ${game.title} consistently engaging, especially the way ${secondMechanic} supports ${game.hook}.`;
  }
  if (score >= 70) {
    return `${critic.name} liked the central ideas in ${game.title}, but noted the experience depends on whether your table enjoys ${firstCategory} pressure.`;
  }
  return `${critic.name} appreciated the ambition in ${game.title}, yet felt the pacing never fully delivered on ${game.hook}.`;
}

function priceForRetailer(game: GameSeed, retailerOffset: number) {
  const base = 24 + game.complexity * 10 + game.buzz * 0.22 + retailerOffset * 3;
  return Number((base - (retailerOffset % 2 === 0 ? 6.5 : 2.75)).toFixed(2));
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
    `);

    const criticIds = new Map<string, number>();
    const userIds = new Map<string, number>();
    const gameIds = new Map<string, number>();

    for (const critic of critics) {
      insertCritic.run({ ...critic, tasteProfile: JSON.stringify(critic.tasteProfile) });
      const row = db.prepare(`SELECT id FROM critics WHERE slug = ?`).get(critic.slug) as { id: number };
      criticIds.set(critic.slug, row.id);
    }

    for (const user of communityUsers) {
      insertUser.run({
        ...user,
        tasteProfile: JSON.stringify(user.tasteProfile),
        isCurrent: user.isCurrent ? 1 : 0,
      });
      const row = db.prepare(`SELECT id FROM community_users WHERE handle = ?`).get(user.handle) as { id: number };
      userIds.set(user.handle, row.id);
    }

    for (const game of gameSeeds) {
      const slug = slugify(game.title);
      insertGame.run({
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
      const row = db.prepare(`SELECT id FROM games WHERE slug = ?`).get(slug) as { id: number };
      gameIds.set(slug, row.id);
    }

    for (const [gameIndex, game] of gameSeeds.entries()) {
      const gameId = gameIds.get(slugify(game.title));
      if (!gameId) continue;

      const reviewPool = critics
        .map((critic, criticIndex) => ({
          critic,
          criticId: criticIds.get(critic.slug)!,
          score: criticScoreForGame(game, critic, `${critic.slug}-${game.title}`),
          criticIndex,
        }))
        .sort((left, right) => right.score - left.score);

      const selected = Array.from(
        new Map(
          [reviewPool[0], reviewPool[1], reviewPool[2], reviewPool[(gameIndex + 3) % reviewPool.length], reviewPool[(gameIndex + 5) % reviewPool.length]]
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => [item.critic.slug, item]),
        ).values(),
      ).slice(0, 4 + (gameIndex % 2));

      for (const [reviewIndex, review] of selected.entries()) {
        if (!review) continue;
        const publishedAt = daysAgo((gameIndex * 4 + reviewIndex * 7 + review.criticIndex * 2) % 75 + 1);
        insertCriticReview.run(
          gameId,
          review.criticId,
          review.score,
          criticVerdict(review.score),
          criticExcerpt(review.score, review.critic, game),
          review.critic.outlet,
          review.critic.platform,
          publishedAt,
        );
      }

      const retailers = [
        ["MeepleMart", "Free over $75", "Best editorial pick"],
        ["Cardboard Corner", "$5 flat", "Lowest live price"],
        ["Tabletop Direct", "Pickup eligible", "Fastest delivery"],
      ] as const;

      retailers.forEach(([retailer, shipping, label], retailerIndex) => {
        insertPrice.run(gameId, retailer, priceForRetailer(game, retailerIndex), shipping, label);
      });

      communityUsers.slice(1).forEach((user, userIndex) => {
        const rating = userRatingForGame(game, user, `${user.handle}-${game.title}`);
        insertCommunityReview.run(
          gameId,
          userIds.get(user.handle),
          rating,
          communitySnippet(rating, game),
          daysAgo((gameIndex * 3 + userIndex * 5) % 60 + 2),
        );
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
    ];

    const alexUser = communityUsers[0];
    for (const slug of alexRatedGames) {
      const game = gameSeeds.find((candidate) => slugify(candidate.title) === slug);
      if (!game || !alexUser) continue;
      insertCommunityReview.run(
        gameIds.get(slug),
        userIds.get("alex"),
        userRatingForGame(game, alexUser, `alex-${slug}`),
        communitySnippet(userRatingForGame(game, alexUser, `alex-${slug}`), game),
        daysAgo((hash(slug) % 28) + 1),
      );
    }

    const scoreRows = db.prepare(`SELECT id FROM games`).all() as Array<{ id: number }>;
    const updateGameScores = db.prepare(`
      UPDATE games
      SET critics_score = ?, community_score = ?, critic_reviews_count = ?, community_reviews_count = ?
      WHERE id = ?
    `);

    for (const row of scoreRows) {
      const criticStats = db.prepare(`SELECT ROUND(AVG(score)) as avgScore, COUNT(*) as count FROM critic_reviews WHERE game_id = ?`).get(row.id) as { avgScore: number; count: number };
      const communityStats = db.prepare(`SELECT ROUND(AVG(rating) * 10) as avgScore, COUNT(*) as count FROM community_reviews WHERE game_id = ?`).get(row.id) as { avgScore: number; count: number };
      updateGameScores.run(criticStats.avgScore ?? 0, communityStats.avgScore ?? 0, criticStats.count ?? 0, communityStats.count ?? 0, row.id);
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
      LIMIT 12
    `).all() as Array<{ game_id: number; critic_id: number; score: number; published_at: string; game_title: string; critic_name: string }>;

    freshestReviews.forEach((review, index) => {
      const itemType = index % 3 === 0 ? "video" : "review";
      const badge = review.score >= 85 ? "Fresh pulse" : "Mixed buzz";
      insertFeed.run(
        itemType,
        `${review.critic_name} on ${review.game_title}`,
        `${review.critic_name} posted a ${itemType === "video" ? "new breakdown" : "fresh take"} with a ${review.score}/100 critic score.`,
        review.game_id,
        review.critic_id,
        review.published_at,
        badge,
      );
    });

    const newsTitles = [
      ["Rising buzz: SETI keeps climbing", "Critics keep rewarding its deep strategy arc and solo puzzle structure.", "news", "Rising"],
      ["Deal watch: Heat drops under $55", "Retailers are discounting the season's most replayed racing hit.", "deals", "Deal"],
      ["Award radar: Sky Team lands another win", "The two-player co-op darling keeps sweeping award lists.", "news", "Award season"],
      ["Weekend watchlist: Harmonies is surging", "Community sentiment is jumping as more tables discover the puzzle depth.", "news", "Trending"],
      ["Video roundup: party-table favorites", "Theo Sparks and Benji Cruz both highlighted fast fillers for bigger groups.", "video", "Creator clip"],
      ["Deal watch: Brass restock lands", "Cardboard Corner finally has fresh copies after weeks of low inventory.", "deals", "Restock"],
    ] as const;

    const featuredGameSlugs = ["seti-search-for-extraterrestrial-intelligence", "heat-pedal-to-the-metal", "sky-team", "harmonies", "scout", "brass-birmingham"];

    newsTitles.forEach(([title, summary, type, badge], index) => {
      const slug = featuredGameSlugs[index];
      const gameId = slug ? gameIds.get(slug) : undefined;
      insertFeed.run(type, title, summary, gameId ?? null, null, daysAgo(index + 1), badge);
    });

    const alexId = userIds.get("alex");
    if (alexId) {
      ["seti-search-for-extraterrestrial-intelligence", "harmonies", "wonderlands-war"].forEach((slug, index) => {
        const gameId = gameIds.get(slug);
        if (gameId) insertList.run(alexId, gameId, "watchlist", daysAgo(index + 2));
      });
      ["sky-team", "the-white-castle", "apiary"].forEach((slug, index) => {
        const gameId = gameIds.get(slug);
        if (gameId) insertList.run(alexId, gameId, "wishlist", daysAgo(index + 4));
      });
      ["greta-ledger", "samira-holt", "mina-vale"].forEach((slug, index) => {
        const criticId = criticIds.get(slug);
        if (criticId) insertFollow.run(alexId, criticId, daysAgo(index + 1));
      });
    }

    setMeta.run("seed_version", SEED_VERSION);
  });

  transaction();
}

export { SEED_VERSION };
