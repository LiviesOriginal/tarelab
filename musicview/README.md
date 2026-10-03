# Retro Music TV

Vite + vanilla JavaScript retro music-video player built around the supplied living-room scene.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Responsive scene

- The living-room scene is fixed to the viewport: it fills the available screen and the document never scrolls.
- The square source artwork scales to the larger of viewport width/height, preserving the scene composition while allowing natural edge cropping on very wide or very tall screens.
- The YouTube player remains a real responsive 16:9 iframe positioned over the television.
- The queue is hidden by default so it never sits on top of the player while watching.
- Press **Queue** to open it; selecting a video closes it automatically. `Esc` also closes open panels.

## Playlist

Edit `public/playlist.md`, then use **Queue → refresh** in the app. The parser accepts:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

The first video loads without autoplay. Selecting a playlist item loads it with autoplay.

## Seasonal decor

The scene is now data-driven through `public/scene.json`.

Change the default season with:

```json
"theme": "fall"
```

Available themes are `classic`, `fall`, and `holiday`. The **Decor** button also lets you switch themes in the browser; the selection is remembered locally.

### Seasonal backgrounds

Optional full-scene artwork lives in `public/seasonal/`:

- `fall.jpg`
- `holiday.jpg`

Use the same 1:1 composition as the classic background and keep the television in roughly the same location so the iframe remains aligned. If a seasonal file is absent, the classic background is used automatically.

This is the easiest way to change candles, throw pillows, table styling, plants, and other baked-in room details as a group.

### Frame photos

Optional replacement frame photos are configured in `public/scene.json` under `framePhotos` and live in `public/frames/`. If a file is missing, the original photo in the background remains visible. This means you can change only the photos without rebuilding the rest of the scene artwork.

Recommended workflow:

1. Add a new JPG/WEBP to `public/frames/`.
2. Point the matching `framePhotos` entry at it.
3. Refresh the app.

## TV branding

The baked-in television logo is covered by an HTML `XYZZ` badge so the brand can be changed without editing the source artwork.

## Background composition

The supplied background has been lightly reframed to reduce the amount of foreground while retaining the coffee table, couch, pillows, shelves, framed photos, and other Easter-egg details.
