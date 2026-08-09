import { requireRole } from "@/lib/auth/guard";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function StudentLayout({
  children,
}: LayoutProps<"/student">) {
  const profile = await requireRole("student");

  return (
    <div className="flex flex-1 flex-col bg-white">
      <DashboardHeader heading="Student Dashboard" fullName={profile.full_name} homeHref="/student" />
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
