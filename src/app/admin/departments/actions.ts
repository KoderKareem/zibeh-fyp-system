"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function withError(message: string): never {
  redirect(`/admin/departments?error=${encodeURIComponent(message)}`);
}

export async function createDepartment(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;

  if (!name) withError("Department name is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({ name, code });
  if (error) withError(error.message);

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function renameDepartment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;

  if (!id || !name) withError("Department name is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ name, code }).eq("id", id);
  if (error) withError(error.message);

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function deleteDepartment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) withError("Missing department id.");

  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) withError(error.message);

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}
