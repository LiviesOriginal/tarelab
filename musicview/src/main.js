import "./style.css";

const player = document.querySelector("#player");
const nowPlaying = document.querySelector("#nowPlaying");
const playlistElement = document.querySelector("#playlist");
const refreshButton = document.querySelector("#refreshPlaylist");
const playlistPanel = document.querySelector("#playlistPanel");
const playlistToggle = document.querySelector("#playlistToggle");
const closePlaylist = document.querySelector("#closePlaylist");
const scene = document.querySelector("#scene");
const photoOverlays = document.querySelector("#photoOverlays");
const decorToggle = document.querySelector("#decorToggle");
const decorPanel = document.querySelector("#decorPanel");
const themeSelect = document.querySelector("#themeSelect");

let sceneConfig = null;

function extractYouTubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (url.pathname.includes("/embed/")) return url.pathname.split("/embed/")[1].split("/")[0] || null;
    return url.searchParams.get("v");
  } catch {
    return /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : null;
  }
}

function changeVideo(videoId, title, autoplay = true) {
  player.src =
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` +
    `?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`;

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

      const linkMatch = lines[next].match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
      if (linkMatch) {
        videoUrl = linkMatch[1];
        break;
      }

      const rawUrlMatch = lines[next].match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)<>]+)/);
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

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
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
    button.innerHTML = `
      <span class="track-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="track-title">${escapeHtml(video.title)}</span>
      <span class="track-arrow" aria-hidden="true">▶</span>
    `;

    button.addEventListener("click", () => {
      changeVideo(video.videoId, video.title, true);
      setPlaylistOpen(false);
    });
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

function setPlaylistOpen(open) {
  playlistPanel.classList.toggle("is-open", open);
  playlistPanel.setAttribute("aria-hidden", String(!open));
  playlistToggle.setAttribute("aria-expanded", String(open));
}

function setDecorOpen(open) {
  decorPanel.classList.toggle("is-open", open);
  decorPanel.setAttribute("aria-hidden", String(!open));
  decorToggle.setAttribute("aria-expanded", String(open));
}

async function imageExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function applyTheme(themeName) {
  if (!sceneConfig?.themes?.[themeName]) return;
  const theme = sceneConfig.themes[themeName];
  const backgroundAvailable = await imageExists(theme.background);

  scene.style.setProperty("--accent", theme.accent);
  scene.style.setProperty("--accent-2", theme.accent2);
  scene.style.setProperty("--theme-candle", theme.candle);
  scene.style.setProperty("--theme-pillows", theme.pillows);
  scene.style.setProperty("--scene-background", `url("${backgroundAvailable ? theme.background : sceneConfig.themes.classic.background}")`);
  scene.dataset.theme = themeName;
  themeSelect.value = themeName;
  localStorage.setItem("retro-tv-theme", themeName);

  await renderPhotoOverlays();
}

async function renderPhotoOverlays() {
  photoOverlays.innerHTML = "";
  if (!sceneConfig?.framePhotos) return;

  const slots = [
    ["leftShelfTop", "frame-photo frame-left-shelf-top"],
    ["leftShelfBottom", "frame-photo frame-left-shelf-bottom"],
    ["consoleTopLeft", "frame-photo frame-console-left"],
    ["consoleTopCenter", "frame-photo frame-console-center"],
    ["consoleTopRight", "frame-photo frame-console-right"],
    ["rightTable", "frame-photo frame-right-table"],
  ];

  for (const [key, className] of slots) {
    const src = sceneConfig.framePhotos[key];
    if (!(await imageExists(src))) continue;
    const image = document.createElement("img");
    image.className = className;
    image.src = src;
    image.alt = "";
    photoOverlays.appendChild(image);
  }
}

async function loadSceneConfig() {
  try {
    const response = await fetch(`/scene.json?cacheBust=${Date.now()}`);
    if (!response.ok) throw new Error(`Scene config request failed: ${response.status}`);
    sceneConfig = await response.json();
    const savedTheme = localStorage.getItem("retro-tv-theme");
    const theme = savedTheme && sceneConfig.themes[savedTheme] ? savedTheme : sceneConfig.theme;
    await applyTheme(theme);
  } catch (error) {
    console.error(error);
    scene.style.setProperty("--scene-background", 'url("/retro-music-tv-bg.png")');
  }
}

playlistToggle.addEventListener("click", () => setPlaylistOpen(!playlistPanel.classList.contains("is-open")));
closePlaylist.addEventListener("click", () => setPlaylistOpen(false));
refreshButton.addEventListener("click", loadPlaylist);
decorToggle.addEventListener("click", () => setDecorOpen(!decorPanel.classList.contains("is-open")));
themeSelect.addEventListener("change", (event) => applyTheme(event.target.value));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setPlaylistOpen(false);
    setDecorOpen(false);
  }
});

loadPlaylist();
loadSceneConfig();
