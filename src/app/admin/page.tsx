import { DashboardCard } from "@/components/dashboard-card";

const sections = [
  {
    href: "/admin/dashboard",
    title: "Submissions",
    description: "View and filter every submission package by status, department, supervisor, or session.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "Create, edit, and deactivate student and supervisor accounts. Assign supervisors to students.",
  },
  {
    href: "/admin/departments",
    title: "Departments",
    description: "Manage the list of departments/programs.",
  },
  {
    href: "/admin/sessions",
    title: "Academic sessions",
    description: "Open or close submissions, and mark which session is active.",
  },
  {
    href: "/admin/repository/add",
    title: "Add archival project",
    description: "Backfill a past year's project into the repository directly.",
  },
  {
    href: "/admin/repository/pending",
    title: "Pending final projects",
    description: "Review final project uploads before they're published to the repository.",
  },
  {
    href: "/admin/reports",
    title: "Reports",
    description: "Submissions per session, approval rate, and most active supervisors.",
  },
  {
    href: "/admin/audit",
    title: "Audit log",
    description: "Logins, package decisions, and document downloads — who did what, and when.",
  },
];

export default function AdminPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((s) => (
        <DashboardCard key={s.href} href={s.href} title={s.title} description={s.description} />
      ))}
    </div>
  );
}
