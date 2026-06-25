"use client";

import Image from "next/image";

interface PhotoUploadProps {
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PhotoUpload({ preview, onChange }: PhotoUploadProps) {
  return (
    <div className="flex justify-center mb-5">
      <label className="relative cursor-pointer">
        {preview ? (
          <Image
            src={preview}
            alt="Foto"
            width={88}
            height={88}
            className="w-[88px] h-[88px] rounded-[26px] object-cover block"
          />
        ) : (
          <div className="w-[88px] h-[88px] rounded-[26px] bg-[#efeeea] border-2 border-dashed border-[#cfcfca] flex flex-col items-center justify-center gap-1">
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <rect
                x="1"
                y="3"
                width="18"
                height="12"
                rx="3"
                stroke="#a8a8a2"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M6 3V2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
                stroke="#a8a8a2"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="10" cy="9" r="3" stroke="#a8a8a2" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="text-[9.5px] text-[#a8a8a2] font-semibold">
              Foto
            </span>
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent border-[3px] border-[#f7f7f8] flex items-center justify-center text-[#17181c] font-extrabold text-sm">
          +
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </label>
    </div>
  );
}
