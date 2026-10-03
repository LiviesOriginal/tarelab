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

## Playlist

Edit `public/playlist.md`, then use **Queue → refresh** in the app. The parser accepts:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

The first video loads without autoplay. Selecting a playlist item loads it with autoplay.

## Responsive behavior

- Desktop uses a responsive 16:9 YouTube iframe positioned over the television screen in the supplied living-room scene.
- Mobile keeps the living-room background visible and opens the playlist as an overlay on top of the television/player.
- The player is always a real YouTube iframe, so its native controls remain YouTube controls.
