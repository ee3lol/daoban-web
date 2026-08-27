import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../config/env';
import { ErrorCode, ScraperError } from '../errors/scraper';
export function createHttpClient(
  baseURL?: string,
  customHeaders?: Record<string, string>,
  options?: { timeout?: number; maxRetries?: number },
): AxiosInstance {
  const client = axios.create({
    ...(baseURL ? { baseURL } : {}),
    timeout: options?.timeout ?? config.HTTP_TIMEOUT_MS,
    headers: {
      'User-Agent': config.DEFAULT_USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      ...customHeaders,
    },
  });
  axiosRetry(client, {
    retries: options?.maxRetries ?? config.HTTP_MAX_RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: error => {
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        (error.response?.status !== undefined && error.response.status >= 500)
      );
    },
  });
  return client;
}
export function handleAxiosError(error: unknown, providerName: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      throw new ScraperError('Resource not found', ErrorCode.NOT_FOUND, providerName, error);
    }
    if (error.response?.status === 403 || error.response?.status === 503) {
      throw new ScraperError(
        'Blocked or Cloudflare CAPTCHA encountered',
        ErrorCode.CAPTCHA_BLOCKED,
        providerName,
        error,
      );
    }
    throw new ScraperError(
      `HTTP request failed: ${error.message}`,
      ErrorCode.NETWORK_ERROR,
      providerName,
      error,
    );
  }
  throw new ScraperError(
    'An unexpected error occurred during HTTP fetch',
    ErrorCode.UNKNOWN,
    providerName,
    error,
  );
}
