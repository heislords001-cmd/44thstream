const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const PORT = process.env.PORT || 5000;

// ============================
// MOVIES (TMDB)
// ============================

app.get('/api/movies/popular', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/popular',
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
    );
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/movies/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
    );
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/movie/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?append_to_response=videos`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Movie details failed' });
  }
});

app.get('/api/movies/trending', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.themoviedb.org/3/trending/movie/week',
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
    );
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// ============================
// ANIME (Consumet - Animepahe)
// ============================

app.get('/api/anime/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    const response = await axios.get(
      `https://api.consumet.org/anime/animepahe?query=${encodeURIComponent(query)}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Anime search failed' });
  }
});

app.get('/api/anime/info', async (req, res) => {
  const animeId = req.query.id;
  if (!animeId) return res.status(400).json({ error: 'Anime ID required' });
  try {
    const response = await axios.get(
      `https://api.consumet.org/anime/animepahe/info/${animeId}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
});

app.get('/api/anime/episodes', async (req, res) => {
  const animeId = req.query.id;
  const page = req.query.page || 1;
  if (!animeId) return res.status(400).json({ error: 'Anime ID required' });
  try {
    const response = await axios.get(
      `https://api.consumet.org/anime/animepahe/episodes/${animeId}?page=${page}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

app.get('/api/anime/watch', async (req, res) => {
  const episodeId = req.query.id;
  if (!episodeId) return res.status(400).json({ error: 'Episode ID required' });
  try {
    const response = await axios.get(
      `https://api.consumet.org/anime/animepahe/watch/${episodeId}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get watch links' });
  }
});

app.get('/api/anime/trending', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.consumet.org/anime/animepahe/top-airing'
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending anime' });
  }
});

// ============================
// KOREAN DRAMAS (Consumet - Dramacool)
// ============================

app.get('/api/dramas/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    const response = await axios.get(
      `https://api.consumet.org/movies/dramacool/${encodeURIComponent(query)}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Drama search failed' });
  }
});

app.get('/api/dramas/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Drama ID required' });
  try {
    const response = await axios.get(
      `https://api.consumet.org/movies/dramacool/info?id=${id}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drama info' });
  }
});

app.get('/api/dramas/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  const mediaId = req.query.mediaId;
  if (!episodeId || !mediaId) {
    return res.status(400).json({ error: 'Episode ID and Media ID required' });
  }
  try {
    const response = await axios.get(
      `https://api.consumet.org/movies/dramacool/watch?episodeId=${episodeId}&mediaId=${mediaId}&server=asianload`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get drama watch links' });
  }
});

app.get('/api/dramas/latest', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.consumet.org/movies/dramacool/recently-updated'
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest dramas' });
  }
});

// ============================
// START SERVER
// ============================

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
