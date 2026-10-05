const hasViteBase = Boolean(import.meta.env?.BASE_URL);
const assetUrl = (name) => hasViteBase
  ? `${import.meta.env.BASE_URL}${name}`
  : new URL(name, document.baseURI).href;
const imageUrl = (name) => hasViteBase
  ? `${import.meta.env.BASE_URL}${name}`
  : new URL(`public/${name}`, document.baseURI).href;
const contentUrl = (name) => hasViteBase
  ? `${import.meta.env.BASE_URL}${name}`
  : new URL(`public/${name}`, document.baseURI).href;

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
const playlistSelect = document.querySelector('#playlist-select');
const playlistPrevious = document.querySelector('#playlist-previous');
const playlistNext = document.querySelector('#playlist-next');
const nowPlayingTitle = document.querySelector('#now-playing-title');
const queueCount = document.querySelector('#queue-count');
const queueItems = document.querySelector('#queue-items');
const queueClear = document.querySelector('#queue-clear');
const status = document.querySelector('#status');

const RESUME_PREFIX = 'retro-tv:resume:';
const QUEUE_KEY = 'retro-tv:queue:v1';

let player = null;
let youtubeReady = false;
let playlist = [];
let playlists = [];
let activePlaylistId = 'main';
let currentIndex = 0;
let currentVideoId = null;
let currentVideoTitle = '';
let playlistOpen = false;
let resumeCandidateId = null;
let resumeApplied = false;
let progressTimer = null;
let queue = loadQueue();

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

function safeGetStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures; playback remains usable.
  }
}

function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

function loadQueue() {
  const raw = safeGetStorage(QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
      .slice(0, 50);
  } catch {
    return [];
  }
}

function saveQueue() {
  safeSetStorage(QUEUE_KEY, JSON.stringify(queue));
}

function resumeKey(videoId) {
  return `${RESUME_PREFIX}${videoId}`;
}

function saveCurrentPosition() {
  if (!player?.getPlayerState || !currentVideoId) return;

  try {
    const state = player.getPlayerState();
    const playing = state === window.YT.PlayerState.PLAYING;
    const paused = state === window.YT.PlayerState.PAUSED;
    if (!playing && !paused) return;

    const time = Number(player.getCurrentTime());
    const duration = Number(player.getDuration());
    if (!Number.isFinite(time) || time < 2) return;

    if (Number.isFinite(duration) && duration > 0 && time >= duration - 10) {
      safeRemoveStorage(resumeKey(currentVideoId));
      return;
    }

    safeSetStorage(resumeKey(currentVideoId), String(time));
  } catch {
    // Player may be transitioning between states.
  }
}

function clearResume(videoId) {
  safeRemoveStorage(resumeKey(videoId));
}

function getResumePosition(videoId) {
  const raw = safeGetStorage(resumeKey(videoId));
  if (raw === null) return null;

  const value = Number(raw);
  return Number.isFinite(value) && value >= 3 ? value : null;
}

function applyResumePosition() {
  if (!player?.seekTo || resumeApplied || !resumeCandidateId) return;
  if (resumeCandidateId !== currentVideoId) return;

  const position = getResumePosition(resumeCandidateId);
  resumeApplied = true;

  if (position === null) return;

  try {
    const duration = Number(player.getDuration());
    const safePosition = Number.isFinite(duration) && duration > 0
      ? Math.min(position, Math.max(0, duration - 10))
      : position;

    if (safePosition >= 3) {
      player.seekTo(safePosition, true);
      setStatus(`Resumed at ${formatTime(safePosition)}`);
      window.setTimeout(() => setStatus('', false), 1400);
    }
  } catch {
    // A later PLAYING event will retry through the state handler.
    resumeApplied = false;
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remaining = String(total % 60).padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function setPlaylistOpen(open) {
  playlistOpen = Boolean(open);
  screen.classList.toggle('playlist-open', playlistOpen);
  playlistToggle.setAttribute('aria-expanded', String(playlistOpen));
  playlistToggle.title = playlistOpen ? 'Hide playlist' : 'Show playlist';
}

function queueEntryFor(item) {
  return {
    id: item.id,
    title: item.title,
    playlistId: activePlaylistId,
    playlistName: getActivePlaylistName()
  };
}

function isQueued(videoId) {
  return queue.some((item) => item.id === videoId && item.playlistId === activePlaylistId);
}

function renderQueue() {
  queueCount.textContent = queue.length ? `${queue.length}` : '';
  queueItems.replaceChildren();
  queueClear.disabled = queue.length === 0;

  if (!queue.length) {
    const empty = document.createElement('p');
    empty.className = 'queue-empty';
    empty.textContent = 'Queue is empty.';
    queueItems.append(empty);
    return;
  }

  queue.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'queue-row';

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'queue-row-title';
    play.textContent = item.title;
    play.title = `Play ${item.title}`;
    play.addEventListener('click', () => playQueueAt(index));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'queue-row-remove';
    remove.textContent = '×';
    remove.title = 'Remove from queue';
    remove.setAttribute('aria-label', `Remove ${item.title} from queue`);
    remove.addEventListener('click', () => {
      queue.splice(index, 1);
      saveQueue();
      renderQueue();
      renderPlaylist();
    });

    row.append(play, remove);
    queueItems.append(row);
  });
}

function addToQueue(index) {
  const item = playlist[index];
  if (!item) return;

  if (isQueued(item.id)) {
    setStatus('Already in queue.');
    window.setTimeout(() => setStatus('', false), 1200);
    return;
  }

  queue.push(queueEntryFor(item));
  saveQueue();
  renderQueue();
  renderPlaylist();
  setStatus(`Added “${item.title}” to queue.`);
  window.setTimeout(() => setStatus('', false), 1200);
}

async function playQueueAt(index) {
  const item = queue[index];
  if (!item) return;

  queue.splice(index, 1);
  saveQueue();
  renderQueue();

  try {
    if (item.playlistId !== activePlaylistId) {
      await loadPlaylistById(item.playlistId, false);
    }

    const playlistIndex = playlist.findIndex((video) => video.id === item.id);
    if (playlistIndex >= 0) {
      await selectVideo(playlistIndex, { close: false });
    } else {
      await playExternalQueueItem(item);
    }
  } catch (error) {
    console.error(error);
    setStatus('Could not play that queued video.');
  }
}

function playExternalQueueItem(item) {
  currentIndex = -1;
  currentVideoId = item.id;
  currentVideoTitle = item.title;
  resumeCandidateId = item.id;
  resumeApplied = false;
  syncActive();
  renderNowPlaying();

  if (player?.loadVideoById) {
    player.loadVideoById(item.id);
  }
}

function clearQueueList() {
  queue = [];
  saveQueue();
  renderQueue();
  renderPlaylist();
}

function getActivePlaylistName() {
  return playlists.find((item) => item.id === activePlaylistId)?.name || playlistTitle.textContent || 'Playlist';
}

function renderNowPlaying() {
  nowPlayingTitle.textContent = currentVideoTitle || 'Nothing playing';
}

function syncActive() {
  playlistItems.querySelectorAll('.playlist-item').forEach((button, index) => {
    const active = index === currentIndex;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

function renderPlaylist() {
  playlistCount.textContent = `${playlist.length} ${playlist.length === 1 ? 'video' : 'videos'}`;
  playlistItems.replaceChildren();

  playlist.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'playlist-row';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'playlist-item';
    button.setAttribute('aria-label', `Play ${item.title}`);

    const thumbnail = document.createElement('img');
    thumbnail.src = `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';

    const textWrap = document.createElement('span');
    textWrap.className = 'playlist-item-copy';

    const titleNode = document.createElement('span');
    titleNode.className = 'playlist-item-title';
    titleNode.textContent = item.title;

    const meta = document.createElement('span');
    meta.className = 'playlist-item-meta';
    meta.textContent = index === currentIndex ? 'Now playing' : (isQueued(item.id) ? 'Queued' : '');

    textWrap.append(titleNode, meta);
    button.append(thumbnail, textWrap);

    button.addEventListener('click', () => selectVideo(index));

    const queueButton = document.createElement('button');
    queueButton.type = 'button';
    queueButton.className = 'queue-add';
    queueButton.textContent = isQueued(item.id) ? '✓' : '+';
    queueButton.title = isQueued(item.id) ? 'Already queued' : 'Add to queue';
    queueButton.setAttribute('aria-label', isQueued(item.id)
      ? `${item.title} is already queued`
      : `Add ${item.title} to queue`);
    queueButton.disabled = isQueued(item.id);
    queueButton.addEventListener('click', (event) => {
      event.stopPropagation();
      addToQueue(index);
    });

    row.append(button, queueButton);
    playlistItems.append(row);
  });

  syncActive();
}

async function selectVideo(index, { close = true } = {}) {
  if (!playlist[index]) return;

  currentIndex = index;
  currentVideoId = playlist[index].id;
  currentVideoTitle = playlist[index].title;
  resumeCandidateId = currentVideoId;
  resumeApplied = false;

  syncActive();
  renderPlaylist();
  renderNowPlaying();

  if (close) setPlaylistOpen(false);

  if (player?.loadVideoById) {
    player.loadVideoById(currentVideoId);
  }
}

function previousVideo() {
  if (!playlist.length) return;
  const nextIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
  selectVideo(nextIndex, { close: false });
}

function nextVideo() {
  if (queue.length) {
    playQueueAt(0);
    return;
  }

  if (!playlist.length) return;
  const nextIndex = currentIndex < 0
    ? 0
    : (currentIndex + 1) % playlist.length;
  selectVideo(nextIndex, { close: false });
}

function renderPlaylistSelector() {
  playlistSelect.replaceChildren();

  playlists.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    playlistSelect.append(option);
  });

  playlistSelect.value = activePlaylistId;
  playlistSelect.hidden = playlists.length < 2;
}

async function loadPlaylistById(id, loadFirstVideo = true) {
  const definition = playlists.find((item) => item.id === id);
  if (!definition) throw new Error(`Unknown playlist: ${id}`);

  const response = await fetch(contentUrl(definition.file), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Playlist HTTP ${response.status}`);

  const parsed = parsePlaylist(await response.text());
  activePlaylistId = definition.id;
  playlist = parsed.items;
  currentIndex = playlist.length ? 0 : -1;
  playlistTitle.textContent = parsed.title || definition.name;
  renderPlaylistSelector();
  renderPlaylist();
  renderQueue();

  if (!playlist.length) {
    currentVideoId = null;
    currentVideoTitle = '';
    renderNowPlaying();
    setStatus('This playlist has no playable YouTube videos.');
    return;
  }

  if (!currentVideoId || !playlist.some((item) => item.id === currentVideoId)) {
    currentVideoId = playlist[0].id;
    currentVideoTitle = playlist[0].title;
    resumeCandidateId = currentVideoId;
    resumeApplied = false;
  }

  if (loadFirstVideo && player?.loadVideoById) {
    await selectVideo(0, { close: false });
  } else {
    renderNowPlaying();
  }
}

async function loadPlaylistLibrary() {
  const fallback = [{ id: 'main', name: 'My YouTube Playlist', file: 'playlist.md' }];

  try {
    const response = await fetch(contentUrl('playlists/manifest.json'), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);

    const manifest = await response.json();
    if (!Array.isArray(manifest) || !manifest.length) throw new Error('Empty playlist manifest');

    playlists = manifest
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.file === 'string')
      .slice(0, 25);
  } catch {
    playlists = fallback;
  }

  renderPlaylistSelector();
  await loadPlaylistById(playlists[0].id);
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

  currentVideoId = playlist[0].id;
  currentVideoTitle = playlist[0].title;
  resumeCandidateId = currentVideoId;
  resumeApplied = false;
  renderNowPlaying();

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
      onReady: () => {
        setStatus('', false);
        if (!progressTimer) {
          progressTimer = window.setInterval(saveCurrentPosition, 2000);
        }
      },
      onStateChange: (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
          setStatus('', false);
          applyResumePosition();
        }

        if (event.data === window.YT.PlayerState.PAUSED) {
          saveCurrentPosition();
        }

        if (event.data === window.YT.PlayerState.ENDED) {
          clearResume(currentVideoId);
          nextVideo();
        }
      },
      onError: () => setStatus('This YouTube video cannot be embedded.')
    }
  });
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
playlistPrevious.addEventListener('click', previousVideo);
playlistNext.addEventListener('click', nextVideo);
queueClear.addEventListener('click', clearQueueList);

playlistSelect.addEventListener('change', async () => {
  try {
    await loadPlaylistById(playlistSelect.value);
  } catch (error) {
    console.error(error);
    setStatus('Could not load that playlist.');
  }
});

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
window.addEventListener('pagehide', saveCurrentPosition, { passive: true });
room.addEventListener('load', updateSceneGeometry, { once: true });

renderQueue();
updateSceneGeometry();
loadPlaylistLibrary().then(() => {
  ensureYoutubeApi();
}).catch((error) => {
  console.error(error);
  setStatus('Could not load the playlist library.');
});
