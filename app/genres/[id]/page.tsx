/* eslint-disable @typescript-eslint/no-explicit-any */
import MediaCard from '@/components/media-card';
import { getByGenre } from '@/lib/tmdb';

export default async function GenrePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ name?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const id = resolvedParams.id;
  const name = resolvedSearchParams.name || 'Genre';

  const data = await getByGenre(id);
  const items = data?.results || [];

  return (
    <main className="flex-1 flex flex-col min-h-screen relative bg-background-light pt-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
      
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#EAE8E3] tracking-tight mb-4 uppercase">
          {name}
        </h1>
        <div className="w-24 h-1 bg-accent rounded-full" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-20">
        {items.map((item: any) => (
          <div key={item.id} className="w-full">
            <MediaCard item={item} />
          </div>
        ))}
      </div>

    </main>
  );
}
