/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install DAOBAN, use your browser's 'Add to Home Screen' or 'Install' option. (If you are on an iPhone, tap the Share icon and select 'Add to Home Screen').");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <button 
      onClick={handleInstallClick}
      className="text-[#888888] hover:text-accent transition-colors"
      title="Install App"
    >
      <Download className="w-5 h-5" strokeWidth={2} />
    </button>
  );
}
