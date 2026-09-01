import Link from 'next/link';
import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/tmdb';

interface WatchHistoryItem {
  id: string;
  mediaId: number;
  mediaType: string;
  season: number | null;
  episode: number | null;
  progress: number;
  duration: number;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
}

export default function ContinueWatchingCard({ item }: { item: WatchHistoryItem }) {
  if (!item.posterPath) return null;

  const percentage = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;

  const remainingSeconds = item.duration - item.progress;
  let remainingText = '';
  if (remainingSeconds > 0) {
    if (remainingSeconds < 60) {
      remainingText = `${Math.floor(remainingSeconds)}s left`;
    } else if (remainingSeconds < 3600) {
      remainingText = `${Math.floor(remainingSeconds / 60)}m left`;
    } else {
      remainingText = `${Math.floor(remainingSeconds / 3600)}h ${Math.floor((remainingSeconds % 3600) / 60)}m left`;
    }
  }

  let href = item.mediaType === 'tv'
    ? `/watch/tv/${item.mediaId}?season=${item.season || 1}&episode=${item.episode || 1}`
    : `/watch/movie/${item.mediaId}`;

  return (
    <Link
      href={href}
      className="group relative w-full aspect-[16/9] block rounded-xl overflow-hidden cursor-pointer shrink-0 snap-start bg-[#111111] shadow-2xl border border-white/5 hover:border-accent/50 transition-all duration-500"
    >
      <Image
        src={getTMDBImageUrl(item.backdropPath || item.posterPath, 'w500')}
        alt={item.title}
        fill
        sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-70 group-hover:opacity-100"
      />

      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
        <div className="w-14 h-14 rounded-full bg-accent/90 backdrop-blur-md text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end z-20">
        <h3 className="text-white font-bold text-[14px] sm:text-[16px] line-clamp-1 leading-snug drop-shadow-xl mb-1 group-hover:text-accent transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[#888888] text-[11px] sm:text-[12px] font-bold tracking-widest uppercase">
            {item.season && item.episode ? `S${item.season} E${item.episode}` : 'Movie'}
          </span>
          {remainingText && (
            <span className="text-white text-[11px] font-medium tracking-wider bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
              {remainingText}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-20">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
