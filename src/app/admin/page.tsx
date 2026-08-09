import Link from "next/link";

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
        <Link
          key={s.href}
          href={s.href}
          className="rounded-card bg-card p-6 transition-colors hover:bg-card/70"
        >
          <h2 className="text-lg text-navy">{s.title}</h2>
          <p className="mt-2 text-sm text-navy/70">{s.description}</p>
        </Link>
      ))}
    </div>
  );
}
