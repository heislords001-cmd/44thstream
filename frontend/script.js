// ============================================================
// CONFIG — Your friend's API
// ============================================================
const API_BASE = 'https://apis.davidcyril.name.ng';

// ============================================================
// STATE
// ============================================================
let currentTab = 'schedule';
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
  const poster = item.image || item.poster || item.images?.jpg?.image_url || null;
  const rating = item.rating || item.score || 0;
  const year = item.year || '';
  const id = item.id || item.mal_id || item.animeId;

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
async function fetchAPI(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  console.log('📡 Fetching:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// LOAD FUNCTIONS
// ============================================================
async function loadSchedule() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/anime/schedule');
    const results = (data.results || data || []).map(item => ({
      id: item.id || item.mal_id || item.animeId,
      title: item.title || item.name || 'Unknown',
      image: item.image || item.poster || item.images?.jpg?.image_url,
      rating: item.rating || item.score || 0,
      year: item.year || '',
      synopsis: item.synopsis || item.overview || ''
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'schedule')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'schedule');
    sectionTitle.textContent = 'Airing Schedule';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load</div><p>${e.message}</p></div>`;
  }
}

async function loadAnimeList() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/anime/list');
    const results = (data.results || data || []).map(item => ({
      id: item.id || item.mal_id || item.animeId,
      title: item.title || item.name || 'Unknown',
      image: item.image || item.poster || item.images?.jpg?.image_url,
      rating: item.rating || item.score || 0,
      year: item.year || '',
      synopsis: item.synopsis || item.overview || ''
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'anime')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'anime');
    sectionTitle.textContent = 'Anime List';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load</div><p>${e.message}</p></div>`;
  }
}

async function loadMovies() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/anime/list');
    const results = (data.results || data || []).map(item => ({
      id: item.id || item.mal_id || item.animeId,
      title: item.title || item.name || 'Unknown',
      image: item.image || item.poster || item.images?.jpg?.image_url,
      rating: item.rating || item.score || 0,
      year: item.year || '',
      synopsis: item.synopsis || item.overview || ''
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'movies')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'movies');
    sectionTitle.textContent = 'Movies (from Anime API)';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load</div><p>${e.message}</p></div>`;
  }
}

async function loadDramas() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/anime/list');
    const results = (data.results || data || []).map(item => ({
      id: item.id || item.mal_id || item.animeId,
      title: item.title || item.name || 'Unknown',
      image: item.image || item.poster || item.images?.jpg?.image_url,
      rating: item.rating || item.score || 0,
      year: item.year || '',
      synopsis: item.synopsis || item.overview || ''
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'dramas')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'dramas');
    sectionTitle.textContent = 'Korean Dramas (from Anime API)';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load</div><p>${e.message}</p></div>`;
  }
}

function loadTabContent() {
  if (currentTab === 'schedule') loadSchedule();
  else if (currentTab === 'anime') loadAnimeList();
  else if (currentTab === 'movies') loadMovies();
  else if (currentTab === 'dramas') loadDramas();
}

// ============================================================
// HERO
// ============================================================
function setHero(item, type) {
  const heroBg = $('heroBg');
  const imgUrl = item.image || item.backdrop;
  if (imgUrl) {
    heroBg.style.backgroundImage = `url(${imgUrl})`;
    heroBg.classList.add('show');
  }
  $('heroTitle').textContent = item.title || '44thStream';
  $('heroDesc').textContent = item.synopsis || 'No synopsis available.';
  const eyebrows = {
    schedule: 'Airing Now',
    anime: 'Trending Anime',
    movies: 'Now Showing',
    dramas: 'Korean Drama'
  };
  $('heroEyebrow').textContent = eyebrows[type] || 'Now Showing';
  $('heroMeta').innerHTML = `
    <div class="pill">★ ${Number(item.rating || 0).toFixed(1)}</div>
    <div class="pill">${String(item.year || '').slice(0, 4) || '—'}</div>
  `;
  $('heroCta').onclick = () => { if (item.id) openDetail(item.id, type); };
}

// ============================================================
// DETAIL PAGE
// ============================================================
async function openDetail(id, type) {
  detailPage.classList.add('show');
  document.querySelector('main').style.display = 'none';
  detailContent.innerHTML = '<div class="modal-loading">Loading...</div>';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    const info = await fetchAPI(`/anime/info?id=${id}`);
    const episodesData = await fetchAPI(`/anime/episodes?id=${id}`);
    const episodes = episodesData.results || episodesData.data || episodesData || [];

    currentDetailData = info;
    currentEpisodes = episodes;
    renderDetail(info, episodes);
  } catch (e) {
    detailContent.innerHTML = `<div class="empty-state"><div class="display">Failed to load details</div><p>${e.message}</p></div>`;
  }
}

function renderDetail(data, episodes) {
  const poster = data.image || data.poster || data.images?.jpg?.image_url || '';
  const title = data.title || data.name || 'Unknown';
  const rating = Number(data.rating || data.score || 0).toFixed(1);
  const year = String(data.year || '').slice(0, 4);
  const genres = (data.genres || []).map(g => g.name || g).join(' • ');
  const synopsis = data.synopsis || data.overview || 'No synopsis available.';

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
        <div class="overview">${synopsis}</div>
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
        ${episodes.slice(0, 30).map((ep, i) => `
          <button class="episode-btn" onclick="playEpisode(${i})">
            ${ep.number || ep.episode || i + 1}
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
    const epId = ep.id || ep.episodeId;
    const data = await fetchAPI(`/anime/watch?id=${epId}`);
    const videoUrl = data.url || data.stream || data.source || data.video || data.link;

    if (videoUrl) {
      const isHls = videoUrl.includes('.m3u8');
      container.innerHTML = `
        <div class="video-player">
          <video controls autoplay style="width:100%;max-height:500px;">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <button onclick="downloadVideo('${videoUrl}')" style="margin-top:10px;padding:8px 20px;background:var(--grad);border:none;color:var(--void);border-radius:6px;cursor:pointer;font-weight:700;">⬇️ Download</button>
      `;
    } else {
      container.innerHTML = '<div class="empty-state">No video source found.</div>';
    }
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Failed to load: ${e.message}</div>`;
  }
}

function downloadVideo(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'video.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================
// BACK BUTTON
// ============================================================
$('backBtn').addEventListener('click', () => {
  detailPage.classList.remove('show');
  document.querySelector('main').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadTabContent();
});

// ============================================================
// TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    detailPage.classList.remove('show');
    document.querySelector('main').style.display = 'block';
    $('searchInput').value = '';
    searchHead.style.display = 'none';
    searchGrid.innerHTML = '';
    loadTabContent();
  });
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
    detailPage.classList.remove('show');
    document.querySelector('main').style.display = 'block';
    loadTabContent();
    return;
  }
  searchHead.style.display = 'flex';
  searchGrid.innerHTML = skeletonCards(6);
  document.querySelector('main').style.display = 'block';
  detailPage.classList.remove('show');

  searchTimer = setTimeout(async () => {
    try {
      const data = await fetchAPI(`/anime/search?q=${encodeURIComponent(q)}`);
      const results = (data.results || data || []).map(item => ({
        id: item.id || item.mal_id || item.animeId,
        title: item.title || item.name || 'Unknown',
        image: item.image || item.poster || item.images?.jpg?.image_url,
        rating: item.rating || item.score || 0,
        year: item.year || '',
        synopsis: item.synopsis || item.overview || ''
      }));
      searchGrid.innerHTML = results.length
        ? results.map(item => movieCard(item, currentTab)).join('')
        : `<div class="empty-state"><div class="display">No results</div>Try another title.</div>`;
      attachCardHandlers(searchGrid);
    } catch (e) {
      searchGrid.innerHTML = `<div class="empty-state">Search failed: ${e.message}</div>`;
    }
  }, 400);
});

// ============================================================
// SIGN IN
// ============================================================
$('authBtn').addEventListener('click', () => {
  alert('Sign in / Sign up coming soon!');
});

// ============================================================
// MODAL CLOSE
// ============================================================
$('modalClose').addEventListener('click', () => $('modalBg').classList.remove('open'));
$('modalBg').addEventListener('click', (e) => {
  if (e.target.id === 'modalBg') $('modalBg').classList.remove('open');
});

// ============================================================
// BOOT
// ============================================================
mainGrid.innerHTML = skeletonCards(12);
loadSchedule();
