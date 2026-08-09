import { createClient } from "@/lib/supabase/server";
import { NewUserForm } from "./new-user-form";

export default async function NewUserPage() {
  const supabase = await createClient();
  const [{ data: departments }, { data: supervisors }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").eq("role", "supervisor").order("full_name"),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="text-lg text-navy">New account</h1>
      <p className="mt-1 text-sm text-navy/70">
        Admin accounts aren&apos;t created here — only students and supervisors.
      </p>
      <div className="mt-4">
        <NewUserForm departments={departments ?? []} supervisors={supervisors ?? []} />
      </div>
    </div>
  );
}
