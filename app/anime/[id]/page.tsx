import { getTVDetails, getTMDBImageUrl } from '@/lib/tmdb';
import MediaDetails from '@/components/media-details';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getTVDetails(resolvedParams.id);

  if (!data || !data.name) return { title: "Anime not found" };

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

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getTVDetails(resolvedParams.id);
  
  if (!data) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: data.name,
    image: getTMDBImageUrl(data.poster_path, 'original'),
    description: data.overview,
    dateCreated: data.first_air_date,
    creator: {
      '@type': 'Person',
      name: data.created_by?.[0]?.name || 'Unknown'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MediaDetails item={data} type="anime" />
    </>
  );
}
