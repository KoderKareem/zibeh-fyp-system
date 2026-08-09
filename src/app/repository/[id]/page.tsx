import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { CitationBox } from "@/components/citation-box";
import { buildApaCitation, buildIeeeCitation } from "@/lib/citation";

type Project = {
  id: string;
  title: string;
  abstract: string | null;
  keywords: string[];
  access_level: "public" | "restricted";
  document_path: string | null;
  author_name: string | null;
  student_id: string | null;
  created_at: string;
  department: { name: string } | null;
  session: { label: string } | null;
};

export default async function RepositoryDetailPage(props: PageProps<"/repository/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const { data: project } = await supabase
    .from("repository_projects")
    .select(
      `id, title, abstract, keywords, access_level, document_path, author_name, student_id, created_at,
       department:departments(name),
       session:academic_sessions(label)`,
    )
    .eq("id", id)
    .maybeSingle()
    .returns<Project>();

  if (!project) notFound();

  let authorName = project.author_name;
  if (project.student_id) {
    // Citations need the author's name to be resolvable by anyone, including
    // anonymous visitors — but profiles' RLS correctly blocks a random
    // visitor from reading an arbitrary student's row. The admin client
    // bypasses that here on purpose: this is a narrow, read-only lookup of
    // a name that's meant to be publicly citable, same rationale as
    // public_supervisor_directory for the repository's supervisor filter.
    const admin = createAdminClient();
    const { data: student } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", project.student_id)
      .single();
    authorName = student?.full_name ?? authorName;
  }
  authorName = authorName ?? "Unknown author";

  const canView = project.access_level === "public" || isLoggedIn;
  const canDownload = canView && !!project.document_path;
  const year = project.session?.label ?? String(new Date(project.created_at).getFullYear());
  const department = project.department?.name ?? null;

  const apa = buildApaCitation({ authorName, title: project.title, year, department });
  const ieee = buildIeeeCitation({ authorName, title: project.title, year, department });

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 px-6 py-8 sm:px-10">
        <Link href="/repository" className="text-sm font-semibold text-primary hover:underline">
          ← Back to repository
        </Link>

        <div className="mt-4 rounded-card bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl text-navy">{project.title}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                project.access_level === "public"
                  ? "bg-[#e6f6ec] text-green-700"
                  : "bg-navy/5 text-navy/60"
              }`}
            >
              {project.access_level === "public" ? "Public" : "Restricted"}
            </span>
          </div>
          <p className="mt-2 text-sm text-navy/60">
            {authorName} · {department ?? "—"} · {project.session?.label ?? "—"}
          </p>

          {canView ? (
            <>
              <p className="mt-4 text-sm text-navy/80">
                {project.abstract || "No abstract provided."}
              </p>
              {project.keywords?.length ? (
                <p className="mt-3 text-xs text-navy/50">
                  Keywords: {project.keywords.join(", ")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm text-navy/50">
              <Link href="/login" className="font-semibold text-primary">
                Log in
              </Link>{" "}
              to view the abstract for this restricted project.
            </p>
          )}

          {canDownload ? (
            <a
              href={`/repository/download/${project.id}`}
              className="mt-5 inline-block rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
            >
              Download full document
            </a>
          ) : null}
        </div>

        <div className="mt-6 rounded-card bg-card-secondary p-6 sm:p-8">
          <h2 className="text-lg text-navy">Cite this project</h2>
          <div className="mt-4 flex flex-col gap-3">
            <CitationBox label="APA" citation={apa} />
            <CitationBox label="IEEE" citation={ieee} />
          </div>
        </div>
      </main>
    </div>
  );
}
