import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[AdminLayout] Failed to get session:", error);
  }

  if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role)) {
    redirect("/");
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[100dvh] relative font-sans overflow-y-auto md:overflow-hidden bg-background-light">
      <AdminSidebar user={session.user} />

      {/* Main Content Area */}
      <div className="flex-1 h-auto md:h-full bg-background-light overflow-visible md:overflow-y-auto custom-scrollbar relative flex justify-center lg:justify-start">
        <div className="w-full max-w-[1300px] p-6 pt-10 md:p-16 lg:pl-24 pb-32">
          {children}
        </div>
      </div>
    </div>
  );
}
