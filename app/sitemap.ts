import { MetadataRoute } from 'next';
import { getTrending } from '@/lib/tmdb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://daoban.lol';
  
  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tv`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/anime`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/genres`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/social`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    // Fetch top trending movies and TV shows for dynamic sitemap generation
    const [trendingMovies, trendingTV] = await Promise.all([
      getTrending('movie', 'week'),
      getTrending('tv', 'week')
    ]);

    if (trendingMovies?.results) {
      trendingMovies.results.slice(0, 50).forEach((movie: any) => {
        routes.push({
          url: `${baseUrl}/movie/${movie.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    }

    if (trendingTV?.results) {
      trendingTV.results.slice(0, 50).forEach((tv: any) => {
        routes.push({
          url: `${baseUrl}/tv/${tv.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
