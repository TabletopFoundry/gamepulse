import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { schema } from "./schema";
import { seedDatabase, SEED_VERSION } from "./seed";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "gamepulse.db");

declare global {
  var __gamePulseDb: Database.Database | undefined;
}

function initializeDb(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(schema);

  const meta = db.prepare(`SELECT value FROM app_meta WHERE key = 'seed_version'`).get() as { value?: string } | undefined;
  const hasReferenceData = (db.prepare(`SELECT COUNT(*) as count FROM games`).get() as { count: number }).count > 0;

  if (!meta?.value && !hasReferenceData) {
    seedDatabase(db);
    return;
  }

  if (meta?.value !== SEED_VERSION) {
    db.prepare(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', ?)`).run(SEED_VERSION);
  }
}

export function getDb() {
  if (!global.__gamePulseDb) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    global.__gamePulseDb = new Database(DB_PATH);
    initializeDb(global.__gamePulseDb);
  }

  return global.__gamePulseDb;
}
