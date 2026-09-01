import { getTVDetails, getTMDBImageUrl } from '@/lib/tmdb';
import MediaDetails from '@/components/media-details';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getTVDetails(resolvedParams.id);

  if (!data || !data.name) return { title: "TV Show not found" };

  const title = data.name;
  const description = data.overview ? data.overview.slice(0, 160) + '...' : `info about ${title}`;
  const image = getTMDBImageUrl(data.backdrop_path || data.poster_path, 'w500');

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [image],
      type: 'video.tv_show',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [image],
    }
  };
}

export default async function TVPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getTVDetails(resolvedParams.id);

  return <MediaDetails item={data} type="tv" />;
}
