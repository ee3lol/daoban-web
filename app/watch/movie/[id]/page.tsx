import { getMovieDetails, getTMDBImageUrl } from '@/lib/tmdb';
import WatchPlayer from '@/components/watch-player';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getMovieDetails(resolvedParams.id);

  if (!data || !data.title) return { title: "Movie not found" };

  const title = `Watching ${data.title}`;
  const description = `stream ${data.title} for free in hd on DAOBAN. no bs.`;
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

export default async function WatchMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getMovieDetails(resolvedParams.id);

  if (!data || !data.id) {
    return <div className="p-20 text-center text-white">Movie not found</div>;
  }

  return <WatchPlayer item={data} type="movie" />;
}
