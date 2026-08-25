import { getMovieDetails } from '@/lib/tmdb';
import WatchPlayer from '@/components/watch-player';

export default async function WatchMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getMovieDetails(resolvedParams.id);
  
  if (!data || !data.id) {
    return <div className="p-20 text-center text-white">Movie not found</div>;
  }

  return <WatchPlayer item={data} type="movie" />;
}
