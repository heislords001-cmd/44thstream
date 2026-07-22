// ============================================================
// CONFIG — Direct Consumet API (no backend)
// ============================================================
const CONSUMET_API = 'https://api.consumet.org';

// Provider endpoints
const PROVIDERS = {
  movies: {
    name: 'FlixHQ',
    base: '/movies/flixhq',
    search: (q) => `/${encodeURIComponent(q)}`,
    info: (id) => `/info?id=${id}`,
    watch: (episodeId, mediaId) => `/watch?episodeId=${episodeId}&mediaId=${mediaId}`,
    trending: '/trending',
    recent: '/recent-movies'
  },
  anime: {
    name: 'Animepahe',
    base: '/anime/animepahe',
    search: (q) => `?query=${encodeURIComponent(q)}`,
    info: (id) => `/info/${id}`,
    watch: (episodeId) => `/watch/${episodeId}`,
    trending: '/top-airing',
    recent: '/recent-episodes'
  },
  dramas: {
    name: 'Dramacool',
    base: '/movies/dramacool',
    search: (q) => `/${encodeURIComponent(q)}`,
    info: (id) => `/info?id=${id}`,
    watch: (episodeId, mediaId) => `/watch?episodeId=${episodeId}&mediaId=${mediaId}`,
    trending: '/popular',
    recent: '/recently-updated'
  }
};

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

function movieCard(item, type) {
  const title = item.title || item.name || 'Unknown';
  const poster = item.image || item.poster || item.cover || null;
  const rating = item.rating || item.score || item.vote_average || 0;
  const year = item.releaseDate || item.year || item.release_date || '';
  const id = item.id || item.animeId || item.dramaId || item.mediaId;

  return `
    <div class="card" data-id="${id}" data-type="${type || currentTab}">
      ${poster ? `<img src="${poster}" alt="${title}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--cream-dim);font-size:12px;padding:10px;text-align:center;">${title}</div>`}
      ${year ? `<div class="card-badge">${String(year).slice(0, 4)}</div>` : ''}
      <div class="card-overlay">
        <div class="card-title">${title}</div>
        <div class="card-rating" style="color:${ratingColor(rating)}">★ ${Number(rating).toFixed(1)}</div>
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
async function fetchConsumet(path) {
  const url = `${CONSUMET_API}${path}`;
  console.log('Fetching:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return res.json();
}

// ============================================================
// LOAD FUNCTIONS
// ============================================================
function getProvider() {
  return PROVIDERS[currentTab];
}

async function loadTabContent() {
  const provider = getProvider();
  if (!provider) return;
  
  mainGrid.innerHTML = skeletonCards(12);
  
  try {
    // Try trending first
    let data;
    try {
      data = await fetchConsumet(`${provider.base}${provider.trending}`);
    } catch (e) {
      // Fallback to recent if trending fails
      data = await fetchConsumet(`${provider.base}${provider.recent}`);
    }
    
    const results = data.results || data || [];
    const formatted = formatResults(results, currentTab);
    currentResults = formatted;
    mainGrid.innerHTML = formatted.map(item => movieCard(item, currentTab)).join('');
    attachCardHandlers(mainGrid);
    if (formatted.length) setHero(formatted[0], currentTab);
    
    const titles = {
      movies: 'Trending Movies',
      anime: 'Trending Anime',
      dramas: 'Popular Korean Dramas'
    };
    sectionTitle.textContent = titles[currentTab] || 'Trending';
  } catch (e) {
    console.error(`${currentTab} load error:`, e);
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load ${currentTab}</div><p>${e.message}</p><p style="font-size:12px;margin-top:10px;">The Consumet API may be rate-limited. Try again later.</p></div>`;
  }
}

function formatResults(data, type) {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    const base = {
      id: item.id || item.animeId || item.dramaId || item.mediaId || item.showId,
      title: item.title || item.name || 'Unknown',
      overview: item.synopsis || item.overview || item.description || '',
      rating: item.rating || item.score || item.vote_average || 0,
      year: item.releaseDate || item.year || item.release_date || '',
      genres: item.genres || []
    };
    
    // Different providers use different keys for images
    if (type === 'movies') {
      base.poster_path = item.image || item.poster || item.cover;
      base.backdrop_path = item.backdrop || item.cover;
    } else if (type === 'anime') {
      base.poster_path = item.image || item.poster || item.cover;
      base.backdrop_path = item.cover || item.backdrop;
    } else if (type === 'dramas') {
      base.poster_path = item.image || item.poster || item.cover;
      base.backdrop_path = item.cover || item.backdrop;
    }
    
    return base;
  });
}

// ============================================================
// HERO
// ============================================================
function setHero(item, type) {
  const heroBg = $('heroBg');
  const imgUrl = item.backdrop_path || item.poster_path;
  if (imgUrl) {
    heroBg.style.backgroundImage = `url(${imgUrl})`;
    heroBg.classList.add('show');
  }
  
  $('heroTitle').textContent = item.title || '44thStream';
  $('heroDesc').textContent = item.overview || 'No synopsis available.';
  
  const eyebrows = {
    movies: 'Now Showing',
    anime: 'Trending Anime',
    dramas: 'Korean Drama'
  };
  $('heroEyebrow').textContent = eyebrows[type] || 'Now Showing';
  
  $('heroMeta').innerHTML = `
    <div class="pill">★ ${Number(item.rating || 0).toFixed(1)}</div>
    <div class="pill">${String(item.year || '').slice(0, 4) || '—'}</div>
  `;
  
  $('heroCta').onclick = () => {
    if (item.id) openDetail(item.id, type);
  };
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
    const provider = getProvider();
    let data, episodes = [];
    
    // Get info
    const infoData = await fetchConsumet(`${provider.base}${provider.info(id)}`);
    data = formatDetail(infoData, type);
    episodes = infoData.episodes || [];
    
    currentDetailData = data;
    currentEpisodes = episodes;
    renderDetail(data, episodes, type);
  } catch (e) {
    console.error('Detail load error:', e);
    detailContent.innerHTML = `<div class="empty-state"><div class="display">Failed to load details</div><p>${e.message}</p></div>`;
  }
}

function formatDetail(data, type) {
  return {
    id: data.id || data.mediaId,
    title: data.title || data.name || 'Unknown',
    overview: data.synopsis || data.overview || data.description || '',
    poster_path: data.image || data.poster || data.cover,
    backdrop_path: data.cover || data.backdrop,
    rating: data.rating || data.score || data.vote_average || 0,
    year: data.releaseDate || data.year || data.release_date || '',
    genres: data.genres || [],
    episodes: data.episodes || []
  };
}

function renderDetail(data, episodes, type) {
  const poster = data.poster_path || '';
  const title = data.title || 'Unknown';
  const rating = Number(data.rating || 0).toFixed(1);
  const year = String(data.year || '').slice(0, 4);
  const genres = (data.genres || []).map(g => g.name || g).join(' • ');

  let html = `
    <div class="detail-hero">
      <div class="detail-poster">
        <img src="${poster || 'https://via.placeholder.com/500x750?text=No+Poster'}" alt="${title}">
      </div>
      <div class="detail-info">
        <h1>${title}</h1>
        <div class="detail-meta">
          <div class="pill">★ ${rating}</div>
          ${year ? `<div class="pill">${year}</div>` : ''}
          ${genres ? `<div class="pill">${genres}</div>` : ''}
        </div>
        <div class="overview">${data.overview || 'No synopsis available.'}</div>
        <div class="detail-actions">
          ${episodes && episodes.length > 0 ? `<button class="btn-primary" onclick="playEpisode(0)">▶ Watch Episode 1</button>` : ''}
        </div>
      </div>
    </div>
  `;

  if (episodes && episodes.length > 0) {
    html += `
      <h3 style="margin-top: 30px;">Episodes (${episodes.length})</h3>
      <div class="episodes-grid">
        ${episodes.map((ep, i) => `
          <button class="episode-btn" data-index="${i}" onclick="playEpisode(${i})">
            ${ep.number || ep.episode_number || ep.episodeId || i + 1}
          </button>
        `).join('')}
      </div>
    `;
  }

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
  if (!ep) {
    container.innerHTML = '<div class="empty-state">Episode not found.</div>';
    return;
  }

  container.innerHTML = '<div class="modal-loading">Loading episode...</div>';

  try {
    const provider = getProvider();
    const epId = ep.id || ep.episodeId || ep.episode_id;
    const mediaId = currentDetailData.id;
    
    let watchData;
    if (currentTab === 'anime') {
      watchData = await fetchConsumet(`${provider.base}${provider.watch(epId)}`);
    } else {
      watchData = await fetchConsumet(`${provider.base}${provider.watch(epId, mediaId)}`);
    }
    
    const sources = watchData.sources || [];
    const source = sources.find(s => s.quality === '1080p') || sources[0];
    if (source && source.url) {
      renderVideoPlayer(source.url, ep.title || `Episode ${ep.number || index + 1}`);
    } else {
      container.innerHTML = '<div class="empty-state">No video source available.</div>';
    }
  } catch (e) {
    console.error('Episode load error:', e);
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
    <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap;">
      ${isMp4 ? `<button class="btn-primary" onclick="downloadVideo('${url}', '${title}')">⬇️ Download</button>` : ''}
      ${!isMp4 ? `<button class="btn-primary" style="opacity:0.6;cursor:not-allowed;">⬇️ Download (HLS stream)</button>` : ''}
    </div>
  `;
  container.innerHTML = html;

  const video = document.getElementById(playerId);
  if (isHls) {
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      container.innerHTML = '<div class="empty-state">Your browser does not support HLS streaming.</div>';
    }
  } else {
    video.src = url;
    video.play();
  }
}

function downloadVideo(url, title) {
  if (url.includes('.m3u8') || url.includes('m3u8')) {
    alert('This is a stream (HLS). Download is not available for this format.');
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'video'}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

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
    loadTabContent();
    return;
  }
  searchHead.style.display = 'flex';
  searchGrid.innerHTML = skeletonCards(6);
  document.querySelector('main').style.display = 'block';
  detailPage.style.display = 'none';

  searchTimer = setTimeout(async () => {
    try {
      const provider = getProvider();
      const data = await fetchConsumet(`${provider.base}${provider.search(q)}`);
      const results = data.results || data || [];
      const formatted = formatResults(results, currentTab);
      searchGrid.innerHTML = formatted.length
        ? formatted.map(item => movieCard(item, currentTab)).join('')
        : `<div class="empty-state"><div class="display">No results</div>Try another title.</div>`;
      attachCardHandlers(searchGrid);
    } catch (e) {
      console.error('Search error:', e);
      searchGrid.innerHTML = `<div class="empty-state">Search failed: ${e.message}</div>`;
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
    loadTabContent();
  });
});

// ============================================================
// BACK BUTTON
// ============================================================
$('backBtn').addEventListener('click', () => {
  detailPage.style.display = 'none';
  document.querySelector('main').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadTabContent();
});

// ============================================================
// SIGN IN BUTTON
// ============================================================
$('authBtn').addEventListener('click', () => {
  alert('Sign in / Sign up coming soon!');
});

// ============================================================
// BOOT
// ============================================================
mainGrid.innerHTML = skeletonCards(12);
loadTabContent();
