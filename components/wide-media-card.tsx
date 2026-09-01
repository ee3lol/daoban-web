
import Link from 'next/link';
import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/tmdb';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
}

export default function WideMediaCard({ item }: { item: Movie }) {
  if (!item.backdrop_path && !item.poster_path) return null;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').split('-')[0];

  let type = item.title ? 'movie' : 'tv';
  if (item.media_type) {
    type = item.media_type;
  }
  if (type === 'tv' && (item as any).original_language === 'ja' && (item as any).genre_ids?.includes(16)) {
    type = 'anime';
  }

  let href = `/${type}/${item.id}`;

  return (
    <Link
      href={href}
      className="group relative w-full aspect-[16/9] block rounded-[8px] overflow-hidden cursor-pointer shrink-0 snap-start bg-[#1a1a1a] shadow-lg border border-white/5 hover:border-white/20 transition-all duration-300"
    >
      <Image
        src={getTMDBImageUrl(item.backdrop_path || item.poster_path, 'w500')}
        alt={title!}
        fill
        sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
      />

      <div className="absolute inset-x-0 bottom-0 h-[80%] bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent opacity-100" />

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 bg-black/20 backdrop-blur-[2px]">
        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex flex-col justify-end z-20">
        <h3 className="text-[#EAE8E3] font-bold text-[13px] sm:text-[15px] line-clamp-1 leading-snug drop-shadow-xl">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-1 mb-2">
          <span className="text-[#888888] text-[10px] sm:text-[11px] font-semibold tracking-wider">
            {type === 'movie' ? 'Movie' : 'TV Show'}
          </span>
          <span className="text-white/70 text-[10px] sm:text-[11px] font-medium tracking-wider">
            {year}
          </span>
        </div>
      </div>
    </Link>
  );
}
