
import Link from 'next/link';
import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/tmdb';
import { Star } from 'lucide-react';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  watch_provider?: {
    logo_path: string;
    provider_name: string;
  };
}

export default function MediaCard({ item, rank }: { item: Movie, rank?: number }) {
  if (!item.poster_path) return null;

  const title = item.title || item.name;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const year = (item.release_date || item.first_air_date || '').split('-')[0];

  let type = item.title ? 'movie' : 'tv';
  if (item.media_type) {
    type = item.media_type;
  }
  
  if (type === 'tv' && (item as any).original_language === 'ja' && (item as any).genre_ids?.includes(16)) {
    type = 'anime';
  }

  return (
    <Link
      href={`/${type}/${item.id}`}
      className="group relative w-full aspect-[2/3] block rounded-[12px] overflow-hidden cursor-pointer shrink-0 snap-start bg-[#1a1a1a] shadow-lg"
    >
      {}
      <Image
        src={getTMDBImageUrl(item.poster_path, 'w500')}
        alt={title!}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

      {}
      {rank !== undefined && rank <= 10 && (
        <div className="absolute top-0 left-3 z-30 w-7 h-9 bg-black/40 backdrop-blur-md border border-white/10 border-t-0 flex items-end justify-center pb-1.5 shadow-md pointer-events-none rounded-b-[6px]">
          <span className="font-bold text-[13px] text-accent leading-none">{rank}</span>
        </div>
      )}

      {}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex flex-col justify-end z-20">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <h3 className="text-[#EAE8E3] font-bold text-[12px] sm:text-[14px] line-clamp-2 leading-snug drop-shadow-xl">
            {title}
          </h3>

          <div className="flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[#888888] group-hover:text-[#EAE8E3] transition-colors text-[10px] sm:text-[11px] font-semibold tracking-wider">{year}</span>
            {rating && rating !== '0.0' && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-accent text-accent" />
                <span className="text-accent font-bold text-[10px] sm:text-[11px] drop-shadow-md">{rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
