export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-in w-full h-full flex-1 flex flex-col">
      {children}
    </div>
  );
}
