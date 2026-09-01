"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/lib/actions/friends";
import {
  Search,
  UserPlus,
  Check,
  X,
  UserMinus,
  MessageSquare,
  Users,
} from "lucide-react";

export default function FriendsManager({
  data,
  activeTab,
}: {
  data: any;
  activeTab: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(activeTab || "online");
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [optimisticRemoved, setOptimisticRemoved] = useState<string[]>([]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setLoading(true);
    setMessage(null);

    const res = await sendFriendRequest(searchUsername.trim());
    if (res.success) {
      setMessage({
        type: "success",
        text: `Friend request sent to ${searchUsername}!`,
      });
      setSearchUsername("");
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: res.error || "Failed to send request",
      });
    }
    setLoading(false);
  };

  const handleAccept = async (id: string) => {
    setOptimisticRemoved((prev) => [...prev, id]);
    const res = await acceptFriendRequest(id);
    if (res.success) router.refresh();
  };

  const handleDecline = async (id: string) => {
    setOptimisticRemoved((prev) => [...prev, id]);
    const res = await declineFriendRequest(id);
    if (res.success) router.refresh();
  };

  const handleRemove = async (friendId: string, reqId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    setOptimisticRemoved((prev) => [...prev, reqId]);
    const res = await removeFriend(friendId);
    if (res.success) router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-white">
      {/* DAOBAN-style Top Navigation Bar */}
      <div className="flex items-center justify-center pt-8 pb-4 bg-transparent w-full">
        <div className="flex items-center bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-full p-1.5 shadow-inner backdrop-blur-md">
          <button 
            onClick={() => setTab("online")}
            className={`px-6 py-2.5 rounded-full text-[11px] tracking-widest font-bold uppercase transition-all ${tab === "online" ? "bg-white/10 text-white shadow-md" : "text-[#888888] hover:text-white"}`}
          >
            Online
          </button>
          <button 
            onClick={() => setTab("all")}
            className={`px-6 py-2.5 rounded-full text-[11px] tracking-widest font-bold uppercase transition-all ${tab === "all" ? "bg-white/10 text-white shadow-md" : "text-[#888888] hover:text-white"}`}
          >
            All
          </button>
          <button 
            onClick={() => setTab("pending")}
            className={`px-6 py-2.5 rounded-full text-[11px] tracking-widest font-bold uppercase transition-all flex items-center gap-2 ${tab === "pending" ? "bg-white/10 text-white shadow-md" : "text-[#888888] hover:text-white"}`}
          >
            Pending
            {data?.pendingIncoming?.length > 0 && (
              <span className="w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(252,83,90,0.4)]">
                {data.pendingIncoming.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setTab("add")}
            className={`px-6 py-2.5 rounded-full text-[11px] tracking-widest font-bold uppercase transition-all ml-2 ${tab === "add" ? "bg-accent text-accent-foreground" : "bg-transparent text-accent hover:bg-accent/10 border border-accent/20"}`}
          >
            Add Friend
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10">
      <div className="mb-8 border-b border-[rgba(255,255,255,0.05)] pb-6">
        <h1 className="text-2xl font-bold text-ivory tracking-wider uppercase">
          {tab === "all" && "All Friends"}
          {tab === "pending" && "Pending Requests"}
          {tab === "add" && "Add Friend"}
        </h1>
        <p className="text-[#888888] text-sm mt-1">
          {tab === "all" && `You have ${data?.accepted?.length || 0} friends`}
          {tab === "pending" && `Manage your incoming and outgoing requests`}
          {tab === "add" && `Search by exact username to connect`}
        </p>
      </div>

      {tab === "add" && (
        <div className="max-w-md">
          <form onSubmit={handleSendRequest} className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter exact username..."
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[14px] pl-12 pr-4 py-4 text-ivory focus:outline-none focus:border-accent/50 focus:bg-[rgba(255,255,255,0.05)] transition-all"
                required
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-[12px] text-sm font-medium ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-accent/10 text-accent border border-accent/20"}`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !searchUsername.trim()}
              className="bg-accent text-accent-foreground py-3.5 rounded-[12px] font-bold tracking-widest uppercase text-xs hover:brightness-110 transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Send Request
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {}
      {tab === "pending" && (
        <div className="flex flex-col gap-8">
          {}
          <div>
            <h2 className="text-xs font-bold text-[#888888] uppercase tracking-[0.2em] mb-4">
              Incoming Requests ({data?.pendingIncoming?.length || 0})
            </h2>
            {data?.pendingIncoming?.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length === 0 ? (
              <p className="text-[#888888]/50 text-sm">No incoming requests.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.pendingIncoming.filter((r: any) => !optimisticRemoved.includes(r.requestId)).map((req: any) => (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[16px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                        {req.user.image ? (
                          <img
                            src={req.user.image}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#888888] font-bold">
                            {req.user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-ivory font-semibold">
                          {req.user.username}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(req.requestId)}
                        className="w-9 h-9 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center"
                        title="Accept"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDecline(req.requestId)}
                        className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] text-[#888888] hover:bg-red-500/90 hover:text-white transition-colors flex items-center justify-center"
                        title="Decline"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div>
            <h2 className="text-xs font-bold text-[#888888] uppercase tracking-[0.2em] mb-4">
              Outgoing Requests ({data?.pendingOutgoing?.length || 0})
            </h2>
            {data?.pendingOutgoing?.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length === 0 ? (
              <p className="text-[#888888]/50 text-sm">No outgoing requests.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.pendingOutgoing.filter((r: any) => !optimisticRemoved.includes(r.requestId)).map((req: any) => (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[16px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                        {req.user.image ? (
                          <img
                            src={req.user.image}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#888888] font-bold">
                            {req.user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-ivory font-semibold">
                          {req.user.username}
                        </span>
                        <span className="text-[10px] text-[#888888] uppercase tracking-wider">
                          Pending
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDecline(req.requestId)}
                      className="px-4 py-2 rounded-[10px] bg-[rgba(255,255,255,0.05)] text-[#888888] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors text-xs font-bold tracking-widest uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {tab === "all" && (
        <div>
          {data?.accepted?.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Users className="w-16 h-16 text-[#888888] mb-4" />
              <p className="text-ivory font-medium">No friends yet</p>
              <p className="text-[#888888] text-sm mt-1">
                Go to the Add Friend tab to connect!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.accepted?.filter((r: any) => !optimisticRemoved.includes(r.requestId)).map((req: any) => (
                <div
                  key={req.user.id}
                  className="group flex items-center justify-between p-4 bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.08)] rounded-[16px] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                      {req.user.image ? (
                        <img
                          src={req.user.image}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#888888] font-bold text-lg">
                          {req.user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-ivory font-semibold text-lg leading-tight">
                        {req.user.username}
                      </span>
                      <span className="text-[11px] text-[#888888] tracking-widest uppercase">
                        Online
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-10 h-10 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#EAE8E3] hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
                      title="Message (Coming Soon)"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(req.user.id, req.requestId)}
                      className="w-10 h-10 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-[#888888] hover:bg-red-500/80 hover:text-white transition-colors flex items-center justify-center"
                      title="Remove Friend"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
