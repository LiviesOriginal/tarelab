import "./style.css";

const player = document.querySelector("#player");
const nowPlaying = document.querySelector("#nowPlaying");
const playlistElement = document.querySelector("#playlist");
const refreshButton = document.querySelector("#refreshPlaylist");
const playlistPanel = document.querySelector("#playlistPanel");
const playlistToggle = document.querySelector("#playlistToggle");

function extractYouTubeId(value) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (url.pathname.includes("/embed/")) {
      return url.pathname.split("/embed/")[1].split("/")[0] || null;
    }

    return url.searchParams.get("v");
  } catch {
    return /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : null;
  }
}

function changeVideo(videoId, title, autoplay = true) {
  const autoplayValue = autoplay ? 1 : 0;

  player.src =
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` +
    `?autoplay=${autoplayValue}&rel=0&modestbranding=1`;

  nowPlaying.textContent = `Now playing: ${title}`;

  document.querySelectorAll(".playlist-button").forEach((button) => {
    const active = button.dataset.videoId === videoId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "true" : "false");
  });
}

function parsePlaylist(markdown) {
  const lines = markdown.split(/\r?\n/);
  const videos = [];

  for (let index = 0; index < lines.length; index += 1) {
    const headingMatch = lines[index].match(/^##\s+(.+?)\s*$/);
    if (!headingMatch) continue;

    const title = headingMatch[1].trim();
    let videoUrl = null;

    for (let next = index + 1; next < lines.length; next += 1) {
      if (/^##\s+/.test(lines[next])) break;

      const linkMatch = lines[next].match(
        /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/
      );

      if (linkMatch) {
        videoUrl = linkMatch[1];
        break;
      }

      const rawUrlMatch = lines[next].match(
        /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)<>]+)/
      );

      if (rawUrlMatch) {
        videoUrl = rawUrlMatch[1];
        break;
      }
    }

    const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;
    if (videoId) videos.push({ title, videoId });
  }

  return videos;
}

function renderPlaylist(videos) {
  playlistElement.innerHTML = "";

  if (!videos.length) {
    playlistElement.textContent = "No playable videos found.";
    return;
  }

  videos.forEach((video, index) => {
    const button = document.createElement("button");
    button.className = "playlist-button";
    button.type = "button";
    button.dataset.videoId = video.videoId;
    button.setAttribute("aria-current", "false");

    const number = String(index + 1).padStart(2, "0");
    button.innerHTML = `
      <span class="track-number">${number}</span>
      <span class="track-title">${escapeHtml(video.title)}</span>
      <span class="track-arrow" aria-hidden="true">▶</span>
    `;

    button.addEventListener("click", () => {
      changeVideo(video.videoId, video.title, true);
      if (window.matchMedia("(max-width: 760px)").matches) {
        setPlaylistOpen(false);
      }
    });

    playlistElement.appendChild(button);
  });

  changeVideo(videos[0].videoId, videos[0].title, false);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function loadPlaylist() {
  playlistElement.textContent = "Loading playlist…";

  try {
    const response = await fetch(`/playlist.md?cacheBust=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Playlist request failed: ${response.status}`);
    }

    const markdown = await response.text();
    renderPlaylist(parsePlaylist(markdown));
  } catch (error) {
    console.error(error);
    playlistElement.textContent =
      "Could not load playlist.md. Check the browser console.";
  }
}

function setPlaylistOpen(open) {
  playlistPanel.classList.toggle("is-open", open);
  playlistToggle.setAttribute("aria-expanded", String(open));
}

playlistToggle.addEventListener("click", () => {
  const open = playlistPanel.classList.contains("is-open");
  setPlaylistOpen(!open);
});

refreshButton.addEventListener("click", loadPlaylist);

loadPlaylist();
