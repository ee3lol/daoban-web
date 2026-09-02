'use server';

import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { cache } from 'react';

export const getUserPreferences = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);

    if (prefs.length === 0) {
    
    return {
      accentColor: '#fc535a',
      themeStyle: 'dark',
      cardRadius: 'rounded-xl',
      filmGrain: true,
      mentionPrivacy: 'anyone',
    };
  }

  return prefs[0];
});

export async function updateUserPreferences(data: {
  accentColor?: string;
  themeStyle?: string;
  cardRadius?: string;
  filmGrain?: boolean;
  mentionPrivacy?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userPreferences).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        accentColor: data.accentColor ?? '#fc535a',
        themeStyle: data.themeStyle ?? 'dark',
        cardRadius: data.cardRadius ?? 'rounded-xl',
        filmGrain: data.filmGrain ?? true,
        mentionPrivacy: data.mentionPrivacy ?? 'anyone',
      });
    } else {
      await db
        .update(userPreferences)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id));
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}
