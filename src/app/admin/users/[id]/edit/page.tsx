import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage(props: PageProps<"/admin/users/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: user }, { data: departments }, { data: supervisors }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, department_id, supervisor_id")
      .eq("id", id)
      .in("role", ["student", "supervisor"])
      .maybeSingle(),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").eq("role", "supervisor").order("full_name"),
  ]);

  if (!user) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-lg text-navy">Edit account</h1>
      <div className="mt-4">
        <EditUserForm
          user={user}
          departments={departments ?? []}
          supervisors={(supervisors ?? []).filter((s) => s.id !== id)}
        />
      </div>
    </div>
  );
}
