import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PendingProject = {
  id: string;
  title: string;
  student_id: string;
  created_at: string;
  department: { name: string } | null;
  session: { label: string } | null;
};

export default async function AdminPendingRepositoryPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("repository_projects")
    .select(
      `id, title, student_id, created_at,
       department:departments(name),
       session:academic_sessions(label)`,
    )
    .eq("review_status", "pending")
    .order("created_at", { ascending: true })
    .returns<PendingProject[]>();

  const rows = projects ?? [];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy/70">
        Final project uploads waiting for review. Approving one publishes it to the public
        repository; rejecting it lets the student re-upload.
      </p>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/60">
                  Nothing waiting for review.
                </td>
              </tr>
            ) : (
              rows.map((project) => (
                <tr key={project.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 text-navy">{nameById.get(project.student_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-navy">{project.title}</td>
                  <td className="px-4 py-3 text-navy/70">{project.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-navy/70">{project.session?.label ?? "—"}</td>
                  <td className="px-4 py-3 text-navy/60">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/repository/pending/${project.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
