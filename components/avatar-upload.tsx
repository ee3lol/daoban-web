"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function AvatarUpload({ user }: { user: any }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("profilePicture", {
    onClientUploadComplete: async (res) => {
      if (res && res.length > 0) {
        const newUrl = res[0].url;
        setPreviewUrl(newUrl);
        // Update user profile in better-auth
        await authClient.updateUser({
          image: newUrl,
        });
        router.refresh();
      }
    },
    onUploadError: (error: Error) => {
      console.error("Upload failed", error);
      alert("Failed to upload image. Please try again.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Start upload
    startUpload([file]);
  };

  const currentImage = previewUrl || user.image;

  return (
    <div className="flex items-center gap-6">
      <div 
        className="relative group w-24 h-24 rounded-full overflow-hidden cursor-pointer bg-background-elevated border border-white/10 flex-shrink-0"
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="Profile Picture" 
            className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100 group-hover:opacity-75'}`} 
          />
        ) : (
          <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent text-3xl font-bold uppercase">
            {user.username?.[0] || user.name?.[0] || "?"}
          </div>
        )}

        {/* Hover / Loading Overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Change</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <h3 className="text-white text-[16px] font-bold">Profile Picture</h3>
        <p className="text-[#888888] text-[13px] mt-1 max-w-[250px]">
          We support PNG, JPG or GIF up to 4MB. Square images work best.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}
