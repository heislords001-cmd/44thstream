// ============================================================
// CONFIG
// ============================================================
const API_BASE = 'https://four4thstream.onrender.com/api';
const IMG = 'https://image.tmdb.org/t/p/';

// ============================================================
// STATE
// ============================================================
let currentTab = 'movies';
let currentResults = [];
let currentDetailData = null;
let currentEpisodes = [];
let currentVideoSource = null;

// ============================================================
// DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const mainGrid = $('mainGrid');
const searchGrid = $('searchGrid');
const searchHead = $('searchHead');
const genreChips = $('genreChips');
const sectionTitle = $('sectionTitle');
const detailPage = $('detailPage');
const detailContent = $('detailContent');

// ============================================================
// HELPERS
// ============================================================
function skeletonCards(n) {
  return Array.from({ length: n }).map(() => `<div class="card skeleton"></div>`).join('');
}

function ratingColor(score) {
  if (!score) return 'var(--gold)';
  return score >= 7 ? 'var(--teal)' : score >= 5 ? 'var(--gold)' : 'var(--crimson)';
}

function movieCard(item) {
  const title = item.title || item.name || 'Unknown';
  const poster = item.poster_path ? `${IMG}w342${item.poster_path}` : null;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '—';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  return `
    <div class="card" data-id="${item.id}" data-type="${currentTab}">
      ${poster ? `<img src="${poster}" alt="${title}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--cream-dim);font-size:12px;padding:10px;text-align:center;">${title}</div>`}
      ${year ? `<div class="card-badge">${year}</div>` : ''}
      <div class="card-overlay">
        <div class="card-title">${title}</div>
        <div class="card-rating" style="color:${ratingColor(item.vote_average)}">★ ${rating}</div>
      </div>
    </div>
  `;
}

function attachCardHandlers(container) {
  container.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type || currentTab;
      openDetail(id, type);
    });
  });
}

// ============================================================
// API CALLS
// ============================================================
async function fetchFromBackend(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// LOAD FUNCTIONS
// ============================================================
async function loadMovies() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchFromBackend('/movies/popular');
    currentResults = data;
    mainGrid.innerHTML = data.map(movieCard).join('');
    attachCardHandlers(mainGrid);
    if (data.length) setHero(data[0], 'movies');
    sectionTitle.textContent = 'Trending This Week';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load movies</div></div>`;
  }
}

async function loadAnime() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchFromBackend('/anime/trending');
    currentResults = data;
    mainGrid.innerHTML = data.map(movieCard).join('');
    attachCardHandlers(mainGrid);
    if (data.length) setHero(data[0], 'anime');
    sectionTitle.textContent = 'Trending Anime';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load anime</div></div>`;
  }
}

async function loadDramas() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchFromBackend('/dramas/latest');
    currentResults = data;
    mainGrid.innerHTML = data.map(movieCard).join('');
    attachCardHandlers(mainGrid);
    if (data.length) setHero(data[0], 'dramas');
    sectionTitle.textContent = 'Latest Korean Dramas';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load dramas</div></div>`;
  }
}

function loadTab() {
  if (currentTab === 'movies') loadMovies();
  else if (currentTab === 'anime') loadAnime();
  else if (currentTab === 'dramas') loadDramas();
}

// ============================================================
// HERO
// ============================================================
function setHero(item, type) {
  const heroBg = $('heroBg');
  if (item.backdrop_path) {
    heroBg.style.backgroundImage = `url(${IMG}original${item.backdrop_path})`;
    heroBg.classList.add('show');
  }
  $('heroTitle').textContent = item.title || item.name || '44thStream';
  $('heroDesc').textContent = item.overview || 'No synopsis available.';
  $('heroEyebrow').textContent = type === 'movies' ? 'Now Showing' : type === 'anime' ? 'Trending Anime' : 'Korean Drama';
  $('heroMeta').innerHTML = `
    <div class="pill">★ ${(item.vote_average || 0).toFixed(1)}</div>
    <div class="pill">${(item.release_date || item.first_air_date || '').slice(0, 4) || '—'}</div>
  `;
  $('heroCta').onclick = () => openDetail(item.id, type);
}

// ============================================================
// DETAIL PAGE
// ============================================================
async function openDetail(id, type) {
  detailPage.style.display = 'block';
  document.querySelector('main').style.display = 'none';
  detailContent.innerHTML = '<div class="modal-loading">Loading...</div>';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    let data, episodes = [];
    if (type === 'movies') {
      data = await fetchFromBackend(`/movie/${id}`);
      episodes = [];
    } else if (type === 'anime') {
      data = await fetchFromBackend(`/anime/info?id=${id}`);
      episodes = await fetchFromBackend(`/anime/episodes?id=${id}`);
    } else if (type === 'dramas') {
      data = await fetchFromBackend(`/dramas/info?id=${id}`);
      episodes = data.episodes || [];
    }

    currentDetailData = data;
    currentEpisodes = episodes;
    renderDetail(data, episodes, type);
  } catch (e) {
    detailContent.innerHTML = `<div class="empty-state"><div class="display">Failed to load details</div></div>`;
  }
}

function renderDetail(data, episodes, type) {
  const poster = data.poster_path ? `${IMG}w500${data.poster_path}` : '';
  const backdrop = data.backdrop_path ? `${IMG}original${data.backdrop_path}` : '';
  const title = data.title || data.name || 'Unknown';
  const rating = (data.vote_average || 0).toFixed(1);
  const year = (data.release_date || data.first_air_date || '').slice(0, 4);
  const genres = (data.genres || []).map(g => g.name).join(' • ');

  let html = `
    <div class="detail-hero">
      <div class="detail-poster">
        <img src="${poster || 'https://via.placeholder.com/500x750?text=No+Poster'}" alt="${title}">
      </div>
      <div class="detail-info">
        <h1>${title}</h1>
        ${data.tagline ? `<div class="tagline">${data.tagline}</div>` : ''}
        <div class="detail-meta">
          <div class="pill">★ ${rating}</div>
          ${year ? `<div class="pill">${year}</div>` : ''}
          ${data.runtime ? `<div class="pill">${data.runtime} min</div>` : ''}
          ${genres ? `<div class="pill">${genres}</div>` : ''}
        </div>
        <div class="overview">${data.overview || 'No synopsis available.'}</div>
        <div class="detail-actions">
          ${type === 'movies' ? `<button class="btn-primary" onclick="playTrailer(${data.id})">▶ Watch Trailer</button>` : ''}
          ${episodes.length > 0 ? `<button class="btn-primary" onclick="playEpisode(0)">▶ Watch Episode 1</button>` : ''}
        </div>
      </div>
    </div>
  `;

  if (episodes.length > 0) {
    html += `
      <h3 style="margin-top: 30px;">Episodes (${episodes.length})</h3>
      <div class="episodes-grid">
        ${episodes.map((ep, i) => `
          <button class="episode-btn" data-index="${i}" onclick="playEpisode(${i})">
            ${ep.number || ep.episode_number || i + 1}
          </button>
        `).join('')}
      </div>
    `;
  }

  // Video player placeholder
  html += `<div id="videoPlayerContainer" style="margin-top: 20px;"></div>`;

  detailContent.innerHTML = html;
}

// ============================================================
// PLAY FUNCTIONS
// ============================================================
async function playEpisode(index) {
  const container = $('videoPlayerContainer');
  if (!container) return;
  const ep = currentEpisodes[index];
  if (!ep) return;

  container.innerHTML = '<div class="modal-loading">Loading episode...</div>';

  try {
    let watchData;
    if (currentTab === 'anime') {
      watchData = await fetchFromBackend(`/anime/watch?id=${ep.id}`);
    } else if (currentTab === 'dramas') {
      watchData = await fetchFromBackend(`/dramas/watch?episodeId=${ep.episodeId || ep.id}&mediaId=${currentDetailData.id}`);
    }
    const sources = watchData.sources || [];
    const source = sources.find(s => s.quality === '1080p') || sources[0];
    if (source && source.url) {
      renderVideoPlayer(source.url, ep.title || `Episode ${ep.number || index + 1}`);
    } else {
      container.innerHTML = '<div class="empty-state">No video source available.</div>';
    }
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Failed to load episode: ${e.message}</div>`;
  }
}

function renderVideoPlayer(url, title) {
  const container = $('videoPlayerContainer');
  const isHls = url.includes('.m3u8') || url.includes('m3u8');
  const isMp4 = url.includes('.mp4');
  const playerId = 'videoPlayer_' + Date.now();

  let html = `
    <div class="video-player">
      <video id="${playerId}" controls style="width:100%;max-height:500px;" playsinline></video>
    </div>
    <div style="display:flex;gap:12px;margin-top:10px;">
      <button class="btn-primary" onclick="downloadVideo('${url}', '${title}')">⬇️ Download</button>
    </div>
  `;
  container.innerHTML = html;

  const video = document.getElementById(playerId);
  if (isHls) {
    if (Hls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
  } else {
    video.src = url;
  }
}

function downloadVideo(url, title) {
  // If it's an HLS stream, we can't download directly — show a message
  if (url.includes('.m3u8') || url.includes('m3u8')) {
    alert('This is a stream (HLS). Download is not available for this format. Use an external tool like yt-dlp.');
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'video'}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function playTrailer(id) {
  try {
    const data = await fetchFromBackend(`/movie/${id}`);
    const trailer = (data.videos?.results || []).find(v => v.type === 'Trailer');
    if (trailer) {
      openModal(`https://www.youtube.com/embed/${trailer.key}`, 'Trailer');
    } else {
      alert('No trailer available for this movie.');
    }
  } catch (e) {
    alert('Failed to load trailer.');
  }
}

// ============================================================
// MODAL (for trailer)
// ============================================================
function openModal(url, title) {
  $('modalBg').classList.add('open');
  $('modalContent').innerHTML = `
    <div style="padding:20px;">
      <h3 style="margin-bottom:10px;">${title || 'Video'}</h3>
      <iframe src="${url}" style="width:100%;height:400px;border:none;border-radius:8px;" allowfullscreen></iframe>
    </div>
  `;
}

$('modalClose').addEventListener('click', () => $('modalBg').classList.remove('open'));
$('modalBg').addEventListener('click', (e) => {
  if (e.target.id === 'modalBg') $('modalBg').classList.remove('open');
});

// ============================================================
// SEARCH
// ============================================================
let searchTimer;
$('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) {
    searchHead.style.display = 'none';
    searchGrid.innerHTML = '';
    detailPage.style.display = 'none';
    document.querySelector('main').style.display = 'block';
    loadTab();
    return;
  }
  searchHead.style.display = 'flex';
  searchGrid.innerHTML = skeletonCards(6);
  document.querySelector('main').style.display = 'block';
  detailPage.style.display = 'none';

  searchTimer = setTimeout(async () => {
    try {
      let endpoint = '';
      if (currentTab === 'movies') endpoint = `/movies/search?q=${encodeURIComponent(q)}`;
      else if (currentTab === 'anime') endpoint = `/anime/search?q=${encodeURIComponent(q)}`;
      else if (currentTab === 'dramas') endpoint = `/dramas/search?q=${encodeURIComponent(q)}`;
      const data = await fetchFromBackend(endpoint);
      searchGrid.innerHTML = data.length
        ? data.map(movieCard).join('')
        : `<div class="empty-state"><div class="display">No results</div>Try another title.</div>`;
      attachCardHandlers(searchGrid);
    } catch (e) {
      searchGrid.innerHTML = `<div class="empty-state">Search failed.</div>`;
    }
  }, 400);
});

// ============================================================
// TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    detailPage.style.display = 'none';
    document.querySelector('main').style.display = 'block';
    $('searchInput').value = '';
    searchHead.style.display = 'none';
    searchGrid.innerHTML = '';
    loadTab();
  });
});

// ============================================================
// BACK BUTTON
// ============================================================
$('backBtn').addEventListener('click', () => {
  detailPage.style.display = 'none';
  document.querySelector('main').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadTab();
});

// ============================================================
// GENRE CHIPS (Movies only)
// ============================================================
async function loadGenres() {
  const genres = [
    { id: 28, name: 'Action' }, { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' }, { id: 878, name: 'Sci-Fi' },
    { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' },
    { id: 16, name: 'Animation' }
  ];
  genreChips.innerHTML = `<div class="chip active" data-id="">All</div>` +
    genres.map(g => `<div class="chip" data-id="${g.id}">${g.name}</div>`).join('');

  genreChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      if (currentTab !== 'movies') return;
      genreChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const genreId = chip.dataset.id || null;
      mainGrid.innerHTML = skeletonCards(12);
      try {
        const data = genreId
          ? await fetchFromBackend(`/movies/discover?genre=${genreId}`)
          : await fetchFromBackend('/movies/popular');
        mainGrid.innerHTML = data.map(movieCard).join('');
        attachCardHandlers(mainGrid);
        if (data.length) setHero(data[0], 'movies');
      } catch (e) {
        mainGrid.innerHTML = `<div class="empty-state">Failed to load</div>`;
      }
    });
  });
}

// ============================================================
// BOOT
// ============================================================
mainGrid.innerHTML = skeletonCards(12);
loadMovies();
loadGenres();
