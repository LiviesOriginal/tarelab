# Book Club for Two

The Reading Room, Radar, and Read pages are rendered from `content/books.md`. The homepage Updates form submits a structured change to that file and opens a GitHub pull request; merging the PR publishes the update through Cloudflare Pages.

## Structure

- `index.html` — homepage and mobile-friendly Updates form.
- `content/books.md` — canonical book and shelf data.
- `books.js` — shared Markdown parser and renderer for all book pages.
- `book-update.js` — Updates form client; loads shelf headings from `books.md`, verifies the Turnstile challenge, and submits the form.
- `functions/api/book-submission-config.js` — supplies the public Turnstile site key.
- `functions/api/book-submissions.js` — validates submissions, verifies Turnstile server-side, updates the selected Markdown section, and opens one GitHub PR per submission.
- `radarview.html` and `readview.html` — complete Radar and Read shelves.
- `styles.css` — shared site styles.

The shelf is selected explicitly from the headings in `books.md`. ISBN is used to match an entry only within the selected section and to obtain covers/Goodreads links; it does not determine the shelf. For Read entries, the first and second ratings are XY and ZZ. Submitting a blank rating preserves the existing rating. Notes are appended without duplicating identical lines.

## Configure submissions

1. Create a Cloudflare Turnstile widget for the production hostname (and any preview hostnames used for testing). Add these Pages environment variables:
   - `TURNSTILE_SITE_KEY` — public site key.
   - `TURNSTILE_SECRET_KEY` — secret key; store as a Cloudflare secret.
2. Create a GitHub App and install it only on `LiviesOriginal/tarelab`. Grant repository **Contents: Read and write** and **Pull requests: Read and write**. Add these Pages variables/secrets:
   - `GITHUB_APP_ID` — app ID.
   - `GITHUB_INSTALLATION_ID` — installation ID.
   - `GITHUB_APP_PRIVATE_KEY` — generated private key; store as a Cloudflare secret.
   - `GITHUB_REPOSITORY` — optional; defaults to `LiviesOriginal/tarelab`.
   - `GITHUB_BASE_BRANCH` — optional; defaults to `main`.
3. Add a Cloudflare rate-limiting rule for `POST /api/book-submissions` (for example, five requests per ten minutes per IP). Turnstile reduces automated submissions but is not identity verification or a replacement for rate limiting.
4. Protect `main` so changes require a pull request and at least one approving review before merge. This is the deployment gate; the submitter does not need GitHub credentials.
5. Ensure Cloudflare Pages deploys production from `main`. Form submissions create reviewable PRs and do not publish until merged.

Never put the GitHub App private key or Turnstile secret in browser code or commit them to the repository. Until the required keys are configured, the form reports that submissions are unavailable.

## Local preview

Install dependencies and run Cloudflare Pages locally:

```bash
npm install
npm run dev
```

The Pages Functions require local environment values in an untracked `.dev.vars` file to test submissions. Use test Turnstile credentials and a GitHub App installation restricted to a test repository; otherwise local submissions can create real PRs.

## Legacy Club Log

The former D1-backed Club Log API and migration files remain in the repository but are no longer used by the homepage form. The new source-of-truth flow writes to `content/books.md` through GitHub PRs.
