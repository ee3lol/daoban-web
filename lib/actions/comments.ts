/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/db";
import { comments, commentLikes, notifications, userPreferences, user, friends } from "@/db/schema";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";

export async function getComments(mediaId: number, mediaType: string, season?: number, episode?: number) {
  try {
    const conditions: any[] = [
      eq(comments.mediaId, mediaId),
      eq(comments.mediaType, mediaType)
    ];

    if (season && episode) {
      conditions.push(eq(comments.season, season));
      conditions.push(eq(comments.episode, episode));
    } else {
      conditions.push(isNull(comments.season));
      conditions.push(isNull(comments.episode));
    }

    conditions.push(isNull(comments.parentId));

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const currentUserId = session?.user?.id;

    const results = await db.query.comments.findMany({
      where: and(...conditions),
      orderBy: [desc(comments.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            image: true,
            username: true,
          }
        },
        likes: true,
        replies: {
          orderBy: [desc(comments.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
                username: true,
              }
            },
            likes: true,
          }
        }
      }
    });

    const formatComment = (c: { likes: { isLike: boolean, userId: string }[], replies?: any[] } & Record<string, unknown>): any => {
      const likesCount = c.likes.filter((l) => l.isLike).length;
      const dislikesCount = c.likes.filter((l) => !l.isLike).length;
      const userLike = currentUserId ? c.likes.find((l) => l.userId === currentUserId) : null;
      
      return {
        ...c,
        likesCount,
        dislikesCount,
        userLikeStatus: userLike ? (userLike.isLike ? 'like' : 'dislike') : null,
        likes: undefined, 
        replies: c.replies ? c.replies.map(formatComment) : []
      };
    };

    return { success: true, comments: results.map(formatComment) };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return { success: false, error: "Failed to fetch comments" };
  }
}

export async function postComment(mediaId: number, mediaType: string, content: string, season?: number, episode?: number, parentId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!content.trim()) {
      return { success: false, error: "Comment cannot be empty" };
    }

    const newComment = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      mediaId,
      mediaType,
      season: season || null,
      episode: episode || null,
      content: content.trim(),
      parentId: parentId || null,
      validMentions: [] as string[],
    };

    const notifiedUserIds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationsToInsert: any[] = [];

    // 1. Reply Notification
    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId)
      });
      if (parentComment && parentComment.userId !== session.user.id) {
        notificationsToInsert.push({
          id: crypto.randomUUID(),
          recipientId: parentComment.userId,
          senderId: session.user.id,
          type: 'reply',
          mediaId,
          mediaType,
          season: season || null,
          episode: episode || null,
          commentId: newComment.id,
        });
        notifiedUserIds.push(parentComment.userId);
      }
    }

    // 2. Mention Notifications
    const regex = /@([a-zA-Z0-9_.-]+)/g;
    const mentionedUsernames = [...new Set(Array.from(content.matchAll(regex), m => m[1]))];
    
    for (const username of mentionedUsernames) {
      // Find user by username
      const mentionedUser = await db.query.user.findFirst({
        where: eq(user.username, username)
      });
      
      if (mentionedUser && mentionedUser.id !== session.user.id) {
        // Check their privacy preferences
        const prefs = await db.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, mentionedUser.id)
        });
        
        const privacy = prefs?.mentionPrivacy || 'anyone';
        let canMention = false;
        
        if (privacy === 'anyone') {
          canMention = true;
        } else if (privacy === 'friends') {
          // check if they are friends
          const friendship = await db.query.friends.findFirst({
            where: and(
              eq(friends.status, 'accepted'),
              or(
                and(eq(friends.senderId, session.user.id), eq(friends.receiverId, mentionedUser.id)),
                and(eq(friends.senderId, mentionedUser.id), eq(friends.receiverId, session.user.id))
              )
            )
          });
          if (friendship) canMention = true;
        }
        
        if (canMention) {
          notificationsToInsert.push({
            id: crypto.randomUUID(),
            recipientId: mentionedUser.id,
            senderId: session.user.id,
            type: 'mention',
            mediaId,
            mediaType,
            season: season || null,
            episode: episode || null,
            commentId: newComment.id,
          });
          notifiedUserIds.push(mentionedUser.id);
          if (mentionedUser.username) {
            newComment.validMentions.push(mentionedUser.username);
          }
        }
      }
    }

    // Now insert the comment with validMentions
    await db.insert(comments).values(newComment);

    if (notificationsToInsert.length > 0) {
      await db.insert(notifications).values(notificationsToInsert);
    }

    return { success: true, comment: newComment, notifiedUserIds };
  } catch (error) {
    console.error("Error posting comment:", error);
    return { success: false, error: "Failed to post comment" };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId)
    });

    if (!comment || comment.userId !== session.user.id) {
      return { success: false, error: "Unauthorized or not found" };
    }

    await db.delete(comments).where(eq(comments.id, commentId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function toggleCommentLike(commentId: string, isLike: boolean) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    const existingLike = await db.query.commentLikes.findFirst({
      where: and(
        eq(commentLikes.userId, userId),
        eq(commentLikes.commentId, commentId)
      )
    });

    let notifiedUserId: string | null = null;
    
    if (existingLike) {
      if (existingLike.isLike === isLike) {
        
        await db.delete(commentLikes).where(eq(commentLikes.id, existingLike.id));
        return { success: true, action: 'removed' };
      } else {
        
        await db.update(commentLikes)
          .set({ isLike })
          .where(eq(commentLikes.id, existingLike.id));
        return { success: true, action: 'updated' };
      }
    } else {
      
      await db.insert(commentLikes).values({
        id: crypto.randomUUID(),
        userId,
        commentId,
        isLike
      });

      // Like notification
      if (isLike) {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, commentId)
        });
        if (comment && comment.userId !== userId) {
          await db.insert(notifications).values({
            id: crypto.randomUUID(),
            recipientId: comment.userId,
            senderId: userId,
            type: 'like',
            mediaId: comment.mediaId,
            mediaType: comment.mediaType,
            season: comment.season,
            episode: comment.episode,
            commentId: comment.id,
          });
          notifiedUserId = comment.userId;
        }
      }

      return { success: true, action: 'added', notifiedUserIds: notifiedUserId ? [notifiedUserId] : [] };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to process interaction" };
  }
}

export async function searchMentionableUsers(query: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserId = session.user.id;

    if (!query || query.length < 1) {
      return { success: true, users: [] };
    }

    // Search users by username or name
    const matchingUsers = await db.query.user.findMany({
      where: (user, { or, ilike }) => 
        or(
          ilike(user.username, `${query}%`),
          ilike(user.name, `${query}%`)
        ),
      limit: 10,
    });

    const results = [];

    for (const u of matchingUsers) {
      if (u.id === currentUserId) continue;

      let canMention = false;
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, u.id)
      });

      const privacy = prefs?.mentionPrivacy || 'anyone';

      if (privacy === 'anyone') {
        canMention = true;
      } else if (privacy === 'friends') {
        // check friendship
        const friendship = await db.query.friends.findFirst({
          where: and(
            eq(friends.status, 'accepted'),
            or(
              and(eq(friends.senderId, currentUserId), eq(friends.receiverId, u.id)),
              and(eq(friends.senderId, u.id), eq(friends.receiverId, currentUserId))
            )
          )
        });
        if (friendship) canMention = true;
      }

      results.push({
        id: u.id,
        username: u.username,
        name: u.name,
        image: u.image,
        mentionable: canMention,
      });
    }

    return { success: true, users: results };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users" };
  }
}
