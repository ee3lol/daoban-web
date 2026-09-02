/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getContrastColor } from "@/lib/color";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    template: "%s | DAOBAN",
    default: "DAOBAN - watch movies and shows",
  },
  description: "just a chill place to stream movies and tv shows for free. no bs.",
  openGraph: {
    title: "DAOBAN",
    description: "just a chill place to stream movies and tv shows for free. no bs.",
    url: "https://daoban.lol",
    siteName: "DAOBAN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAOBAN",
    description: "just a chill place to stream movies and tv shows for free. no bs.",
  }
};

import { Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Footer from "@/components/footer";
import SetUsernameModal from "@/components/set-username-modal";
import { getUserPreferences } from "@/lib/actions/appearance";
import Preloader from "@/components/preloader";
import FriendsSidebar from "@/components/friends-sidebar";
import { getFriendData } from "@/lib/actions/friends";
import { SocketProvider } from "@/components/socket-provider";
import PwaProvider from "@/components/pwa-provider";
import AnnouncementBanner from "@/components/announcement-banner";
import { getActiveAnnouncements } from "@/lib/actions/admin";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[Better Auth] Silent catch in RootLayout:", error);
  }

  const user = session?.user ?? null;

  let prefs = null;
  try {
    prefs = await getUserPreferences();
  } catch (err) {
    console.error("[DB] Silent catch for preferences:", err);
  }

  let friendData = null;
  if (user) {
    try {
      friendData = await getFriendData();
    } catch (err) {
      console.error("[DB] Silent catch for friend data:", err);
    }
  }

  let announcements: any = [];
  try {
    announcements = await getActiveAnnouncements();
  } catch (err) {
    console.error("[DB] Silent catch for announcements:", err);
  }

  const accentColor = prefs?.accentColor ?? '#fc535a';
  const showFilmGrain = prefs?.filmGrain ?? true;
  const themeStyle = prefs?.themeStyle ?? 'dark';

  let bgBase = '#050505';
  let bgElevated = '#0a0a0a';
  let bgLight = '#151515';

  if (themeStyle === 'pitch_black') {
    bgBase = '#000000';
    bgElevated = '#050505';
    bgLight = '#0a0a0a';
  } else if (themeStyle === 'midnight') {
    bgBase = '#020617';
    bgElevated = '#0f172a';
    bgLight = '#1e293b';
  }

  const accentForeground = getContrastColor(accentColor);

  return (
    <html lang="en" className={themeStyle}>
      <body
        className={`font-sans antialiased bg-background-base text-[#EAE8E3] min-h-screen relative overflow-x-hidden ${inter.variable}`}
        style={{
          '--accent-red': accentColor,
          '--accent-foreground': accentForeground,
          '--bg-base': bgBase,
          '--bg-elevated': bgElevated,
          '--bg-light': bgLight
        } as React.CSSProperties}
      >
        <SocketProvider userId={user?.id}>
          {showFilmGrain && <div className="film-grain" />}
          <Preloader />
          <AnnouncementBanner announcements={announcements} />
          <Navbar user={user} />
          <FriendsSidebar user={user} data={friendData} />
          {user && !user.hasSetUsername && <SetUsernameModal user={user} />}
          {children}
          <Footer />
          <PwaProvider />
        </SocketProvider>
      </body>
    </html>
  );
}
