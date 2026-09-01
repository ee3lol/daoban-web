"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, X, Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { checkHasPassword, requestPasswordOTP, verifyAndSetPassword } from "@/lib/actions/password";

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

export default function UpdatePasswordModal({ isOpen, onClose, email }: UpdatePasswordModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setOtpSent(false);
      setError("");
      setSuccess(false);
      
      const checkStatus = async () => {
        setLoading(true);
        const res = await checkHasPassword();
        if (res.success) {
          setHasPassword(res.hasPassword ?? false);
        } else {
          setError("Failed to verify account status.");
        }
        setLoading(false);
      };
      
      checkStatus();
    }
  }, [isOpen]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      
      if (res.error) {
        setError(res.error.message || "Failed to update password.");
      } else {
        setSuccess(true);
        setTimeout(onClose, 2000);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    setSubmitting(true);
    setError("");
    
    const res = await requestPasswordOTP();
    if (res.success) {
      setOtpSent(true);
    } else {
      setError(res.error || "Failed to send verification code.");
    }
    setSubmitting(false);
  };

  const handleSetPasswordWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setSubmitting(true);
    setError("");
    
    const res = await verifyAndSetPassword(otp, newPassword);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(onClose, 2000);
    } else {
      setError(res.error || "Failed to set password.");
    }
    
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-background-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-background-light/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-[#EAE8E3]">
                {hasPassword === false ? "Set Password" : "Update Password"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#888888] hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                <p className="text-[#888888] text-sm">Checking account security...</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                <p className="text-[#888888] text-sm">
                  Your account is now secure.
                </p>
              </div>
            ) : hasPassword ? (
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        setError("");
                        if (!email) {
                          setError("Email address not found.");
                          setSubmitting(false);
                          return;
                        }
                        const res = await authClient.requestPasswordReset({
                          email,
                          redirectTo: "/reset-password",
                        });
                        if (res.error) {
                          setError(res.error.message || "Failed to send reset link.");
                        } else {
                          setError("Reset link sent! Check your email.");
                        }
                        setSubmitting(false);
                      }}
                      className="text-[10px] font-bold text-accent uppercase tracking-[0.1em] hover:brightness-110 transition-colors mb-2 disabled:opacity-50"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-[#EAE8E3] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                
                <div className="pt-2 border-t border-white/5">
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-[#EAE8E3] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-[#EAE8E3] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20"
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
                  disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full mt-6 bg-accent text-accent-foreground py-3.5 rounded-xl font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </form>
            ) : (
              
              <div className="space-y-4">
                {!otpSent ? (
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                      <Mail className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Protect Your Account</h3>
                    <p className="text-[#888888] text-sm mb-8 leading-relaxed max-w-sm">
                      Since you signed up with a social account, you don't have a password yet. We'll send a verification code to <strong>{email}</strong> so you can set one up.
                    </p>
                    
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 mb-6 w-full text-left">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSendOTP}
                      disabled={submitting}
                      className="w-full bg-accent text-accent-foreground py-3.5 rounded-xl font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Verification Code"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSetPasswordWithOTP} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-[#EAE8E3] font-mono tracking-[0.5em] text-center text-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                        placeholder="6-digit code"
                        maxLength={6}
                        required
                      />
                      <p className="text-[#666666] text-xs text-center mt-2">
                        Code sent to {email}
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-white/5">
                      <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-[#EAE8E3] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20"
                        placeholder="At least 8 characters"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-[#EAE8E3] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20"
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
                      disabled={submitting || !otp || !newPassword || !confirmPassword}
                      className="w-full mt-6 bg-accent text-accent-foreground py-3.5 rounded-xl font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Account"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
