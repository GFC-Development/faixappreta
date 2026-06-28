import { NavSidebar } from "@/components/nav-sidebar";
import { TenantThemeProvider } from "@/components/tenant-theme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantThemeProvider>
      <div className="flex min-h-screen bg-[#f7f7f8]">
        <NavSidebar />
        <main className="flex-1 min-w-0 p-4 lg:p-8 pt-[72px] lg:pt-8 pb-[90px] lg:pb-8">
          {children}
        </main>
      </div>
    </TenantThemeProvider>
  );
}
