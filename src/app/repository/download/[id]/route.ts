import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DOCUMENT_BUCKET = "project-documents";
const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Re-checks access at click time (not just what the search page displayed),
 * issues a short-lived signed URL, logs the download to audit_logs, and
 * redirects. Generating the signed URL here — rather than eagerly for every
 * search result — means the audit log only records actual downloads.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("repository_projects")
    .select("title, access_level, review_status, document_path")
    .eq("id", id)
    .maybeSingle();

  if (!project || !project.document_path || project.review_status !== "approved") {
    return new NextResponse("Not found", { status: 404 });
  }

  const canDownload = project.access_level === "public" || !!user;
  if (!canDownload) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(project.document_path, SIGNED_URL_TTL_SECONDS);

  if (error || !signed) {
    return new NextResponse("Could not generate a download link.", { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: user?.id ?? null,
    action: "repository_project.document_downloaded",
    entity_type: "repository_project",
    entity_id: id,
    metadata: { title: project.title },
  });

  return NextResponse.redirect(signed.signedUrl);
}
