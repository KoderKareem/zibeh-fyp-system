import { requireRole } from "@/lib/auth/guard";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function SupervisorLayout({
  children,
}: LayoutProps<"/supervisor">) {
  const profile = await requireRole("supervisor");

  return (
    <div className="flex flex-1 flex-col bg-white">
      <DashboardHeader heading="Supervisor Dashboard" fullName={profile.full_name} />
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
