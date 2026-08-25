import { ReactNode } from "react";
import Link from "next/link";
import { Users, UserPlus, Clock, UserCheck } from "lucide-react";

export default function FriendsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col md:flex-row pt-24 pb-20 md:pb-0 px-4 md:px-8 max-w-7xl mx-auto w-full gap-6">
      
      {/* Sidebar temporarily hidden for Coming Soon */}
      {/* 
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar">
        <div className="flex flex-row md:flex-col gap-2 w-max md:w-full">
          <Link 
            href="/friends"
            className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[#EAE8E3] font-medium hover:bg-[rgba(255,255,255,0.06)] transition-all flex-shrink-0"
          >
            <Users className="w-5 h-5 text-[#D47A73]" />
            <span className="text-sm tracking-wide">All Friends</span>
          </Link>
          
          <Link 
            href="/friends?tab=pending"
            className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[rgba(255,255,255,0.015)] border border-transparent text-[#888888] font-medium hover:bg-[rgba(255,255,255,0.04)] hover:text-[#EAE8E3] transition-all flex-shrink-0"
          >
            <Clock className="w-5 h-5" />
            <span className="text-sm tracking-wide">Pending</span>
          </Link>
          
          <Link 
            href="/friends?tab=add"
            className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[rgba(212,122,115,0.1)] border border-[rgba(212,122,115,0.2)] text-[#D47A73] font-medium hover:bg-[rgba(212,122,115,0.15)] transition-all flex-shrink-0 mt-0 md:mt-4"
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-sm tracking-wide">Add Friend</span>
          </Link>
        </div>
      </aside>
      */}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col backdrop-blur-xl">
        {children}
      </main>
      
    </div>
  );
}
