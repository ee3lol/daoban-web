/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Users, ShieldAlert, MoreVertical, Loader2, X, Ban, Settings2, ChevronDown, Check } from "lucide-react";
import { searchUsers, updateUserRole, updateUserBan } from "@/lib/actions/admin";

export default function UsersClient({ initialUsers, currentUser }: { initialUsers: any[], currentUser: any }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Custom Dropdown State
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Ban Confirmation State
  const [isConfirmingBan, setIsConfirmingBan] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [banDuration, setBanDuration] = useState<number | null>(null); // null = permanent
  const [banReason, setBanReason] = useState("");

  const durationOptions = [
    { value: 24, label: "24 Hours" },
    { value: 72, label: "3 Days" },
    { value: 168, label: "7 Days" },
    { value: 720, label: "30 Days" },
    { value: null, label: "Permanent" },
  ];

  const isSuperAdmin = currentUser?.role === "super_admin";
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchUsers(query);
      setUsers(results);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset confirmation state when modal changes
  useEffect(() => {
    setIsConfirmingBan(false);
    setConfirmUsername("");
    setConfirmText("");
    setIsRoleDropdownOpen(false);
  }, [selectedUser]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) return;
    setUpdatingId(userId);
    setIsRoleDropdownOpen(false);
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, role: newRole }));
      }
    } else {
      alert(res.error || "Failed to update role");
    }
    setUpdatingId(null);
  };

  const handleBanToggle = async (user: any) => {
    if (!user.banned) {
      // If we are suspending, require confirmation
      if (!isConfirmingBan) {
        setIsConfirmingBan(true);
        return;
      }
      const targetName = user.username || user.name;
      if (confirmUsername.toLowerCase() !== targetName.toLowerCase() || confirmText.toLowerCase() !== "banpan this user") {
        return;
      }
    }

    const isBanning = !user.banned;
    setUpdatingId(user.id);
    const res = await updateUserBan(user.id, isBanning, isBanning ? banDuration : null, isBanning ? (banReason || null) : null);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, banned: isBanning } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev: any) => ({ ...prev, banned: isBanning }));
      }
      setIsConfirmingBan(false);
      setConfirmUsername("");
      setConfirmText("");
      setBanDuration(null);
      setBanReason("");
    } else {
      alert(res.error || "Failed to update ban status");
    }
    setUpdatingId(null);
  };

  const roleOptions = [
    { value: "user", label: "Standard User" },
    { value: "admin", label: "Administrator" },
    { value: "super_admin", label: "Super Admin" }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all shadow-lg"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 pl-6 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase w-1/3">User</th>
                <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase w-1/3">Email</th>
                <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Role</th>
                <th className="p-4 text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 relative">
              {users.length === 0 && !isSearching && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#888888] text-[13px]">
                    No users found matching "{query}".
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-background-light border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        <img src={u.image || "/avatar/default1.png"} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-[14px] font-semibold tracking-wide flex items-center gap-2">
                          {u.username || u.name}
                          {u.banned && <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] px-1.5 rounded uppercase tracking-wider">Banned</span>}
                        </span>
                        {u.username && (
                          <span className="text-[#888888] text-[11px]">{u.name}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#888888] text-[13px]">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                      u.role === 'super_admin' ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_10px_rgba(252,83,90,0.1)]' : 
                      u.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                      'bg-white/5 text-[#888888] border border-white/10'
                    }`}>
                      {u.role === 'super_admin' ? 'Super Admin' : u.role || 'user'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="inline-flex items-center justify-center p-2 text-[#888888] hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl w-full max-w-md relative z-10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-white text-lg font-bold tracking-wide flex items-center gap-2">
                Manage User
              </h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#888888] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-8">
              {/* Profile Overview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-background-light border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={selectedUser.image || "/avatar/default1.png"} alt={selectedUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-lg font-semibold tracking-wide">
                    {selectedUser.username || selectedUser.name}
                  </span>
                  <span className="text-[#888888] text-[13px]">{selectedUser.email}</span>
                  <span className="text-[#888888] text-[11px] mt-1">Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Settings Section */}
              <div className="flex flex-col gap-6">
                
                {/* Role Management */}
                <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
                  <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">User Role</label>
                  {isSuperAdmin && selectedUser.id !== currentUser.id ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        disabled={updatingId === selectedUser.id}
                        className="w-full flex items-center justify-between bg-background-light border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-[13px] text-white cursor-pointer outline-none transition-all shadow-inner focus:border-accent"
                      >
                        <span className="font-medium">
                          {roleOptions.find(opt => opt.value === (selectedUser.role || 'user'))?.label}
                        </span>
                        {updatingId === selectedUser.id ? (
                          <Loader2 className="w-4 h-4 text-accent animate-spin" />
                        ) : (
                          <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {isRoleDropdownOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-background-light border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {roleOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleRoleChange(selectedUser.id, option.value)}
                              className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-left hover:bg-white/5 transition-colors"
                            >
                              <span className={`font-medium ${selectedUser.role === option.value ? 'text-accent' : 'text-white'}`}>
                                {option.label}
                              </span>
                              {selectedUser.role === option.value && (
                                <Check className="w-4 h-4 text-accent" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-[13px] text-[#888888] opacity-75">
                      {selectedUser.role === 'super_admin' ? 'Super Admin' : selectedUser.role === 'admin' ? 'Administrator' : 'Standard User'}
                      {selectedUser.id === currentUser.id && " (You cannot change your own role)"}
                      {!isSuperAdmin && " (Requires Super Admin)"}
                    </div>
                  )}
                </div>

                {/* Account Status / Ban */}
                {selectedUser.id !== currentUser.id && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Account Status</label>
                    <div className="flex flex-col gap-4 p-4 rounded-xl border border-white/5 bg-background-light">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className={`text-[13px] font-semibold ${selectedUser.banned ? 'text-red-500' : 'text-emerald-500'}`}>
                            {selectedUser.banned ? 'Account Suspended' : 'Account Active'}
                          </span>
                          <span className="text-[#888888] text-[11px] mt-0.5">
                            {selectedUser.banned ? 'User cannot log in or access the platform.' : 'User has full access to the platform.'}
                          </span>
                          {!isSuperAdmin && (selectedUser.role === 'admin' || selectedUser.role === 'super_admin') && (
                             <span className="text-red-400 text-[11px] mt-2 font-medium">Only Super Admins can suspend administrators.</span>
                          )}
                        </div>
                        {(!isConfirmingBan || selectedUser.banned) && (
                          <button
                            onClick={() => handleBanToggle(selectedUser)}
                            disabled={
                              updatingId === selectedUser.id || 
                              (!isSuperAdmin && (selectedUser.role === 'admin' || selectedUser.role === 'super_admin'))
                            }
                            className={`px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${
                              (!isSuperAdmin && (selectedUser.role === 'admin' || selectedUser.role === 'super_admin'))
                                ? 'bg-white/5 text-[#888888] cursor-not-allowed opacity-50'
                                : selectedUser.banned 
                                  ? 'bg-white/5 text-white hover:bg-white/10' 
                                  : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            }`}
                          >
                            {updatingId === selectedUser.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Ban className="w-3 h-3" />
                            )}
                            {selectedUser.banned ? 'Unban User' : 'Suspend User'}
                          </button>
                        )}
                      </div>

                      {/* Confirmation Inputs */}
                      {isConfirmingBan && !selectedUser.banned && (
                        <div className="flex flex-col gap-3 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Duration Selector */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[#888888] text-[11px] uppercase tracking-wider font-bold">Duration</label>
                            <div className="flex flex-wrap gap-2">
                              {durationOptions.map((opt) => (
                                <button
                                  key={String(opt.value)}
                                  type="button"
                                  onClick={() => setBanDuration(opt.value)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all border ${
                                    banDuration === opt.value
                                      ? opt.value === null
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : 'bg-accent/20 text-accent border-accent/30'
                                      : 'bg-white/5 text-[#888888] border-white/5 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reason Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[#888888] text-[11px] uppercase tracking-wider font-bold">Reason <span className="normal-case tracking-normal font-normal">(shown to user)</span></label>
                            <input
                              type="text"
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="e.g. Spamming, harassment, etc."
                              className="w-full bg-background border border-white/10 focus:border-white/20 rounded-lg px-3 py-2 text-[13px] text-white outline-none transition-colors"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[#888888] text-[11px] uppercase tracking-wider">
                              Type <strong className="text-white select-all normal-case tracking-normal">{selectedUser.username || selectedUser.name}</strong> to confirm
                            </label>
                            <input
                              type="text"
                              value={confirmUsername}
                              onChange={(e) => setConfirmUsername(e.target.value)}
                              placeholder="Username..."
                              className="w-full bg-background border border-white/10 focus:border-red-500/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[#888888] text-[11px] uppercase tracking-wider">
                              Type <strong className="text-white select-all normal-case tracking-normal">banpan this user</strong> to confirm
                            </label>
                            <input
                              type="text"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              placeholder="banpan this user"
                              className="w-full bg-background border border-white/10 focus:border-red-500/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none transition-colors"
                            />
                          </div>
                          
                          <div className="flex justify-end mt-2">
                             <button
                               onClick={() => handleBanToggle(selectedUser)}
                               disabled={
                                 updatingId === selectedUser.id || 
                                 (!isSuperAdmin && (selectedUser.role === 'admin' || selectedUser.role === 'super_admin')) ||
                                 (confirmUsername.toLowerCase() !== (selectedUser.username || selectedUser.name).toLowerCase() || confirmText.toLowerCase() !== "banpan this user")
                               }
                               className={`px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                                 (confirmUsername.toLowerCase() === (selectedUser.username || selectedUser.name).toLowerCase() && confirmText.toLowerCase() === "banpan this user")
                                   ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/20'
                                   : 'bg-white/5 text-[#888888] cursor-not-allowed opacity-50 border border-white/5'
                               }`}
                             >
                               {updatingId === selectedUser.id ? (
                                 <Loader2 className="w-3 h-3 animate-spin" />
                               ) : (
                                 <Ban className="w-3 h-3" />
                               )}
                               Confirm Suspend
                             </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
