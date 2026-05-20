import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/* ─────────────────────────────────────────────────────────────────────
   Game tables — one row per level tracking tutorial progress.

   There is no authentication: progress belongs to a single anonymous
   local profile. `profileId` is a constant (LOCAL_PROFILE) — kept as a
   column so the table shape stays stable if multi-profile is ever added.
   ───────────────────────────────────────────────────────────────────── */

/* The only profile id ever written — the local, anonymous player. */
export const LOCAL_PROFILE = 'local';

export const levelProgress = sqliteTable('level_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: text('profileId').notNull().default(LOCAL_PROFILE),
  levelId: text('levelId').notNull(),       // 'commit', 'branch', 'merge'
  status: text('status').notNull().default('locked'), // locked | unlocked | completed
  commandsRun: integer('commandsRun').notNull().default(0),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});
