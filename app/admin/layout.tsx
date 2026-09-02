import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="w-full h-full flex flex-col bg-background-base">
      {children}
    </div>
  );
}
