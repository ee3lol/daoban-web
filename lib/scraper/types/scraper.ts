import { MediaType } from './media';
export interface ScraperMetadata {
  id: string;
  name: string;
  baseUrl: string;
  supportedTypes: MediaType[];
  hasSubDub?: boolean;
}
export interface ScraperOptions {
  timeout?: number;
  headers?: Record<string, string>;
  proxyUrl?: string;
}
export interface SearchOptions {
  page?: number;
  type?: MediaType;
}
