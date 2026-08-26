"use server";

import { db } from '@/db';
import { watchLater, favorites, session as sessionTable, account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

function generateId(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function toggleWatchLater(mediaId: number, mediaType: string, title: string, posterPath: string | null) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const existing = await db
      .select()
      .from(watchLater)
      .where(and(eq(watchLater.userId, user.id), eq(watchLater.mediaId, mediaId)));

    if (existing.length > 0) {
      await db.delete(watchLater).where(eq(watchLater.id, existing[0].id));
      return { success: true, added: false };
    } else {
      await db.insert(watchLater).values({
        id: generateId(16),
        userId: user.id,
        mediaId,
        mediaType,
        title,
        posterPath: posterPath || '',
      });
      return { success: true, added: true };
    }
  } catch (error) {
    console.error('Watch later error:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function toggleFavorite(mediaId: number, mediaType: string, title: string, posterPath: string | null) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.mediaId, mediaId)));

    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return { success: true, added: false };
    } else {
      await db.insert(favorites).values({
        id: generateId(16),
        userId: user.id,
        mediaId,
        mediaType,
        title,
        posterPath: posterPath || '',
      });
      return { success: true, added: true };
    }
  } catch (error) {
    console.error('Favorite error:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function getWatchLater() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  return db.select().from(watchLater).where(eq(watchLater.userId, user.id));
}

export async function getFavorites() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  return db.select().from(favorites).where(eq(favorites.userId, user.id));
}

export async function checkMediaSaved(mediaId: number) {
  const user = await getCurrentUser();
  if (!user) return { isWatchLater: false, isFavorite: false };

  const [wl, fav] = await Promise.all([
    db.select().from(watchLater).where(and(eq(watchLater.userId, user.id), eq(watchLater.mediaId, mediaId))),
    db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.mediaId, mediaId)))
  ]);

  return {
    isWatchLater: wl.length > 0,
    isFavorite: fav.length > 0
  };
}

export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect('/');
}

export async function getUserSessions() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const currentSession = await auth.api.getSession({ headers: await headers() });
  const allSessions = await db.select().from(sessionTable).where(eq(sessionTable.userId, user.id));
  
  const enrichedSessions = await Promise.all(allSessions.map(async (session) => {
    let location = 'Unknown Location';
    if (session.ipAddress) {
      if (session.ipAddress === '::1' || session.ipAddress === '127.0.0.1' || session.ipAddress.includes('0000:0000:0000:0000:0000:0000:0000:0000')) {
        location = 'Local Machine';
      } else {
        try {
          // Use ip-api for free IP geolocation
          const res = await fetch(`http://ip-api.com/json/${session.ipAddress}`);
          const data = await res.json();
          if (data.status === 'success') {
            location = `${data.city}, ${data.countryCode}`;
          }
        } catch (e) {
          // Fallback to unknown if API fails
        }
      }
    }
    return { ...session, location };
  }));
  
  return {
    currentSessionId: currentSession?.session?.id || null,
    sessions: enrichedSessions
  };
}

export async function revokeSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  await db.delete(sessionTable).where(and(eq(sessionTable.id, sessionId), eq(sessionTable.userId, user.id)));
  return { success: true };
}

export async function revokeOtherSessions(currentSessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Delete all sessions EXCEPT the current one
  // Drizzle doesn't have a simple 'neq' operator out of the box in some versions without importing 'ne', 
  // so we can use a raw SQL approach or import `ne`
  // Actually, let's just fetch all, filter out the current one, and delete by ID.
  const sessions = await db.select().from(sessionTable).where(eq(sessionTable.userId, user.id));
  const otherSessions = sessions.filter(s => s.id !== currentSessionId);
  
  if (otherSessions.length > 0) {
    for (const s of otherSessions) {
      await db.delete(sessionTable).where(eq(sessionTable.id, s.id));
    }
  }

  return { success: true };
}

export async function getConnectedAccounts() {
  const user = await getCurrentUser();
  if (!user) return [];
  
  return db.select().from(account).where(eq(account.userId, user.id));
}
