import "./style.css";

const player = document.querySelector("#player");
const nowPlaying = document.querySelector("#nowPlaying");
const playlistElement = document.querySelector("#playlist");
const refreshButton = document.querySelector("#refreshPlaylist");

function extractYouTubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (url.pathname.includes("/embed/")) return url.pathname.split("/embed/")[1].split("/")[0];
    return url.searchParams.get("v");
  } catch {
    return /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : null;
  }
}

function changeVideo(videoId, title, autoplay = true) {
  const autoplayValue = autoplay ? 1 : 0;
  player.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=${autoplayValue}&rel=0`;
  nowPlaying.textContent = `Now playing: ${title}`;
  document.querySelectorAll(".playlist-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.videoId === videoId);
  });
}

function parsePlaylist(markdown) {
  const lines = markdown.split(/\r?\n/);
  const videos = [];

  for (let index = 0; index < lines.length; index += 1) {
    const headingMatch = lines[index].match(/^##\s+(.+)$/);
    if (!headingMatch) continue;

    const title = headingMatch[1].trim();
    let videoUrl = null;

    for (let next = index + 1; next < lines.length; next += 1) {
      if (/^##\s+/.test(lines[next])) break;
      const linkMatch = lines[next].match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
      if (linkMatch) {
        videoUrl = linkMatch[1];
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
  if (videos.length === 0) {
    playlistElement.textContent = "No playable videos found.";
    return;
  }

  videos.forEach((video, index) => {
    const button = document.createElement("button");
    button.className = "playlist-button";
    button.dataset.videoId = video.videoId;
    button.type = "button";

    const number = String(index + 1).padStart(2, "0");
    const trackNumber = document.createElement("span");
    trackNumber.className = "track-number";
    trackNumber.textContent = number;
    const title = document.createElement("span");
    title.textContent = video.title;
    button.append(trackNumber, title);

    button.addEventListener("click", () => changeVideo(video.videoId, video.title, true));
    playlistElement.appendChild(button);
  });

  changeVideo(videos[0].videoId, videos[0].title, false);
}

async function loadPlaylist() {
  playlistElement.textContent = "Loading playlist…";
  try {
    const response = await fetch(`/playlist.md?cacheBust=${Date.now()}`);
    if (!response.ok) throw new Error(`Playlist request failed: ${response.status}`);
    renderPlaylist(parsePlaylist(await response.text()));
  } catch (error) {
    console.error(error);
    playlistElement.textContent = "Could not load playlist.md. Check the browser console.";
  }
}

refreshButton.addEventListener("click", loadPlaylist);
loadPlaylist();
