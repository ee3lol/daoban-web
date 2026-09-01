import HeroCarousel from '@/components/hero-carousel';
import ContentSection from '@/components/content-section';
import { getPopularAnime, getTopRatedAnime, getAiringAnime } from '@/lib/tmdb';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Anime",
  description: "stream your favorite anime for free. all the good stuff, no bs.",
};

export default async function AnimePage() {
  const [popularData, topRatedData, airingData] = await Promise.all([
    getPopularAnime(),
    getTopRatedAnime(),
    getAiringAnime()
  ]);

  const popular = popularData?.results || [];
  const topRated = topRatedData?.results || [];
  const airing = airingData?.results || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-background-light">
      
      {}
      <HeroCarousel movies={topRated} />

      {}
      <div className="flex flex-col gap-4 mt-8 pb-20 relative z-20">
        <ContentSection title="Popular Anime" items={popular} />
        <ContentSection title="Airing Recently" items={airing} />
        <ContentSection title="Highest Rated of All Time" items={topRated} />
      </div>

    </main>
  );
}
