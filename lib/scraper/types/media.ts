import { z } from 'zod';
export const MediaTypeSchema = z.enum(['movie', 'tv', 'anime']);
export type MediaType = z.infer<typeof MediaTypeSchema>;
export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  poster: z.string().url().optional(),
  type: MediaTypeSchema,
  year: z.number().int().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
export const SubtitleSchema = z.object({
  lang: z.string(),
  url: z.string().url(),
  format: z.enum(['vtt', 'srt', 'ass']).default('vtt'),
});
export type Subtitle = z.infer<typeof SubtitleSchema>;
export const StreamSourceSchema = z.object({
  quality: z.string(),
  url: z.string().url(),
  isM3U8: z.boolean().default(false),
  isMP4: z.boolean().default(false),
  serverName: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  subtitles: z.array(SubtitleSchema).optional(),
});
export type StreamSource = z.infer<typeof StreamSourceSchema>;
export const EpisodeSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string().optional(),
  url: z.string().url(),
  season: z.number().optional(),
  thumbnail: z.string().url().optional(),
  isDub: z.boolean().optional(),
  isSub: z.boolean().optional(),
});
export type Episode = z.infer<typeof EpisodeSchema>;
export const MediaDetailsSchema = z.object({
  id: z.string(),
  title: z.string(),
  japaneseTitle: z.string().optional(),
  description: z.string().optional(),
  poster: z.string().url().optional(),
  cover: z.string().url().optional(),
  type: MediaTypeSchema,
  releaseYear: z.number().int().optional(),
  status: z.enum(['Ongoing', 'Completed', 'Upcoming']).optional(),
  genres: z.array(z.string()).default([]),
  rating: z.number().optional(),
  episodes: z.array(EpisodeSchema).default([]),
  sources: z.array(StreamSourceSchema).default([]),
});
export type MediaDetails = z.infer<typeof MediaDetailsSchema>;
