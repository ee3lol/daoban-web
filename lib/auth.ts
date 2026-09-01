import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: ["https://daoban.lol", "https://www.daoban.lol", "http://localhost:3000"],
  user: {
    additionalFields: {
      hasSetUsername: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        await resend.emails.send({
          from: 'DAOBAN <noreply@daoban.lol>',
          to: user.email,
          subject: 'Reset your DAOBAN password',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset your DAOBAN password</title>
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
                            Ahoy, <span style="color: #fc535a;">${user.name || user.email}</span>
                          </p>
                          
                          <p style="color: #888888; font-size: 15px; line-height: 1.6; margin-top: 15px; text-align: center;">
                            We received a request to reset your password. Click the button below to securely set a new password. If you didn't request this, you can safely ignore this email.
                          </p>
                          
                          <!-- Action Button -->
                          <div style="text-align: center; margin: 40px 0;">
                            <a href="${url}" style="background-color: #fc535a; color: #F9F8F6; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.1em; display: inline-block; text-transform: uppercase;">
                              Reset Password
                            </a>
                          </div>
                          
                          <!-- Fallback Link -->
                          <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; margin-top: 30px;">
                            <p style="font-size: 11px; color: #666666; text-align: center; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em;">
                              Or paste this link into your browser:
                            </p>
                            <p style="font-size: 12px; color: #fc535a; word-break: break-all; text-align: center; margin: 0; line-height: 1.5; opacity: 0.8;">
                              ${url}
                            </p>
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
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      try {
        await resend.emails.send({
          from: 'DAOBAN <noreply@daoban.lol>',
          to: user.email,
          subject: 'Verify your DAOBAN account',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify your DAOBAN account</title>
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
                            Welcome aboard, <span style="color: #fc535a;">${user.name || user.email}</span>
                          </p>
                          
                          <p style="color: #888888; font-size: 15px; line-height: 1.6; margin-top: 15px; text-align: center;">
                            Your cinematic journey awaits. Please verify your email address to unlock full access to DAOBAN.
                          </p>
                          
                          <!-- Action Button -->
                          <div style="text-align: center; margin: 40px 0;">
                            <a href="${url}" style="background-color: #fc535a; color: #F9F8F6; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.1em; display: inline-block; text-transform: uppercase;">
                              Verify Account
                            </a>
                          </div>
                          
                          <!-- Fallback Link -->
                          <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; margin-top: 30px;">
                            <p style="font-size: 11px; color: #666666; text-align: center; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em;">
                              Or paste this link into your browser:
                            </p>
                            <p style="font-size: 12px; color: #fc535a; word-break: break-all; text-align: center; margin: 0; line-height: 1.5; opacity: 0.8;">
                              ${url}
                            </p>
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
                            If you didn't request this email, you can safely ignore it.
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
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "discord"],
    },
  },
  plugins: [username()],
});
