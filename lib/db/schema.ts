export const schema = `
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS critics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  platform TEXT NOT NULL,
  outlet TEXT NOT NULL,
  bio TEXT NOT NULL,
  tagline TEXT NOT NULL,
  preferred_complexity REAL NOT NULL,
  taste_profile TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS community_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  bio TEXT NOT NULL,
  preferred_complexity REAL NOT NULL,
  taste_profile TEXT NOT NULL,
  is_current INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  description TEXT NOT NULL,
  categories TEXT NOT NULL,
  mechanics TEXT NOT NULL,
  min_players INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  complexity REAL NOT NULL,
  play_time INTEGER NOT NULL,
  buzz INTEGER NOT NULL,
  rising INTEGER NOT NULL,
  taste_profile TEXT NOT NULL,
  critics_score INTEGER DEFAULT 0,
  community_score INTEGER DEFAULT 0,
  critic_reviews_count INTEGER DEFAULT 0,
  community_reviews_count INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS critic_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  critic_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  source TEXT NOT NULL,
  content_type TEXT NOT NULL,
  published_at TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (critic_id) REFERENCES critics(id)
);
CREATE TABLE IF NOT EXISTS community_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating REAL NOT NULL,
  review TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (game_id, user_id),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES community_users(id)
);
CREATE TABLE IF NOT EXISTS game_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  retailer TEXT NOT NULL,
  price REAL NOT NULL,
  shipping TEXT NOT NULL,
  label TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id)
);
CREATE TABLE IF NOT EXISTS awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  award_name TEXT NOT NULL,
  award_year INTEGER NOT NULL,
  result TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id)
);
CREATE TABLE IF NOT EXISTS release_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  release_date TEXT NOT NULL,
  item_type TEXT NOT NULL,
  anticipation INTEGER NOT NULL,
  note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS feed_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  game_id INTEGER,
  critic_id INTEGER,
  published_at TEXT NOT NULL,
  badge TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (critic_id) REFERENCES critics(id)
);
CREATE TABLE IF NOT EXISTS user_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  list_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, game_id, list_type),
  FOREIGN KEY (user_id) REFERENCES community_users(id),
  FOREIGN KEY (game_id) REFERENCES games(id)
);
CREATE TABLE IF NOT EXISTS follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  critic_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, critic_id),
  FOREIGN KEY (user_id) REFERENCES community_users(id),
  FOREIGN KEY (critic_id) REFERENCES critics(id)
);
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS newsletter_manage_tokens (
  email TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL,
  PRIMARY KEY (ip, action)
);
`;
