import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewForm } from "./review-form";

const DOCUMENT_BUCKET = "project-documents";
const SIGNED_URL_TTL_SECONDS = 300;

type PendingProject = {
  id: string;
  title: string;
  case_study: string | null;
  abstract: string | null;
  keywords: string[];
  source_code_url: string | null;
  document_path: string | null;
  student_id: string;
  review_status: "pending" | "approved" | "rejected";
  department: { name: string } | null;
  session: { label: string } | null;
};

export default async function AdminPendingReviewPage(
  props: PageProps<"/admin/repository/pending/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("repository_projects")
    .select(
      `id, title, case_study, abstract, keywords, source_code_url, document_path, student_id, review_status,
       department:departments(name),
       session:academic_sessions(label)`,
    )
    .eq("id", id)
    .maybeSingle()
    .returns<PendingProject>();

  if (!project) notFound();

  const { data: student } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", project.student_id)
    .single();

  let documentUrl: string | null = null;
  if (project.document_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(project.document_path, SIGNED_URL_TTL_SECONDS);
    documentUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="rounded-card bg-card-secondary p-5">
        <h2 className="text-lg text-navy">{project.title}</h2>
        <p className="mt-1 text-sm text-navy/70">
          {student?.full_name ?? "—"} · {project.department?.name ?? "—"} ·{" "}
          {project.session?.label ?? "—"}
        </p>
        {project.case_study ? (
          <p className="mt-3 text-sm font-semibold text-navy/70">
            Case Study: {project.case_study}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-navy/80">{project.abstract || "No abstract provided."}</p>
        {project.keywords?.length ? (
          <p className="mt-3 text-xs text-navy/50">Keywords: {project.keywords.join(", ")}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              View document
            </a>
          ) : (
            <span className="text-sm text-navy/50">No document uploaded.</span>
          )}
          {project.source_code_url ? (
            <a
              href={project.source_code_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Source code link
            </a>
          ) : null}
        </div>
      </div>

      {project.review_status === "pending" ? (
        <ReviewForm projectId={project.id} />
      ) : (
        <p className="text-sm text-navy/60">This submission has already been reviewed.</p>
      )}
    </div>
  );
}
