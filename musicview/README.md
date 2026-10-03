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

- The YouTube player uses a responsive 1:1 CRT-screen-shaped viewport to preserve the compact retro-TV feel.
- The living-room background stays fixed while the page can scroll on smaller screens.
- Desktop keeps the playlist beside the television; mobile moves it below the television so it does not cover the player or its controls.
- The player is always a real YouTube iframe, so its native controls remain YouTube controls.


### Layout notes

- The YouTube player is embedded directly inside the TV screen opening in the supplied artwork.
- The background artwork remains fixed while the page scrolls.
- The queue never sits over the TV; it moves below the TV on smaller screens.
- The bezel branding is XYZZ.
