"use server";

import { getByGenre, searchMulti, getTVSeasonDetails, getTrending, getPopularAnime } from '@/lib/tmdb';

export async function fetchByGenreAction(genreId: string, type: 'movie' | 'tv' | 'anime' = 'movie') {
  return await getByGenre(genreId, type);
}

export async function searchTMDB(query: string) {
  return await searchMulti(query);
}

export async function fetchTVSeason(id: string, seasonNumber: number) {
  return await getTVSeasonDetails(id, seasonNumber);
}

export async function fetchTrendingAction(type: 'movie' | 'tv' | 'anime' | 'all' = 'all', timeWindow: 'day' | 'week' = 'day') {
  if (type === 'anime') {
    return await getPopularAnime();
  }
  return await getTrending(type, timeWindow);
}

