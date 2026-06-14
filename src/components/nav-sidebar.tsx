"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  BookOpen,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  X,
  Award,
  ArrowLeft,
  UserCog,
  UserCheck,
  Trophy,
  Timer,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "./student-avatar";
import { useState } from "react";
import { useTenantInfo } from "./tenant-theme";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: Home, ownerOnly: false },
  { href: "/admin/professors", label: "Professores", icon: Users, ownerOnly: true },
  { href: "/admin/slots", label: "Horários Particulares", icon: Clock, ownerOnly: false },
  { href: "/admin/group-classes", label: "Aulas", icon: BookOpen, ownerOnly: false },
  { href: "/admin/events", label: "Eventos", icon: CalendarDays, ownerOnly: false },
  { href: "/admin/notifications", label: "Notificações", icon: Bell, ownerOnly: false },
  { href: "/admin/agenda", label: "Agenda do Dia", icon: CalendarDays, ownerOnly: false },
  { href: "/admin/roll-call", label: "Chamada", icon: ClipboardList, ownerOnly: false },
  { href: "/admin/attendance", label: "Presenças", icon: ClipboardCheck, ownerOnly: false },
  { href: "/admin/belt-requirements", label: "Requisitos de Faixa", icon: Award, ownerOnly: false },
  { href: "/admin/ranking", label: "Ranking", icon: Trophy, ownerOnly: false },
  { href: "/admin/timer", label: "Timer", icon: Timer, ownerOnly: false },
  { href: "/admin/approvals", label: "Aprovações", icon: UserCheck, ownerOnly: false },
];

const studentLinks = [
  { href: "/student", label: "Início", icon: Home },
  { href: "/student/agenda", label: "Minha Agenda", icon: CalendarDays },
  { href: "/student/graduations", label: "Graduações", icon: Award },
  { href: "/student/account", label: "Minha Conta", icon: UserCog },
];

export function NavSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const tenantInfo = useTenantInfo();

  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = session.user.isOwner;
  const links = isAdmin
    ? adminLinks.filter((l) => !l.ownerOnly || isOwner)
    : studentLinks;
  const homePath = isAdmin ? "/admin" : "/student";
  const isHome = pathname === homePath;
  const tenantLogoUrl = tenantInfo?.logoUrl || null;
  const tenantName = tenantInfo?.name;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <Logo size={40} logoUrl={tenantLogoUrl} />
          <span className="text-2xl font-bold text-content-primary tracking-tight font-teko uppercase">
            {tenantName || <>faix<span className="text-accent font-extrabold">app</span>reta</>}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-content-secondary">
          <StudentAvatar
            name={session.user.name}
            photoUrl={session.user.photoUrl}
            size={28}
          />
          <span>{session.user.name}</span>
        </div>
      </div>

      <nav className="flex-1 p-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1",
                isActive
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-content-secondary hover:bg-surface-tertiary hover:text-content-primary"
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-content-muted hover:bg-surface-tertiary hover:text-content-primary w-full transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 p-3 lg:hidden bg-surface-primary/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2">
          <Logo size={28} logoUrl={tenantLogoUrl} />
          <span className="text-lg font-bold text-content-primary tracking-tight font-teko uppercase">
            {tenantName || <>faix<span className="text-accent font-extrabold">app</span>reta</>}
          </span>
        </div>
        {!isHome ? (
          <button
            onClick={() => router.back()}
            className="p-2 bg-surface-secondary border border-border rounded-lg text-content-secondary hover:text-content-primary transition-colors ml-auto"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "p-2 bg-surface-secondary border border-border rounded-lg text-content-secondary hover:text-content-primary transition-colors",
            isHome && "ml-auto"
          )}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-surface-secondary border-r border-border transform transition-transform lg:translate-x-0 lg:relative lg:z-auto lg:h-screen lg:shrink-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </aside>

    </>
  );
}
