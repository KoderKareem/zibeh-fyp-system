"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AddProjectState = { error: string } | { success: true; title: string } | null;

const DOCUMENT_BUCKET = "project-documents";
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function addArchivalProject(
  _prevState: AddProjectState,
  formData: FormData,
): Promise<AddProjectState> {
  const title = String(formData.get("title") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const caseStudy = String(formData.get("caseStudy") ?? "").trim();
  const abstract = String(formData.get("abstract") ?? "").trim();
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const departmentId = String(formData.get("departmentId") ?? "") || null;
  const sessionId = String(formData.get("sessionId") ?? "") || null;
  const supervisorId = String(formData.get("supervisorId") ?? "") || null;
  const accessLevel = String(formData.get("accessLevel") ?? "public");
  const document = formData.get("document");
  const file = document instanceof File && document.size > 0 ? document : null;

  if (!title) {
    return { error: "Title is required." };
  }
  if (!caseStudy) {
    return { error: "Case study is required." };
  }
  if (accessLevel !== "public" && accessLevel !== "restricted") {
    return { error: "Invalid access level." };
  }
  if (file) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      return { error: "Document must be 20MB or smaller." };
    }
    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      return { error: "Document must be a PDF or Word document." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let documentPath: string | null = null;
  if (file) {
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
    documentPath = `admin-backfill/${randomUUID()}${extension ? `.${extension}` : ""}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(DOCUMENT_BUCKET)
      .upload(documentPath, file, { contentType: file.type });

    if (uploadError) {
      return { error: `Document upload failed: ${uploadError.message}` };
    }
  }

  const { error } = await supabase.from("repository_projects").insert({
    title,
    author_name: authorName || null,
    case_study: caseStudy,
    abstract: abstract || null,
    keywords,
    department_id: departmentId,
    session_id: sessionId,
    supervisor_id: supervisorId,
    student_id: null,
    submission_package_id: null,
    document_path: documentPath,
    access_level: accessLevel,
    source: "admin_backfill",
    review_status: "approved",
    added_by: user!.id,
  });

  if (error) {
    if (documentPath) {
      const admin = createAdminClient();
      await admin.storage.from(DOCUMENT_BUCKET).remove([documentPath]);
    }
    return { error: error.message };
  }

  return { success: true, title };
}
