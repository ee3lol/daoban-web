"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SetUsernameModal({ user }: { user: any }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If the user has already set their username or is not logged in, don't show the modal
  if (!user || user.hasSetUsername) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setError(null);
    setLoading(true);

    try {
      // Check if username is available
      const { data: isAvailable } = await authClient.isUsernameAvailable({
        username: username.trim(),
      });

      if (isAvailable && !isAvailable.available) {
        setError("This username is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      // Update the user
      const { error: updateError } = await authClient.updateUser({
        username: username.trim(),
        // @ts-ignore: custom field
        hasSetUsername: true,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update username");
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Soft backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-[420px] rounded-[24px] p-7 sm:p-8 flex flex-col gap-6"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div className="text-center">
          <h2 className="text-xl font-bold text-ivory tracking-widest uppercase mb-2">
            Complete Your Profile
          </h2>
          <p className="text-[#888888] text-[12px] font-medium leading-relaxed">
            Welcome to DAOBAN! Since you signed in with a social account, please
            pick a unique username to continue.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-accent/10 border border-accent/30 text-accent text-[13px] font-medium rounded-[12px] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] ml-1">
              Choose a Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[#888888] text-[15px] font-medium pointer-events-none">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[12px] pl-9 pr-4 py-3.5 text-[#EAE8E3] text-[15px] placeholder:text-[#888888]/50 focus:outline-none focus:bg-[rgba(255,255,255,0.04)] focus:border-accent/50 focus:shadow-[0_0_0_1px_rgba(212,122,115,0.2)] transition-all font-medium"
                placeholder="cinematic_fan"
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_]+$"
                title="Only letters, numbers, and underscores are allowed."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="mt-2 px-6 py-3.5 bg-accent text-[#F9F8F6] rounded-[14px] font-semibold w-full hover:brightness-110 transition-all duration-300 disabled:opacity-50 tracking-wide "
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
