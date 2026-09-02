export interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  banned?: boolean;
}

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  seasons?: Season[];
  images?: {
    logos?: { file_path: string }[];
  };
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  overview: string;
  poster_path: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string;
}

export interface PartyMember {
  id: string;
  name: string;
  image?: string;
}

export interface PartySettings {
  anyoneCanControl: boolean;
}

export interface Comment {
  id: string;
  content: string;
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  season?: number | null;
  episode?: number | null;
  userId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Notification {
  id: string;
  type: string;
  recipientId: string;
  senderId?: string | null;
  mediaId?: number | null;
  mediaType?: string | null;
  season?: number | null;
  episode?: number | null;
  commentId?: string | null;
  isRead: boolean;
  createdAt: Date;
  sender?: User;
  comment?: Comment;
}
