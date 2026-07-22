// Change this to your backend URL when deployed
const API_URL = 'http://localhost:5000/api';
let currentTab = 'movies';

document.addEventListener('DOMContentLoaded', () => {
  fetchMovies();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      search();
    });
  });

  // Search
  document.getElementById('searchBtn').addEventListener('click', search);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') search();
  });
});

async function fetchMovies() {
  try {
    const res = await fetch(`${API_URL}/movies/popular`);
    const data = await res.json();
    renderMovies(data);
  } catch (error) {
    console.error('Error fetching movies:', error);
    document.getElementById('movieGrid').innerHTML = '<p>Failed to load movies.</p>';
  }
}

async function search() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    fetchMovies();
    return;
  }

  let endpoint = '';
  if (currentTab === 'movies') endpoint = `${API_URL}/movies/search?q=${encodeURIComponent(query)}`;
  else if (currentTab === 'anime') endpoint = `${API_URL}/anime/search?q=${encodeURIComponent(query)}`;
  else if (currentTab === 'dramas') endpoint = `${API_URL}/dramas/search?q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    renderMovies(data);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

function renderMovies(movies) {
  const grid = document.getElementById('movieGrid');
  if (!movies || movies.length === 0) {
    grid.innerHTML = '<p>No results found.</p>';
    return;
  }

  grid.innerHTML = movies.map(movie => `
    <div class="card">
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title || movie.name}" />
      <h3>${movie.title || movie.name}</h3>
      <p>${movie.release_date || movie.first_air_date || ''}</p>
      <button class="watch-btn">▶ Watch</button>
    </div>
  `).join('');
}
