"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadFinalProjectState = { error: string } | { success: true } | null;

const DOCUMENT_BUCKET = "project-documents";
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function uploadFinalProject(
  _prevState: UploadFinalProjectState,
  formData: FormData,
): Promise<UploadFinalProjectState> {
  const packageId = String(formData.get("packageId") ?? "");
  const abstract = String(formData.get("abstract") ?? "").trim();
  const sourceCodeUrl = String(formData.get("sourceCodeUrl") ?? "").trim();
  const document = formData.get("document");
  const file = document instanceof File && document.size > 0 ? document : null;

  if (!packageId) {
    return { error: "Missing package id." };
  }
  if (!file) {
    return { error: "A document is required." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Document must be 20MB or smaller." };
  }
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return { error: "Document must be a PDF or Word document." };
  }
  if (sourceCodeUrl) {
    try {
      new URL(sourceCodeUrl);
    } catch {
      return { error: "Source code link must be a valid URL." };
    }
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: existing } = await supabase
    .from("repository_projects")
    .select("document_path")
    .eq("submission_package_id", packageId)
    .maybeSingle();
  const previousDocumentPath = existing?.document_path ?? null;

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const documentPath = `live-submissions/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const { error: uploadError } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .upload(documentPath, file, { contentType: file.type });

  if (uploadError) {
    return { error: `Document upload failed: ${uploadError.message}` };
  }

  const { error } = await supabase.rpc("submit_final_project", {
    p_package_id: packageId,
    p_abstract: abstract,
    p_document_path: documentPath,
    p_source_code_url: sourceCodeUrl || null,
  });

  if (error) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([documentPath]);
    return { error: error.message };
  }

  if (previousDocumentPath && previousDocumentPath !== documentPath) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([previousDocumentPath]);
  }

  revalidatePath("/student/history");
  return { success: true };
}
