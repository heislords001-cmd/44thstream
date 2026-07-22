// ============================================================
// CONFIG — Working APIs
// ============================================================
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlMmY1N2Q3MDQ1NDI0NDc2NDNjNmYxZGEwOTJmZjkxYyIsIm5iZiI6MTc4MzI3MjMzNC41NzksInN1YiI6IjZhNGE5MzhlZmJhNTZhOWRhZWYyZjg3OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.cR-Ks9gEwGxu-UPb5pmCPMNNrRKwe8AcI6KAMwfrSi0';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const JIKAN_API = 'https://api.jikan.moe/v4';
const TVMAZE_API = 'https://api.tvmaze.com';

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
  const poster = item.poster || item.image || item.poster_path || null;
  const rating = item.rating || item.vote_average || item.score || 0;
  const year = item.year || item.release_date || item.releaseDate || '';
  const id = item.id || item.mal_id;

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
async function fetchTMDB(path) {
  const url = `${TMDB_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`
    }
  });
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
  return res.json();
}

async function fetchJikan(path) {
  const res = await fetch(`${JIKAN_API}${path}`);
  if (!res.ok) throw new Error(`Jikan HTTP ${res.status}`);
  return res.json();
}

async function fetchTVMaze(path) {
  const res = await fetch(`${TVMAZE_API}${path}`);
  if (!res.ok) throw new Error(`TVMaze HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// MOVIES — TMDB
// ============================================================
async function loadMovies() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchTMDB('/discover/movie?sort_by=popularity.desc&page=1');
    const results = data.results.map(item => ({
      id: item.id,
      title: item.title,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      rating: item.vote_average || 0,
      year: item.release_date || '',
      overview: item.overview || '',
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'movies')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'movies');
    sectionTitle.textContent = 'Trending Movies';
  } catch (e) {
    console.error('Movies error:', e);
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load movies</div><p>${e.message}</p></div>`;
  }
}

// ============================================================
// ANIME — Jikan API (Works, No Key)
// ============================================================
async function loadAnime() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchJikan('/top/anime?limit=50&filter=airing');
    const results = data.data.map(item => ({
      id: item.mal_id,
      title: item.title,
      poster: item.images?.jpg?.image_url || null,
      rating: item.score || 0,
      year: item.year || '',
      overview: item.synopsis || '',
      backdrop: item.images?.jpg?.large_image_url || null,
      genres: item.genres || [],
      episodes: item.episodes || 0
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'anime')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'anime');
    sectionTitle.textContent = 'Trending Anime';
  } catch (e) {
    console.error('Anime error:', e);
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load anime</div><p>${e.message}</p></div>`;
  }
}

// ============================================================
// KOREAN DRAMAS — TVMaze (No Key)
// ============================================================
async function loadDramas() {
  mainGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchTVMaze('/search/shows?q=korean+drama');
    const results = data.map(item => ({
      id: item.show.id,
      title: item.show.name,
      poster: item.show.image?.medium || null,
      rating: item.show.rating?.average || 0,
      year: item.show.premiered?.slice(0,4) || '',
      overview: item.show.summary?.replace(/<[^>]+>/g, '') || '',
      backdrop: item.show.image?.original || null,
      genres: item.show.genres || []
    }));
    currentResults = results;
    mainGrid.innerHTML = results.map(item => movieCard(item, 'dramas')).join('');
    attachCardHandlers(mainGrid);
    if (results.length) setHero(results[0], 'dramas');
    sectionTitle.textContent = 'Korean Dramas';
  } catch (e) {
    console.error('Drama error:', e);
    mainGrid.innerHTML = `<div class="empty-state"><div class="display">Failed to load dramas</div><p>${e.message}</p></div>`;
  }
}

// ============================================================
// LOAD TAB
// ============================================================
function loadTabContent() {
  if (currentTab === 'movies') loadMovies();
  else if (currentTab === 'anime') loadAnime();
  else if (currentTab === 'dramas') loadDramas();
}

// ============================================================
// HERO
// ============================================================
function setHero(item, type) {
  const heroBg = $('heroBg');
  const imgUrl = item.backdrop || item.poster;
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
    let data, episodes = [];
    if (type === 'movies') {
      const info = await fetchTMDB(`/movie/${id}?append_to_response=videos`);
      data = {
        id: info.id,
        title: info.title,
        poster: info.poster_path ? `https://image.tmdb.org/t/p/w500${info.poster_path}` : null,
        rating: info.vote_average || 0,
        year: info.release_date || '',
        overview: info.overview || '',
        genres: info.genres || [],
        runtime: info.runtime || 0,
        tagline: info.tagline || '',
        trailer: (info.videos?.results || []).find(v => v.type === 'Trailer')?.key || null
      };
      episodes = [];
    } else if (type === 'anime') {
      const info = await fetchJikan(`/anime/${id}/full`);
      data = {
        id: info.data.mal_id,
        title: info.data.title,
        poster: info.data.images?.jpg?.image_url || null,
        rating: info.data.score || 0,
        year: info.data.year || '',
        overview: info.data.synopsis || '',
        genres: info.data.genres || [],
        episodes: info.data.episodes || 0,
        trailer: info.data.trailer?.url || null
      };
      const epData = await fetchJikan(`/anime/${id}/episodes?limit=50`);
      episodes = epData.data || [];
    } else if (type === 'dramas') {
      const info = await fetchTVMaze(`/shows/${id}`);
      data = {
        id: info.id,
        title: info.name,
        poster: info.image?.medium || null,
        rating: info.rating?.average || 0,
        year: info.premiered?.slice(0,4) || '',
        overview: info.summary?.replace(/<[^>]+>/g, '') || '',
        genres: info.genres || [],
        episodes: info._embedded?.episodes || []
      };
      episodes = data.episodes || [];
    }
    currentDetailData = data;
    currentEpisodes = episodes;
    renderDetail(data, episodes, type);
  } catch (e) {
    console.error('Detail error:', e);
    detailContent.innerHTML = `<div class="empty-state"><div class="display">Failed to load details</div><p>${e.message}</p></div>`;
  }
}

function renderDetail(data, episodes, type) {
  const poster = data.poster || '';
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
        ${data.tagline ? `<div class="tagline">${data.tagline}</div>` : ''}
        <div class="detail-meta">
          <div class="pill">★ ${rating}</div>
          ${year ? `<div class="pill">${year}</div>` : ''}
          ${data.runtime ? `<div class="pill">${data.runtime} min</div>` : ''}
          ${genres ? `<div class="pill">${genres}</div>` : ''}
        </div>
        <div class="overview">${data.overview || 'No synopsis available.'}</div>
        <div class="detail-actions">
          ${type === 'movies' && data.trailer ? `<button class="btn-primary" onclick="openTrailer('${data.trailer}')">▶ Watch Trailer</button>` : ''}
          ${episodes && episodes.length > 0 ? `<button class="btn-primary" onclick="playEpisode(0)">▶ Watch Episode 1</button>` : ''}
        </div>
      </div>
    </div>
  `;

  if (episodes && episodes.length > 0) {
    html += `
      <h3 style="margin-top: 30px;">Episodes (${episodes.length})</h3>
      <div class="episodes-grid">
        ${episodes.slice(0, 20).map((ep, i) => `
          <button class="episode-btn" data-index="${i}" onclick="playEpisode(${i})">
            ${ep.number || ep.episode_number || i + 1}
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
    // This is a placeholder — Jikan/TVMaze don't provide streaming links.
    // You'll need to integrate GogoAnime, Animepahe, or another video source.
    container.innerHTML = `
      <div class="empty-state">
        <div class="display">Streaming Source Needed</div>
        <p>Episode ${ep.number || index + 1} — ${ep.title || ''}</p>
        <p style="font-size:12px;margin-top:10px;">Jikan/TVMaze provide metadata only.</p>
        <p style="font-size:12px;">You'll need to integrate GogoAnime, Animepahe, or another video provider.</p>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Failed to load episode: ${e.message}</div>`;
  }
}

function openTrailer(key) {
  openModal(`https://www.youtube.com/embed/${key}`, 'Trailer');
}

// ============================================================
// MODAL (for trailer)
// ============================================================
function openModal(url, title) {
  $('modalBg').classList.add('open');
  $('modalContent').innerHTML = `
    <div style="padding:20px;">
      <h3 style="margin-bottom:10px;color:var(--cream);">${title || 'Video'}</h3>
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
    loadTabContent();
    return;
  }
  searchHead.style.display = 'flex';
  searchGrid.innerHTML = skeletonCards(6);
  document.querySelector('main').style.display = 'block';
  detailPage.style.display = 'none';

  searchTimer = setTimeout(async () => {
    try {
      let results = [];
      if (currentTab === 'movies') {
        const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(q)}`);
        results = data.results.map(item => ({
          id: item.id,
          title: item.title,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          rating: item.vote_average || 0,
          year: item.release_date || '',
          overview: item.overview || ''
        }));
      } else if (currentTab === 'anime') {
        const data = await fetchJikan(`/anime?q=${encodeURIComponent(q)}&limit=50`);
        results = data.data.map(item => ({
          id: item.mal_id,
          title: item.title,
          poster: item.images?.jpg?.image_url || null,
          rating: item.score || 0,
          year: item.year || '',
          overview: item.synopsis || ''
        }));
      } else if (currentTab === 'dramas') {
        const data = await fetchTVMaze(`/search/shows?q=${encodeURIComponent(q)}`);
        results = data.map(item => ({
          id: item.show.id,
          title: item.show.name,
          poster: item.show.image?.medium || null,
          rating: item.show.rating?.average || 0,
          year: item.show.premiered?.slice(0,4) || '',
          overview: item.show.summary?.replace(/<[^>]+>/g, '') || ''
        }));
      }
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
        const data = await fetchTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`);
        const results = data.results.map(item => ({
          id: item.id,
          title: item.title,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          rating: item.vote_average || 0,
          year: item.release_date || '',
          overview: item.overview || ''
        }));
        mainGrid.innerHTML = results.map(item => movieCard(item, 'movies')).join('');
        attachCardHandlers(mainGrid);
        if (results.length) setHero(results[0], 'movies');
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
