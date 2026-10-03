# Retro Music TV — Vite Handoff

## Project Overview

Build a retro music-video player using Vite and vanilla JavaScript.

The application should display YouTube music videos inside an old-school CRT television interface. The playlist should be controlled through a Markdown file so that adding or changing videos only requires editing `public/playlist.md`.

## Technology

- Vite
- Vanilla JavaScript
- HTML
- CSS
- YouTube iframe embeds
- Markdown playlist source

No React, Vue, backend, database, or authentication is required for the initial version.

## Create the Project

```bash
npm create vite@latest retro-music-tv -- --template vanilla
cd retro-music-tv
npm install
```

## Project Structure

```text
retro-music-tv/
├── HANDOFF.md
├── index.html
├── package.json
├── public/
│   └── playlist.md
└── src/
    ├── main.js
    └── style.css
```

---

# Required Features

## TV Player

The page should include:

- Retro CRT television frame
- Rounded screen
- Scanline overlay
- Screen glow
- Dark vignette
- `ON AIR` badge
- Current video title overlay
- YouTube iframe player
- Decorative TV knobs and speaker grille

## Playlist

The playlist should:

- Load from `/playlist.md`
- Parse second-level Markdown headings as video titles
- Parse YouTube links below each heading
- Render one button per video
- Change the YouTube player when a button is selected
- Highlight the active video
- Include a refresh button
- Automatically load the first video without autoplay

## Supported YouTube Formats

The parser should support:

```text
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
```

Videos must allow embedding on external websites.

---

# File: `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#171126" />
    <title>Retro Music TV</title>
  </head>

  <body>
    <main class="page">
      <div class="brand">RETRO MUSIC TV</div>

      <section class="tv">
        <div class="screen-shell">
          <div class="screen">
            <iframe
              id="player"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0"
              title="Retro music video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>

            <div class="live-badge">ON AIR</div>

            <div class="now-playing" id="nowPlaying">
              Now playing: Retro Music Channel
            </div>
          </div>
        </div>

        <div class="tv-controls">
          <div class="control-knob"></div>

          <div class="speaker">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
          </div>

          <div class="control-knob"></div>
        </div>
      </section>

      <section class="playlist-section">
        <div class="playlist-heading">
          <h2>Now Playing Queue</h2>
          <button id="refreshPlaylist">Refresh Playlist</button>
        </div>

        <div id="playlist" class="playlist">
          Loading playlist…
        </div>
      </section>
    </main>

    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

---

# File: `src/main.js`

```js
import "./style.css";

const player = document.querySelector("#player");
const nowPlaying = document.querySelector("#nowPlaying");
const playlistElement = document.querySelector("#playlist");
const refreshButton = document.querySelector("#refreshPlaylist");

function extractYouTubeId(value) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0];
    }

    if (url.pathname.includes("/embed/")) {
      return url.pathname.split("/embed/")[1].split("/")[0];
    }

    return url.searchParams.get("v");
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
      return value;
    }

    return null;
  }
}

function changeVideo(videoId, title, autoplay = true) {
  const autoplayValue = autoplay ? 1 : 0;

  player.src =
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` +
    `?autoplay=${autoplayValue}&rel=0`;

  nowPlaying.textContent = `Now playing: ${title}`;

  document.querySelectorAll(".playlist-button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.videoId === videoId
    );
  });
}

function parsePlaylist(markdown) {
  const lines = markdown.split(/\r?\n/);
  const videos = [];

  for (let index = 0; index < lines.length; index++) {
    const headingMatch = lines[index].match(/^##\s+(.+)$/);

    if (!headingMatch) {
      continue;
    }

    const title = headingMatch[1].trim();
    let videoUrl = null;

    for (let next = index + 1; next < lines.length; next++) {
      if (/^##\s+/.test(lines[next])) {
        break;
      }

      const linkMatch = lines[next].match(
        /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/
      );

      if (linkMatch) {
        videoUrl = linkMatch[1];
        break;
      }
    }

    const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

    if (videoId) {
      videos.push({
        title,
        videoId
      });
    }
  }

  return videos;
}

function renderPlaylist(videos) {
  playlistElement.innerHTML = "";

  if (videos.length === 0) {
    playlistElement.textContent = "No playable videos found.";
    return;
  }

  videos.forEach((video, index) => {
    const button = document.createElement("button");

    button.className = "playlist-button";
    button.dataset.videoId = video.videoId;

    const number = String(index + 1).padStart(2, "0");

    button.innerHTML = `
      <span class="track-number">${number}</span>
      <span>${video.title}</span>
    `;

    button.addEventListener("click", () => {
      changeVideo(video.videoId, video.title, true);
    });

    playlistElement.appendChild(button);
  });

  changeVideo(videos[0].videoId, videos[0].title, false);
}

async function loadPlaylist() {
  playlistElement.textContent = "Loading playlist…";

  try {
    const response = await fetch(`/playlist.md?cacheBust=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`Playlist request failed: ${response.status}`);
    }

    const markdown = await response.text();
    const videos = parsePlaylist(markdown);

    renderPlaylist(videos);
  } catch (error) {
    console.error(error);

    playlistElement.textContent =
      "Could not load playlist.md. Check the browser console.";
  }
}

refreshButton.addEventListener("click", loadPlaylist);

loadPlaylist();
```

---

# File: `src/style.css`

```css
:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #ffffff;
  background: #08070d;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  padding: 32px 16px;
  background:
    radial-gradient(circle at center, #3b2461 0%, #171126 45%, #08070d 100%);
}

button {
  font: inherit;
}

.page {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.brand {
  margin: 0 auto 28px;
  color: #ffef87;
  font-size: clamp(2rem, 7vw, 5rem);
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.09em;
  line-height: 0.9;
  text-align: center;
  text-shadow:
    4px 4px 0 #f03d91,
    8px 8px 0 #26d9d0;
  transform: rotate(-3deg);
}

.tv {
  padding: clamp(18px, 4vw, 44px);
  border: 12px solid #201713;
  border-radius: 48px;
  background:
    linear-gradient(145deg, #79503b, #4a2f22 50%, #2f1e17);
  box-shadow:
    inset 0 0 0 5px #a16e50,
    inset 0 0 35px rgb(0 0 0 / 65%),
    0 25px 70px rgb(0 0 0 / 65%);
}

.screen-shell {
  padding: 2%;
  border-radius: 34px;
  background: #0b0908;
  box-shadow:
    inset 0 0 0 5px #33231d,
    0 4px 10px rgb(0 0 0 / 50%);
}

.screen {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  background: #050505;
  box-shadow:
    inset 0 0 32px rgb(0 0 0 / 90%),
    0 0 28px rgb(41 255 225 / 20%);
}

.screen::after {
  position: absolute;
  z-index: 4;
  inset: 0;
  pointer-events: none;
  content: "";
  background:
    repeating-linear-gradient(
      to bottom,
      rgb(255 255 255 / 6%) 0,
      rgb(255 255 255 / 6%) 1px,
      rgb(0 0 0 / 8%) 2px,
      transparent 4px
    ),
    radial-gradient(
      ellipse at center,
      transparent 45%,
      rgb(0 0 0 / 45%) 100%
    );
  mix-blend-mode: screen;
}

iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.live-badge {
  position: absolute;
  top: 7%;
  right: 4%;
  z-index: 5;
  padding: 6px 10px;
  border-radius: 4px;
  color: white;
  background: #e92745;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  animation: blink 1.4s steps(2, start) infinite;
}

@keyframes blink {
  50% {
    opacity: 0.35;
  }
}

.now-playing {
  position: absolute;
  bottom: 7%;
  left: 4%;
  z-index: 5;
  max-width: 85%;
  padding: 10px 15px;
  border-left: 5px solid #ffef35;
  color: white;
  background: rgb(0 0 0 / 72%);
  font-size: clamp(0.75rem, 2vw, 1.1rem);
  font-weight: bold;
  text-shadow: 2px 2px #000;
}

.tv-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 20px;
}

.control-knob {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border: 6px solid #251712;
  border-radius: 50%;
  background: repeating-conic-gradient(
    #9b6b4c 0deg 15deg,
    #704631 15deg 30deg
  );
  box-shadow:
    inset 0 0 0 5px #bc835c,
    3px 3px 0 #1d100c;
}

.speaker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  width: 180px;
}

.speaker span {
  height: 5px;
  border-radius: 10px;
  background: #1d120e;
  box-shadow: 0 1px 0 #8a5a40;
}

.playlist-section {
  margin-top: 28px;
  padding: 22px;
  border: 2px solid rgb(255 255 255 / 12%);
  border-radius: 14px;
  background: rgb(0 0 0 / 25%);
}

.playlist-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.playlist-heading h2 {
  margin: 0;
  color: #ffef87;
  font-size: 1.15rem;
}

.playlist-heading button {
  padding: 8px 12px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  color: #171126;
  background: #26d9d0;
  font-size: 0.8rem;
  font-weight: bold;
}

.playlist {
  display: grid;
  gap: 8px;
}

.playlist-button {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 15px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: white;
  background: #332055;
  text-align: left;
  transition: 0.15s ease;
}

.playlist-button:hover,
.playlist-button.active {
  border-color: #ffef35;
  background: #592c92;
  transform: translateX(4px);
}

.track-number {
  color: #ffef35;
  font-family: monospace;
  font-weight: bold;
}

@media (max-width: 600px) {
  body {
    padding: 22px 10px;
  }

  .tv-controls {
    display: none;
  }

  .playlist-section {
    padding: 15px;
  }

  .playlist-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
```

---

# File: `public/playlist.md`

Use one second-level heading per video. Put a YouTube link below each heading.

```md
# Retro Music TV

## Billie Jean — Michael Jackson

[Watch video](https://www.youtube.com/watch?v=Zi_XLOBDo_Y)

## Bohemian Rhapsody — Queen

[Watch video](https://www.youtube.com/watch?v=fJ9rUzIMcZQ)

## Never Gonna Give You Up — Rick Astley

[Watch video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
```

## Adding a Video

Add another section to `public/playlist.md`:

```md
## Song Title — Artist Name

[Watch video](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
```

Then click **Refresh Playlist** in the application.

---

# Run the Application

Start the development server:

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173
```

Do not open `index.html` directly with a `file://` URL because the browser may block loading `playlist.md`.

---

# Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The deployable files will be placed in:

```text
dist/
```

---

# Deployment Notes

The project can be deployed to any static hosting provider that supports Vite builds.

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

The `playlist.md` file is copied into the production build and can be found at:

```text
/playlist.md
```

If the playlist is changed after deployment, the site needs to be rebuilt and redeployed unless the Markdown file is hosted separately.

---

# Future Enhancements

Possible future features:

- Automatic video progression
- Multiple channels
- Channel schedules
- Video thumbnails
- Keyboard controls
- Volume and mute controls
- Fullscreen TV mode
- Animated station IDs
- VCR-style controls
- Playlist categories
- External Markdown or CMS source
- Remote playlist editor
- Local storage for the current channel
- YouTube IFrame API integration
- Optional background audio visualizer

---

# Acceptance Criteria

The implementation is complete when:

- `npm run dev` launches successfully
- The retro television appears in the browser
- The YouTube iframe displays a video
- `public/playlist.md` loads successfully
- Each Markdown video becomes a playlist button
- Clicking a playlist item changes the video
- The current title updates
- The active playlist item is highlighted
- The refresh button reloads the Markdown file
- `npm run build` completes without errors
````_
