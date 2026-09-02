/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

export async function fetchVideoSources(type: 'movie' | 'tv' | 'anime', tmdbId: number, season?: number, episode?: number) {
  try {
    const apiKey = process.env.DAOBAN_API_KEY;
    if (!apiKey) {
      throw new Error("DAOBAN_API_KEY is not configured.");
    }

    const baseUrl = process.env.BASE_DANBAO_API_URL || process.env.DAOBAN_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.daoban.lol' : 'http://localhost:3001');
    let url = `${baseUrl}/api/movie/${tmdbId}`;
    if (type === 'tv' || type === 'anime') {
      if (!season || !episode) throw new Error("Season and episode required for TV/Anime.");
      url = `${baseUrl}/api/tv/${tmdbId}/${season}/${episode}`;
    }

    console.log(`[fetchVideoSources] Trying to fetch from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'x-daoban-api-key': apiKey,
        'Origin': 'https://www.daoban.lol',
        'Referer': 'https://www.daoban.lol/'
      },
      
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "No sources found for this media." };
      }
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data; 
  } catch (error: any) {
    console.error("Error fetching video sources:", error);
    return { success: false, error: error.message || "Failed to fetch sources." };
  }
}
