const hasViteBase = Boolean(import.meta.env?.BASE_URL);
const assetUrl = (name) => hasViteBase
  ? `${import.meta.env.BASE_URL}${name}`
  : new URL(name, document.baseURI).href;
const imageUrl = (name) => hasViteBase
  ? `${import.meta.env.BASE_URL}${name}`
  : new URL(`public/${name}`, document.baseURI).href;

// These two background assets are derived only from the supplied source photo.
// Desktop: exact-photo crop to 1920×1080.
// Mobile: exact source photo centered inside a 1080×2340 portrait canvas; the
// remaining top/bottom space is a blurred copy of that same source image.
//
// Coordinates are measured in each background asset's own pixels.
const SCENES = {
  desktop: {
    width: 1920,
    height: 1080,
    url: imageUrl('background-desktop-16x9.jpg'),
    tv: { left: 793.19, top: 60.00, width: 973.64, height: 590.63 }
  },
  mobile: {
    width: 1080,
    height: 2340,
    url: imageUrl('background-mobile-9x19_5.jpg'),
    tv: { left: 100, top: 503, width: 910, height: 570 }
  }
};

const room = document.querySelector('#room');
const tv = document.querySelector('#tv');
const screen = document.querySelector('#screen');
const playerHost = document.querySelector('#player');
const playlistToggle = document.querySelector('#playlist-toggle');
const playlistPanel = document.querySelector('#playlist-panel');
const playlistItems = document.querySelector('#playlist-items');
const playlistTitle = document.querySelector('#playlist-title');
const playlistCount = document.querySelector('#playlist-count');
const status = document.querySelector('#status');

let player = null;
let youtubeReady = false;
let playlist = [];
let currentIndex = 0;
let playlistOpen = false;

function setStatus(message, visible = true) {
  status.textContent = message;
  status.classList.toggle('is-visible', visible && Boolean(message));
}

function parseVideoId(value) {
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  if (!input) return null;

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
    }

    if (host === 'youtube.com' || host === 'www.youtube.com' || host.endsWith('.youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const path = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      return path ? path[1] : null;
    }
  } catch {
    return null;
  }

  return null;
}

function parsePlaylist(markdown) {
  let title = 'Playlist';
  const items = [];
  let inComment = false;

  for (const sourceLine of markdown.split(/\r?\n/)) {
    let line = sourceLine.trim();
    if (!line) continue;

    if (line.includes('<!--')) inComment = true;
    if (inComment) {
      if (line.includes('-->')) inComment = false;
      continue;
    }

    const heading = line.match(/^#\s+(.+)$/);
    if (heading) {
      title = heading[1].trim();
      continue;
    }

    line = line.replace(/^[-*+]\s+/, '').trim();

    const link = line.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const id = parseVideoId(link[2]);
      if (id) items.push({ id, title: link[1].trim() });
      continue;
    }

    const id = parseVideoId(line);
    if (id) items.push({ id, title: id });
  }

  return { title, items };
}

function setPlaylistOpen(open) {
  playlistOpen = Boolean(open);
  screen.classList.toggle('playlist-open', playlistOpen);
  playlistToggle.setAttribute('aria-expanded', String(playlistOpen));
  playlistToggle.title = playlistOpen ? 'Hide playlist' : 'Show playlist';
}

function syncActive() {
  playlistItems.querySelectorAll('.playlist-item').forEach((button, index) => {
    const active = index === currentIndex;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

function selectVideo(index) {
  if (!playlist[index]) return;
  currentIndex = index;
  syncActive();
  setPlaylistOpen(false);

  if (player?.loadVideoById) {
    player.loadVideoById(playlist[index].id);
  }
}

function renderPlaylist(title) {
  playlistTitle.textContent = title;
  playlistCount.textContent = `${playlist.length} ${playlist.length === 1 ? 'video' : 'videos'}`;
  playlistItems.replaceChildren();

  playlist.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'playlist-item';
    button.setAttribute('aria-label', `Play ${item.title}`);

    const thumbnail = document.createElement('img');
    thumbnail.src = `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';

    const titleNode = document.createElement('span');
    titleNode.className = 'playlist-item-title';
    titleNode.textContent = item.title;

    button.append(thumbnail, titleNode);
    button.addEventListener('click', () => selectVideo(index));
    playlistItems.append(button);
  });

  syncActive();
}

function ensureYoutubeApi() {
  if (window.YT?.Player) {
    handleYoutubeReady();
    return;
  }

  window.onYouTubeIframeAPIReady = handleYoutubeReady;
  if (document.querySelector('script[data-youtube-iframe-api]')) return;

  const script = document.createElement('script');
  script.dataset.youtubeIframeApi = 'true';
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  script.onerror = () => setStatus('YouTube could not load. Check your internet connection.');
  document.head.append(script);
}

function handleYoutubeReady() {
  if (youtubeReady || !playlist.length) return;
  youtubeReady = true;

  player = new window.YT.Player(playerHost, {
    width: '100%',
    height: '100%',
    videoId: playlist[0].id,
    playerVars: {
      autoplay: 0,
      controls: 1,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      origin: window.location.origin
    },
    events: {
      onReady: () => setStatus('', false),
      onStateChange: (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) setStatus('', false);
        if (event.data === window.YT.PlayerState.ENDED && playlist.length > 1) {
          selectVideo((currentIndex + 1) % playlist.length);
        }
      },
      onError: () => setStatus('This YouTube video cannot be embedded.')
    }
  });
}

async function loadPlaylist() {
  try {
    const playlistUrl = assetUrl(`playlist.md?v=${Date.now()}`);
    const response = await fetch(playlistUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { title, items } = parsePlaylist(await response.text());
    playlist = items;
    renderPlaylist(title);

    if (!playlist.length) {
      setStatus('Add at least one YouTube link to playlist.md.');
      return;
    }

    ensureYoutubeApi();
  } catch (error) {
    console.error(error);
    setStatus('Could not load playlist.md.');
  }
}

function getScene(viewportWidth, viewportHeight) {
  return viewportWidth <= 700 && viewportHeight > viewportWidth
    ? SCENES.mobile
    : SCENES.desktop;
}

function updateSceneGeometry() {
  const viewportWidth = Math.max(1, Math.round(window.visualViewport?.width || document.documentElement.clientWidth));
  const viewportHeight = Math.max(1, Math.round(window.visualViewport?.height || document.documentElement.clientHeight));
  const scene = getScene(viewportWidth, viewportHeight);

  if (room.dataset.scene !== scene.url) {
    room.dataset.scene = scene.url;
    room.src = scene.url;
  }

  const scale = Math.max(viewportWidth / scene.width, viewportHeight / scene.height);
  const renderedWidth = scene.width * scale;
  const renderedHeight = scene.height * scale;

  // Keep the full mobile TV screen visible on narrow portrait devices.
  // The mobile asset was composed so the player screen is centered in the 1080px canvas.
  const positionX = 0.50;
  const positionY = 0.50;

  const imageLeft = (viewportWidth - renderedWidth) * positionX;
  const imageTop = (viewportHeight - renderedHeight) * positionY;

  room.style.left = `${imageLeft}px`;
  room.style.top = `${imageTop}px`;
  room.style.width = `${renderedWidth}px`;
  room.style.height = `${renderedHeight}px`;
  room.style.objectFit = 'fill';
  room.style.objectPosition = '50% 50%';

  tv.style.left = `${imageLeft + scene.tv.left * scale}px`;
  tv.style.top = `${imageTop + scene.tv.top * scale}px`;
  tv.style.width = `${scene.tv.width * scale}px`;
  tv.style.height = `${scene.tv.height * scale}px`;

  screen.style.borderRadius = `${Math.max(2, 5 * scale)}px`;
}

playlistToggle.addEventListener('click', () => setPlaylistOpen(!playlistOpen));

screen.addEventListener('pointerenter', (event) => {
  if (event.pointerType === 'mouse' || window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    setPlaylistOpen(true);
  }
});

screen.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse' || window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    setPlaylistOpen(false);
  }
});

window.addEventListener('resize', updateSceneGeometry, { passive: true });
window.addEventListener('orientationchange', updateSceneGeometry, { passive: true });
window.visualViewport?.addEventListener('resize', updateSceneGeometry, { passive: true });
room.addEventListener('load', updateSceneGeometry, { once: true });

updateSceneGeometry();
loadPlaylist();
