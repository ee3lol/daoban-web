import { ReactNode } from "react";
import Link from "next/link";
import { Users, UserPlus, Clock, UserCheck } from "lucide-react";

export default function FriendsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col md:flex-row pt-24 pb-20 md:pb-0 px-4 md:px-8 max-w-7xl mx-auto w-full gap-6">
      
      {}
      {}

      {}
      <main className="flex-1 min-w-0 flex flex-col backdrop-blur-xl">
        {children}
      </main>
      
    </div>
  );
}
