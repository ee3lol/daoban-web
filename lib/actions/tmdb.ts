"use server";

import { getTVSeasonDetails, searchMulti } from '../tmdb';

export async function fetchTVSeason(id: string, seasonNumber: number) {
  return getTVSeasonDetails(id, seasonNumber);
}

export async function searchTMDB(query: string) {
  if (!query) return { results: [] };
  return searchMulti(query);
}
