"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DecideChapterState = { error: string } | null;

export async function decideChapter(
  _prevState: DecideChapterState,
  formData: FormData,
): Promise<DecideChapterState> {
  const chapterId = String(formData.get("chapterId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!chapterId) {
    return { error: "Missing chapter id." };
  }
  if (decision !== "approved" && decision !== "revision_requested") {
    return { error: "Invalid decision." };
  }
  if (decision === "revision_requested" && !comment) {
    return { error: "A comment is required when requesting a revision." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_chapter", {
    p_chapter_id: chapterId,
    p_decision: decision,
    p_comment: comment,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/supervisor/chapters");
}
