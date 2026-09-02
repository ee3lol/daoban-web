const TMDB_BASE_URL = process.env.BASE_DAOBAN_API_URL || 'http://localhost:3001';

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const res = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
    },
    next: { revalidate: 3600 }
  });

  if (!res.ok) {
    console.error(`Failed to fetch TMDB endpoint: ${endpoint}`, await res.text());
    return { results: [] };
  }

  return res.json();
}

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

  return fetchFromTMDB('/discover/tv', {
    with_genres: '16',
    with_original_language: 'ja',
    sort_by: 'popularity.desc'
  });
}

export async function getTopRated() {
  return fetchFromTMDB('/movie/top_rated');
}

export async function getTopRatedAnime() {
  return fetchFromTMDB('/discover/tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '500' });
}

export async function getAiringAnime() {

  return fetchFromTMDB('/discover/tv', {
    with_genres: '16',
    with_original_language: 'ja',
    sort_by: 'popularity.desc',
    'first_air_date.gte': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
}

export async function getNowPlayingMovies() {
  return fetchFromTMDB('/movie/now_playing');
}

export async function getUpcomingMovies() {
  return fetchFromTMDB('/movie/upcoming');
}

export async function getPopularTV() {
  return fetchFromTMDB('/tv/popular');
}

export async function getTopRatedTV() {
  return fetchFromTMDB('/tv/top_rated');
}

export async function getAiringTodayTV() {
  return fetchFromTMDB('/tv/airing_today');
}

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
