import HeroCarousel from '@/components/hero-carousel';
import ContentSection from '@/components/content-section';
import { getPopularTV, getTopRatedTV, getAiringTodayTV } from '@/lib/tmdb';

export default async function TVPage() {
  const [popularData, topRatedData, airingData] = await Promise.all([
    getPopularTV(),
    getTopRatedTV(),
    getAiringTodayTV()
  ]);

  const popular = popularData?.results || [];
  const topRated = topRatedData?.results || [];
  const airing = airingData?.results || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden bg-[#151515]">
      
      <HeroCarousel movies={popular} />

      <div className="flex flex-col gap-4 mt-8 pb-20 relative z-20">
        <ContentSection title="Popular TV Shows" items={popular} />
        <ContentSection title="Airing Today" items={airing} />
        <ContentSection title="Top Rated Series" items={topRated} />
      </div>

    </main>
  );
}
