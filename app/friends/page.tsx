import { getFriendData } from "@/lib/actions/friends";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FriendsManager from "@/components/friends-manager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const sp = await searchParams;
  const data = await getFriendData();

  return (
    <div className="flex w-full h-screen bg-background-base text-white overflow-hidden relative">
      <Link 
        href="/"
        className="absolute top-8 left-8 z-[100] w-12 h-12 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-white/10 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
      >
        <ArrowLeft className="w-5 h-5 text-accent" />
      </Link>
      
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-transparent">
        <FriendsManager data={data} activeTab={sp.tab || "all"} />
      </div>
    </div>
  );
}
