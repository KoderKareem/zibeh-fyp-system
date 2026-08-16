"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function loadUnassignedPendingPackage(supabase: Awaited<ReturnType<typeof createClient>>, packageId: string) {
  const { data: pkg } = await supabase
    .from("submission_packages")
    .select("id, status, supervisor_id")
    .eq("id", packageId)
    .maybeSingle();
  return pkg;
}

export type DelegateState = { error: string } | null;

export async function delegateToSupervisor(
  _prevState: DelegateState,
  formData: FormData,
): Promise<DelegateState> {
  const packageId = String(formData.get("packageId") ?? "");
  const supervisorId = String(formData.get("supervisorId") ?? "");

  if (!packageId) return { error: "Missing package id." };
  if (!supervisorId) return { error: "Choose a supervisor to delegate to." };

  const supabase = await createClient();

  const pkg = await loadUnassignedPendingPackage(supabase, packageId);
  if (!pkg || pkg.status !== "pending" || pkg.supervisor_id) {
    return { error: "This package is no longer available for assignment." };
  }

  const { error } = await supabase
    .from("submission_packages")
    .update({ supervisor_id: supervisorId })
    .eq("id", packageId);

  if (error) {
    return { error: error.message };
  }

  redirect("/admin/submissions/pending");
}

export type AdminDecideState = { error: string } | null;

export async function adminDecidePackage(
  _prevState: AdminDecideState,
  formData: FormData,
): Promise<AdminDecideState> {
  const packageId = String(formData.get("packageId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const topicId = String(formData.get("topicId") ?? "");
  const oversightSupervisorId = String(formData.get("oversightSupervisorId") ?? "");

  if (!packageId) return { error: "Missing package id." };
  if (decision !== "approve" && decision !== "reject") {
    return { error: "Invalid decision." };
  }
  if (!comment) {
    return { error: "A comment is required, whether you approve or reject." };
  }
  if (decision === "approve" && !topicId) {
    return { error: "Select which topic you're approving." };
  }
  if (decision === "approve" && !oversightSupervisorId) {
    return { error: "Choose a supervisor to oversee this student's project." };
  }

  const supabase = await createClient();

  const pkg = await loadUnassignedPendingPackage(supabase, packageId);
  if (!pkg || pkg.status !== "pending" || pkg.supervisor_id) {
    return { error: "This package is no longer available to decide directly — it may have been delegated to a supervisor." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const decidedAt = new Date().toISOString();

  const { data: updatedPackage, error } = await supabase
    .from("submission_packages")
    .update(
      decision === "approve"
        ? {
            status: "approved",
            approved_topic_id: topicId,
            supervisor_comment: comment,
            decided_at: decidedAt,
            decided_by: user!.id,
          }
        : {
            status: "rejected",
            approved_topic_id: null,
            supervisor_comment: comment,
            decided_at: decidedAt,
            decided_by: user!.id,
          },
    )
    .eq("id", packageId)
    .select("student_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (decision === "approve") {
    const { data: supervisor } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", oversightSupervisorId)
      .single();

    const { error: assignError } = await supabase
      .from("profiles")
      .update({ supervisor_id: oversightSupervisorId })
      .eq("id", updatedPackage.student_id);

    if (assignError) {
      return { error: assignError.message };
    }

    await supabase.from("notifications").insert({
      user_id: updatedPackage.student_id,
      title: "You have been assigned a supervisor",
      body: `${supervisor?.full_name ?? "Your supervisor"} is now your supervisor for this project.`,
      link: "/student/history",
    });
  }

  redirect("/admin/submissions/pending");
}
