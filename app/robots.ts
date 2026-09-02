import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://daoban.lol';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/me', '/watch', '/friends', '/reset-password', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
