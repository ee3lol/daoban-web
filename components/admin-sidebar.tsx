/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Users, 
  Settings, 
  ArrowLeft,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Megaphone,
  Activity
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function AdminSidebar({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between w-full bg-background-elevated border-b border-white/5 px-6 py-4 z-30 sticky top-0">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-white font-bold tracking-widest uppercase text-[12px]">
          Command Center
        </span>
        <button
          onClick={() => router.push("/")}
          className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 md:z-auto md:relative w-[280px] shrink-0 h-full bg-background-elevated md:bg-transparent md:border-r border-white/5 flex flex-col pt-12 overflow-y-auto custom-scrollbar transition-transform duration-300 transform ${isDrawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-8 flex flex-col gap-8 pb-12">
          {/* User Info / Profile Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-background-light flex items-center justify-center shrink-0">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.username || user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-white/30" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-white text-[15px] font-bold tracking-wide truncate">
                  {user?.username || user?.name || 'Admin'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldAlert className="w-3 h-3 text-[#888888]" />
                  <span className="text-[#888888] text-[9px] font-bold tracking-[0.2em] uppercase">
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="md:hidden p-2 text-white/50 hover:text-white transition-colors bg-white/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase px-4 mb-3">
              Management
            </h3>

            <Link
              href="/admin"
              onClick={() => setIsDrawerOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${pathname === "/admin"
                ? "bg-background-light text-white"
                : "text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5"
                }`}
            >
              <LayoutDashboard
                className={`w-4 h-4 ${pathname === "/admin" ? "text-accent" : ""}`}
              />
              Dashboard
            </Link>

            <Link
              href="/admin/users"
              onClick={() => setIsDrawerOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${pathname === "/admin/users"
                ? "bg-background-light text-white"
                : "text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5"
                }`}
            >
              <Users
                className={`w-4 h-4 ${pathname === "/admin/users" ? "text-accent" : ""}`}
              />
              Users
            </Link>

            <Link
              href="/admin/moderation"
              onClick={() => setIsDrawerOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${pathname === "/admin/moderation"
                ? "bg-background-light text-white"
                : "text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5"
                }`}
            >
              <ShieldAlert
                className={`w-4 h-4 ${pathname === "/admin/moderation" ? "text-accent" : ""}`}
              />
              Moderation
            </Link>

            <Link
              href="/admin/announcements"
              onClick={() => setIsDrawerOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${pathname === "/admin/announcements"
                ? "bg-background-light text-white"
                : "text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5"
                }`}
            >
              <Megaphone
                className={`w-4 h-4 ${pathname === "/admin/announcements" ? "text-accent" : ""}`}
              />
              Announcements
            </Link>

            {user?.role === 'super_admin' && (
              <Link
                href="/admin/audit-logs"
                onClick={() => setIsDrawerOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${pathname === "/admin/audit-logs"
                  ? "bg-background-light text-white"
                  : "text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5"
                  }`}
              >
                <Activity
                  className={`w-4 h-4 ${pathname === "/admin/audit-logs" ? "text-accent" : ""}`}
                />
                Audit Logs
              </Link>
            )}
          </div>

          <div className="border-t border-white/5 mt-4 pt-6 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5 text-left"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Site
            </button>
            <button
              type="button"
              onClick={() => router.push("/me")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5 text-left"
            >
              <UserIcon className="w-4 h-4" />
              User Dashboard
            </button>
            <button
              type="button"
              onClick={async () => {
                await authClient.signOut();
                window.location.href = "/";
              }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-accent hover:bg-accent/10 transition-colors rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
