import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PendingPackage = {
  id: string;
  student_id: string;
  session_id: string;
  created_at: string;
};

export default async function AdminPendingSubmissionsPage() {
  const supabase = await createClient();

  const { data: packages } = await supabase
    .from("submission_packages")
    .select("id, student_id, session_id, created_at")
    .eq("status", "pending")
    .is("supervisor_id", null)
    .order("created_at", { ascending: true })
    .returns<PendingPackage[]>();

  const rows = packages ?? [];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const sessionIds = [...new Set(rows.map((r) => r.session_id))];

  const [{ data: students }, { data: sessions }] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    sessionIds.length
      ? supabase.from("academic_sessions").select("id, label").in("id", sessionIds)
      : Promise.resolve({ data: [] as { id: string; label: string }[] }),
  ]);

  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));
  const sessionLabelById = new Map((sessions ?? []).map((s) => [s.id, s.label]));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-navy/70">
        New submissions with no supervisor assigned yet. Delegate each one to a supervisor for
        review, or decide it yourself.
      </p>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy/60">
                  Nothing waiting for assignment.
                </td>
              </tr>
            ) : (
              rows.map((pkg) => (
                <tr key={pkg.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 text-navy">{nameById.get(pkg.student_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {sessionLabelById.get(pkg.session_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy/60">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/submissions/pending/${pkg.id}`}
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
