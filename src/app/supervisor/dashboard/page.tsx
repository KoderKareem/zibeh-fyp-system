import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PACKAGE_STATUS_LABEL as STATUS_LABEL, PACKAGE_STATUS_STYLE as STATUS_STYLE } from "@/lib/status";

type Package = {
  id: string;
  status: "pending" | "approved" | "rejected";
  student_id: string;
  session_id: string;
  created_at: string;
};

export default async function SupervisorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: packages } = await supabase
    .from("submission_packages")
    .select("id, status, student_id, session_id, created_at")
    .eq("supervisor_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<Package[]>();

  const results = packages ?? [];
  const pendingCount = results.filter((p) => p.status === "pending").length;
  const approvedCount = results.filter((p) => p.status === "approved").length;

  const studentIds = [...new Set(results.map((p) => p.student_id))];
  const sessionIds = [...new Set(results.map((p) => p.session_id))];

  const [{ data: students }, { data: sessions }] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    sessionIds.length
      ? supabase.from("academic_sessions").select("id, label").in("id", sessionIds)
      : Promise.resolve({ data: [] as { id: string; label: string }[] }),
  ]);

  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));
  const sessionLabelById = new Map((sessions ?? []).map((s) => [s.id, s.label]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card bg-card-secondary p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Pending</p>
          <p className="mt-1 text-3xl font-semibold text-navy">{pendingCount}</p>
        </div>
        <div className="rounded-card bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Approved</p>
          <p className="mt-1 text-3xl font-semibold text-navy">{approvedCount}</p>
        </div>
      </div>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy/60">
                  No submission packages assigned to you yet.
                </td>
              </tr>
            ) : (
              results.map((pkg) => (
                <tr key={pkg.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 text-navy">{studentNameById.get(pkg.student_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-navy/70">{sessionLabelById.get(pkg.session_id) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[pkg.status]}`}>
                      {STATUS_LABEL[pkg.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/60">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/supervisor/review/${pkg.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {pkg.status === "pending" ? "Review" : "View decision"}
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
