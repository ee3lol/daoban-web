export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CAPTCHA_BLOCKED = 'CAPTCHA_BLOCKED',
  EXTRACTOR_ERROR = 'EXTRACTOR_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  UNKNOWN = 'UNKNOWN',
}
export class ScraperError extends Error {
  public readonly code: ErrorCode;
  public readonly provider: string | undefined;
  public readonly originalError?: unknown;
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    provider?: string,
    originalError?: unknown,
  ) {
    super(message);
    this.name = 'ScraperError';
    this.code = code;
    this.provider = provider;
    this.originalError = originalError;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
