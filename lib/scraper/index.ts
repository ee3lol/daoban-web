import { ScraperManager } from './scrapers/manager';
import { OneEmbedScraper } from './scrapers/index';

// Initialize a singleton instance of the ScraperManager
const scraperManager = new ScraperManager();

// Register all available scrapers
scraperManager.register(new OneEmbedScraper());

export { scraperManager };
