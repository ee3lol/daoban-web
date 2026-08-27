import { z } from 'zod';
export const TokenResponseSchema = z.object({
  token: z.string(),
  expires_in: z.number(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export const ServerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  desc: z.string(),
  endpoint: z.string(),
});
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export const SERVERS: ServerConfig[] = [
  { id: 'MAIN', name: 'MAIN', icon: '💫', desc: 'Slow', endpoint: '/server/vidsrc' },
  { id: 'NIGHT', name: 'NIGHT', icon: '🌙', desc: 'Decent', endpoint: '/server/night' },
  { id: 'EMP', name: 'EMP', icon: '⚡', desc: 'Decent', endpoint: '/server/emp' },
];
export const AudioTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
});
export type AudioTrack = z.infer<typeof AudioTrackSchema>;
export const StreamsDataSchema = z.object({
  raw_m3u8: z.string().optional(),
  proxy_m3u8: z.string().optional(),
  vps_proxy_m3u8: z.string().optional(),
  local_proxy_m3u8: z.string().optional(),
  worker_proxy_m3u8: z.string().optional(),
  m3u8: z.string().optional(),
  format: z.string().optional(),
});
export type StreamsData = z.infer<typeof StreamsDataSchema>;
export const StreamTitleSchema = z.object({
  id: z.number(),
  name: z.string(),
  poster_url: z.string().optional(),
  backdrop_url: z.string().optional(),
  tmdb_id: z.string(),
  imdb_id: z.string().optional(),
  overview: z.string().optional(),
  release_date: z.string().optional(),
  type: z.string().optional(),
});
export type StreamTitle = z.infer<typeof StreamTitleSchema>;
export const OneEmbedSubtitleSchema = z.object({
  lang: z.string().optional(),
  label: z.string().optional(),
  file: z.string().optional(),
  url: z.string().optional(),
});
export type OneEmbedSubtitle = z.infer<typeof OneEmbedSubtitleSchema>;
export const StreamResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string().optional(),
  selectedSource: z.string().optional(),
  isIframe: z.boolean().optional(),
  streamUrl: z.string().optional(),
  sourceTitle: z.string().optional(),
  error: z.string().optional(),
  title: StreamTitleSchema.optional(),
  audioTracks: z.array(AudioTrackSchema).optional(),
  streams: StreamsDataSchema.optional(),
  subtitles: z.array(OneEmbedSubtitleSchema).optional(),
});
export type StreamResponse = z.infer<typeof StreamResponseSchema>;
export const TmdbDetailsResponseSchema = z.object({
  success: z.boolean().optional(),
  id: z.number().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  overview: z.string().optional(),
  poster_path: z.string().optional(),
  backdrop_path: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  vote_average: z.number().optional(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  imdb_id: z.string().optional(),
  number_of_seasons: z.number().optional(),
  status: z.string().optional(),
});
export type TmdbDetailsResponse = z.infer<typeof TmdbDetailsResponseSchema>;
export const TvEpisodeSchema = z.object({
  id: z.number(),
  episode_number: z.number(),
  season_number: z.number(),
  name: z.string(),
  overview: z.string().optional(),
  still_path: z.string().optional(),
  air_date: z.string().optional(),
  runtime: z.number().optional(),
  vote_average: z.number().optional(),
});
export type TvEpisode = z.infer<typeof TvEpisodeSchema>;
export const TvSeasonSchema = z.object({
  season_number: z.number(),
  name: z.string(),
  episode_count: z.number(),
});
export type TvSeason = z.infer<typeof TvSeasonSchema>;
export const TvEpisodesResponseSchema = z.object({
  success: z.boolean(),
  tmdb_id: z.string(),
  season: z.number(),
  total_seasons: z.number(),
  show_name: z.string().optional(),
  seasons: z.array(TvSeasonSchema).optional(),
  episodes: z.array(TvEpisodeSchema).optional(),
});
export type TvEpisodesResponse = z.infer<typeof TvEpisodesResponseSchema>;
export const SubtitlesResponseSchema = z.object({
  success: z.boolean(),
  subtitles: z.array(OneEmbedSubtitleSchema).optional(),
  count: z.number().optional(),
});
export type SubtitlesResponse = z.infer<typeof SubtitlesResponseSchema>;
export interface OneEmbedSourceOptions {
  type: 'movie' | 'tv';
  tmdbId: string;
  season?: number;
  episode?: number;
  title?: string;
  serverId?: 'MAIN' | 'NIGHT' | 'EMP';
}
