import HeroCarousel from '@/components/hero-carousel';
import ContentSection from '@/components/content-section';
import { getPopularMovies, getNowPlayingMovies, getUpcomingMovies, getTopRated } from '@/lib/tmdb';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Movies",
  description: "browse all the best movies to stream for free right now. no bs.",
};

export default async function MoviesPage() {
  const [popularData, nowPlayingData, upcomingData, topRatedData] = await Promise.all([
    getPopularMovies(),
    getNowPlayingMovies(),
    getUpcomingMovies(),
    getTopRated()
  ]);

  const popular = popularData?.results || [];
  const nowPlaying = nowPlayingData?.results || [];
  const upcoming = upcomingData?.results || [];
  const topRated = topRatedData?.results || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-background-light">
      
      <HeroCarousel movies={nowPlaying} />

      <div className="flex flex-col gap-4 mt-8 pb-20 relative z-20">
        <ContentSection title="Now Playing in Theaters" items={nowPlaying} />
        <ContentSection title="Popular Movies" items={popular} />
        <ContentSection title="Upcoming Releases" items={upcoming} />
        <ContentSection title="Critically Acclaimed" items={topRated} />
      </div>

    </main>
  );
}
