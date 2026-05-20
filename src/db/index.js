import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema.js';

/* Path: data/local.db in dev, file:/data/local.db on the Fly volume in prod. */
const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/data/local.db'
  : 'data/local.db';

export const sqlite = new Database(DB_PATH, { create: true });

/* WAL mode + foreign keys ON — set at boot, before any query runs. */
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

/* ─────────────────────────────────────────────────────────────────────
   Imperative migrations — CREATE TABLE IF NOT EXISTS, run on every boot.
   Drizzle-kit exists in devDeps but this array is the canonical path.
   ───────────────────────────────────────────────────────────────────── */
export function runMigrations() {
  const statements = [
    /* No auth tables — progress belongs to a single anonymous local profile. */
    `CREATE TABLE IF NOT EXISTS level_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId TEXT NOT NULL DEFAULT 'local',
      levelId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      commandsRun INTEGER NOT NULL DEFAULT 0,
      completedAt INTEGER,
      updatedAt INTEGER NOT NULL
    )`,
  ];

  for (const sql of statements) {
    try {
      sqlite.exec(sql);
    } catch (err) {
      // ALTER TABLE ADD COLUMN re-runs throw "duplicate column name" — safe to skip.
      if (!String(err.message).includes('duplicate column name')) throw err;
    }
  }
}
