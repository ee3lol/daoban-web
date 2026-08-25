import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/navbar";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DAOBAN | 盗版",
  description: "A cinematic movie streaming experience.",
};

import Footer from "@/components/footer";
import SetUsernameModal from "@/components/set-username-modal";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user ?? null;

  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <div className="film-grain" />
        <Navbar user={user} />
        {user && !user.hasSetUsername && <SetUsernameModal user={user} />}
        {children}
        <Footer />
      </body>
    </html>
  );
}
