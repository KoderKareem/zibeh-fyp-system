import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inputClasses, primaryButtonClasses, secondaryButtonClasses } from "@/lib/ui";
import { PACKAGE_STATUS_LABEL as STATUS_LABEL, PACKAGE_STATUS_STYLE as STATUS_STYLE } from "@/lib/status";

type Department = { id: string; name: string };
type Session = { id: string; label: string };
type Supervisor = { id: string; full_name: string };

type Package = {
  id: string;
  status: "pending" | "approved" | "rejected";
  student_id: string;
  supervisor_id: string | null;
  session_id: string;
  created_at: string;
  decided_at: string | null;
};

export default async function AdminDashboardPage(props: PageProps<"/admin/dashboard">) {
  const params = await props.searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const departmentId = typeof params.department === "string" ? params.department : "";
  const supervisorId = typeof params.supervisor === "string" ? params.supervisor : "";
  const sessionId = typeof params.session === "string" ? params.session : "";

  const supabase = await createClient();

  const [{ data: departments }, { data: sessions }, { data: supervisors }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name").returns<Department[]>(),
    supabase
      .from("academic_sessions")
      .select("id, label")
      .order("label", { ascending: false })
      .returns<Session[]>(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "supervisor")
      .order("full_name")
      .returns<Supervisor[]>(),
  ]);

  let studentIdsInDepartment: string[] | null = null;
  if (departmentId) {
    const { data: students } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("department_id", departmentId);
    studentIdsInDepartment = (students ?? []).map((s) => s.id);
  }

  let query = supabase
    .from("submission_packages")
    .select("id, status, student_id, supervisor_id, session_id, created_at, decided_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (supervisorId) query = query.eq("supervisor_id", supervisorId);
  if (sessionId) query = query.eq("session_id", sessionId);
  if (studentIdsInDepartment) query = query.in("student_id", studentIdsInDepartment);

  const { data: packages } = await query.returns<Package[]>();
  const results = packages ?? [];

  const profileIds = [
    ...new Set(results.flatMap((p) => [p.student_id, p.supervisor_id]).filter((id): id is string => !!id)),
  ];
  const { data: profileRows } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((profileRows ?? []).map((p) => [p.id, p.full_name]));
  const sessionLabelById = new Map((sessions ?? []).map((s) => [s.id, s.label]));

  return (
    <div className="flex flex-col gap-6">
      <form method="get" className="rounded-card bg-card-secondary p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-navy">
              Status
            </label>
            <select id="status" name="status" defaultValue={status} className={inputClasses}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">One Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="department" className="text-sm font-medium text-navy">
              Department
            </label>
            <select id="department" name="department" defaultValue={departmentId} className={inputClasses}>
              <option value="">All departments</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="supervisor" className="text-sm font-medium text-navy">
              Supervisor
            </label>
            <select id="supervisor" name="supervisor" defaultValue={supervisorId} className={inputClasses}>
              <option value="">All supervisors</option>
              {(supervisors ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="session" className="text-sm font-medium text-navy">
              Session
            </label>
            <select id="session" name="session" defaultValue={sessionId} className={inputClasses}>
              <option value="">All sessions</option>
              {(sessions ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button type="submit" className={primaryButtonClasses}>
            Filter
          </button>
          <Link href="/admin/dashboard" className={secondaryButtonClasses}>
            Clear
          </Link>
        </div>
      </form>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Decided</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-navy/60">
                  No submission packages match these filters.
                </td>
              </tr>
            ) : (
              results.map((pkg) => (
                <tr key={pkg.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 text-navy">{nameById.get(pkg.student_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-navy">
                    {pkg.supervisor_id ? (nameById.get(pkg.supervisor_id) ?? "—") : "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{sessionLabelById.get(pkg.session_id) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[pkg.status]}`}>
                      {STATUS_LABEL[pkg.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/60">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-navy/60">
                    {pkg.decided_at ? new Date(pkg.decided_at).toLocaleDateString() : "—"}
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
