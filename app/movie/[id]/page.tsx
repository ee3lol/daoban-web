import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import MediaDetails from '@/components/media-details';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getMovieDetails(resolvedParams.id);

  if (!data || !data.title) return { title: "Movie not found" };

  const title = data.title;
  const description = data.overview ? data.overview.slice(0, 160) + '...' : `info about ${title}`;
  const image = getTMDBImageUrl(data.backdrop_path || data.poster_path, 'w500');

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [image],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [image],
    }
  };
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getMovieDetails(resolvedParams.id);

  if (!data) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: data.title,
    image: getTMDBImageUrl(data.poster_path, 'original'),
    description: data.overview,
    dateCreated: data.release_date,
    director: {
      '@type': 'Person',
      name: data.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Unknown'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MediaDetails item={data} type="movie" />
    </>
  );
}
