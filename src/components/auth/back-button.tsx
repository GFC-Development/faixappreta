"use client";

import Link from "next/link";

interface BackButtonProps {
  href: string;
  label?: string;
}

export function BackButton({ href, label = "Voltar" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-[13px] text-[#82838a] font-semibold mb-3.5 hover:text-content-primary transition-colors"
    >
      <span className="text-base">‹</span> {label}
    </Link>
  );
}
