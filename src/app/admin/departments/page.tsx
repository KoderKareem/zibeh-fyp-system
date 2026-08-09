import { createClient } from "@/lib/supabase/server";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";
import { createDepartment, renameDepartment, deleteDepartment } from "./actions";

type Department = { id: string; name: string; code: string | null };

export default async function AdminDepartmentsPage(props: PageProps<"/admin/departments">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name")
    .returns<Department[]>();

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <div className="rounded-card bg-card-secondary p-5">
        <h2 className="text-base font-semibold text-navy">Add a department</h2>
        <form action={createDepartment} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-navy">
              Name
            </label>
            <input id="name" name="name" type="text" required className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-navy">
              Code (optional)
            </label>
            <input id="code" name="code" type="text" className={inputClasses} />
          </div>
          <button type="submit" className={primaryButtonClasses}>
            Add
          </button>
        </form>
      </div>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(departments ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-navy/60">
                  No departments yet.
                </td>
              </tr>
            ) : (
              (departments ?? []).map((d) => (
                <tr key={d.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3">
                    <form action={renameDepartment} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={d.id} />
                      <input
                        name="name"
                        defaultValue={d.name}
                        className="rounded-lg border border-navy/15 px-2 py-1 text-sm text-navy focus:border-primary focus:outline-none"
                      />
                      <input
                        name="code"
                        defaultValue={d.code ?? ""}
                        placeholder="Code"
                        className="w-24 rounded-lg border border-navy/15 px-2 py-1 text-sm text-navy focus:border-primary focus:outline-none"
                      />
                      <button type="submit" className="text-xs font-semibold text-primary hover:underline">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-navy/60">{d.code ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteDepartment}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
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
