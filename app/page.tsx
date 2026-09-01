import HeroCarousel from '@/components/hero-carousel';
import ContentSection from '@/components/content-section';

import GenreContentSection from '@/components/genre-content-section';
import DiscordBanner from '@/components/discord-banner';
import ContinueWatchingSection from '@/components/continue-watching-section';
import { getWatchHistory } from '@/lib/actions/history';
import { 
  getTrending, getPopularAnime, getMovieGenres,
  getNowPlayingMovies
} from '@/lib/tmdb';

export default async function Home() {
  const [
    trendingAllData,
    nowPlayingData, genresData,
    watchHistory
  ] = await Promise.all([
    getTrending('all', 'day'),
    getNowPlayingMovies(),
    getMovieGenres(),
    getWatchHistory()
  ]);

  const top10 = trendingAllData?.results?.slice(0, 10) || [];

  const nowPlaying = nowPlayingData?.results?.slice(0, 15) || [];
  const genres = genresData?.genres || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-background-light">
      
      {/* HERO */}
      <HeroCarousel movies={top10} />

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4 mt-8 pb-10 relative z-20">
        {watchHistory && watchHistory.length > 0 && (
          <ContinueWatchingSection items={watchHistory.slice(0, 10)} />
        )}

        {/* Top 10 Today — has rank badges so it's already distinct */}
        <ContentSection title="TOP 10 Today" items={top10} showRank />

        {/* Interactive Genre Section with Dropdown & Tabs */}
        <GenreContentSection genres={genres} />


        {/* Now Playing in Theaters — fresh daily content */}
        <ContentSection title="Now Playing in Theaters" items={nowPlaying} />
      </div>



      {/* Discord Banner */}
      <div className="pb-20">
        <DiscordBanner />
      </div>

    </main>
  );
}
