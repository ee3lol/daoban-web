import { db } from "@/db";
import { user as userSchema } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ShieldAlert, Users, Film, Activity, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const allUsers = await db.select().from(userSchema).orderBy(desc(userSchema.createdAt)).limit(50);
  
  return (
    <main className="min-h-screen w-full relative pt-24 pb-32 px-6 md:px-12 lg:px-24">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                <ArrowLeft className="w-5 h-5 text-[#888888] group-hover:text-white" />
              </Link>
              <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-4 h-4 text-accent" />
                <span className="text-accent text-[11px] font-bold tracking-[0.2em] uppercase">Super Admin</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mt-4">Command Center</h1>
            <p className="text-[#888888] text-[15px] mt-1 max-w-xl">
              Welcome to the DAOBAN administrative dashboard. Oversee users, monitor activity, and manage platform configurations.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background-elevated border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase">Total Users</span>
              <Users className="w-5 h-5 text-accent" />
            </div>
            <span className="text-3xl font-bold text-white">{allUsers.length}</span>
          </div>

          <div className="bg-background-elevated border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase">Active Streams</span>
              <Film className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-3xl font-bold text-white">Live</span>
          </div>

          <div className="bg-background-elevated border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase">System Status</span>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold text-white">Online</span>
          </div>

          <div className="bg-background-elevated border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase">Configurations</span>
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-3xl font-bold text-white">Secured</span>
          </div>
        </div>

        {/* User Management Section */}
        <div className="flex flex-col gap-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide">User Management</h2>
          </div>
          
          <div className="bg-background-elevated border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">User</th>
                    <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Email</th>
                    <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Role</th>
                    <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background-light border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {u.image ? (
                              <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-white/30" />
                            )}
                          </div>
                          <span className="text-white text-[14px] font-medium">{u.username || u.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#888888] text-[13px]">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${u.role === 'admin' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-[#888888] text-[13px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
