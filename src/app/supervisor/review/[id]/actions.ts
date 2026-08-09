"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DecideState = { error: string } | null;

export async function decidePackage(
  _prevState: DecideState,
  formData: FormData,
): Promise<DecideState> {
  const packageId = String(formData.get("packageId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "");

  if (!packageId) {
    return { error: "Missing package id." };
  }
  if (decision !== "approve" && decision !== "reject") {
    return { error: "Invalid decision." };
  }
  if (!comment) {
    return { error: "A comment is required, whether you approve or reject." };
  }
  if (decision === "approve" && !topicId) {
    return { error: "Select which topic you're approving." };
  }

  const supabase = await createClient();
  const decidedAt = new Date().toISOString();

  const { error } = await supabase
    .from("submission_packages")
    .update(
      decision === "approve"
        ? {
            status: "approved",
            approved_topic_id: topicId,
            supervisor_comment: comment,
            decided_at: decidedAt,
          }
        : {
            status: "rejected",
            approved_topic_id: null,
            supervisor_comment: comment,
            decided_at: decidedAt,
          },
    )
    .eq("id", packageId);

  if (error) {
    return { error: error.message };
  }

  redirect("/supervisor/dashboard");
}
