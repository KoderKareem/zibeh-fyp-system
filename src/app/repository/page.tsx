import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

type Department = { id: string; name: string };
type Session = { id: string; label: string };
type Supervisor = { id: string; full_name: string };

type Project = {
  id: string;
  title: string;
  abstract: string | null;
  access_level: "public" | "restricted";
  document_path: string | null;
  department: { name: string } | null;
  session: { label: string } | null;
};

export default async function RepositoryPage(props: PageProps<"/repository">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const departmentId = typeof params.department === "string" ? params.department : "";
  const sessionId = typeof params.session === "string" ? params.session : "";
  const supervisorId = typeof params.supervisor === "string" ? params.supervisor : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const [{ data: departments }, { data: sessions }, { data: repoSupervisorRows }] =
    await Promise.all([
      supabase.from("departments").select("id, name").order("name").returns<Department[]>(),
      supabase
        .from("academic_sessions")
        .select("id, label")
        .order("label", { ascending: false })
        .returns<Session[]>(),
      supabase
        .from("repository_projects")
        .select("supervisor_id")
        .not("supervisor_id", "is", null),
    ]);

  const supervisorIds = [...new Set((repoSupervisorRows ?? []).map((r) => r.supervisor_id as string))];
  const { data: supervisors } = supervisorIds.length
    ? await supabase
        .from("public_supervisor_directory")
        .select("id, full_name")
        .in("id", supervisorIds)
        .order("full_name")
        .returns<Supervisor[]>()
    : { data: [] as Supervisor[] };

  let query = supabase
    .from("repository_projects")
    .select(
      `id, title, abstract, access_level, document_path,
       department:departments(name),
       session:academic_sessions(label)`,
    )
    .eq("review_status", "approved")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);
  if (departmentId) query = query.eq("department_id", departmentId);
  if (sessionId) query = query.eq("session_id", sessionId);
  if (supervisorId) query = query.eq("supervisor_id", supervisorId);

  const { data: projects } = await query.returns<Project[]>();
  const results = projects ?? [];

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader title="Project Repository" />

      <main className="flex-1 px-6 py-8 sm:px-10">
        <form method="get" className="rounded-card bg-card-secondary p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="q" className="text-sm font-medium text-navy">
                Title
              </label>
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search by title…"
                className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="department" className="text-sm font-medium text-navy">
                Department
              </label>
              <select
                id="department"
                name="department"
                defaultValue={departmentId}
                className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
              >
                <option value="">All departments</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="session" className="text-sm font-medium text-navy">
                Academic session
              </label>
              <select
                id="session"
                name="session"
                defaultValue={sessionId}
                className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
              >
                <option value="">All sessions</option>
                {(sessions ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="supervisor" className="text-sm font-medium text-navy">
                Supervisor
              </label>
              <select
                id="supervisor"
                name="supervisor"
                defaultValue={supervisorId}
                className="rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
              >
                <option value="">All supervisors</option>
                {(supervisors ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Search
            </button>
            <Link href="/repository" className="text-sm font-semibold text-navy/70 hover:text-navy">
              Clear filters
            </Link>
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          {results.length === 0 ? (
            <p className="text-sm text-navy/70">No projects match your search.</p>
          ) : (
            results.map((project) => {
              const canView = project.access_level === "public" || isLoggedIn;
              const canDownload = canView && !!project.document_path;
              return (
                <div key={project.id} className="rounded-card bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg text-navy">
                      <Link href={`/repository/${project.id}`} className="hover:underline">
                        {project.title}
                      </Link>
                    </h2>
                    <span className="text-xs text-navy/50">
                      {project.department?.name ?? "—"}
                      {project.session ? ` · ${project.session.label}` : ""}
                    </span>
                  </div>

                  {canView ? (
                    <p className="mt-2 text-sm text-navy/70">
                      {project.abstract || "No abstract provided."}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-navy/50">
                      <Link href="/login" className="font-semibold text-primary">
                        Log in
                      </Link>{" "}
                      to view the abstract for this restricted project.
                    </p>
                  )}

                  {canDownload ? (
                    <a
                      href={`/repository/download/${project.id}`}
                      className="mt-3 inline-block rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
                    >
                      Download full document
                    </a>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
