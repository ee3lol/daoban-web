"use server";

import { db } from "@/db";
import { comments, commentLikes } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";

export async function getComments(mediaId: number, mediaType: string, season?: number, episode?: number) {
  try {
    let conditions = [
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

    const formatComment = (c: any) => {
      const likesCount = c.likes.filter((l: any) => l.isLike).length;
      const dislikesCount = c.likes.filter((l: any) => !l.isLike).length;
      const userLike = currentUserId ? c.likes.find((l: any) => l.userId === currentUserId) : null;
      
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
    };

    await db.insert(comments).values(newComment);

    return { success: true, comment: newComment };
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
      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to process interaction" };
  }
}
