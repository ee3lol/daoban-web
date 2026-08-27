"use server";

import { scraperManager } from '../scraper';

export async function fetchVideoSources(type: 'movie' | 'tv' | 'anime', tmdbId: number, season?: number, episode?: number) {
  try {
    const tmdbIdStr = tmdbId.toString();
    const scraperType = type === 'anime' ? 'tv' : type;

    // Use ScraperManager directly instead of HTTP fetch!
    const [details, sources] = await Promise.all([
      scraperManager.getDetails(tmdbIdStr),
      scraperManager.getSources({
        type: scraperType,
        tmdbId: tmdbIdStr,
        season,
        episode,
      })
    ]);

    if (!sources || sources.length === 0) {
      return { success: false, error: "No sources found for this media." };
    }

    return {
      success: true,
      media: details,
      sources,
    };
  } catch (error: any) {
    console.error("Error fetching video sources:", error);
    return { success: false, error: error.message || "Failed to fetch sources." };
  }
}
