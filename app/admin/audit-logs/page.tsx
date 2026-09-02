import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/lib/actions/admin";
import AuditLogsClient from "./audit-logs-client";

export const metadata = {
  title: 'Audit Logs | Admin',
};

export default async function AuditLogsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Only super_admin can view audit logs
  if (!session?.user || (session.user as any).role !== 'super_admin') {
    redirect("/admin");
  }

  const logs = await getAuditLogs();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
            Audit Logs
            <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded font-bold uppercase tracking-widest border border-accent/20">Super Admin Only</span>
          </h1>
          <p className="text-[#888888] mt-2 text-[15px]">An immutable ledger of all administrative actions taken on the platform.</p>
        </div>

        <AuditLogsClient logs={logs} />
      </div>
    </div>
  );
}
