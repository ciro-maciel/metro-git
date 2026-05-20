# Metro Git

A Canvas game that teaches Git through a metro-network metaphor. Branches are
metro lines, commits are stations, HEAD is the train you ride.

## Stack conventions (Bun-first)

- Runtime: **Bun >=1.0**. Use `bun <file>`, not `node`/`ts-node`.
- Language: **plain JavaScript, ES6**, ESM (`"type": "module"`).
- `bun test` — not jest/vitest. `bunx` — not `npx`.
- `Bun.serve()` via Elysia — not Express.
- `bun:sqlite` — not better-sqlite3. `Bun.file` — not `node:fs`.
- `.env` loads automatically — no `dotenv`.

## Layout

- `src/app.js` — Elysia app + `Bun.serve()` boot.
- `src/db/` — `bun:sqlite` connection, Drizzle schema, imperative migrations.
- `src/db/auth-adapter.js` — custom Drizzle adapter for better-auth.
- `src/middleware/session.js` — `getUser(headers)` helper.
- `src/routes/` — route groups (game, progress, auth).
- `src/views/` — server-rendered HTML pages.
- `public/` — static assets, served at `/public/*`.
  - `public/css/tokens.css` — RiLiGar "Zen Aesthetics" design tokens (verbatim).
  - `public/js/game/` — the Canvas game engine (state, render, levels).

## Design language

Monochrome "Zen Aesthetics" — see `public/css/tokens.css`. Brand black is
`#34322D` (warm, never pure black). Montserrat only; hierarchy from weight
(500–950), not size. 8px radius everywhere. 1px hairline borders. Color is a
status signal (green pulse / red destructive), never decoration.

Game UI copy is **English**, terse and cinematic — matches the design
system's product-surface voice.
