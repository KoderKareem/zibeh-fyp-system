import { createClient } from "@/lib/supabase/server";

type Package = {
  status: "pending" | "approved" | "rejected";
  session_id: string;
  supervisor_id: string | null;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const [{ data: packages }, { data: sessions }, { data: supervisors }] = await Promise.all([
    supabase.from("submission_packages").select("status, session_id, supervisor_id").returns<Package[]>(),
    supabase.from("academic_sessions").select("id, label"),
    supabase.from("profiles").select("id, full_name").eq("role", "supervisor"),
  ]);

  const rows = packages ?? [];
  const sessionLabelById = new Map((sessions ?? []).map((s) => [s.id, s.label]));
  const supervisorNameById = new Map((supervisors ?? []).map((s) => [s.id, s.full_name]));

  const perSession = new Map<
    string,
    { total: number; pending: number; approved: number; rejected: number }
  >();
  for (const row of rows) {
    const entry = perSession.get(row.session_id) ?? {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    entry.total += 1;
    entry[row.status] += 1;
    perSession.set(row.session_id, entry);
  }

  const decided = rows.filter((r) => r.status !== "pending");
  const approvedCount = decided.filter((r) => r.status === "approved").length;
  const overallApprovalRate = decided.length > 0 ? (approvedCount / decided.length) * 100 : null;

  const perSupervisor = new Map<string, number>();
  for (const row of rows) {
    if (!row.supervisor_id) continue;
    perSupervisor.set(row.supervisor_id, (perSupervisor.get(row.supervisor_id) ?? 0) + 1);
  }
  const topSupervisors = [...perSupervisor.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <h2 className="text-base font-semibold text-navy">Overall approval rate</h2>
        <p className="mt-2 text-3xl font-semibold text-navy">
          {overallApprovalRate === null ? "—" : `${overallApprovalRate.toFixed(0)}%`}
        </p>
        <p className="mt-1 text-xs text-navy/60">
          {decided.length} decided package(s) out of {rows.length} total.
        </p>
      </div>

      <div className="rounded-card bg-card overflow-x-auto">
        <div className="px-4 pt-4">
          <h2 className="text-lg text-navy">Submissions per session</h2>
        </div>
        <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Approved</th>
              <th className="px-4 py-3">Rejected</th>
              <th className="px-4 py-3">Approval rate</th>
            </tr>
          </thead>
          <tbody>
            {perSession.size === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/60">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              [...perSession.entries()].map(([sessionId, s]) => {
                const decidedInSession = s.approved + s.rejected;
                const rate = decidedInSession > 0 ? (s.approved / decidedInSession) * 100 : null;
                return (
                  <tr key={sessionId} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3 text-navy">{sessionLabelById.get(sessionId) ?? "—"}</td>
                    <td className="px-4 py-3 text-navy/70">{s.total}</td>
                    <td className="px-4 py-3 text-navy/70">{s.pending}</td>
                    <td className="px-4 py-3 text-navy/70">{s.approved}</td>
                    <td className="px-4 py-3 text-navy/70">{s.rejected}</td>
                    <td className="px-4 py-3 text-navy/70">
                      {rate === null ? "—" : `${rate.toFixed(0)}%`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-card bg-card overflow-x-auto">
        <div className="px-4 pt-4">
          <h2 className="text-lg text-navy">Most active supervisors</h2>
        </div>
        <table className="mt-3 w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Packages received</th>
            </tr>
          </thead>
          <tbody>
            {topSupervisors.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-navy/60">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              topSupervisors.map(([supervisorId, count]) => (
                <tr key={supervisorId} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 text-navy">
                    {supervisorNameById.get(supervisorId) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
