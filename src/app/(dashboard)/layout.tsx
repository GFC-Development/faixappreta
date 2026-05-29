import { NavSidebar } from "@/components/nav-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <NavSidebar />
      <main className="flex-1 min-w-0 p-4 lg:p-8 pt-16 lg:pt-8">{children}</main>
    </div>
  );
}
