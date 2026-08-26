import Link from 'next/link';
import { getMovieGenres, getTVGenres } from '@/lib/tmdb';
import GenreTabs from './genre-tabs';

export default async function GenresPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ tab?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || 'movies';
  
  const data = await (currentTab === 'movies' ? getMovieGenres() : getTVGenres());
  const genres = data?.genres || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative bg-background-light pt-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
      
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#EAE8E3] tracking-tight mb-4">
          Browse by Genre
        </h1>
        <div className="w-24 h-1 bg-accent rounded-full" />
      </div>

      <GenreTabs currentTab={currentTab} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
        {genres.map((genre: { id: number; name: string }) => (
          <Link 
            key={genre.id} 
            href={`/genres/${genre.id}?name=${encodeURIComponent(genre.name)}&type=${currentTab}`}
            className="group relative h-32 md:h-40 rounded-2xl overflow-hidden border border-white/5 bg-[#1a1a1a] flex items-center justify-center shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/10"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#151515] to-[#222222] opacity-80 group-hover:opacity-40 transition-opacity duration-300" />
            
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            
            <h2 className="relative z-10 text-[#EAE8E3] font-bold text-lg md:text-xl tracking-widest uppercase group-hover:text-white transition-colors">
              {genre.name}
            </h2>
          </Link>
        ))}
      </div>

    </main>
  );
}
