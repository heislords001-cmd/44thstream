// ============================================================
// CONFIG — point to your Render backend
// ============================================================
const API_BASE = 'https://four4thstream.onrender.com/api';

// ============================================================
// DOM refs
// ============================================================
const $ = (id) => document.getElementById(id);
const trendingGrid = $('trendingGrid');
const topRatedGrid = $('topRatedGrid');
const searchGrid = $('searchGrid');
const searchHead = $('searchHead');
const genreChips = $('genreChips');

let currentGenre = null;

// ============================================================
// Helpers
// ============================================================
function skeletonCards(n) {
  return Array.from({ length: n }).map(() => `<div class="card skeleton"></div>`).join('');
}

function ratingColor(score) {
  return score >= 7 ? 'var(--teal)' : score >= 5 ? 'var(--gold)' : 'var(--crimson)';
}

function movieCard(m) {
  const poster = m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null;
  const rating = m.vote_average ? m.vote_average.toFixed(1) : '—';
  return `
    <div class="card" data-id="${m.id}">
      ${poster ? `<img src="${poster}" alt="${m.title || m.name}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--cream-dim);font-size:12px;padding:10px;text-align:center;">${m.title || m.name}</div>`}
      ${m.release_date ? `<div class="card-badge">${m.release_date.slice(0, 4)}</div>` : ''}
      <div class="card-overlay">
        <div class="card-title">${m.title || m.name}</div>
        <div class="card-rating" style="color:${ratingColor(m.vote_average || 0)}">★ ${rating}</div>
      </div>
    </div>
  `;
}

function attachCardHandlers(container) {
  container.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

// ============================================================
// API calls to your backend
// ============================================================
async function fetchFromBackend(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// Load sections
// ============================================================
async function loadTrending() {
  trendingGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchFromBackend('/movies/popular');
    trendingGrid.innerHTML = data.map(movieCard).join('');
    attachCardHandlers(trendingGrid);
    if (data.length) setHeroFrom(data[0]);
  } catch (e) {
    trendingGrid.innerHTML = `<div class="empty-state"><div class="display">Couldn't load trending</div>${e.message}</div>`;
  }
}

async function loadTopRated() {
  topRatedGrid.innerHTML = skeletonCards(12);
  try {
    const data = await fetchFromBackend('/movies/trending');
    topRatedGrid.innerHTML = data.slice(0, 12).map(movieCard).join('');
    attachCardHandlers(topRatedGrid);
  } catch (e) {
    topRatedGrid.innerHTML = '';
  }
}

async function loadGenres() {
  // Static genre list (your backend doesn't have /genres endpoint yet)
  const genres = [
    { id: 28, name: 'Action' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
    { id: 878, name: 'Sci-Fi' },
    { id: 27, name: 'Horror' },
    { id: 10749, name: 'Romance' },
    { id: 16, name: 'Animation' }
  ];
  genreChips.innerHTML = `<div class="chip active" data-id="">All</div>` +
    genres.map(g => `<div class="chip" data-id="${g.id}">${g.name}</div>`).join('');

  genreChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      genreChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentGenre = chip.dataset.id || null;
      trendingGrid.innerHTML = skeletonCards(12);
      try {
        const data = currentGenre
          ? await fetchFromBackend(`/movies/discover?genre=${currentGenre}`)
          : await fetchFromBackend('/movies/popular');
        trendingGrid.innerHTML = data.map(movieCard).join('');
        attachCardHandlers(trendingGrid);
      } catch (e) {
        trendingGrid.innerHTML = `<div class="empty-state">Failed to load</div>`;
      }
    });
  });
}

// ============================================================
// Hero
// ============================================================
function setHeroFrom(m) {
  if (!m) return;
  const heroBg = $('heroBg');
  if (m.backdrop_path) {
    heroBg.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${m.backdrop_path})`;
    heroBg.classList.add('show');
  }
  $('heroTitle').textContent = m.title || m.name;
  $('heroDesc').textContent = m.overview || 'No synopsis available.';
  $('heroMeta').innerHTML = `
    <div class="pill">★ ${(m.vote_average || 0).toFixed(1)}</div>
    <div class="pill">${(m.release_date || '').slice(0, 4) || '—'}</div>
  `;
  $('heroCta').onclick = () => openModal(m.id);
}

// ============================================================
// Modal
// ============================================================
async function openModal(id) {
  $('modalBg').classList.add('open');
  $('modalContent').className = 'modal-loading';
  $('modalContent').innerHTML = 'Loading…';
  try {
    const m = await fetchFromBackend(`/movie/${id}`);
    const backdrop = m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '';
    $('modalContent').className = '';
    $('modalContent').innerHTML = `
      <div class="modal-hero" style="background-image:url(${backdrop})"></div>
      <div class="modal-body">
        <h2 class="modal-title display">${m.title}</h2>
        <div class="modal-tags">
          <div class="pill">★ ${(m.vote_average || 0).toFixed(1)}</div>
          <div class="pill">${m.release_date || '—'}</div>
          ${m.runtime ? `<div class="pill">${m.runtime} min</div>` : ''}
          ${(m.genres || []).map(g => `<div class="pill">${g.name}</div>`).join('')}
        </div>
        <p class="modal-overview">${m.overview || 'No synopsis available.'}</p>
      </div>
    `;
  } catch (e) {
    $('modalContent').innerHTML = `<div class="modal-loading">Couldn't load details.</div>`;
  }
}

$('modalClose').addEventListener('click', () => $('modalBg').classList.remove('open'));
$('modalBg').addEventListener('click', (e) => {
  if (e.target.id === 'modalBg') $('modalBg').classList.remove('open');
});

// ============================================================
// Search
// ============================================================
let searchTimer;
$('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) {
    searchHead.style.display = 'none';
    searchGrid.innerHTML = '';
    return;
  }
  searchHead.style.display = 'flex';
  searchGrid.innerHTML = skeletonCards(6);
  searchTimer = setTimeout(async () => {
    try {
      const data = await fetchFromBackend(`/movies/search?q=${encodeURIComponent(q)}`);
      searchGrid.innerHTML = data.length
        ? data.map(movieCard).join('')
        : `<div class="empty-state"><div class="display">No matches</div>Try another title.</div>`;
      attachCardHandlers(searchGrid);
    } catch (e) {
      searchGrid.innerHTML = `<div class="empty-state">Search failed.</div>`;
    }
  }, 400);
});

// ============================================================
// Boot
// ============================================================
trendingGrid.innerHTML = skeletonCards(12);
topRatedGrid.innerHTML = skeletonCards(12);

loadTrending();
loadTopRated();
loadGenres();

// Show live status
document.getElementById('statusBadge').textContent = '● Live';
