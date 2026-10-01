import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_BUCKET } from "@/lib/chapters";

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Opens a chapter document. Access is decided by project_chapters' RLS (the
 * owning student, their current supervisor, or admin) — if the row isn't
 * visible to the caller, it's a 404. Only then is a short-lived signed URL
 * issued from the private bucket.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: chapter } = await supabase
    .from("project_chapters")
    .select("document_path")
    .eq("id", id)
    .maybeSingle();

  if (!chapter) {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(chapter.document_path, SIGNED_URL_TTL_SECONDS);

  if (error || !signed) {
    return new NextResponse("Could not generate a document link.", { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
