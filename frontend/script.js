// ============================================================
// CONFIG — ZST Labs Movie API
// ============================================================
const API_BASE = 'https://zstlab.cyou/api/v1';
const API_KEY = 'zst_ZQU5Kk0koRFSJgoJBAL6xBuq3HFMNHA25D1QdeAs';

// ============================================================
// STATE
// ============================================================
let currentTab = 'trending';
let currentResults = [];
let currentDetailData = null;
let currentEpisodes = [];

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

function getImage(item) {
  return item.medium_cover_image || item.large_cover_image || item.poster || item.image || null;
}

function getTitle(item) {
  return item.title || item.name || 'Unknown';
}

function getRating(item) {
  return item.rating || item.rating_avg || item.vote_average || 0;
}

function getYear(item) {
  return item.year || '';
}

function getSynopsis(item) {
  return item.description_full || item.synopsis || item.overview || item.summary || 'No synopsis available.';
}

function movieCard(item, type) {
  const title = getTitle(item);
  const poster = getImage(item);
  const rating = getRating(item);
  const year = getYear(item);
  const id = item.id || item.imdb_id;

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
  const res = await fetch(url, {
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// LOAD FUNCTIONS
// ============================================================

// 1. Trending Movies
async function loadTrending() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/moviebox/trending');
    const results = data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'trending')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'trending');
    sectionTitle.textContent = 'Trending Movies';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load trending</div><p>${e.message}</p></div>`;
  }
}

// 2. Latest Movies
async function loadLatest() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/moviebox/latest');
    const results = data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'latest')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'latest');
    sectionTitle.textContent = 'Latest Movies';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load latest</div><p>${e.message}</p></div>`;
  }
}

// 3. Nkiri Movies (Nigerian)
async function loadNkiri() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/nkiri/latest');
    const results = data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'nkiri')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'nkiri');
    sectionTitle.textContent = 'Nkiri Movies';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load Nkiri</div><p>${e.message}</p></div>`;
  }
}

// 4. TV Shows (Search with query)
async function loadTV() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/moviebox/tv?query=popular');
    const results = data.results || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'tv')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'tv');
    sectionTitle.textContent = 'TV Shows';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load TV shows</div><p>${e.message}</p></div>`;
  }
}

// 5. Korean Dramas
async function loadDramas() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/nkiri/dramas');
    const results = data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'dramas')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'dramas');
    sectionTitle.textContent = 'Korean Dramas';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load dramas</div><p>${e.message}</p></div>`;
  }
}

function loadTabContent() {
  if (currentTab === 'trending') loadTrending();
  else if (currentTab === 'latest') loadLatest();
  else if (currentTab === 'nkiri') loadNkiri();
  else if (currentTab === 'tv') loadTV();
  else if (currentTab === 'dramas') loadDramas();
}

// ============================================================
// HERO
// ============================================================
function setHero(item, type) {
  const heroBg = $('heroBg');
  const imgUrl = getImage(item);
  if (imgUrl) {
    heroBg.style.backgroundImage = `url(${imgUrl})`;
    heroBg.classList.add('show');
  }
  $('heroTitle').textContent = getTitle(item);
  $('heroDesc').textContent = getSynopsis(item);
  const eyebrows = {
    trending: 'Trending Now',
    latest: 'Latest Releases',
    nkiri: 'Nkiri Movies',
    tv: 'TV Shows',
    dramas: 'Korean Dramas'
  };
  $('heroEyebrow').textContent = eyebrows[type] || 'Now Showing';
  $('heroMeta').innerHTML = `
    <div class="pill">★ ${Number(getRating(item)).toFixed(1)}</div>
    <div class="pill">${String(getYear(item)).slice(0, 4) || '—'}</div>
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
    let data;
    if (type === 'tv') {
      data = await fetchAPI(`/moviebox/tv/${id}`);
    } else {
      data = await fetchAPI(`/moviebox/movies/${id}`);
    }
    currentDetailData = data;
    renderDetail(data, type);
  } catch (e) {
    detailContent.innerHTML = `<div class="empty-state"><div class="display">Failed to load details</div><p>${e.message}</p></div>`;
  }
}

function renderDetail(data, type) {
  const poster = getImage(data);
  const title = getTitle(data);
  const rating = Number(getRating(data)).toFixed(1);
  const year = String(getYear(data)).slice(0, 4);
  const synopsis = getSynopsis(data);
  const genres = data.genres ? data.genres.join(' • ') : '';

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
          ${data.runtime ? `<div class="pill">${data.runtime} min</div>` : ''}
        </div>
        <div class="overview">${synopsis}</div>
        <div class="detail-actions">
          ${data.trailer ? `<button class="btn-primary" onclick="openTrailer('${data.trailer}')">▶ Watch Trailer</button>` : ''}
          ${data.url || data.download_url ? `<button class="btn-primary" onclick="window.open('${data.url || data.download_url}', '_blank')">⬇️ Download</button>` : ''}
        </div>
      </div>
    </div>
  `;

  // If it's a TV show, show episodes
  if (data._embedded?.episodes || data.episodes) {
    const episodes = data._embedded?.episodes || data.episodes || [];
    html += `
      <h3 style="margin-top: 30px;">Episodes (${episodes.length})</h3>
      <div class="episodes-grid">
        ${episodes.slice(0, 20).map(ep => `
          <button class="episode-btn">${ep.number || ep.episode_number || '—'}</button>
        `).join('')}
      </div>
    `;
  }

  detailContent.innerHTML = html;
}

function openTrailer(url) {
  $('modalBg').classList.add('open');
  $('modalContent').innerHTML = `
    <div style="padding:20px;">
      <h3 style="margin-bottom:10px;color:var(--cream);">Trailer</h3>
      <iframe src="${url}" style="width:100%;height:400px;border:none;border-radius:8px;" allowfullscreen></iframe>
    </div>
  `;
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
      const data = await fetchAPI(`/moviebox/movies?query=${encodeURIComponent(q)}`);
      const results = data.movies || data.data || data || [];
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
loadTrending();
