"use client";

import { useEffect } from "react";

export default function PwaProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
      });
    }
  }, []);

  return null;
}
