import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { searchUsers } from "@/lib/actions/admin";
import UsersClient from "./users-client";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Initial load of users (top 50)
  const initialUsers = await searchUsers("");

  return (
    <div className="animate-in fade-in duration-300 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-white text-2xl font-bold tracking-wide">
          User Management
        </h2>
        <p className="text-[#888888] text-[15px] mt-1 max-w-xl text-balance">
          Search and manage registered users. Only Super Admins can assign or revoke administrative roles.
        </p>
      </div>

      <UsersClient initialUsers={initialUsers} currentUser={session?.user} />
    </div>
  );
}
