import { DashboardCard } from "@/components/dashboard-card";

export default function SupervisorPage() {
  return (
    <DashboardCard
      href="/supervisor/dashboard"
      title="Submission packages"
      description="Review packages from your assigned students — approve one topic or reject the whole set."
      variant="secondary"
    />
  );
}
