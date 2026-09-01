import { getTVDetails, getTMDBImageUrl } from '@/lib/tmdb';
import WatchPlayer from '@/components/watch-player';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ season?: string, episode?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getTVDetails(resolvedParams.id);

  if (!data || !data.name) return { title: "TV Show not found" };

  let title = `Watching ${data.name}`;
  if (resolvedSearchParams.season && resolvedSearchParams.episode) {
    title = `Watching ${data.name} S${resolvedSearchParams.season}E${resolvedSearchParams.episode}`;
  }

  const description = `stream ${data.name} for free in hd on DAOBAN. no bs.`;
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

export default async function WatchTVPage({
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
    return <div className="p-20 text-center text-white">TV Show not found</div>;
  }

  const season = resolvedSearchParams.season ? parseInt(resolvedSearchParams.season) : undefined;
  const episode = resolvedSearchParams.episode ? parseInt(resolvedSearchParams.episode) : undefined;

  return <WatchPlayer item={data} type="tv" defaultSeason={season} defaultEpisode={episode} />;
}