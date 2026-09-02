"use server";

import { db } from "@/db";
import { user as userSchema, announcements, auditLogs, blacklistedMedia, comments, notifications } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { User } from "@/types";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

// --- Internal Helpers ---
async function logAdminAction(adminId: string, action: string, details?: string, targetId?: string) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      adminId,
      action,
      details,
      targetId,
    });
  } catch (err) {
    console.error("[logAdminAction] Error:", err);
  }
}

// --- User Management ---

export async function searchUsers(query: string = "") {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      throw new Error("Unauthorized");
    }

    if (!query) {
      return await db.select().from(userSchema).orderBy(desc(userSchema.createdAt)).limit(50);
    }

    const searchQuery = `%${query}%`;
    return await db.select()
      .from(userSchema)
      .where(
        or(
          ilike(userSchema.name, searchQuery),
          ilike(userSchema.email, searchQuery),
          ilike(userSchema.username, searchQuery)
        )
      )
      .orderBy(desc(userSchema.createdAt))
      .limit(50);
  } catch (error) {
    console.error("[searchUsers]", error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user as User).role as string !== "super_admin") {
      return { success: false, error: "Only a Super Admin can change user roles." };
    }
    if (!['user', 'admin', 'super_admin'].includes(newRole)) {
      return { success: false, error: "Invalid role." };
    }
    if (userId === session.user.id) {
      return { success: false, error: "You cannot change your own role." };
    }

    await db.update(userSchema)
      .set({ role: newRole })
      .where(eq(userSchema.id, userId));

    await logAdminAction(session.user.id, "update_role", `Set role to ${newRole}`, userId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[updateUserRole]", error);
    return { success: false, error: "An error occurred while updating the role." };
  }
}

export async function updateUserBan(userId: string, isBanned: boolean, durationHours: number | null = null, reason: string | null = null) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }
    if (userId === session.user.id) {
      return { success: false, error: "You cannot ban yourself." };
    }

    const targetUsers = await db.select().from(userSchema).where(eq(userSchema.id, userId)).limit(1);
    const targetUser = targetUsers[0];
    if (!targetUser) {
      return { success: false, error: "User not found." };
    }

    const isSuperAdmin = (session.user as User).role as string === "super_admin";
    if (!isSuperAdmin && (targetUser.role === "admin" || targetUser.role === "super_admin")) {
      return { success: false, error: "Only a Super Admin can suspend other administrators." };
    }

    const banExpires = isBanned && durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null;
    const finalReason = isBanned ? (reason || "Violation of terms") : null;

    await db.update(userSchema)
      .set({ 
        banned: isBanned, 
        banReason: finalReason,
        banExpires: banExpires
      })
      .where(eq(userSchema.id, userId));

    await logAdminAction(session.user.id, isBanned ? "ban_user" : "unban_user", `Suspension toggled to ${isBanned}. Duration: ${durationHours || 'Permanent'}. Reason: ${finalReason}`, userId);

    if (isBanned) {
      // Create system notification
      try {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          recipientId: userId,
          senderId: session.user.id, // The admin banning them
          type: 'system_ban',
        });
      } catch (notifErr) {
        console.error("Failed to create system notification:", notifErr);
      }

      // Send email
      if (targetUser.email) {
        const durationText = durationHours ? `${durationHours} hours` : "Permanent";
        const expiresText = banExpires ? banExpires.toLocaleString() : "Never";
        
        try {
          await resend.emails.send({
            from: 'DAOBAN Moderation <moderation@daoban.lol>',
            to: targetUser.email,
            subject: 'Account Suspension Notice',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Account Suspension</title>
              </head>
              <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505; width: 100%;">
                  <tr>
                    <td align="center" style="padding: 40px 20px;">
                      <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #111111; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                        
                        <!-- Hero Image Area -->
                        <tr>
                          <td align="center" style="position: relative; background-color: #1a1a1a;">
                            <img src="https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1200&auto=format&fit=crop" alt="Cinematic Pirate Ship" style="width: 100%; max-width: 600px; height: 200px; object-fit: cover; display: block; border: 0;" />
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(17,17,17,0) 0%, rgba(17,17,17,1) 100%);"></div>
                          </td>
                        </tr>
                        
                        <!-- Content Area -->
                        <tr>
                          <td align="center" style="padding: 0 40px 40px 40px;">
                            <!-- Logo -->
                            <div style="margin-top: -30px; position: relative; z-index: 10; display: inline-flex; align-items: center; justify-content: center; gap: 12px; background: #111111; padding: 10px 20px; border-radius: 12px;">
                              <span style="color: #EAE8E3; font-weight: 600; font-size: 20px; letter-spacing: 0.15em; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">DAOBAN</span>
                              <span style="color: rgba(136,136,136,0.3); font-size: 16px;">|</span>
                              <span style="color: #fc535a; font-size: 18px; font-weight: 500; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">盗版</span>
                            </div>
                            
                            <p style="color: #EAE8E3; font-size: 16px; line-height: 1.6; margin-top: 40px; text-align: center; font-weight: 500;">
                              Notice for <span style="color: #fc535a;">${targetUser.username || targetUser.name || targetUser.email}</span>
                            </p>
                            
                            <p style="color: #888888; font-size: 15px; line-height: 1.6; margin-top: 15px; text-align: center;">
                              Your account has been suspended by DAOBAN Moderation.
                            </p>
                            
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-top: 30px; text-align: left;">
                              <p style="color: #EAE8E3; font-size: 14px; margin: 0 0 10px 0;"><strong>Reason:</strong> <span style="color: #fc535a;">${finalReason}</span></p>
                              <p style="color: #EAE8E3; font-size: 14px; margin: 0 0 10px 0;"><strong>Duration:</strong> <span style="color: #888888;">${durationText}</span></p>
                              <p style="color: #EAE8E3; font-size: 14px; margin: 0;"><strong>Expires:</strong> <span style="color: #888888;">${expiresText}</span></p>
                            </div>
                            
                            <p style="color: #666666; font-size: 13px; line-height: 1.6; margin-top: 30px; text-align: center;">
                              If you believe this is an error, please reply directly to this email to contact the moderation team.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Footer -->
                      <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                        <tr>
                          <td align="center" style="padding: 30px 20px;">
                            <p style="font-size: 11px; color: #444444; margin: 0; letter-spacing: 0.05em;">
                              © ${new Date().getFullYear()} DAOBAN. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `
          });
        } catch (emailErr) {
          console.error("Failed to send suspension email:", emailErr);
        }
      }
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[updateUserBan]", error);
    return { success: false, error: "An error occurred while updating the ban status." };
  }
}

// --- Announcements ---

export async function getAnnouncements() {
  try {
    return await db.select({
      id: announcements.id,
      title: announcements.title,
      message: announcements.message,
      type: announcements.type,
      isActive: announcements.isActive,
      createdAt: announcements.createdAt,
      creator: {
        id: userSchema.id,
        name: userSchema.name,
        username: userSchema.username,
        image: userSchema.image,
      }
    })
    .from(announcements)
    .leftJoin(userSchema, eq(announcements.createdBy, userSchema.id))
    .orderBy(desc(announcements.createdAt));
  } catch (error) {
    console.error("[getAnnouncements]", error);
    return [];
  }
}

export async function getActiveAnnouncements() {
  try {
    return await db.select({
      id: announcements.id,
      title: announcements.title,
      message: announcements.message,
      type: announcements.type,
    })
    .from(announcements)
    .where(eq(announcements.isActive, true))
    .orderBy(desc(announcements.createdAt));
  } catch (error) {
    console.error("[getActiveAnnouncements]", error);
    return [];
  }
}

export async function createAnnouncement(title: string, message: string, type: string = 'info') {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    const id = crypto.randomUUID();
    await db.insert(announcements).values({
      id,
      title,
      message,
      type,
      isActive: true,
      createdBy: session.user.id,
    });

    await logAdminAction(session.user.id, "create_announcement", `Created announcement: ${title}`, id);

    revalidatePath("/admin/announcements");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[createAnnouncement]", error);
    return { success: false, error: "Failed to create announcement." };
  }
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    await db.update(announcements)
      .set({ isActive })
      .where(eq(announcements.id, id));

    await logAdminAction(session.user.id, "toggle_announcement", `Set announcement active=${isActive}`, id);

    revalidatePath("/admin/announcements");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[toggleAnnouncement]", error);
    return { success: false, error: "Failed to toggle announcement." };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    await db.delete(announcements).where(eq(announcements.id, id));
    await logAdminAction(session.user.id, "delete_announcement", `Deleted announcement`, id);

    revalidatePath("/admin/announcements");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("[deleteAnnouncement]", error);
    return { success: false, error: "Failed to delete announcement." };
  }
}

// --- Audit Logs ---

export async function getAuditLogs() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user as User).role as string !== "super_admin") {
      throw new Error("Unauthorized");
    }

    return await db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      details: auditLogs.details,
      targetId: auditLogs.targetId,
      createdAt: auditLogs.createdAt,
      admin: {
        id: userSchema.id,
        name: userSchema.name,
        username: userSchema.username,
        image: userSchema.image,
      }
    })
    .from(auditLogs)
    .leftJoin(userSchema, eq(auditLogs.adminId, userSchema.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);
  } catch (error) {
    console.error("[getAuditLogs]", error);
    return [];
  }
}

// --- Content Moderation ---

export async function getBlacklistedMedia() {
  try {
    return await db.select({
      id: blacklistedMedia.id,
      mediaId: blacklistedMedia.mediaId,
      mediaType: blacklistedMedia.mediaType,
      reason: blacklistedMedia.reason,
      createdAt: blacklistedMedia.createdAt,
      admin: {
        id: userSchema.id,
        name: userSchema.name,
      }
    })
    .from(blacklistedMedia)
    .leftJoin(userSchema, eq(blacklistedMedia.adminId, userSchema.id))
    .orderBy(desc(blacklistedMedia.createdAt));
  } catch (error) {
    console.error("[getBlacklistedMedia]", error);
    return [];
  }
}

export async function checkBlacklist(mediaId: number, mediaType: string) {
  try {
    const id = `${mediaType}_${mediaId}`;
    const found = await db.select().from(blacklistedMedia).where(eq(blacklistedMedia.id, id)).limit(1);
    return found.length > 0;
  } catch (error) {
    console.error("[checkBlacklist]", error);
    return false;
  }
}

export async function blacklistMedia(mediaId: number, mediaType: string, reason: string = "", season?: number | null, episode?: number | null) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    let id = `${mediaType}_${mediaId}`;
    if (season) id += `_s${season}`;
    if (season && episode) id += `e${episode}`;

    await db.insert(blacklistedMedia).values({
      id,
      mediaId,
      mediaType,
      season: season || null,
      episode: episode || null,
      reason,
      adminId: session.user.id,
    });

    let details = `Blacklisted ${mediaType} ${mediaId}`;
    if (season) details += ` S${season}`;
    if (season && episode) details += `E${episode}`;
    await logAdminAction(session.user.id, "blacklist_media", details, id);

    revalidatePath("/admin/moderation");
    return { success: true };
  } catch (error) {
    console.error("[blacklistMedia]", error);
    return { success: false, error: "Failed to blacklist media. It may already be blacklisted." };
  }
}

export async function unblacklistMedia(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    await db.delete(blacklistedMedia).where(eq(blacklistedMedia.id, id));
    await logAdminAction(session.user.id, "unblacklist_media", `Removed media from blacklist`, id);

    revalidatePath("/admin/moderation");
    return { success: true };
  } catch (error) {
    console.error("[unblacklistMedia]", error);
    return { success: false, error: "Failed to remove blacklist." };
  }
}

export async function getRecentComments(limit: number = 50) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      throw new Error("Unauthorized");
    }

    return await db.select({
      id: comments.id,
      content: comments.content,
      mediaId: comments.mediaId,
      mediaType: comments.mediaType,
      season: comments.season,
      episode: comments.episode,
      createdAt: comments.createdAt,
      user: {
        id: userSchema.id,
        name: userSchema.name,
        username: userSchema.username,
        image: userSchema.image,
      }
    })
    .from(comments)
    .leftJoin(userSchema, eq(comments.userId, userSchema.id))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
  } catch (error) {
    console.error("[getRecentComments]", error);
    return [];
  }
}

export async function adminDeleteComment(commentId: string, reason: string = "Violation of community guidelines") {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as User).role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch the comment before deleting to get the author's userId
    const targetComments = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    const targetComment = targetComments[0];
    if (!targetComment) {
      return { success: false, error: "Comment not found." };
    }

    await db.delete(comments).where(eq(comments.id, commentId));
    await logAdminAction(session.user.id, "delete_comment", `Deleted comment. Reason: ${reason}`, commentId);

    // Send in-app system notification to the comment author
    if (targetComment.userId !== session.user.id) {
      try {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          recipientId: targetComment.userId,
          senderId: session.user.id,
          type: 'system_comment_deleted',
        });
      } catch (notifErr) {
        console.error("Failed to create system notification for deleted comment:", notifErr);
      }
    }

    revalidatePath("/admin/moderation");
    return { success: true };
  } catch (error) {
    console.error("[adminDeleteComment]", error);
    return { success: false, error: "Failed to delete comment." };
  }
}
