import { config } from '../config/env';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
export class Logger {
  private scope: string;
  private currentLevel: number;
  constructor(scope: string) {
    this.scope = scope;
    this.currentLevel = LOG_LEVELS[config.LOG_LEVEL] ?? 1;
  }
  private formatMessage(message: string): string {
    return `[${this.scope.toLowerCase()}] ${message}`;
  }
  public debug(message: string, ...meta: unknown[]): void {
    if (this.currentLevel <= LOG_LEVELS.debug) {
      console.debug(this.formatMessage(message), ...meta);
    }
  }
  public info(message: string, ...meta: unknown[]): void {
    if (this.currentLevel <= LOG_LEVELS.info) {
      console.info(this.formatMessage(message), ...meta);
    }
  }
  public warn(message: string, ...meta: unknown[]): void {
    if (this.currentLevel <= LOG_LEVELS.warn) {
      console.warn(this.formatMessage(message), ...meta);
    }
  }
  public error(message: string, ...meta: unknown[]): void {
    if (this.currentLevel <= LOG_LEVELS.error) {
      console.error(this.formatMessage(message), ...meta);
    }
  }
}
