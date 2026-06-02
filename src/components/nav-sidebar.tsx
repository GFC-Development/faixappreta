"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
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
  ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "./student-avatar";
import { useState } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/slots", label: "Horários Particulares", icon: Clock },
  { href: "/admin/group-classes", label: "Aulas", icon: BookOpen },
  { href: "/admin/events", label: "Eventos", icon: CalendarDays },
  { href: "/admin/notifications", label: "Notificações", icon: Bell },
  { href: "/admin/agenda", label: "Agenda do Dia", icon: CalendarDays },
  { href: "/admin/roll-call", label: "Chamada", icon: ClipboardList },
  { href: "/admin/attendance", label: "Presenças", icon: ClipboardCheck },
  { href: "/admin/belt-requirements", label: "Requisitos de Faixa", icon: Award },
  { href: "/admin/ranking", label: "Ranking", icon: Trophy },
  { href: "/admin/timer", label: "Timer", icon: Timer },
  { href: "/admin/approvals", label: "Aprovações", icon: UserCheck },
  { href: "/admin/plan-upgrades", label: "Solicitações de Plano", icon: ArrowUpCircle },
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

  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const links = isAdmin ? adminLinks : studentLinks;
  const homePath = isAdmin ? "/admin" : "/student";
  const isHome = pathname === homePath;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="PQ" width={40} height={40} />
          <span className="text-2xl font-bold text-zinc-50 tracking-tight font-teko uppercase">
            PQ <span className="text-accent">FIGHTERS</span>
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-zinc-400">
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
                  ? "bg-orange-500/10 text-orange-500 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800 space-y-1">
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-50 w-full transition-colors"
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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 p-3 lg:hidden bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="PQ" width={28} height={28} />
          <span className="text-lg font-bold text-zinc-50 tracking-tight font-teko uppercase">
            PQ <span className="text-accent">FIGHTERS</span>
          </span>
        </div>
        {!isHome ? (
          <button
            onClick={() => router.back()}
            className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors ml-auto"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors",
            isHome && "ml-auto"
          )}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform lg:translate-x-0 lg:relative lg:z-auto lg:h-screen lg:shrink-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </aside>

    </>
  );
}
