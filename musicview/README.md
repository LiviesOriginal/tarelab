# Retro Room TV

This directory is a small vanilla Vite app that also works when the repository is served directly as a static GitHub Pages directory at `/musicview/`.

## Run locally

```bash
npm install
npm run check
npm run dev
```

To test from another device on the same Wi-Fi:

```bash
npm run dev -- --host 0.0.0.0
```

## Backgrounds

The desktop and mobile backgrounds are derived only from the supplied room photos.

- `public/background-desktop-16x9.jpg` — 1920×1080.
- `public/background-mobile-9x19_5.jpg` — 1080×2340.

The runtime resolves these paths in two modes: Vite builds use Vite's base URL, while direct static GitHub Pages loading uses the `public/` directory. This lets `/musicview/` work without requiring a separate deployment workflow.

## Playlist

Edit `playlist.md` to change the videos. The app accepts Markdown links to YouTube watch, short, embed, and live URLs, plus bare 11-character YouTube IDs.

## Deployment

The repository can serve `/musicview/` directly from the normal GitHub Pages branch/source. No dedicated GitHub Actions deployment workflow is required for this directory.
