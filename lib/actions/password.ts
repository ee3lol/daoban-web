"use server";

import { db } from "@/db";
import { account, verification } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Check if the currently authenticated user has a password set.
 */
export async function checkHasPassword() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if the user has an account record with a password
    const userAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, session.user.id),
        isNotNull(account.password)
      ),
    });

    return { success: true, hasPassword: !!userAccount };
  } catch (error) {
    console.error("Error checking password status:", error);
    return { success: false, error: "Failed to check password status" };
  }
}

/**
 * Generates a 6-digit OTP, stores it in the verification table, and emails it.
 */
export async function requestPasswordOTP() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `password_set_${session.user.id}`;
    
    // Expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete any existing OTP for this user
    await db.delete(verification).where(eq(verification.identifier, identifier));

    // Store new OTP
    await db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier,
      value: otp,
      expiresAt,
    });

    // Send email via Resend
    await resend.emails.send({
      from: 'DAOBAN <noreply@daoban.lol>',
      to: session.user.email,
      subject: 'Your DAOBAN Password Setup Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your DAOBAN Password Setup Code</title>
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
                        <span style="color: #D47A73; font-size: 18px; font-weight: 500; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">盗版</span>
                      </div>
                      
                      <p style="color: #EAE8E3; font-size: 16px; line-height: 1.6; margin-top: 40px; text-align: center; font-weight: 500;">
                        Ahoy, <span style="color: #D47A73;">${session.user.name || session.user.email}</span>
                      </p>
                      
                      <p style="color: #888888; font-size: 15px; line-height: 1.6; margin-top: 15px; text-align: center;">
                        You requested to set a password for your account. Please use the verification code below to complete the setup. This code expires in 15 minutes.
                      </p>
                      
                      <!-- OTP Code Display -->
                      <div style="margin: 40px 0; text-align: center;">
                        <div style="background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; display: inline-block;">
                          <span style="color: #EAE8E3; font-size: 42px; font-weight: 700; letter-spacing: 0.25em; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${otp}</span>
                        </div>
                      </div>
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
                      <p style="font-size: 11px; color: #444444; margin: 5px 0 0 0; letter-spacing: 0.05em;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error requesting password OTP:", error);
    return { success: false, error: "Failed to send verification code" };
  }
}

/**
 * Verifies the OTP and sets the password using auth.api.setPassword.
 */
export async function verifyAndSetPassword(otp: string, newPassword: string) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const identifier = `password_set_${session.user.id}`;

    // Fetch the OTP record
    const otpRecord = await db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, identifier),
        eq(verification.value, otp)
      ),
    });

    if (!otpRecord) {
      return { success: false, error: "Invalid verification code" };
    }

    if (new Date() > otpRecord.expiresAt) {
      return { success: false, error: "Verification code has expired" };
    }

    // Set the password using better-auth server API
    await auth.api.setPassword({
      headers: reqHeaders,
      body: {
        newPassword,
      },
    });

    // Revoke all other sessions
    await auth.api.revokeOtherSessions({
      headers: reqHeaders,
    });

    // Clean up OTP
    await db.delete(verification).where(eq(verification.id, otpRecord.id));

    return { success: true };
  } catch (error: any) {
    console.error("Error setting password:", error);
    return { success: false, error: error?.message || "Failed to set password" };
  }
}
