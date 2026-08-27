import { BaseScraper, ScraperSourceOptions } from './base';
import { StreamSource, MediaDetails, Subtitle } from '../types/media';
import { Logger } from '../utils/logger';
export class ScraperManager {
  private scrapers: Map<string, BaseScraper> = new Map();
  private logger = new Logger('ScraperManager');
  public register(scraper: BaseScraper): void {
    if (this.scrapers.has(scraper.metadata.id)) {
      this.logger.warn(`Scraper ${scraper.metadata.id} is already registered. Overwriting.`);
    }
    this.scrapers.set(scraper.metadata.id, scraper);
    this.logger.info(`Registered scraper: ${scraper.metadata.name} [${scraper.metadata.id}]`);
  }
  public getAllScrapers(): BaseScraper[] {
    return Array.from(this.scrapers.values());
  }
  public async getDetails(tmdbId: string): Promise<MediaDetails | null> {
    for (const scraper of this.scrapers.values()) {
      try {
        const details = await scraper.getDetails(tmdbId);
        if (details) return details;
      } catch (error) {
        this.logger.debug(`Scraper ${scraper.metadata.id} failed to fetch details for ${tmdbId}`);
      }
    }
    return null;
  }
  public async getSources(options: ScraperSourceOptions): Promise<StreamSource[]> {
    this.logger.info(
      `Fetching sources for ${options.type} TMDB:${options.tmdbId} across ${this.scrapers.size} scraper(s)`,
    );
    const promises = Array.from(this.scrapers.values()).map(async scraper => {
      try {
        return await scraper.getStreamSources(options);
      } catch (error) {
        this.logger.warn(
          `Scraper ${scraper.metadata.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return [];
      }
    });
    const results = await Promise.allSettled(promises);
    const allSources: StreamSource[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allSources.push(...result.value);
      }
    }
    this.logger.info(`Aggregated ${allSources.length} total source(s)`);
    return allSources;
  }
  public async getSubtitles(options: ScraperSourceOptions): Promise<Subtitle[]> {
    const promises = Array.from(this.scrapers.values()).map(async scraper => {
      try {
        return await scraper.getSubtitles(options);
      } catch (error) {
        return [];
      }
    });
    const results = await Promise.allSettled(promises);
    const allSubtitles: Subtitle[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allSubtitles.push(...result.value);
      }
    }
    return allSubtitles;
  }
}
