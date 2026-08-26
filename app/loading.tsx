import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center relative">
      <div className="w-[150px] md:w-[200px] h-[150px] md:h-[200px] bg-accent/10 rounded-full blur-[60px] md:blur-[80px] absolute" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-accent animate-spin" />
        <p className="text-accent text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
