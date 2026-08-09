import { createClient } from "@/lib/supabase/server";
import { AddProjectForm } from "./add-project-form";

export default async function AddArchivalProjectPage() {
  const supabase = await createClient();
  const [{ data: departments }, { data: sessions }, { data: supervisors }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("academic_sessions").select("id, label").order("label", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "supervisor").order("full_name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg text-navy">Add an archival project</h1>
      <p className="mt-1 text-sm text-navy/70">
        Backfill a past year&apos;s project directly into the repository — no student account or
        submission required.
      </p>
      <div className="mt-4">
        <AddProjectForm
          departments={departments ?? []}
          sessions={sessions ?? []}
          supervisors={supervisors ?? []}
        />
      </div>
    </div>
  );
}
