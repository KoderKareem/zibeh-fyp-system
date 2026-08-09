"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function withError(message: string): never {
  redirect(`/admin/sessions?error=${encodeURIComponent(message)}`);
}

export async function createSession(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) withError("Session label is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("academic_sessions").insert({ label });
  if (error) withError(error.message);

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

export async function setActiveSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) withError("Missing session id.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_active_session", { p_session_id: sessionId });
  if (error) withError(error.message);

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

export async function toggleSubmissionsOpen(nextOpen: boolean) {
  const supabase = await createClient();
  await supabase.from("system_settings").update({ submissions_open: nextOpen }).eq("id", 1);
  revalidatePath("/admin/sessions");
}
