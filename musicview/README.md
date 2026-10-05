# Retro Room TV

This directory contains the vanilla Vite retro-TV player.

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

The desktop and mobile backgrounds are the supplied room images.

- `public/background-desktop-16x9.jpg` — 1920×1080.
- `public/background-mobile-9x19_5.jpg` — 1080×2340.

The runtime resolves assets in both modes: Vite builds use Vite's base URL, while direct static GitHub Pages loading uses the `public/` directory.

## Playlists

Playlists are Markdown files.

The default playlist is:

`public/playlist.md`

Additional playlists live under:

`public/playlists/`

The manifest at `public/playlists/manifest.json` controls the playlist switcher. To add another playlist, add a Markdown file and one manifest entry.

Supported Markdown formats:

```md
# Playlist title

- [Video title](https://www.youtube.com/watch?v=VIDEO_ID)
- [Another video](https://youtu.be/VIDEO_ID)
- VIDEO_ID
```

## Player features

The player keeps YouTube as the playback engine while the app owns the playlist experience:

- playlist thumbnails and active-video state
- previous/next controls
- automatic advance on video end
- resume position stored locally in the browser
- add-to-queue and remove-from-queue
- clear queue
- playlist switching
- multiple Markdown playlists
- responsive desktop/mobile TV geometry

Resume positions and the queue use browser-local storage only; they are not written back to the Markdown files.

## Deployment

The app can be served directly at `/musicview/` from the normal GitHub Pages source. It does not require a separate GitHub Actions deployment workflow for this directory.
