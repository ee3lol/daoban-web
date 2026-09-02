import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of common scraper/bot user agents (excluding good bots like Googlebot)
const BAD_BOTS = [
  'python-requests',
  'python-urllib',
  'scrapy',
  'curl',
  'wget',
  'httpclient',
  'java',
  'libwww',
  'ruby',
  'perl',
  'php',
  'bot',
  'spider',
  'crawl',
  'headless',
  'puppeteer',
  'playwright',
  'phantomjs',
];

// List of good bots that should NOT be blocked (essential for SEO)
const GOOD_BOTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'twitterbot',
  'facebookexternalhit',
  'discordbot',
];

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // 1. Let good bots pass (SEO)
  const isGoodBot = GOOD_BOTS.some((bot) => userAgent.includes(bot));
  if (isGoodBot) {
    return NextResponse.next();
  }

  // 2. Check for bad bots/scrapers
  const isBadBot = BAD_BOTS.some((bot) => userAgent.includes(bot));
  
  // If a known bad bot is detected, stealthily rewrite their request to the Tar Pit!
  // They will think they are accessing the page they requested, but will get stuck
  // in a 5-minute loading loop that ends with a troll message.
  if (isBadBot && !request.nextUrl.pathname.startsWith('/api/v1/system/export')) {
    console.log(`[Troll Middleware] Trapped a bot: ${userAgent} on ${request.nextUrl.pathname}`);
    return NextResponse.rewrite(new URL('/api/v1/system/export', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
