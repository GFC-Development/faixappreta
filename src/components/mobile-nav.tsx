"use client";

import Link from "next/link";


interface MobileNavProps {
  isAdmin: boolean;
  pathname: string;
  onMenuOpen: () => void;
  tenantInfo: { enablePlans?: boolean } | null;
}

interface TabItem {
  href?: string;
  label: string;
  action?: "menu";
  icon: "home" | "calendar" | "check" | "users" | "menu" | "belt" | "card" | "user";
}

const adminTabs: TabItem[] = [
  { href: "/admin", label: "Início", icon: "home" },
  { href: "/admin/agenda", label: "Agenda", icon: "calendar" },
  { href: "/admin/roll-call", label: "Chamada", icon: "check" },
  { href: "/admin/approvals", label: "Alunos", icon: "users" },
  { label: "Mais", action: "menu", icon: "menu" },
];

const studentTabs: TabItem[] = [
  { href: "/student", label: "Início", icon: "home" },
  { href: "/student/agenda", label: "Agenda", icon: "calendar" },
  { href: "/student/graduations", label: "Graus", icon: "belt" },
  { href: "/student/plans", label: "Planos", icon: "card" },
  { href: "/student/account", label: "Conta", icon: "user" },
];

function TabIcon({ icon, color }: { icon: TabItem["icon"]; color: string }) {
  const s = { stroke: color, fill: "none", strokeWidth: 2 };

  switch (icon) {
    case "home":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="1" y="1" width="16" height="16" rx="4" {...s} />
        </svg>
      );
    case "calendar":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="1" y="3" width="16" height="14" rx="3" {...s} />
          <line x1="5" y1="1" x2="5" y2="5" {...s} strokeLinecap="round" />
          <line x1="13" y1="1" x2="13" y2="5" {...s} strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="1" y="1" width="16" height="16" rx="4" {...s} />
          <polyline points="5,9 8,12 13,6" {...s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="7" r="3" {...s} />
          <path d="M3 17c0-3.3 2.7-6 6-6s6 2.7 6 6" {...s} strokeLinecap="round" />
        </svg>
      );
    case "menu":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <line x1="3" y1="5" x2="15" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="9" x2="15" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "belt":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="1" y="6" width="16" height="6" rx="2" {...s} />
        </svg>
      );
    case "card":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="1" y="3" width="16" height="12" rx="3" {...s} />
          <line x1="1" y1="7" x2="17" y2="7" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "user":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="6" r="3" {...s} />
          <path d="M4 16c0-2.8 2.2-5 5-5s5 2.2 5 5" {...s} strokeLinecap="round" />
        </svg>
      );
  }
}

export function MobileNav({ isAdmin, pathname, onMenuOpen, tenantInfo }: MobileNavProps) {
  let tabs = isAdmin ? adminTabs : studentTabs;

  // Filter out Plans tab if feature flag is off
  if (!isAdmin && tenantInfo && !tenantInfo.enablePlans) {
    tabs = tabs.filter((t) => t.href !== "/student/plans");
  }

  return (
    <div className="lg:hidden">
      {/* Spacer */}
      <div className="h-[74px]" />
      {/* Nav bar */}
      <div
        className="fixed left-0 right-0 bottom-0 z-40 flex bg-[#17181c]"
        style={{
          padding: "8px 6px",
          paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.href ? pathname === tab.href : false;
          const color = isActive ? "#e08a1e" : "#5c5e66";

          if (tab.action === "menu") {
            return (
              <button
                key="menu"
                onClick={onMenuOpen}
                className="flex-1 flex flex-col items-center gap-1 py-[5px]"
              >
                <TabIcon icon={tab.icon} color={color} />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className="flex-1 flex flex-col items-center gap-1 py-[5px]"
            >
              <TabIcon icon={tab.icon} color={color} />
              <span
                className="text-[10px] font-semibold"
                style={{ color }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
