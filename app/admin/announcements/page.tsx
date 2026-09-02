import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAnnouncements } from "@/lib/actions/admin";
import AnnouncementsClient from "./announcements-client";

export const metadata = {
  title: 'Announcements | Admin',
};

export default async function AnnouncementsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role)) {
    redirect("/");
  }

  const announcements = await getAnnouncements();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Global Announcements</h1>
          <p className="text-[#888888] mt-2 text-[15px]">Create and manage banners that appear for all users on DAOBAN.</p>
        </div>

        <AnnouncementsClient initialAnnouncements={announcements} />
      </div>
    </div>
  );
}
