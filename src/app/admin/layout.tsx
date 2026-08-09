import { requireRole } from "@/lib/auth/guard";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const profile = await requireRole("admin");

  return (
    <div className="flex flex-1 flex-col bg-white">
      <DashboardHeader heading="Admin Dashboard" fullName={profile.full_name} homeHref="/admin" />
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
