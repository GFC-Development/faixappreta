"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

interface TenantInfo {
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  enablePlans: boolean;
  enableTimer: boolean;
}

const TenantInfoContext = createContext<TenantInfo | null>(null);

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);

  useEffect(() => {
    const slug = session?.user?.tenantSlug;
    if (!slug) return;

    fetch(`/api/tenant-info?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.primaryColor) {
          setTenantInfo(data);
        }
      })
      .catch(() => {});
  }, [session?.user?.tenantSlug]);

  useEffect(() => {
    if (!tenantInfo) return;
    const root = document.documentElement;
    root.style.setProperty("--color-accent", tenantInfo.primaryColor);
    root.style.setProperty("--color-accent-dark", tenantInfo.secondaryColor);
    root.style.setProperty("--color-accent-light", tenantInfo.primaryColor + "cc");

    return () => {
      root.style.removeProperty("--color-accent");
      root.style.removeProperty("--color-accent-dark");
      root.style.removeProperty("--color-accent-light");
    };
  }, [tenantInfo]);

  return (
    <TenantInfoContext.Provider value={tenantInfo}>
      {children}
    </TenantInfoContext.Provider>
  );
}

export function useTenantInfo() {
  return useContext(TenantInfoContext);
}
