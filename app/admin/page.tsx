import { db } from "@/db";
import { user as userSchema } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminDashboard() {
  const allUsers = await db.select().from(userSchema).orderBy(desc(userSchema.createdAt)).limit(50);
  
  return (
    <div className="animate-in fade-in duration-300 flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-2xl font-bold tracking-wide mb-2">
            Command Center
          </h2>
          <p className="text-[#888888] text-[15px] mt-1 max-w-xl text-balance">
            Welcome to the DAOBAN administrative dashboard. Oversee users, monitor activity, and manage platform configurations.
          </p>
        </div>
      </div>

    </div>
  );
}
