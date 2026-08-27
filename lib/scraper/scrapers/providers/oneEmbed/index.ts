import { BaseScraper } from '../../base';
import { MediaDetails, SearchResult, StreamSource, Subtitle } from '../../../types/media';
import { ScraperMetadata, SearchOptions } from '../../../types/scraper';
import {
  TokenResponse,
  TokenResponseSchema,
  StreamResponse,
  StreamResponseSchema,
  TmdbDetailsResponse,
  TmdbDetailsResponseSchema,
  TvEpisodesResponse,
  TvEpisodesResponseSchema,
  SubtitlesResponse,
  SubtitlesResponseSchema,
  OneEmbedSourceOptions,
  OneEmbedSubtitle,
  SERVERS,
  StreamsData,
} from './types';
import { createHttpClient, handleAxiosError } from '../../../utils/http';
import { Logger } from '../../../utils/logger';
import { ErrorCode, ScraperError } from '../../../errors/scraper';
import { extractTmdbId, extractYear, mapStatus, extractRefererHeaders } from './helpers';
const BASE_URL = 'https://1embed.cc';
const TOKEN_TTL_MS = 60 * 1000; // 1 minute
export class OneEmbedScraper extends BaseScraper {
  metadata: ScraperMetadata = {
    id: '1embed',
    name: '1Embed',
    baseUrl: BASE_URL,
    supportedTypes: ['movie', 'tv'],
  };
  private token: string | null = null;
  private tokenExpiresAt = 0;
  constructor() {
    super();
    this.client = createHttpClient(BASE_URL, {
      Referer: `${BASE_URL}/`,
      Origin: BASE_URL,
      Accept: 'application/json, text/plain, */*',
    });
    this.logger = new Logger('OneEmbedScraper');
  }
  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    this.logger.debug('fetching new token...');
    try {
      const { data } = await this.client.get('/api/token');
      const parsed: TokenResponse = TokenResponseSchema.parse(data);
      this.token = parsed.token;
      this.tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
      this.logger.info(`got token: ${this.token} (expires in ${parsed.expires_in}s)`);
      return this.token;
    } catch (error) {
      throw new ScraperError(
        'Failed to fetch auth token from 1embed.cc',
        ErrorCode.NETWORK_ERROR,
        this.metadata.name,
        error,
      );
    }
  }
  private async authenticatedGet<T>(path: string): Promise<T> {
    const token = await this.getToken();
    const separator = path.includes('?') ? '&' : '?';
    const url = `${path}${separator}_st=${token}`;
    const { data } = await this.client.get(url, {
      headers: {
        'X-Stream-Token': token,
      },
    });
    return data as T;
  }
  async search(_query: string, _options?: SearchOptions): Promise<SearchResult[]> {
    this.logger.warn('1embed does not support search, use tmdb ids directly');
    throw new ScraperError(
      '1embed.cc does not have a search API. Pass a TMDB ID to getDetails() or getStreamSources() directly.',
      ErrorCode.INVALID_INPUT,
      this.metadata.name,
    );
  }
  async getDetails(idOrUrl: string): Promise<MediaDetails> {
    const tmdbId = extractTmdbId(idOrUrl);
    this.logger.info(`fetching details for id: ${tmdbId}`);
    try {
      const raw = await this.authenticatedGet<TmdbDetailsResponse>(
        `/api/tmdb/details?type=movie&id=${tmdbId}`,
      );
      const tmdb = TmdbDetailsResponseSchema.parse(raw);
      const mediaType = tmdb.number_of_seasons ? 'tv' : 'movie';
      const details: MediaDetails = {
        id: tmdbId,
        title: tmdb.title || tmdb.name || 'Unknown',
        description: tmdb.overview,
        poster: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : undefined,
        cover: tmdb.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`
          : undefined,
        type: mediaType,
        releaseYear: extractYear(tmdb.release_date || tmdb.first_air_date),
        status: mapStatus(tmdb.status),
        genres: tmdb.genres?.map(g => g.name) ?? [],
        rating: tmdb.vote_average,
        episodes: [],
        sources: [],
      };
      return details;
    } catch (error) {
      if (error instanceof ScraperError) throw error;
      handleAxiosError(error, this.metadata.name);
    }
  }
  async getTvEpisodes(tmdbId: string, season: number): Promise<TvEpisodesResponse> {
    this.logger.info(`fetching episodes for id: ${tmdbId}, season: ${season}`);
    try {
      const raw = await this.authenticatedGet<TvEpisodesResponse>(
        `/api/tv/episodes?id=${tmdbId}&season=${season}`,
      );
      return TvEpisodesResponseSchema.parse(raw);
    } catch (error) {
      if (error instanceof ScraperError) throw error;
      handleAxiosError(error, this.metadata.name);
    }
  }
  async getSources(episodeIdOrUrl: string): Promise<StreamSource[]> {
    return this.getStreamSources({
      type: 'movie',
      tmdbId: extractTmdbId(episodeIdOrUrl),
    });
  }
  async getStreamSources(options: OneEmbedSourceOptions): Promise<StreamSource[]> {
    const { type, tmdbId, season, episode, title, serverId } = options;
    const sources: StreamSource[] = [];
    const serversToTry = serverId ? SERVERS.filter(s => s.id === serverId) : SERVERS;
    this.logger.info(
      `extracting streams for ${type} id:${tmdbId}` +
      (type === 'tv' ? ` s${season}e${episode}` : '') +
      ` trying ${serversToTry.length} servers`,
    );
    for (const server of serversToTry) {
      try {
        const streamResponse = await this.fetchFromServer(server.endpoint, server.id, {
          type,
          tmdbId,
          season,
          episode,
          title,
        });
        if (!streamResponse.success) {
          this.logger.warn(`${server.id}: ${streamResponse.error || 'no stream available'}`);
          continue;
        }
        const streamSource = this.parseStreamResponse(streamResponse, server.id);
        if (streamSource) {
          sources.push(streamSource);
          this.logger.info(`${server.id}: got source`);
          break; // We only need 1 working source!
        }
      } catch (error) {
        this.logger.warn(
          `${server.id} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    if (sources.length === 0) {
      this.logger.error(`no streams found for ${type} id:${tmdbId}`);
    }
    return sources;
  }
  private async fetchFromServer(
    endpoint: string,
    serverId: string,
    opts: {
      type: string;
      tmdbId: string;
      season?: number | undefined;
      episode?: number | undefined;
      title?: string | undefined;
    },
  ): Promise<StreamResponse> {
    let url: string;
    if (opts.type === 'tv') {
      url =
        `${endpoint}/id=${opts.tmdbId}?s=${opts.season ?? 1}&e=${opts.episode ?? 1}&type=tv` +
        (opts.title ? `&title=${encodeURIComponent(opts.title)}` : '') +
        `&server=${encodeURIComponent(serverId)}`;
    } else {
      url =
        `${endpoint}/id=${opts.tmdbId}?type=movie` +
        (opts.title ? `&title=${encodeURIComponent(opts.title)}` : '') +
        `&server=${encodeURIComponent(serverId)}`;
    }
    this.logger.debug(`Fetching from server: ${url}`);
    const raw = await this.authenticatedGet<StreamResponse>(url);
    return StreamResponseSchema.parse(raw);
  }
  /**
   * Parse a stream response into our normalized StreamSource format.
   * Prioritizes raw_m3u8 (direct source) over proxied URLs.
   */
  private parseStreamResponse(response: StreamResponse, serverId: string): StreamSource | null {
    const streams: StreamsData | undefined = response.streams;
    // Priority: proxy_m3u8 (works reliably via 1embed proxy) > raw_m3u8 > streamUrl
    const m3u8Url = streams?.proxy_m3u8 || streams?.raw_m3u8 || streams?.m3u8 || response.streamUrl;
    if (!m3u8Url) {
      return null;
    }
    return {
      quality: 'auto',
      url: m3u8Url,
      isM3U8: true,
      isMP4: false,
      serverName: `1embed-${serverId}`,
      headers: extractRefererHeaders(m3u8Url),
      subtitles: response.subtitles
        ?.filter((s): s is OneEmbedSubtitle & { url: string } => !!s.url || !!s.file)
        .map(s => ({
          lang: s.lang || s.label || 'unknown',
          url: s.url || s.file || '',
          format: 'vtt' as const,
        })),
    };
  }
  async getSubtitles(
    options: import('../../base').ScraperSourceOptions,
  ): Promise<Subtitle[]> {
    const { tmdbId, type, season = 1, episode = 1 } = options;
    this.logger.info(
      `fetching subtitles for ${type} id:${tmdbId}` +
      (type === 'tv' ? ` s${season}e${episode}` : ''),
    );
    try {
      const raw = await this.authenticatedGet<SubtitlesResponse>(
        `/api/subtitles?type=${type}&id=${tmdbId}&s=${season}&e=${episode}`,
      );
      const parsed = SubtitlesResponseSchema.parse(raw);
      return (parsed.subtitles || [])
        .filter((s): s is OneEmbedSubtitle & { url: string } => !!s.url || !!s.file)
        .map(s => ({
          lang: s.lang || s.label || 'unknown',
          url: s.url || s.file || '',
          format: 'vtt' as const,
        }));
    } catch (error) {
      if (error instanceof ScraperError) throw error;
      handleAxiosError(error, this.metadata.name);
    }
  }
}
