"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Navbar from "@/components/navbar";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (res.error) {
        setError(res.error.message || "Failed to reset password.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 py-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h3>
        <p className="text-[#888888] text-sm">
          Redirecting you to the home page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] ml-1">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={!token || loading}
          className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-4 py-3.5 text-[#EAE8E3] text-sm placeholder:text-[#888888]/50 focus:outline-none focus:bg-[rgba(255,255,255,0.04)] focus:border-accent/50 focus:shadow-[0_0_0_1px_rgba(212,122,115,0.2)] transition-all disabled:opacity-50"
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] ml-1">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!token || loading}
          className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-4 py-3.5 text-[#EAE8E3] text-sm placeholder:text-[#888888]/50 focus:outline-none focus:bg-[rgba(255,255,255,0.04)] focus:border-accent/50 focus:shadow-[0_0_0_1px_rgba(212,122,115,0.2)] transition-all disabled:opacity-50"
          placeholder="Confirm new password"
          required
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 mt-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !token || !newPassword || !confirmPassword}
        className="mt-6 px-6 py-4 bg-accent text-[#F9F8F6] rounded-[14px] font-semibold w-full hover:brightness-110 transition-all duration-300 disabled:opacity-50 tracking-wide flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background text-[#EAE8E3] font-sans overflow-x-hidden selection:bg-accent/30 selection:text-white">
      <Navbar />

      <main className="pt-28 md:pt-36 px-4 md:px-8 max-w-7xl mx-auto pb-20 flex justify-center">
        <div className="w-full max-w-md bg-background-elevated border border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Subtle glow effect behind form */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-accent/5 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <KeyRound className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-2">
              Reset Password
            </h1>
            <p className="text-[#888888] text-sm max-w-sm">
              Securely create a new password for your DAOBAN account.
            </p>
          </div>

          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
