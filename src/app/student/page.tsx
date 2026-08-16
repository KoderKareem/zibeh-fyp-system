import { DashboardCard } from "@/components/dashboard-card";

export default function StudentPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DashboardCard
        href="/student/submit"
        title="Submit topics"
        description="Submit your 3 topic options as one package for your supervisor to review."
      />

      <DashboardCard
        href="/student/history"
        title="Submission history"
        description="Track the status of your past packages and read your supervisor's comments."
        variant="secondary"
      />
    </div>
  );
}
