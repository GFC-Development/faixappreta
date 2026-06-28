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

/**
 * Calculates the relative luminance of a hex color and returns
 * an appropriate contrasting text color (dark or white).
 * Uses the WCAG relative luminance formula.
 */
function getContrastColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  // sRGB to linear
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Threshold ~0.35 works well for most accent colors
  return luminance > 0.35 ? "#17181c" : "#ffffff";
}

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
    root.style.setProperty("--color-accent-on", getContrastColor(tenantInfo.primaryColor));
    root.style.setProperty("--color-accent-dark-on", getContrastColor(tenantInfo.secondaryColor));

    return () => {
      root.style.removeProperty("--color-accent");
      root.style.removeProperty("--color-accent-dark");
      root.style.removeProperty("--color-accent-light");
      root.style.removeProperty("--color-accent-on");
      root.style.removeProperty("--color-accent-dark-on");
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
