"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTempPassword() {
  return randomBytes(9).toString("base64url"); // 12 chars, URL-safe
}

export async function toggleUserActive(userId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: nextActive }).eq("id", userId);
  revalidatePath("/admin/users");
}

export type CreateUserState =
  | { error: string }
  | { success: true; email: string; tempPassword: string }
  | null;

export async function createUser(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const departmentId = String(formData.get("departmentId") ?? "") || null;
  const supervisorId = String(formData.get("supervisorId") ?? "") || null;

  if (!fullName || !email) {
    return { error: "Full name and email are required." };
  }
  if (role !== "student" && role !== "supervisor") {
    return { error: "Choose student or supervisor." };
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    return { error: error.message };
  }

  if (departmentId || (role === "student" && supervisorId)) {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({
        department_id: departmentId,
        supervisor_id: role === "student" ? supervisorId : null,
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/users");
  return { success: true, email, tempPassword };
}

export type UpdateUserState = { error: string } | null;

export async function updateUser(
  _prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const departmentId = String(formData.get("departmentId") ?? "") || null;
  const supervisorId = String(formData.get("supervisorId") ?? "") || null;

  if (!id) return { error: "Missing user id." };
  if (!fullName) return { error: "Full name is required." };
  if (role !== "student" && role !== "supervisor") {
    return { error: "Choose student or supervisor." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      department_id: departmentId,
      supervisor_id: role === "student" ? supervisorId : null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
