/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Activity, ShieldAlert, Ban, Megaphone, CheckCircle2, MessageSquare, Trash2, Info, User, FileWarning } from "lucide-react";

export default function AuditLogsClient({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#888888] gap-4">
        <Activity className="w-12 h-12 opacity-20" />
        <p>No audit logs available.</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    if (action.includes('ban')) return <Ban className="w-4 h-4 text-red-500" />;
    if (action.includes('unban')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('role')) return <ShieldAlert className="w-4 h-4 text-amber-500" />;
    if (action.includes('announcement')) return <Megaphone className="w-4 h-4 text-blue-500" />;
    if (action.includes('comment')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes('blacklist')) return <FileWarning className="w-4 h-4 text-red-500" />;
    return <Info className="w-4 h-4 text-[#888888]" />;
  };

  const getActionBadge = (action: string) => {
    let color = 'bg-white/5 text-[#888888]';
    if (action.includes('ban') || action.includes('delete') || action.includes('blacklist')) color = 'bg-red-500/10 text-red-500 border border-red-500/20';
    if (action.includes('unban') || action.includes('unblacklist')) color = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (action.includes('create') || action.includes('toggle')) color = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    if (action.includes('role')) color = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';

    return (
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${color}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-background-light flex items-center justify-center shrink-0 border border-white/5">
              {getActionIcon(log.action)}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-[14px]">
                  {log.admin?.username || log.admin?.name || 'Unknown Admin'}
                </span>
                {getActionBadge(log.action)}
              </div>
              <p className="text-[#888888] text-[13px]">{log.details}</p>
              {log.targetId && (
                <span className="text-[#666666] text-[11px] font-mono mt-1">Target ID: {log.targetId}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[#888888] text-[11px] uppercase tracking-wider font-bold">
              {new Date(log.createdAt).toLocaleDateString()}
            </span>
            <span className="text-[#666666] text-[11px]">
              {new Date(log.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
