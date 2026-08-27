import { ScraperMetadata } from '../types/scraper';
import { MediaDetails, StreamSource, Subtitle } from '../types/media';
import { AxiosInstance } from 'axios';
import { Logger } from '../utils/logger';

export interface ScraperSourceOptions {
  type: 'movie' | 'tv';
  tmdbId: string;
  season?: number;
  episode?: number;
}

export abstract class BaseScraper {
  abstract metadata: ScraperMetadata;
  protected client!: AxiosInstance;
  protected logger!: Logger;

  /**
   * Fetch details for a specific TMDB ID.
   * Universal across scrapers (we only need one to succeed).
   */
  abstract getDetails(tmdbId: string): Promise<MediaDetails | null>;

  /**
   * Fetch playable stream sources.
   * Can be run concurrently across all scrapers.
   */
  abstract getStreamSources(options: ScraperSourceOptions): Promise<StreamSource[]>;

  /**
   * Fetch available subtitles.
   */
  abstract getSubtitles(options: ScraperSourceOptions): Promise<Subtitle[]>;
}
