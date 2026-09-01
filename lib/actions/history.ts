"use server";

import { db } from '@/db';
import { watchHistory } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, desc, isNull } from 'drizzle-orm';

export interface WatchHistoryData {
  mediaId: number;
  mediaType: string;
  season?: number;
  episode?: number;
  progress: number;
  duration: number;
  title: string;
  posterPath?: string;
  backdropPath?: string;
}

export async function updateWatchHistory(data: WatchHistoryData) {
  try {
    const sessionRes = await auth.api.getSession({
      headers: await headers()
    });
    const user = sessionRes?.user?.id;
    
    if (!user) return { success: false, error: "Unauthorized" };

    if (data.progress < 10) return { success: true };

    const existing = await db.query.watchHistory.findFirst({
      where: and(
        eq(watchHistory.userId, user),
        eq(watchHistory.mediaId, data.mediaId),
        eq(watchHistory.mediaType, data.mediaType),
        data.season !== undefined ? eq(watchHistory.season, data.season) : isNull(watchHistory.season),
        data.episode !== undefined ? eq(watchHistory.episode, data.episode) : isNull(watchHistory.episode)
      )
    });

    if (existing) {
      
      await db.update(watchHistory)
        .set({ 
          progress: Math.floor(data.progress), 
          duration: Math.floor(data.duration),
          updatedAt: new Date()
        })
        .where(eq(watchHistory.id, existing.id));
    } else {
      await db.insert(watchHistory).values({
        id: crypto.randomUUID(),
        userId: user,
        mediaId: data.mediaId,
        mediaType: data.mediaType,
        season: data.season,
        episode: data.episode,
        progress: Math.floor(data.progress),
        duration: Math.floor(data.duration),
        title: data.title,
        posterPath: data.posterPath,
        backdropPath: data.backdropPath
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating watch history:", error);
    return { success: false, error: "Internal Error" };
  }
}

export async function getWatchHistory() {
  try {
    const sessionRes = await auth.api.getSession({
      headers: await headers()
    });
    const user = sessionRes?.user?.id;
    
    if (!user) return [];

    const history = await db.query.watchHistory.findMany({
      where: eq(watchHistory.userId, user),
      orderBy: [desc(watchHistory.updatedAt)],
      limit: 100
    });

    return history.filter(item => {
      if (item.duration === 0) return true;
      const percentage = (item.progress / item.duration) * 100;
      return percentage < 95;
    });
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return [];
  }
}

export async function getWatchHistoryByMedia(mediaId: number, mediaType: string) {
  try {
    const sessionRes = await auth.api.getSession({
      headers: await headers()
    });
    const user = sessionRes?.user?.id;
    
    if (!user) return [];

    const history = await db.query.watchHistory.findMany({
      where: and(
        eq(watchHistory.userId, user),
        eq(watchHistory.mediaId, mediaId),
        eq(watchHistory.mediaType, mediaType)
      )
    });

    return history;
  } catch (error) {
    console.error("Error fetching watch history by media:", error);
    return [];
  }
}

export async function getMediaProgress(mediaId: number, mediaType: string, season?: number, episode?: number) {
  try {
    const sessionRes = await auth.api.getSession({
      headers: await headers()
    });
    const user = sessionRes?.user?.id;
    
    if (!user) return 0;

    const existing = await db.query.watchHistory.findFirst({
      where: and(
        eq(watchHistory.userId, user),
        eq(watchHistory.mediaId, mediaId),
        eq(watchHistory.mediaType, mediaType),
        season !== undefined ? eq(watchHistory.season, season) : isNull(watchHistory.season),
        episode !== undefined ? eq(watchHistory.episode, episode) : isNull(watchHistory.episode)
      )
    });

    if (existing && existing.duration > 0) {
      
      const percentage = (existing.progress / existing.duration) * 100;
      if (percentage >= 95) return 0;
      return existing.progress;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching media progress:", error);
    return 0;
  }
}

export async function removeFromHistory(historyId: string) {
  try {
    const sessionRes = await auth.api.getSession({
      headers: await headers()
    });
    const user = sessionRes?.user?.id;
    
    if (!user) return { success: false, error: "Unauthorized" };

    await db.delete(watchHistory)
      .where(and(
        eq(watchHistory.id, historyId),
        eq(watchHistory.userId, user)
      ));

    return { success: true };
  } catch (error) {
    console.error("Error removing from history:", error);
    return { success: false, error: "Internal Error" };
  }
}

export async function clearHistory() {
  try {
    const sessionRes = await auth.api.getSession({
      headers: await headers()
    });
    const user = sessionRes?.user?.id;
    
    if (!user) return { success: false, error: "Unauthorized" };

    await db.delete(watchHistory)
      .where(eq(watchHistory.userId, user));

    return { success: true };
  } catch (error) {
    console.error("Error clearing history:", error);
    return { success: false, error: "Internal Error" };
  }
}
