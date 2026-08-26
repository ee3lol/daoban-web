import { getFriendData } from "@/lib/actions/friends";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FriendsManager from "@/components/friends-manager";

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }
  
  // Await search params for Next.js 15
  const sp = await searchParams;
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[rgba(255,255,255,0.01)] rounded-[20px] m-6 border border-white/5">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
        <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-black text-ivory tracking-widest uppercase mb-4">
        Coming Soon
      </h1>
      <p className="text-[#888888] max-w-md text-sm leading-relaxed mb-8">
        We are putting the final touches on our social features. Soon you'll be able to add friends, share watchlists, and chat in real-time!
      </p>
    </div>
  );
}
