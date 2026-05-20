import { Elysia } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { runMigrations } from './db/index.js';
import { pageRoutes } from './routes/pages.js';
import { progressRoutes } from './routes/progress.js';

/* Run imperative migrations before the first request lands. */
runMigrations();

const app = new Elysia()
  .use(html())
  .use(staticPlugin({ assets: 'public', prefix: '/public', maxAge: 3600 }))
  .use(progressRoutes)
  .use(pageRoutes)
  .onError(({ code, error, set }) => {
    if (code === 'NOT_FOUND') { set.status = 404; return 'Not found'; }
    console.error(error);
    set.status = 500;
    return 'Internal error';
  });

/* Real server is Bun.serve(), delegating to app.fetch. */
const port = Number(process.env.PORT ?? 3000);
Bun.serve({ port, fetch: app.fetch });

console.log(`Metro Git running on http://localhost:${port}`);
