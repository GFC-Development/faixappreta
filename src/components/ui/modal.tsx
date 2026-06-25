"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[460px] rounded-[18px] bg-white border border-[#e9e9ec] p-6 mx-4 shadow-lg animate-fp-pop">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-archivo font-bold text-lg text-[#17181c]">{title}</h2>
          <button onClick={onClose} className="text-[#9b9ca2] hover:text-[#17181c] transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
