# Book Club for Two

A cleaned Canva-derived site for GitHub + Cloudflare Pages, with a D1-backed Club Log.

## Structure

- `index.html` — homepage / reading room, kept at the project root.
- `radarview.html` — On the Radar page.
- `readview.html` — Already Read page.
- `content/books.md` — the single source of truth for Reading Room, Radar, and Already Read content.
- `content/radar.md` and `content/already-read.md` are no longer used.
- `books.js` — shared Markdown parser and renderer for the homepage shelves and both book-list pages.
- `club-log.js` — browser client for the Club Log API.
- `functions/api/club-log.js` — public GET/POST API.
- `functions/api/club-log/[id].js` — protected admin DELETE API.
- `migrations/0001_create_club_log.sql` — D1 schema.
- `styles.css` — extracted site CSS plus the final visual overrides.

The homepage structure and reading-card proportions are intentionally kept close to the supplied Canva HTML. The visual pass changes the blue/gray treatment to plum, cranberry, blush, warm paper, and dark wine; it uses Manrope as the closest practical substitute for the unavailable Canva font.

## D1

Put your real database ID in `wrangler.toml`, then:

```bash
npm install
npm run db:migrate:remote
```

For local development:

```bash
npm run db:migrate:local
npm run dev
```

## Cloudflare Pages

The project root is the Pages build output directory, so `index.html` remains at the root. Connect the GitHub repository to Cloudflare Pages and deploy the repository root.

Set `ADMIN_API_KEY` as a Cloudflare secret only if you want to use the protected DELETE endpoint:

```bash
npx wrangler secret put ADMIN_API_KEY
```

The public Club Log POST endpoint has server-side validation and a honeypot. Before significant public traffic, add Cloudflare rate limiting and/or Turnstile.
