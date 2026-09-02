"use server";

import { db } from "@/db";
import { notifications, userPreferences } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getNotifications() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const results = await db.query.notifications.findMany({
      where: eq(notifications.recipientId, session.user.id),
      orderBy: [desc(notifications.createdAt)],
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            image: true,
            username: true,
          }
        },
        comment: true,
      },
      limit: 50,
    });

    return { success: true, notifications: results };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

export async function clearAllNotifications() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.delete(notifications)
      .where(eq(notifications.recipientId, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return { success: false, error: "Failed to clear notifications" };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientId, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}
