import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { primaryButtonClasses } from "@/lib/ui";
import { toggleUserActive } from "./actions";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "supervisor";
  is_active: boolean;
  department_id: string | null;
  supervisor_id: string | null;
};

function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const action = toggleUserActive.bind(null, userId, !isActive);
  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          isActive
            ? "border border-red-200 text-red-600 hover:bg-red-50"
            : "border border-green-200 text-green-700 hover:bg-green-50"
        }`}
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

function UserTable({
  title,
  users,
  nameById,
  deptNameById,
  showSupervisor,
}: {
  title: string;
  users: Profile[];
  nameById: Map<string, string>;
  deptNameById: Map<string, string>;
  showSupervisor: boolean;
}) {
  return (
    <div className="rounded-card bg-card overflow-x-auto">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-lg text-navy">{title}</h2>
        <span className="text-xs text-navy/50">{users.length} account(s)</span>
      </div>
      <table className="mt-3 w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Department</th>
            {showSupervisor ? <th className="px-4 py-3">Supervisor</th> : null}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={showSupervisor ? 6 : 5} className="px-4 py-6 text-center text-navy/60">
                No accounts yet.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 text-navy">{u.full_name}</td>
                <td className="px-4 py-3 text-navy/70">{u.email}</td>
                <td className="px-4 py-3 text-navy/70">
                  {u.department_id ? deptNameById.get(u.department_id) ?? "—" : "—"}
                </td>
                {showSupervisor ? (
                  <td className="px-4 py-3 text-navy/70">
                    {u.supervisor_id ? nameById.get(u.supervisor_id) ?? "—" : "—"}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      u.is_active ? "bg-[#e6f6ec] text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {u.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/users/${u.id}/edit`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <ToggleActiveButton userId={u.id} isActive={u.is_active} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: departments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, department_id, supervisor_id")
      .in("role", ["student", "supervisor"])
      .order("full_name")
      .returns<Profile[]>(),
    supabase.from("departments").select("id, name"),
  ]);

  const all = profiles ?? [];
  const students = all.filter((p) => p.role === "student");
  const supervisors = all.filter((p) => p.role === "supervisor");
  const nameById = new Map(all.map((p) => [p.id, p.full_name]));
  const deptNameById = new Map((departments ?? []).map((d) => [d.id, d.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy/70">
          Create, edit, and deactivate student and supervisor accounts.
        </p>
        <Link href="/admin/users/new" className={primaryButtonClasses}>
          + New account
        </Link>
      </div>

      <UserTable
        title="Students"
        users={students}
        nameById={nameById}
        deptNameById={deptNameById}
        showSupervisor
      />
      <UserTable
        title="Supervisors"
        users={supervisors}
        nameById={nameById}
        deptNameById={deptNameById}
        showSupervisor={false}
      />
    </div>
  );
}
