import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getContrastColor } from "@/lib/color";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DAOBAN | 盗版",
  description: "A cinematic movie streaming experience.",
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user ?? null;
  const prefs = await getUserPreferences();
  
  const accentColor = prefs?.accentColor ?? '#D47A73';
  const showFilmGrain = prefs?.filmGrain ?? true;
  const themeStyle = prefs?.themeStyle ?? 'dark';

  // Map themeStyle to CSS variables
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
    <html lang="en" className="h-full antialiased">
      <body 
        className={`${inter.className} min-h-full flex flex-col`}
        style={{ 
          '--accent-red': accentColor,
          '--accent-foreground': accentForeground,
          '--bg-base': bgBase,
          '--bg-elevated': bgElevated,
          '--bg-light': bgLight
        } as React.CSSProperties}
      >
        {showFilmGrain && <div className="film-grain" />}
        <Preloader />
        <Navbar user={user} />
        {user && !user.hasSetUsername && <SetUsernameModal user={user} />}
        {children}
        <Footer />
      </body>
    </html>
  );
}
