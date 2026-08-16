"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DecideReviewState = { error: string } | null;

export async function decideReview(
  _prevState: DecideReviewState,
  formData: FormData,
): Promise<DecideReviewState> {
  const projectId = String(formData.get("projectId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const accessLevel = String(formData.get("accessLevel") ?? "public");

  if (!projectId) {
    return { error: "Missing project id." };
  }
  if (decision !== "approve" && decision !== "reject") {
    return { error: "Invalid decision." };
  }
  if (decision === "reject" && !comment) {
    return { error: "A comment is required when rejecting a submission." };
  }
  if (decision === "approve" && accessLevel !== "public" && accessLevel !== "restricted") {
    return { error: "Invalid access level." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviewedAt = new Date().toISOString();

  const { error } = await supabase
    .from("repository_projects")
    .update(
      decision === "approve"
        ? {
            review_status: "approved",
            access_level: accessLevel,
            review_comment: comment || null,
            reviewed_by: user!.id,
            reviewed_at: reviewedAt,
          }
        : {
            review_status: "rejected",
            review_comment: comment,
            reviewed_by: user!.id,
            reviewed_at: reviewedAt,
          },
    )
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  redirect("/admin/repository/pending");
}
