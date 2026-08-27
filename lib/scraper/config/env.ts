import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_KEY: z.string().default('daoban-dev-key'), // Secure default for local testing
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,https://daoban.lol,https://www.daoban.lol')
    .transform(str => str.split(',').map(s => s.trim())),
  HTTP_TIMEOUT_MS: z.coerce.number().positive().default(15000),
  HTTP_MAX_RETRIES: z.coerce.number().min(0).max(10).default(3),
  DEFAULT_USER_AGENT: z
    .string()
    .default(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    ),
});
export type EnvConfig = z.infer<typeof envSchema>;
export const config: EnvConfig = envSchema.parse({
  LOG_LEVEL: process.env.LOG_LEVEL,
  API_KEY: process.env.API_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  HTTP_TIMEOUT_MS: process.env.HTTP_TIMEOUT_MS,
  HTTP_MAX_RETRIES: process.env.HTTP_MAX_RETRIES,
  DEFAULT_USER_AGENT: process.env.DEFAULT_USER_AGENT,
});
