"use client";

import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "discord" | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    try {
      if (isForgotPassword) {
        const { error } = await authClient.requestPasswordReset({
          email: formData.get("email") as string,
          redirectTo: "/reset-password",
        });
        if (error) {
          setError(error.message || "Failed to send reset link");
        } else {
          setSuccessMsg("Reset link sent! Check your email.");
          setTimeout(() => {
            setIsForgotPassword(false);
            setSuccessMsg(null);
          }, 3000);
        }
      } else if (isLogin) {
        const { error } = await authClient.signIn.email({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        });
        if (error) {
          setError(error.message || "Invalid credentials");
        } else {
          setSuccessMsg("Logged in successfully!");
          setTimeout(() => {
            onClose();
            setSuccessMsg(null);
            router.refresh();
          }, 800);
        }
      } else {
        const { error } = await authClient.signUp.email({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          name: formData.get("username") as string,
          username: formData.get("username") as string,
          
          hasSetUsername: true,
        });
        if (error) {
          setError(error.message || "Registration failed");
        } else {
          setSuccessMsg(
            "Account created! Please check your terminal for the verification link.",
          );
          setTimeout(() => {
            onClose();
            setSuccessMsg(null);
            setIsLogin(true); 
          }, 3000); 
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "discord") {
    setError(null);
    setSocialLoading(provider);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      if (error) {
        setError(error.message || `Failed to sign in with ${provider}`);
      }
    } catch (e) {
      setError("An unexpected error occurred during social login.");
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: "rgba(0, 0, 0, 0.45)" }}
        onClick={onClose}
      />

      {}
      <div
        className="relative w-full max-w-[420px] rounded-[24px] p-7 sm:p-8 transition-all duration-500 flex flex-col gap-6 transform scale-100 opacity-100"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-ivory-muted hover:text-ivory transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ivory tracking-widest uppercase mb-1">
              {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-[#888888] text-[11px] font-medium tracking-widest uppercase">
              {isForgotPassword ? "Enter your email" : isLogin ? "Sign in to continue" : "Join the community"}
            </p>
          </div>

          {!isForgotPassword && (
            <>
              {}
          <div className="relative flex w-full p-1 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.04)] shadow-inner">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[12px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.04)] shadow-sm transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isLogin ? "translate-x-0" : "translate-x-[calc(100%+8px)]"
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`relative w-1/2 py-2.5 text-[14px] font-medium tracking-wide transition-colors duration-300 z-10 ${
                isLogin
                  ? "text-[#EAE8E3]"
                  : "text-[#888888] hover:text-[#C4C4C4]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`relative w-1/2 py-2.5 text-[14px] font-medium tracking-wide transition-colors duration-300 z-10 ${
                !isLogin
                  ? "text-[#EAE8E3]"
                  : "text-[#888888] hover:text-[#C4C4C4]"
              }`}
            >
              Register
            </button>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={socialLoading === "google"}
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-2.5 w-full py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-[12px] text-[#EAE8E3] text-[13px] font-semibold tracking-wide transition-all duration-300 disabled:opacity-50"
            >
              {socialLoading === "google" ? (
                <div className="w-4 h-4 border-2 border-[#EAE8E3]/30 border-t-[#EAE8E3] rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google
            </button>

            <button
              type="button"
              disabled={socialLoading === "discord"}
              onClick={() => handleSocialLogin("discord")}
              className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 rounded-[12px] text-[#EAE8E3] text-[13px] font-semibold tracking-wide transition-all duration-300 disabled:opacity-50"
            >
              {socialLoading === "discord" ? (
                <div className="w-4 h-4 border-2 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#5865F2">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
              )}
              Discord
            </button>
          </div>

          {}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] font-medium text-[#888888] uppercase tracking-[0.15em]">
              Or
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {error && error.length > 0 && (
            <div className="p-3.5 bg-accent/10 border border-accent/30 text-accent text-[13px] font-medium rounded-[12px] text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[13px] font-medium rounded-[12px] text-center">
              {successMsg}
            </div>
          )}
          </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {}
            {!isLogin && !isForgotPassword && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] ml-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-4 py-3.5 text-[#EAE8E3] text-sm placeholder:text-[#888888]/50 focus:outline-none focus:bg-[rgba(255,255,255,0.04)] focus:border-accent/50 focus:shadow-[0_0_0_1px_rgba(212,122,115,0.2)] transition-all"
                  placeholder="Choose a username"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] ml-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-4 py-3.5 text-[#EAE8E3] text-sm placeholder:text-[#888888]/50 focus:outline-none focus:bg-[rgba(255,255,255,0.04)] focus:border-accent/50 focus:shadow-[0_0_0_1px_rgba(212,122,115,0.2)] transition-all"
                placeholder="you@example.com"
              />
            </div>

            {!isForgotPassword && (
              <div className="flex flex-col gap-2 relative">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em]">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[10px] font-bold text-accent uppercase tracking-[0.1em] hover:brightness-110 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-4 py-3.5 pr-12 text-[#EAE8E3] text-sm placeholder:text-[#888888]/50 focus:outline-none focus:bg-[rgba(255,255,255,0.04)] focus:border-accent/50 focus:shadow-[0_0_0_1px_rgba(212,122,115,0.2)] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#EAE8E3] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.5} />
                    ) : (
                      <Eye size={18} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 px-6 py-3.5 bg-accent text-[#F9F8F6] rounded-[14px] font-semibold w-full hover:brightness-110 transition-all duration-300 disabled:opacity-50 tracking-wide flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isForgotPassword ? "Send Link" : isLogin ? "Sign In" : "Register"}
            </button>
            
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="mt-2 text-[#888888] hover:text-[#EAE8E3] text-xs font-semibold uppercase tracking-widest transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
