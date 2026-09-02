import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DAOBAN',
    short_name: 'DAOBAN',
    description: 'Means "Pirated" / "Bootleg"',
    start_url: '/',
    display: 'standalone',
    background_color: '#151515',
    theme_color: '#151515',
    icons: [
      {
        src: '/chinaicon.png',
        sizes: '192x192 512x512',
        type: 'image/png',
      },
    ],
  }
}
