import { getTVDetails } from '@/lib/tmdb';
import WatchPlayer from '@/components/watch-player';

export default async function WatchAnimePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getTVDetails(resolvedParams.id);
  
  if (!data || !data.id) {
    return <div className="p-20 text-center text-white">Anime not found</div>;
  }

  return <WatchPlayer item={data} type="anime" />;
}
