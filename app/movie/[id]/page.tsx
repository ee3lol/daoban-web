import { getMovieDetails } from '@/lib/tmdb';
import MediaDetails from '@/components/media-details';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getMovieDetails(resolvedParams.id);
  
  return <MediaDetails item={data} type="movie" />;
}
