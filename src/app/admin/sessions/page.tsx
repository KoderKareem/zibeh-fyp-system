import { createClient } from "@/lib/supabase/server";
import { inputClasses, primaryButtonClasses } from "@/lib/ui";
import { createSession, setActiveSession, toggleSubmissionsOpen } from "./actions";

type Session = { id: string; label: string; is_active: boolean };

export default async function AdminSessionsPage(props: PageProps<"/admin/sessions">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  const supabase = await createClient();
  const [{ data: sessions }, { data: settings }] = await Promise.all([
    supabase
      .from("academic_sessions")
      .select("id, label, is_active")
      .order("label", { ascending: false })
      .returns<Session[]>(),
    supabase.from("system_settings").select("submissions_open").eq("id", 1).single(),
  ]);

  const submissionsOpen = settings?.submissions_open ?? false;
  const toggleAction = toggleSubmissionsOpen.bind(null, !submissionsOpen);

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <div className="rounded-card bg-card-secondary p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-navy">Submission window</h2>
            <p className="mt-1 text-sm text-navy/70">
              {submissionsOpen
                ? "Students can currently submit topic packages."
                : "Submissions are currently closed to students."}
            </p>
          </div>
          <form action={toggleAction}>
            <button
              type="submit"
              className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                submissionsOpen
                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {submissionsOpen ? "Close submissions" : "Open submissions"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-card bg-card-secondary p-5">
        <h2 className="text-base font-semibold text-navy">Add an academic session</h2>
        <form action={createSession} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="label" className="text-sm font-medium text-navy">
              Label
            </label>
            <input
              id="label"
              name="label"
              type="text"
              required
              placeholder="e.g. 2026/2027"
              className={inputClasses}
            />
          </div>
          <button type="submit" className={primaryButtonClasses}>
            Add
          </button>
        </form>
      </div>

      <div className="rounded-card bg-card overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(sessions ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-navy/60">
                  No academic sessions yet.
                </td>
              </tr>
            ) : (
              (sessions ?? []).map((s) => (
                <tr key={s.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3 text-navy">{s.label}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        s.is_active ? "bg-[#e6f6ec] text-green-700" : "bg-navy/5 text-navy/60"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active ? (
                      <span className="text-xs text-navy/40">Current</span>
                    ) : (
                      <form action={setActiveSession}>
                        <input type="hidden" name="sessionId" value={s.id} />
                        <button type="submit" className="text-xs font-semibold text-primary hover:underline">
                          Set active
                        </button>
                      </form>
                    )}
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
