"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide preloader after a short delay to allow for hydration and initial paint
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-base)]"
        >
          {/* Glowing background effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-accent/15 rounded-full blur-[100px] animate-pulse" />
          </div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-[0.3em] text-[#EAE8E3] uppercase flex items-center gap-3 md:gap-4 drop-shadow-2xl">
              DAOBAN
              <span className="text-accent text-2xl md:text-4xl font-light">|</span>
              <span className="text-accent text-2xl md:text-4xl font-normal tracking-widest">盗版</span>
            </h1>
            <div className="w-48 md:w-64 h-[2px] bg-white/5 overflow-hidden relative rounded-full shadow-[0_0_10px_var(--color-accent)]/20">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.2, 
                  ease: "easeInOut" 
                }}
                className="w-1/2 h-full bg-accent absolute rounded-full shadow-[0_0_15px_var(--color-accent)]"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
