import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "supervisor" | "admin";

export type CurrentProfile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
};

/**
 * Server-only route guard for the /student, /supervisor, /admin layouts.
 * No session -> /login. Session but wrong role -> /unauthorized.
 */
export async function requireRole(role: Role): Promise<CurrentProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== role) {
    redirect("/unauthorized");
  }

  return profile as CurrentProfile;
}
