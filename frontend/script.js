// ============================================================
// CONFIG — Runflix API
// ============================================================
const API_BASE = 'https://movieapi.runflix.name.ng/api/v3';
const API_KEY = 'runflix_5bys3cd83u2fzbm317lj';

// ============================================================
// STATE
// ============================================================
let currentTab = 'trending';
let currentResults = [];
let currentDetailData = null;
let currentSources = null;

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
  return item.medium_cover_image || item.large_cover_image || item.poster || item.image || item.cover || null;
}

function getTitle(item) {
  return item.title || item.name || 'Unknown';
}

function getRating(item) {
  return item.rating || item.rating_avg || item.vote_average || 0;
}

function getYear(item) {
  return item.year || item.release_date || '';
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
async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  console.log('📡 Fetching:', url.toString());
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// LOAD FUNCTIONS
// ============================================================

// 1. Trending
async function loadTrending() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/trending');
    const results = data.results || data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'trending')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'trending');
    sectionTitle.textContent = 'Trending Now';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load trending</div><p>${e.message}</p></div>`;
  }
}

// 2. Movies
async function loadMovies() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/filter', { type: 1, page: 1, perPage: 20 });
    const results = data.results || data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'movies')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'movies');
    sectionTitle.textContent = 'Movies';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load movies</div><p>${e.message}</p></div>`;
  }
}

// 3. TV Shows
async function loadTV() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/filter', { type: 2, page: 1, perPage: 20 });
    const results = data.results || data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'tv')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'tv');
    sectionTitle.textContent = 'TV Shows';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load TV shows</div><p>${e.message}</p></div>`;
  }
}

// 4. Anime
async function loadAnime() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/anime', { strict: true, page: 1, perPage: 20 });
    const results = data.results || data.movies || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'anime')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'anime');
    sectionTitle.textContent = 'Anime';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load anime</div><p>${e.message}</p></div>`;
  }
}

// 5. Schedule
async function loadSchedule() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/schedule', { period: 'daily', genre: 'anime', page: 1 });
    const results = data.results || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'schedule')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'schedule');
    sectionTitle.textContent = 'Airing Schedule';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load schedule</div><p>${e.message}</p></div>`;
  }
}

// 6. Popular Airing
async function loadPopularAiring() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/schedule/popular', { type: 'tv', limit: 20 });
    const results = data.results || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'popular_airing')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'popular_airing');
    sectionTitle.textContent = 'Popular Airing Anime';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load popular airing</div><p>${e.message}</p></div>`;
  }
}

// 7. Upcoming Season
async function loadUpcoming() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/seasons/upcoming', { page: 1 });
    const results = data.results || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'upcoming')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'upcoming');
    sectionTitle.textContent = 'Upcoming Season';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load upcoming</div><p>${e.message}</p></div>`;
  }
}

// 8. Live TV
async function loadLiveTV() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchAPI('/live', { page: 1, limit: 20 });
    const results = data.results?.results || data.results || data.data || data || [];
    currentResults = results;
    mainGrid.innerHTML = results.map(item => {
      const title = item.name || item.title || 'Unknown';
      const poster = item.logo || item.image || null;
      const id = item.id;
      return `
        <div class="card" data-id="${id}" data-type="live">
          ${poster ? `<img src="${poster}" alt="${title}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--cream-dim);font-size:12px;padding:10px;text-align:center;">${title}</div>`}
          <div class="card-badge">${item.country || 'Live'}</div>
          <div class="card-overlay">
            <div class="card-title">${title}</div>
            <div class="card-rating" style="color:var(--teal);">● Live</div>
          </div>
        </div>
      `;
    }).join('');
    // Attach handlers for live TV
    document.querySelectorAll('.card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        openLiveStream(id);
      });
    });
    if (results.length) setHero(results[0], 'live');
    sectionTitle.textContent = 'Live TV Channels';
  } catch (e) {
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load live TV</div><p>${e.message}</p></div>`;
  }
}

function loadTabContent() {
  if (currentTab === 'trending') loadTrending();
  else if (currentTab === 'movies') loadMovies();
  else if (currentTab === 'tv') loadTV();
  else if (currentTab === 'anime') loadAnime();
  else if (currentTab === 'schedule') loadSchedule();
  else if (currentTab === 'popular_airing') loadPopularAiring();
  else if (currentTab === 'upcoming') loadUpcoming();
  else if (currentTab === 'live') loadLiveTV();
}

// ============================================================
// HERO
// ============================================================
function setHero(item, type) {
  const heroBg = $('heroBg');
  const imgUrl = getImage(item) || item.logo || null;
  if (imgUrl) {
    heroBg.style.backgroundImage = `url(${imgUrl})`;
    heroBg.classList.add('show');
  }
  $('heroTitle').textContent = getTitle(item) || item.name || '44thStream';
  $('heroDesc').textContent = getSynopsis(item) || 'Live stream available.';
  const eyebrows = {
    trending: 'Trending Now',
    movies: 'Movies',
    tv: 'TV Shows',
    anime: 'Anime',
    schedule: 'Airing Schedule',
    popular_airing: 'Popular Airing',
    upcoming: 'Upcoming Season',
    live: 'Live TV'
  };
  $('heroEyebrow').textContent = eyebrows[type] || 'Now Showing';
  $('heroMeta').innerHTML = `
    <div class="pill">★ ${Number(getRating(item) || 0).toFixed(1)}</div>
    <div class="pill">${String(getYear(item) || '').slice(0, 4) || '—'}</div>
  `;
  $('heroCta').onclick = () => {
    if (item.id) openDetail(item.id, type);
  };
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
    const data = await fetchAPI(`/info/${id}`);
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
          <button class="btn-primary" onclick="getSources('${data.id}')">▶ Watch Now</button>
        </div>
      </div>
    </div>
  `;

  detailContent.innerHTML = html;
}

// ============================================================
// SOURCES
// ============================================================
async function getSources(id) {
  const container = detailContent;
  const watchSection = container.querySelector('.detail-actions');
  if (watchSection) {
    watchSection.innerHTML = '<div class="modal-loading">Loading sources...</div>';
  }

  try {
    const data = await fetchAPI(`/sources/${id}`);
    currentSources = data;
    renderSources(data);
  } catch (e) {
    if (watchSection) {
      watchSection.innerHTML = `<div class="empty-state">Failed to load sources: ${e.message}</div>`;
    }
  }
}

function renderSources(data) {
  const container = detailContent;
  const sources = data.sources || data.results || data || [];
  
  if (!sources.length) {
    const watchSection = container.querySelector('.detail-actions');
    if (watchSection) {
      watchSection.innerHTML = '<div class="empty-state">No sources available for this title.</div>';
    }
    return;
  }

  let html = '<div style="margin-top:20px;"><h3>Available Sources</h3><div class="episodes-grid">';
  sources.forEach((source, index) => {
    const quality = source.quality || source.label || `Source ${index + 1}`;
    html += `
      <button class="episode-btn" onclick="playSource('${source.url || source.stream || source.link}')">
        ${quality}
      </button>
    `;
  });
  html += '</div><div id="videoPlayerContainer" style="margin-top:20px;"></div></div>';
  
  const watchSection = container.querySelector('.detail-actions');
  if (watchSection) {
    watchSection.innerHTML = html;
  }
}

function playSource(url) {
  const container = document.getElementById('videoPlayerContainer');
  if (!container) return;
  
  if (!url) {
    container.innerHTML = '<div class="empty-state">No video URL available.</div>';
    return;
  }

  container.innerHTML = `
    <div class="video-player">
      <video controls autoplay style="width:100%;max-height:500px;">
        <source src="${url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    <button onclick="downloadVideo('${url}')" style="margin-top:10px;padding:8px 20px;background:var(--grad);border:none;color:var(--void);border-radius:6px;cursor:pointer;font-weight:700;">⬇️ Download</button>
  `;
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
// LIVE TV STREAM
// ============================================================
async function openLiveStream(id) {
  detailPage.classList.add('show');
  document.querySelector('main').style.display = 'none';
  detailContent.innerHTML = '<div class="modal-loading">Loading stream...</div>';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    const data = await fetchAPI(`/live/stream/${id}`);
    const channel = data.results || data;
    const streams = channel.streams || [];
    const streamUrl = streams.length > 0 ? streams[0].url : null;

    let html = `
      <div class="detail-hero">
        <div class="detail-poster">
          <img src="${channel.logo || 'https://via.placeholder.com/500x750?text=Live+TV'}" alt="${channel.name}">
        </div>
        <div class="detail-info">
          <h1>${channel.name}</h1>
          <div class="detail-meta">
            <div class="pill">${channel.country || 'Global'}</div>
            <div class="pill">${(channel.categories || []).join(' • ') || 'General'}</div>
          </div>
          <div class="overview">${channel.altNames ? `Also known as: ${channel.altNames.join(', ')}` : 'Live stream available.'}</div>
          <div class="detail-actions">
            ${streamUrl ? `<button class="btn-primary" onclick="playLiveStream('${streamUrl}')">▶ Watch Live</button>` : '<div class="empty-state">No stream available</div>'}
          </div>
        </div>
      </div>
      <div id="videoPlayerContainer" style="margin-top:20px;"></div>
    `;
    detailContent.innerHTML = html;
  } catch (e) {
    detailContent.innerHTML = `<div class="empty-state"><div class="display">Failed to load channel</div><p>${e.message}</p></div>`;
  }
}

function playLiveStream(url) {
  const container = document.getElementById('videoPlayerContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="video-player">
      <video controls autoplay style="width:100%;max-height:500px;">
        <source src="${url}" type="application/x-mpegURL">
        Your browser does not support live streaming.
      </video>
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
      const data = await fetchAPI(`/search/${encodeURIComponent(q)}`, { page: 1 });
      const results = data.results || data.movies || data.data || data || [];
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
