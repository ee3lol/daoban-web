import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRecentComments, getBlacklistedMedia } from "@/lib/actions/admin";
import ModerationClient from "./moderation-client";

export const metadata = {
  title: 'Content Moderation | Admin',
};

export default async function ModerationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role)) {
    redirect("/");
  }

  const [comments, blacklisted] = await Promise.all([
    getRecentComments(100),
    getBlacklistedMedia()
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Content Moderation</h1>
          <p className="text-[#888888] mt-2 text-[15px]">Monitor platform comments and manage content takedowns.</p>
        </div>

        <ModerationClient 
          initialComments={comments} 
          initialBlacklist={blacklisted} 
        />
      </div>
    </div>
  );
}
