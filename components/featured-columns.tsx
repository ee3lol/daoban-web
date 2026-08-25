import Link from 'next/link';
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
  media_type?: string;
}

interface ColumnProps {
  title: string;
  items: Movie[];
}

function Column({ title, items }: ColumnProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col">
      <h2 className="text-[#EAE8E3] text-[13px] md:text-[14px] font-bold tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
        <span className="w-[3px] h-[14px] bg-[#D47A73] rounded-full"></span>
        {title}
      </h2>
      <div className="flex flex-col">
        {items.slice(0, 5).map((item, index) => {
          const displayTitle = item.title || item.name;
          const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
          const year = (item.release_date || item.first_air_date || '').split('-')[0];
          const type = item.media_type === 'tv' || item.name ? 'TV' : 'MOVIE';

          return (
            <Link 
              key={item.id} 
              href={`/${type.toLowerCase()}/${item.id}`} 
              className="group flex items-center gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-3 px-3 rounded-[8px] transition-colors"
            >
              <div className="w-[50px] h-[72px] shrink-0 rounded-[4px] overflow-hidden relative shadow-md bg-[#1a1a1a]">
                <img 
                  src={getTMDBImageUrl(item.poster_path, 'w500')} 
                  alt={displayTitle || 'Poster'}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out"
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center gap-1.5">
                <h3 className="text-[#EAE8E3] text-[13px] font-semibold truncate group-hover:text-[#D47A73] transition-colors leading-tight">
                  {displayTitle}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-[#888888] font-medium tracking-wider">
                  {rating && (
                    <span className="flex items-center gap-1 text-[#EAE8E3]">
                      <Star className="w-[10px] h-[10px] text-[#D47A73] fill-[#D47A73]" />
                      {rating}
                    </span>
                  )}
                  {year && <span>{year}</span>}
                  <span className="bg-white/10 px-1.5 py-0.5 rounded-[2px]">{type}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface FeaturedColumnsProps {
  col1Title: string;
  col1: Movie[];
  col2Title: string;
  col2: Movie[];
  col3Title: string;
  col3: Movie[];
}

export default function FeaturedColumns({ col1Title, col1, col2Title, col2, col3Title, col3 }: FeaturedColumnsProps) {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
        <Column title={col1Title} items={col1} />
        <Column title={col2Title} items={col2} />
        <Column title={col3Title} items={col3} />
      </div>
    </section>
  );
}
