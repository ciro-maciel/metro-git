import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { levelProgress, LOCAL_PROFILE } from '../db/schema.js';
import { LEVEL_IDS } from '../levels.js';
import { playPage } from '../views/pages.js';

/* Public site URL — drives sitemap and robots. Override with SITE_URL
   in .env; the fallback is the published domain. */
const SITE_URL = (process.env.SITE_URL ?? 'http://metro-git.ciromaciel.click')
  .replace(/\/$/, '');

/* HTML page routes. @elysiajs/html sets the text/html content-type.

   The game is the only page — no login, no auth. `/` and `/play` both
   serve the game, with progress loaded from the local profile. */
export const pageRoutes = new Elysia()

  .get('/', () => servePlay())
  .get('/play', () => servePlay())

  /* robots.txt — served at the site root (the static plugin only covers
     /public/*). Crawlers are welcome; the API surface is excluded. */
  .get('/robots.txt', () => new Response(
    `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  ))

  /* sitemap.xml — a single public surface (the game). /play is an alias
     of / and is omitted to avoid a duplicate-content signal. */
  .get('/sitemap.xml', () => new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  ));

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
