import { DashboardCard } from "@/components/dashboard-card";

export default function SupervisorPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DashboardCard
        href="/supervisor/dashboard"
        title="Submission packages"
        description="Review packages from your assigned students — approve one topic or reject the whole set."
        variant="secondary"
      />

      <DashboardCard
        href="/supervisor/chapters"
        title="Chapter submissions"
        description="Review your students' project chapters — approve each one or request a revision."
      />
    </div>
  );
}
