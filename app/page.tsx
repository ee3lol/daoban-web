import HeroCarousel from '@/components/hero-carousel';
import ContentSection from '@/components/content-section';
import TrendingSection from '@/components/trending-section';
import TopRatedSection from '@/components/top-rated-section';
import FeaturedColumns from '@/components/featured-columns';
import DiscordBanner from '@/components/discord-banner';
import { 
  getTrending, getPopularAnime, getTopRated, getTopRatedTV, getTopRatedAnime,
  getPopularMovies, getPopularTV 
} from '@/lib/tmdb';

export default async function Home() {
  const [
    trendingAllData, trendingMoviesData, trendingTVData, animeData,
    topRatedMoviesData, topRatedTvData, topRatedAnimeData,
    topPicksData, mostLovedData, trendingRightNowData
  ] = await Promise.all([
    getTrending('all', 'day'),
    getTrending('movie', 'day'),
    getTrending('tv', 'day'),
    getPopularAnime(),
    getTopRated(),
    getTopRatedTV(),
    getTopRatedAnime(),
    getTrending('all', 'week'),
    getPopularMovies(),
    getPopularTV()
  ]);

  const top10 = trendingAllData?.results?.slice(0, 10) || [];
  const movies = trendingMoviesData?.results?.slice(0, 15) || [];
  const tv = trendingTVData?.results?.slice(0, 15) || [];
  const anime = animeData?.results?.slice(0, 15) || [];

  const trMovies = topRatedMoviesData?.results?.slice(0, 15) || [];
  const trTv = topRatedTvData?.results?.slice(0, 15) || [];
  const trAnime = topRatedAnimeData?.results?.slice(0, 15) || [];

  const topPicks = topPicksData?.results?.slice(0, 10) || [];
  const mostLoved = mostLovedData?.results?.slice(0, 10) || [];
  const trendingRightNow = trendingRightNowData?.results?.slice(0, 10) || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-background-light">
      
      {/* Hero Section */}
      <HeroCarousel movies={top10} />

      {/* Content Grids */}
      <div className="flex flex-col gap-4 mt-8 pb-10 relative z-20">
        <ContentSection title="TOP 10 Today" items={top10} showRank />
        <TrendingSection movies={movies} tv={tv} anime={anime} />
        <TopRatedSection movies={trMovies} tv={trTv} anime={trAnime} />
      </div>

      {/* 3-Column Featured Lists */}
      <FeaturedColumns 
        col1Title="Top Picks This Week" col1={topPicks}
        col2Title="Most Loved Titles" col2={mostLoved}
        col3Title="Trending Right Now" col3={trendingRightNow}
      />

      {/* Discord CTA */}
      <div className="pb-20">
        <DiscordBanner />
      </div>

    </main>
  );
}
