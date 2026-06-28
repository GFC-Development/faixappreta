"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "./student-avatar";
import { useState } from "react";
import { useTenantInfo } from "./tenant-theme";
import { MobileNav } from "./mobile-nav";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  ownerOnly?: boolean;
  featureFlag?: "enableTimer" | "enablePlans";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/agenda", label: "Agenda do dia" },
      { href: "/admin/roll-call", label: "Chamada" },
    ],
  },
  {
    title: "Turmas",
    items: [
      { href: "/admin/group-classes", label: "Aulas coletivas" },
      { href: "/admin/slots", label: "Aulas particulares" },
    ],
  },
  {
    title: "Alunos",
    items: [
      { href: "/admin/approvals", label: "Aprovações" },
      { href: "/admin/attendance", label: "Presenças" },
      { href: "/admin/ranking", label: "Ranking" },
      { href: "/admin/belt-requirements", label: "Requisitos de faixa" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/admin/professors", label: "Professores", ownerOnly: true },
      { href: "/admin/plans", label: "Planos", featureFlag: "enablePlans" },
      { href: "/admin/events", label: "Eventos" },
      { href: "/admin/notifications", label: "Notificações" },
      { href: "/admin/timer", label: "Timer", featureFlag: "enableTimer" },
    ],
  },
];

const studentGroups: NavGroup[] = [
  {
    title: "Menu",
    items: [
      { href: "/student", label: "Início" },
      { href: "/student/agenda", label: "Minha Agenda" },
      { href: "/student/graduations", label: "Graduações" },
      { href: "/student/plans", label: "Planos", featureFlag: "enablePlans" },
      { href: "/student/account", label: "Minha Conta" },
    ],
  },
];

export function NavSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const tenantInfo = useTenantInfo();

  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = session.user.isOwner;
  const tenantLogoUrl = tenantInfo?.logoUrl || null;
  const tenantName = tenantInfo?.name || "";
  const tenantSlug = tenantInfo?.slug || "";
  const initial = (tenantName || "F").charAt(0).toUpperCase();

  const groups = (isAdmin ? adminGroups : studentGroups).map((g) => ({
    ...g,
    items: g.items.filter((item) => {
      if (item.ownerOnly && !isOwner) return false;
      if (item.featureFlag && tenantInfo && !tenantInfo[item.featureFlag])
        return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);


  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[226px] flex-none bg-[#17181c] flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-4">
          {tenantLogoUrl ? (
            <Image
              src={tenantLogoUrl}
              alt={tenantName}
              width={36}
              height={36}
              className="rounded-[10px] object-cover flex-none"
              style={{ width: 36, height: 36 }}
            />
          ) : (
            <div
              className="w-9 h-9 flex-none rounded-[10px] bg-accent flex items-center justify-center font-archivo font-extrabold text-lg text-accent-on"
              style={{ boxShadow: "0 4px 12px rgba(224,138,30,.32)" }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-sm text-[#fbfbf8] leading-tight truncate">
              {tenantName || "faixappreta"}
            </div>
            <div className="font-spline text-[9.5px] text-[#76787f] truncate">
              {tenantSlug ? `${tenantSlug}.faixappreta` : "faixappreta.com.br"}
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto px-3 pt-1 pb-3">
          {groups.map((group) => (
            <div key={group.title} className="mb-3.5">
              <div className="font-spline text-[8.5px] tracking-[.16em] uppercase text-[#5c5e66] px-3 pb-1.5">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors mb-0.5",
                      isActive
                        ? "bg-[#26282e] text-[#f3b765] font-semibold"
                        : "text-[#9a9ca3] hover:bg-[#1e2025] hover:text-[#c9cace]"
                    )}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-none"
                      style={{
                        background: isActive ? "#e08a1e" : "#46484f",
                      }}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 px-[18px] py-3 border-t border-[#26282e]">
          <StudentAvatar
            name={session.user.name}
            photoUrl={session.user.photoUrl}
            size={32}
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[12.5px] text-[#fbfbf8] truncate">
              {session.user.name}
            </div>
            <div className="text-[10.5px] text-[#76787f]">
              {isOwner ? "Owner" : isAdmin ? "Professor" : "Aluno"}
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="text-[#76787f] hover:text-[#fbfbf8] transition-colors text-[11px] font-medium px-2 py-1 rounded-md hover:bg-[#26282e]"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-[#17181c] px-[18px] py-[13px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {tenantLogoUrl ? (
            <Image
              src={tenantLogoUrl}
              alt={tenantName}
              width={32}
              height={32}
              className="rounded-[9px] object-cover flex-none"
              style={{ width: 32, height: 32 }}
            />
          ) : (
            <div className="w-8 h-8 flex-none rounded-[9px] bg-accent flex items-center justify-center font-archivo font-extrabold text-base text-accent-on">
              {initial}
            </div>
          )}
          <div className="font-bold text-sm text-[#fbfbf8]">
            {tenantName || "faixappreta"}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <StudentAvatar
            name={session.user.name}
            photoUrl={session.user.photoUrl}
            size={36}
          />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav
        isAdmin={isAdmin}
        pathname={pathname}
        onMenuOpen={() => setMenuOpen(true)}
        tenantInfo={tenantInfo}
      />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#17181c] flex flex-col animate-fp-pop lg:hidden">
          <div className="flex items-center justify-between px-5 py-[18px]">
            <div className="font-bold text-[17px] text-[#fbfbf8]">Menu</div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-9 h-9 rounded-[9px] bg-[#26282e] text-[#c9cace] flex items-center justify-center text-xl"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {groups.map((group) => (
              <div key={group.title} className="mb-[18px]">
                <div className="font-spline text-[9px] tracking-[.16em] uppercase text-[#5c5e66] px-2 pb-2">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-[10px] rounded-lg text-[14px] transition-colors mb-0.5",
                        isActive
                          ? "bg-[#26282e] text-[#f3b765] font-semibold"
                          : "text-[#9a9ca3]"
                      )}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-none"
                        style={{
                          background: isActive ? "#e08a1e" : "#46484f",
                        }}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
            <button
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.href = "/login";
              }}
              className="flex items-center gap-3 px-3 py-[10px] rounded-lg text-[14px] text-[#9a9ca3] w-full mt-4"
            >
              <span className="w-1.5 h-1.5 rounded-full flex-none bg-[#46484f]" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}
