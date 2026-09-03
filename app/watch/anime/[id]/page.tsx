import { getTVDetails } from '@/lib/tmdb';
import WatchPlayer from '@/components/watch-player';

export default async function WatchAnimePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ season?: string, episode?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getTVDetails(resolvedParams.id);
  
  if (!data || !data.id) {
    return <div className="p-20 text-center text-white">Anime not found</div>;
  }

  const season = resolvedSearchParams.season ? parseInt(resolvedSearchParams.season) : undefined;
  const episode = resolvedSearchParams.episode ? parseInt(resolvedSearchParams.episode) : undefined;

  return <WatchPlayer item={data} type="anime" defaultSeason={season} defaultEpisode={episode} />;
}
