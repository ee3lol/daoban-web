import { getTVDetails } from '@/lib/tmdb';
import MediaDetails from '@/components/media-details';

export default async function TVPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getTVDetails(resolvedParams.id);
  
  return <MediaDetails item={data} type="tv" />;
}
