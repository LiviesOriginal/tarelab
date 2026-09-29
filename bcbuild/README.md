# Book Club for Two — Cloudflare starter

This is a cleaned extraction of the rendered site contained in the uploaded Canva snapshot `Pasted text(6).txt`.

## Extracted from Canva

**Retained:** the rendered page structure/copy, book cards and Goodreads links, reader filters, reviews, footer, Club Log form, loading/error/empty states, and the original visual system.

**Removed:** Canva editor metadata, Canva-hosted codelet iframes, Canva SDK scripts, `window.dataSdk`, Canva-specific `data-*` attributes, and inline Canva text styling.

The Club Log's public delete buttons were also removed. Deletion is scaffolded as an authenticated admin-only API route instead.

## Files

```text
public/
  index.html       # cleaned site HTML
  styles.css       # extracted Tailwind CSS + original design CSS
  club-log.js      # browser-side Club Log API client

functions/api/
  club-log.js      # GET + POST /api/club-log
  club-log/[id].js # authenticated DELETE /api/club-log/:id

migrations/
  0001_create_club_log.sql

wrangler.toml
package.json
```

## D1 setup

Create a D1 database named `book-club-for-two`, put its database ID into `wrangler.toml`, then run:

```bash
npm install
npm run db:migrate:remote
```

For local development:

```bash
npm run db:migrate:local
npm run dev
```

## Admin deletion secret

If you need the protected DELETE endpoint:

```bash
npx wrangler secret put ADMIN_API_KEY
```

Do not put this secret in `public/` or browser JavaScript.

## Cloudflare Pages

Connect the GitHub repository to Cloudflare Pages. Use `public` as the build output directory. The extracted site has no required build step; Pages Functions live in `functions/`.

The custom domain can continue to be attached to the Pages project through Cloudflare.

## API

- `GET /api/club-log` — returns entries ordered newest first.
- `POST /api/club-log` — creates a validated public entry.
- `DELETE /api/club-log/:id` — authenticated with `Authorization: Bearer <ADMIN_API_KEY>`.

## Production hardening

The POST endpoint is intentionally public because visitors need to submit entries. The scaffold already includes:

- server-side allow-lists for status and reader;
- rating validation (0–5 in 0.5 increments);
- field-length limits;
- generated IDs and timestamps;
- a 999-entry ceiling;
- a honeypot field;
- no public deletion UI.

Before opening the form to significant public traffic, add Cloudflare rate limiting and/or Turnstile. Those controls are deployment/security configuration rather than part of the extracted Canva design.

## Markdown

If the existing GitHub site uses Markdown for curated book content, keep doing that. D1 is only for visitor-generated Club Log records; it does not need to replace your Markdown content model.
