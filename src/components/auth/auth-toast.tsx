"use client";

interface AuthToastProps {
  message: string | null;
}

export function AuthToast({ message }: AuthToastProps) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[90] bg-[#17181c] text-white px-[18px] py-[11px] rounded-xl text-[13px] font-semibold shadow-[0_8px_30px_rgba(0,0,0,.3)] animate-fp-pop whitespace-nowrap">
      {message}
    </div>
  );
}
