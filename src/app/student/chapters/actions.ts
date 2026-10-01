"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_DOCUMENT_TYPES,
  CHAPTER_COUNT,
  DOCUMENT_BUCKET,
  MAX_DOCUMENT_BYTES,
} from "@/lib/chapters";

export type UploadChapterState = { error: string } | { success: true } | null;

export async function uploadChapter(
  _prevState: UploadChapterState,
  formData: FormData,
): Promise<UploadChapterState> {
  const chapterNumber = Number(formData.get("chapterNumber"));
  const document = formData.get("document");
  const file = document instanceof File && document.size > 0 ? document : null;

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > CHAPTER_COUNT) {
    return { error: "Invalid chapter." };
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

  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only a chapter sent back for revision can be replaced; remember its old
  // file so it can be cleaned up once the new one is safely recorded.
  const { data: existing } = await supabase
    .from("project_chapters")
    .select("document_path")
    .eq("student_id", user!.id)
    .eq("chapter_number", chapterNumber)
    .eq("status", "revision_requested")
    .maybeSingle();
  const previousDocumentPath = existing?.document_path ?? null;

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const documentPath = `chapters/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const { error: uploadError } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .upload(documentPath, file, { contentType: file.type });

  if (uploadError) {
    return { error: `Document upload failed: ${uploadError.message}` };
  }

  const { error } = await supabase.rpc("submit_chapter", {
    p_chapter_number: chapterNumber,
    p_document_path: documentPath,
    p_original_filename: file.name,
  });

  if (error) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([documentPath]);
    return { error: error.message };
  }

  if (previousDocumentPath && previousDocumentPath !== documentPath) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([previousDocumentPath]);
  }

  revalidatePath("/student/chapters");
  return { success: true };
}
