import SocialHubClient from "@/components/social-hub-client";
import { getFriendData } from "@/lib/actions/friends";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getFriendData();
  const sp = await searchParams;
  
  return <SocialHubClient initialFriendData={data} activeTab={sp.tab || "all"} currentUser={session.user} />;
}
