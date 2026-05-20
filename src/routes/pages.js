import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { levelProgress, LOCAL_PROFILE } from '../db/schema.js';
import { LEVEL_IDS } from '../levels.js';
import { playPage } from '../views/pages.js';

/* HTML page routes. @elysiajs/html sets the text/html content-type.

   The game is the only page — no login, no auth. `/` and `/play` both
   serve the game, with progress loaded from the local profile. */
export const pageRoutes = new Elysia()

  .get('/', () => servePlay())
  .get('/play', () => servePlay());

async function servePlay() {
  /* Load the local profile's progress, seeding the map on first visit. */
  let rows = await db.select().from(levelProgress)
    .where(eq(levelProgress.profileId, LOCAL_PROFILE));

  if (rows.length === 0) {
    const now = new Date();
    await db.insert(levelProgress).values(
      LEVEL_IDS.map((levelId, i) => ({
        profileId: LOCAL_PROFILE,
        levelId,
        status: i === 0 ? 'unlocked' : 'locked',
        commandsRun: 0,
        updatedAt: now,
      })),
    );
    rows = await db.select().from(levelProgress)
      .where(eq(levelProgress.profileId, LOCAL_PROFILE));
  }
  return playPage(rows);
}
