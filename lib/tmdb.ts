const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getHeaders() {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) {
    console.warn('TMDB_READ_ACCESS_TOKEN is missing from .env.local');
  }
  return {
    accept: 'application/json',
    Authorization: `Bearer ${token}`
  };
}

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 3600 } // Cache for 1 hour to keep it fast
  });

  if (!res.ok) {
    console.error(`Failed to fetch TMDB endpoint: ${endpoint}`, await res.text());
    return { results: [] };
  }

  return res.json();
}

// Utility to get image URLs
export function getTMDBImageUrl(path: string, size: 'w500' | 'original' = 'original') {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function getTrending(type: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'day') {
  return fetchFromTMDB(`/trending/${type}/${timeWindow}`);
}

export async function getPopularMovies() {
  return fetchFromTMDB('/movie/popular');
}

export async function getPopularAnime() {
  // Animation genre ID is 16. Using discover API.
  return fetchFromTMDB('/discover/tv', {
    with_genres: '16',
    with_original_language: 'ja',
    sort_by: 'popularity.desc'
  });
}

export async function getTopRated() {
  return fetchFromTMDB('/movie/top_rated');
}

// Anime
export async function getTopRatedAnime() {
  return fetchFromTMDB('/discover/tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '500' });
}

export async function getAiringAnime() {
  // Rough approximation of currently airing anime
  return fetchFromTMDB('/discover/tv', { 
    with_genres: '16', 
    with_original_language: 'ja', 
    sort_by: 'popularity.desc', 
    'first_air_date.gte': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
  });
}

// Movies
export async function getNowPlayingMovies() {
  return fetchFromTMDB('/movie/now_playing');
}

export async function getUpcomingMovies() {
  return fetchFromTMDB('/movie/upcoming');
}

// TV
export async function getPopularTV() {
  return fetchFromTMDB('/tv/popular');
}

export async function getTopRatedTV() {
  return fetchFromTMDB('/tv/top_rated');
}

export async function getAiringTodayTV() {
  return fetchFromTMDB('/tv/airing_today');
}

// Genres
export async function getMovieGenres() {
  return fetchFromTMDB('/genre/movie/list');
}

export async function getTVGenres() {
  return fetchFromTMDB('/genre/tv/list');
}

export async function getByGenre(genreId: string, type: 'movie' | 'tv' | 'anime' = 'movie', page = 1) {
  if (type === 'anime') {
    return fetchFromTMDB(`/discover/tv`, { 
      with_genres: `16,${genreId}`, 
      with_original_language: 'ja', 
      sort_by: 'popularity.desc',
      page: page.toString()
    });
  }
  return fetchFromTMDB(`/discover/${type}`, { 
    with_genres: genreId, 
    sort_by: 'popularity.desc',
    page: page.toString()
  });
}

export async function getMovieDetails(id: string) {
  return fetchFromTMDB(`/movie/${id}`, {
    append_to_response: 'videos,images,credits,similar,recommendations'
  });
}

export async function getTVDetails(id: string) {
  return fetchFromTMDB(`/tv/${id}`, {
    append_to_response: 'videos,images,credits,similar,recommendations'
  });
}

export async function getTVSeasonDetails(id: string, seasonNumber: number) {
  return fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
}

export async function searchMulti(query: string) {
  return fetchFromTMDB('/search/multi', { 
    query, 
    include_adult: 'false'
  });
}
