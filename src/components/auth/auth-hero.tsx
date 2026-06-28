"use client";

import Image from "next/image";

interface AuthHeroProps {
  tenantName: string;
  tenantSlug: string;
  logoUrl?: string | null;
}

export function AuthHero({ tenantName, tenantSlug, logoUrl }: AuthHeroProps) {
  const displayName = tenantName || "faixappreta";
  const initial = displayName.charAt(0).toUpperCase();
  const subdomain = tenantSlug
    ? `${tenantSlug}.faixappreta.com.br`
    : "faixappreta.com.br";

  return (
    <div className="bg-[#17181c] px-[26px] pt-[30px] pb-[26px] flex flex-col items-center text-center">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={displayName}
          width={56}
          height={56}
          className="rounded-2xl object-cover"
          style={{ width: 56, height: 56 }}
        />
      ) : (
        <div
          className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center font-archivo font-extrabold text-[27px] text-[color:var(--color-accent-on)]"
          style={{ boxShadow: "0 8px 24px rgba(224,138,30,.34)" }}
        >
          {initial}
        </div>
      )}
      <div className="font-archivo font-bold text-[19px] text-[#fbfbf8] mt-3.5">
        {displayName}
      </div>
      <div className="font-spline text-[10.5px] tracking-[.06em] text-[#76787f] mt-1.5">
        {subdomain}
      </div>
    </div>
  );
}
