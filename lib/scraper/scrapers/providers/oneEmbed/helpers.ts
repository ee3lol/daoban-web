export function extractTmdbId(idOrUrl: string): string {
  if (/^\d+$/.test(idOrUrl)) return idOrUrl;
  const match = idOrUrl.match(/(?:movie|tv)\/(\d+)/);
  if (match?.[1]) return match[1];
  return idOrUrl;
}

export function extractYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const year = parseInt(dateStr.split('-')[0] ?? '', 10);
  return isNaN(year) ? undefined : year;
}

export function mapStatus(status?: string): 'Ongoing' | 'Completed' | 'Upcoming' | undefined {
  if (!status) return undefined;
  const lower = status.toLowerCase();
  if (lower.includes('returning') || lower.includes('in production')) return 'Ongoing';
  if (lower.includes('ended') || lower.includes('released') || lower.includes('canceled')) return 'Completed';
  if (lower.includes('planned') || lower.includes('post production')) return 'Upcoming';
  return undefined;
}

export function extractRefererHeaders(m3u8Url: string): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const url = new URL(m3u8Url);
    const referer = url.searchParams.get('referer');
    const origin = url.searchParams.get('origin');
    if (referer) headers['Referer'] = referer;
    if (origin) headers['Origin'] = origin;
  } catch {}
  return headers;
}
