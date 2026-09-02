"use server";

import { db } from '@/db';
import { user, friends } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
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

export async function sendFriendRequest(targetUsername: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Not authenticated' };

  if (currentUser.username === targetUsername) {
    return { success: false, error: 'You cannot send a friend request to yourself' };
  }

  try {
    
    const targetUsers = await db.select().from(user).where(eq(user.username, targetUsername));
    const targetUser = targetUsers[0];

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    const existingRelationships = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.senderId, currentUser.id), eq(friends.receiverId, targetUser.id)),
          and(eq(friends.senderId, targetUser.id), eq(friends.receiverId, currentUser.id))
        )
      );

    if (existingRelationships.length > 0) {
      let hasAccepted = false;
      let hasBlocked = false;
      let pendingRel = null;
      let declinedRel = null;

      for (const rel of existingRelationships) {
        if (rel.status === 'accepted') hasAccepted = true;
        if (rel.status === 'blocked') hasBlocked = true;
        if (rel.status === 'pending') pendingRel = rel;
        if (rel.status === 'declined') declinedRel = rel;
      }

      if (hasAccepted) return { success: false, error: 'You are already friends' };
      if (hasBlocked) return { success: false, error: 'User not found' }; 
      if (pendingRel) {
        if (pendingRel.senderId === currentUser.id) return { success: false, error: 'Request already sent' };
        if (pendingRel.receiverId === currentUser.id) return { success: false, error: 'This user already sent you a request. Check your pending requests.' };
      }
      
      if (declinedRel) {
        await db.update(friends)
          .set({ status: 'pending', senderId: currentUser.id, receiverId: targetUser.id, updatedAt: new Date() })
          .where(eq(friends.id, declinedRel.id));
        return { success: true, targetUserId: targetUser.id };
      }
    }

    await db.insert(friends).values({
      id: generateId(),
      senderId: currentUser.id,
      receiverId: targetUser.id,
      status: 'pending',
    });

    return { success: true, targetUserId: targetUser.id };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function acceptFriendRequest(requestId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Not authenticated' };

  try {
    const request = await db.select().from(friends).where(eq(friends.id, requestId));
    if (!request.length) return { success: false, error: 'Request not found' };

    const req = request[0];
    if (req.receiverId !== currentUser.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    if (req.status !== 'pending') {
      return { success: false, error: 'Request is not pending' };
    }

    await db.update(friends)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(friends.id, requestId));

    return { success: true, targetUserId: req.senderId };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function declineFriendRequest(requestId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Not authenticated' };

  try {
    const request = await db.select().from(friends).where(eq(friends.id, requestId));
    if (!request.length) return { success: false, error: 'Request not found' };

    const req = request[0];
    if (req.receiverId !== currentUser.id && req.senderId !== currentUser.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.delete(friends).where(eq(friends.id, requestId));

    const targetUserId = req.senderId === currentUser.id ? req.receiverId : req.senderId;
    return { success: true, targetUserId };
  } catch (error) {
    console.error('Error declining friend request:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function removeFriend(friendId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Not authenticated' };

  try {

    const existingRelationship = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.status, 'accepted'),
          or(
            and(eq(friends.senderId, currentUser.id), eq(friends.receiverId, friendId)),
            and(eq(friends.senderId, friendId), eq(friends.receiverId, currentUser.id))
          )
        )
      );

    if (existingRelationship.length > 0) {
      await db.delete(friends).where(eq(friends.id, existingRelationship[0].id));
    }

    return { success: true, targetUserId: friendId };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getFriendData() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  try {
    const allRelationships = await db
      .select()
      .from(friends)
      .where(
        or(
          eq(friends.senderId, currentUser.id),
          eq(friends.receiverId, currentUser.id)
        )
      );

    const userIds = new Set<string>();
    allRelationships.forEach(r => {
      if (r.senderId !== currentUser.id) userIds.add(r.senderId);
      if (r.receiverId !== currentUser.id) userIds.add(r.receiverId);
    });

    let usersInfo: Record<string, any> = {};
    if (userIds.size > 0) {
      const users = await db.select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
      }).from(user);

      const relevantUsers = users.filter(u => userIds.has(u.id));
      usersInfo = relevantUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
    }

    const friendData = {
      accepted: [] as any[],
      pendingIncoming: [] as any[],
      pendingOutgoing: [] as any[],
    };

    allRelationships.forEach(r => {
      const isSender = r.senderId === currentUser.id;
      const otherUserId = isSender ? r.receiverId : r.senderId;
      const otherUser = usersInfo[otherUserId];
      
      if (!otherUser) return;

      const item = {
        requestId: r.id,
        user: otherUser,
        createdAt: r.createdAt,
      };

      if (r.status === 'accepted') {
        friendData.accepted.push(item);
      } else if (r.status === 'pending') {
        if (isSender) {
          friendData.pendingOutgoing.push(item);
        } else {
          friendData.pendingIncoming.push(item);
        }
      }
    });

    return friendData;
  } catch (error) {
    console.error('Error getting friend data:', error);
    return null;
  }
}

export async function blockFriend(friendId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Not authenticated' };

  try {
    const existingRelationship = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.senderId, currentUser.id), eq(friends.receiverId, friendId)),
          and(eq(friends.senderId, friendId), eq(friends.receiverId, currentUser.id))
        )
      );

    if (existingRelationship.length > 0) {
      await db.update(friends)
        .set({ status: 'blocked', senderId: currentUser.id, receiverId: friendId, updatedAt: new Date() })
        .where(eq(friends.id, existingRelationship[0].id));
    } else {
      await db.insert(friends).values({
        id: generateId(),
        senderId: currentUser.id,
        receiverId: friendId,
        status: 'blocked',
      });
    }

    return { success: true, targetUserId: friendId };
  } catch (error) {
    console.error('Error blocking friend:', error);
    return { success: false, error: 'Internal server error' };
  }
}
