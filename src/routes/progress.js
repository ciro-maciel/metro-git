import { Elysia, t } from 'elysia';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { levelProgress, LOCAL_PROFILE } from '../db/schema.js';
import { LEVEL_IDS } from '../levels.js';

/* Progress API — read/advance the local tutorial state. JSON, consumed by
   the Canvas game client via fetch. No authentication: progress belongs to
   a single anonymous local profile. */
export const progressRoutes = new Elysia({ prefix: '/api/progress' })

  /* GET — full progress map for the local profile. */
  .get('/', async () => {
    const rows = await db.select().from(levelProgress)
      .where(eq(levelProgress.profileId, LOCAL_PROFILE));
    return { progress: rows };
  })

  /* POST /complete — mark a level completed, unlock the next one. */
  .post('/complete', async ({ body, set }) => {
    const { levelId } = body;
    if (!LEVEL_IDS.includes(levelId)) { set.status = 400; return { error: 'bad level' }; }

    const now = new Date();
    await upsert(levelId, { status: 'completed', completedAt: now });

    const nextId = LEVEL_IDS[LEVEL_IDS.indexOf(levelId) + 1];
    if (nextId) await upsert(nextId, { status: 'unlocked' });

    return { ok: true, unlocked: nextId ?? null };
  }, {
    body: t.Object({ levelId: t.String() }),
  });

/* Insert-or-update a level progress row for the local profile. */
async function upsert(levelId, patch) {
  const now = new Date();
  const existing = await db.select().from(levelProgress)
    .where(and(
      eq(levelProgress.profileId, LOCAL_PROFILE),
      eq(levelProgress.levelId, levelId),
    ))
    .get();

  if (existing) {
    // Never downgrade a completed level back to unlocked.
    if (existing.status === 'completed' && patch.status === 'unlocked') return;
    await db.update(levelProgress)
      .set({ ...patch, updatedAt: now })
      .where(eq(levelProgress.id, existing.id));
  } else {
    await db.insert(levelProgress).values({
      profileId: LOCAL_PROFILE, levelId, status: 'locked', commandsRun: 0,
      updatedAt: now, ...patch,
    });
  }
}
